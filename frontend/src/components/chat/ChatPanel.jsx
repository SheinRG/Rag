import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import useChatStore from '../../store/chatStore';
import useDocumentStore from '../../store/documentStore';
import { streamPost } from '../../api/client';

export default function ChatPanel({ showWebSearch, onCloseWebSearch, initialWebSearchQuery = '', onAddToNote }) {
  const { messages, isStreaming, sendMessage, activeDocumentId } = useChatStore();
  const { documents } = useDocumentStore();
  const [webSearching, setWebSearching] = useState(false);
  const [editValue, setEditValue] = useState('');

  const readyDocs = documents.filter(d => d.status === 'ready');
  const hasChunks = readyDocs.some(d => d.num_chunks > 0);

  // Handle re-ask
  const handleReask = (question) => {
    if (isStreaming) return;
    sendMessage(question);
  };

  const handleWebSearch = async (query) => {
    if (!query.trim() || webSearching) return;

    const addMsg = useChatStore.getState();
    addMsg.messages.push({ role: 'user', content: query, isWebSearch: true });
    addMsg.messages.push({ role: 'assistant', content: '', webSources: [] });
    useChatStore.setState({ messages: [...addMsg.messages], isStreaming: true });

    setWebSearching(true);
    try {
      const msgsForHistory = addMsg.messages.slice(0, -2).map(m => ({ role: m.role, content: m.content })).slice(-5);
      const stream = await streamPost('/search/web', { 
        query,
        history: msgsForHistory,
        document_id: activeDocumentId || null
      });
      if (!stream) throw new Error('No stream');

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
            if (event.type === 'status') {
              useChatStore.setState((state) => {
                const msgs = [...state.messages];
                msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], status: event.content };
                return { messages: msgs };
              });
            } else if (event.type === 'token') {
              useChatStore.setState((state) => {
                const msgs = [...state.messages];
                const last = msgs[msgs.length - 1];
                msgs[msgs.length - 1] = { ...last, content: last.content + event.content, status: null };
                return { messages: msgs };
              });
            } else if (event.type === 'web_sources') {
              useChatStore.setState((state) => {
                const msgs = [...state.messages];
                const last = msgs[msgs.length - 1];
                msgs[msgs.length - 1] = { ...last, webSources: event.content };
                return { messages: msgs };
              });
            } else if (event.type === 'error') {
              useChatStore.setState((state) => {
                const msgs = [...state.messages];
                msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: event.content, isError: true, status: null };
                return { messages: msgs, isStreaming: false };
              });
            } else if (event.type === 'done') {
              useChatStore.setState({ isStreaming: false });
            }
          } catch {}
        }
      }
      useChatStore.setState({ isStreaming: false });
    } catch (err) {
      console.error('Web search error:', err);
      useChatStore.setState((state) => {
        const msgs = [...state.messages];
        const last = msgs[msgs.length - 1];
        msgs[msgs.length - 1] = { ...last, content: 'Web search failed. Please try again.', isError: true };
        return { messages: msgs, isStreaming: false };
      });
    } finally {
      setWebSearching(false);
    }
  };

  useEffect(() => {
    if (showWebSearch && initialWebSearchQuery && !webSearching) {
      handleWebSearch(initialWebSearchQuery);
      onCloseWebSearch?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWebSearch, initialWebSearchQuery]);

  return (
    <div 
      className="w-full relative flex flex-col h-full overflow-hidden shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-blur-2xl backdrop-saturate-[180%] bg-white/40 border border-white/60 rounded-[24px]"
      style={{
        fontFamily: '"Inter", sans-serif',
        backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.2) 100%)',
        boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.4), 0 8px 32px 0 rgba(0, 0, 0, 0.05)',
      }}
    >
      <MessageList 
        messages={messages} 
        onReask={handleReask} 
        activeDoc={readyDocs.find(d => d.id === activeDocumentId)} 
        onSuggestionClick={sendMessage} 
        onAddToNote={onAddToNote}
        onEditMessage={(content) => setEditValue(content)}
      />
      <ChatInput
        onSend={(question, useWebSearch) => {
          if (useWebSearch) {
            handleWebSearch(question);
          } else {
            sendMessage(question);
          }
        }}
        disabled={isStreaming}
        editValue={editValue}
        onClearEdit={() => setEditValue('')}
      />
    </div>
  );
}
