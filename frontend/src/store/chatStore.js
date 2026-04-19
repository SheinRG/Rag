import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { streamPost } from '../api/client';



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
        
        // Add user message + empty assistant message in one setState
        set((state) => ({
          messages: [
            ...state.messages,
            { role: 'user', content: question },
            { role: 'assistant', content: '', sources: [] },
          ],
          isStreaming: true,
        }));

        // Token buffer — accumulate tokens and flush at ~30fps
        let tokenBuffer = '';
        let rafId = null;

        const flushTokens = () => {
          rafId = null;
          if (!tokenBuffer) return;
          const chunk = tokenBuffer;
          tokenBuffer = '';
          set((state) => {
            const msgs = state.messages;
            const last = msgs[msgs.length - 1];
            const updated = { ...last, content: last.content + chunk };
            // Mutate-in-place for the array, only replace last element
            const next = msgs.slice(0, -1);
            next.push(updated);
            return { messages: next };
          });
        };

        const scheduleFlush = () => {
          if (rafId === null) {
            rafId = requestAnimationFrame(flushTokens);
          }
        };

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
                  tokenBuffer += event.content;
                  scheduleFlush();
                } else if (event.type === 'sources') {
                  // Flush any remaining tokens first
                  if (rafId !== null) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                  }
                  flushTokens();
                  set((state) => {
                    const msgs = state.messages;
                    const last = msgs[msgs.length - 1];
                    const next = msgs.slice(0, -1);
                    next.push({ ...last, sources: event.content });
                    return { messages: next };
                  });
                } else if (event.type === 'error') {
                  if (rafId !== null) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                  }
                  set((state) => {
                    const msgs = state.messages;
                    const last = msgs[msgs.length - 1];
                    const next = msgs.slice(0, -1);
                    next.push({ ...last, content: event.content, isError: true });
                    return { messages: next };
                  });
                } else if (event.type === 'done') {
                  // Flush remaining tokens before marking done
                  if (rafId !== null) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                  }
                  flushTokens();
                  set({ isStreaming: false });
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
          // Final flush in case there are leftover tokens
          if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
          flushTokens();
          set({ isStreaming: false });
        } catch (err) {
          if (rafId !== null) {
            cancelAnimationFrame(rafId);
          }
          console.error('Chat error:', err);
          set((state) => {
            const msgs = state.messages;
            const last = msgs[msgs.length - 1];
            const next = msgs.slice(0, -1);
            next.push({
              ...last,
              content: `Failed to connect to the AI: ${err.message}. Is the backend running?`,
              isError: true,
            });
            return { messages: next, isStreaming: false };
          });
        }
      },

      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'docmind-chat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        activeDocumentId: state.activeDocumentId,
        messages: state.messages,
        messageHistory: state.messageHistory,
      }),
    }
  )
);

export default useChatStore;
