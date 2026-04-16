import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { streamPost } from '../api/client';

const cleanStorage = {
  getItem: (name) => {
    try {
      const value = localStorage.getItem(name);
      if (!value) return null;
      const parsed = JSON.parse(value);
      if (parsed.state?.messages) {
        parsed.state.messages = parsed.state.messages.filter(
          m => !m.content?.includes('clipboard')
        );
      }
      return JSON.stringify(parsed);
    } catch {
      localStorage.removeItem(name);
      return null;
    }
  },
  setItem: () => {},
  removeItem: () => {},
};

const useChatStore = create(
  persist(
    (set, get) => ({
      messages: [],
      isStreaming: false,
      activeDocumentId: null,
      messageHistory: {},

      setActiveDocument: (docId) => {
        // Store current tab's messages before switching
        const currentMessages = get().messages;
        const currentDocId = get().activeDocumentId;
        
        set((state) => {
          const newMessageHistory = { ...state.messageHistory };
          if (currentDocId) {
            newMessageHistory[currentDocId] = currentMessages;
          } else {
            newMessageHistory['all'] = currentMessages;
          }
          
          return {
            activeDocumentId: docId,
            messages: [],
            messageHistory: newMessageHistory,
          };
        });

        // Restore messages for the new tab (or start fresh)
        setTimeout(() => {
          const history = get().messageHistory;
          const storedMessages = docId ? history[docId] : history['all'];
          if (storedMessages) {
            set({ messages: storedMessages });
          }
        }, 0);
      },

      sendMessage: async (question) => {
        const { activeDocumentId } = get();
        
        // Add user message
        set((state) => ({
          messages: [...state.messages, { role: 'user', content: question }],
          isStreaming: true,
        }));

        // Add empty assistant message to stream into
        set((state) => ({
          messages: [...state.messages, { role: 'assistant', content: '', sources: [] }],
        }));

        try {
          const stream = await streamPost('/ask/stream', { 
            question,
            document_id: activeDocumentId 
          });
          
          if (!stream) {
            throw new Error('No stream response');
          }
          
          const reader = stream.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;

              try {
                const event = JSON.parse(jsonStr);

                if (event.type === 'token') {
                  set((state) => {
                    const msgs = [...state.messages];
                    const last = msgs[msgs.length - 1];
                    msgs[msgs.length - 1] = { ...last, content: last.content + event.content };
                    return { messages: msgs };
                  });
                } else if (event.type === 'sources') {
                  set((state) => {
                    const msgs = [...state.messages];
                    const last = msgs[msgs.length - 1];
                    msgs[msgs.length - 1] = { ...last, sources: event.content };
                    return { messages: msgs };
                  });
                } else if (event.type === 'error') {
                  set((state) => {
                    const msgs = [...state.messages];
                    const last = msgs[msgs.length - 1];
                    msgs[msgs.length - 1] = { ...last, content: event.content, isError: true };
                    return { messages: msgs };
                  });
                } else if (event.type === 'done') {
                  set({ isStreaming: false });
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
          set({ isStreaming: false });
        } catch (err) {
          console.error('Chat error:', err);
          set((state) => {
            const msgs = [...state.messages];
            const last = msgs[msgs.length - 1];
            msgs[msgs.length - 1] = {
              ...last,
              content: `Failed to connect to the AI: ${err.message}. Is the backend running?`,
              isError: true,
            };
            return { messages: msgs, isStreaming: false };
          });
        }
      },

      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'docmind-chat-storage',
      storage: createJSONStorage(() => cleanStorage),
      partialize: (state) => ({ 
        messages: state.messages, 
        activeDocumentId: state.activeDocumentId,
        messageHistory: state.messageHistory || {} 
      }),
    }
  )
);

export default useChatStore;
