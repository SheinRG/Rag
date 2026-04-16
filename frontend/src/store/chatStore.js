import { create } from 'zustand';
import { streamPost } from '../api/client';

const useChatStore = create((set, get) => ({
  messages: [],
  isStreaming: false,

  sendMessage: async (question) => {
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
      const stream = await streamPost('/ask/stream', { question });
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
    } catch (err) {
      set((state) => {
        const msgs = [...state.messages];
        const last = msgs[msgs.length - 1];
        msgs[msgs.length - 1] = {
          ...last,
          content: 'Failed to connect to the AI. Please try again.',
          isError: true,
        };
        return { messages: msgs, isStreaming: false };
      });
    }
  },

  clearMessages: () => set({ messages: [] }),
}));

export default useChatStore;
