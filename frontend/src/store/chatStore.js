import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { streamPost } from '../api/client';

const useChatStore = create(
  persist(
    (set, get) => ({
      messages: [],
      isStreaming: false,
      activeDocumentIds: [],
      messageHistory: {},
      notebookHistory: {}, // { [nbId]: { messages, activeDocumentIds, messageHistory } }
      currentNotebookId: null,

      switchNotebook: (notebookId) => {
        const { currentNotebookId, messages, activeDocumentIds, messageHistory, notebookHistory } = get();
        
        if (notebookId === currentNotebookId) return;

        const newNotebookHistory = { ...notebookHistory };
        if (currentNotebookId || currentNotebookId === null) {
          const key = currentNotebookId || 'default';
          newNotebookHistory[key] = {
            messages,
            activeDocumentIds,
            messageHistory
          };
        }

        const targetKey = notebookId || 'default';
        const saved = newNotebookHistory[targetKey] || {
          messages: [],
          activeDocumentIds: [],
          messageHistory: {}
        };

        set({
          currentNotebookId: notebookId,
          messages: saved.messages,
          activeDocumentIds: saved.activeDocumentIds,
          messageHistory: saved.messageHistory,
          notebookHistory: newNotebookHistory
        });
      },

      toggleDocument: (docId) => {
        set((state) => {
          const isSelected = state.activeDocumentIds.includes(docId);
          const newIds = isSelected 
            ? state.activeDocumentIds.filter(id => id !== docId)
            : [...state.activeDocumentIds, docId];
          
          return { activeDocumentIds: newIds };
        });
      },

      setActiveDocument: (docId) => {
        // Legacy support if needed, set single active
        set({ activeDocumentIds: docId ? [docId] : [] });
      },

      sendMessage: async (question) => {
        const { activeDocumentIds, currentNotebookId } = get();
        
        set((state) => ({
          messages: [
            ...state.messages,
            { role: 'user', content: question },
            { role: 'assistant', content: '', sources: [] },
          ],
          isStreaming: true,
        }));

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
            document_ids: activeDocumentIds,
            notebook_id: currentNotebookId
          });
          
          if (!stream) throw new Error('No stream response');
          
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
                  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
                  flushTokens();
                  set((state) => {
                    const msgs = state.messages;
                    const last = msgs[msgs.length - 1];
                    const next = msgs.slice(0, -1);
                    next.push({ ...last, sources: event.content });
                    return { messages: next };
                  });
                } else if (event.type === 'suggestions') {
                  set((state) => {
                    const msgs = state.messages;
                    const last = msgs[msgs.length - 1];
                    const next = msgs.slice(0, -1);
                    next.push({ ...last, suggestions: event.content });
                    return { messages: next };
                  });
                } else if (event.type === 'error') {
                  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
                  set((state) => {
                    const msgs = state.messages;
                    const last = msgs[msgs.length - 1];
                    const next = msgs.slice(0, -1);
                    next.push({ ...last, content: event.content, isError: true });
                    return { messages: next };
                  });
                } else if (event.type === 'done') {
                  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
                  flushTokens();
                  set({ isStreaming: false });
                }
              } catch { }
            }
          }
          if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
          flushTokens();
          set({ isStreaming: false });
        } catch (err) {
          if (rafId !== null) cancelAnimationFrame(rafId);
          console.error('Chat error:', err);
          set((state) => {
            const msgs = state.messages;
            const last = msgs[msgs.length - 1];
            const next = msgs.slice(0, -1);
            next.push({
              ...last,
              content: `Failed to connect to the AI: ${err.message}.`,
              isError: true,
            });
            return { messages: next, isStreaming: false };
          });
        }
      },

      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'nexus-chat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        notebookHistory: state.notebookHistory,
        currentNotebookId: state.currentNotebookId,
        messages: state.messages,
        activeDocumentIds: state.activeDocumentIds,
        messageHistory: state.messageHistory,
      }),
    }
  )
);

export default useChatStore;
