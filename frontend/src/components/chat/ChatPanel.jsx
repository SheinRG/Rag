import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import useChatStore from '../../store/chatStore';
import useDocumentStore from '../../store/documentStore';
import { streamPost } from '../../api/client';

const typeIcons = { pdf: '📕', txt: '📄', md: '📝' };

function truncate(str, len = 18) {
  return str.length > len ? str.slice(0, len) + '...' : str;
}

export default function ChatPanel({ showWebSearch, onCloseWebSearch }) {
  const { messages, isStreaming, sendMessage, activeDocumentId, setActiveDocument } = useChatStore();
  const { documents } = useDocumentStore();
  const [webSearchMode, setWebSearchMode] = useState(false);
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [webSearching, setWebSearching] = useState(false);

  const readyDocs = documents.filter(d => d.status === 'ready');
  const hasChunks = readyDocs.some(d => d.num_chunks > 0);

  // Handle re-ask
  const handleReask = (question) => {
    if (isStreaming) return;
    sendMessage(question);
  };

  // Handle web search
  const handleWebSearch = async (query) => {
    if (!query.trim() || webSearching) return;

    const addMsg = useChatStore.getState();
    addMsg.messages.push({ role: 'user', content: `🌐 ${query}`, isWebSearch: true });
    addMsg.messages.push({ role: 'assistant', content: '', webSources: [] });
    useChatStore.setState({ messages: [...addMsg.messages], isStreaming: true });

    setWebSearching(true);
    try {
      const stream = await streamPost('/search/web', { query });
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
      setWebSearchMode(false);
    }
  };

  // Activate web search from studio
  const isWebSearchActive = showWebSearch || webSearchMode;

  return (
    <div className="w-full flex flex-col h-full bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[32px] overflow-hidden">
      {/* Tab Bar */}
      <div className="pt-2 px-4 border-b border-gray-200 bg-white/40 backdrop-blur-sm">
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setActiveDocument(null); setWebSearchMode(false); onCloseWebSearch?.(); }}
            style={{
              padding: '0.5rem 1rem', borderRadius: '8px 8px 0 0', border: 'none',
              background: !activeDocumentId && !isWebSearchActive ? 'var(--color-badge-bg)' : 'transparent',
              color: !activeDocumentId && !isWebSearchActive ? 'var(--color-badge-text)' : 'var(--color-text-muted)',
              fontWeight: !activeDocumentId && !isWebSearchActive ? 600 : 400, fontSize: '0.9rem', cursor: 'pointer',
              borderBottom: !activeDocumentId && !isWebSearchActive ? '2px solid var(--color-primary-500)' : '2px solid transparent',
              fontFamily: 'inherit',
            }}
          >
            💬 All
          </motion.button>

          {readyDocs.map(doc => (
            <motion.button
              key={doc.id}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setActiveDocument(doc.id); setWebSearchMode(false); onCloseWebSearch?.(); }}
              style={{
                padding: '0.5rem 0.75rem', borderRadius: '8px 8px 0 0', border: 'none',
                background: activeDocumentId === doc.id ? 'var(--color-badge-bg)' : 'transparent',
                color: activeDocumentId === doc.id ? 'var(--color-badge-text)' : 'var(--color-text-muted)',
                fontWeight: activeDocumentId === doc.id ? 600 : 400, fontSize: '0.85rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                borderBottom: activeDocumentId === doc.id ? '2px solid var(--color-primary-500)' : '2px solid transparent',
                maxWidth: '150px', fontFamily: 'inherit',
              }}
            >
              <span>{typeIcons[doc.file_type] || '📄'}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {truncate(doc.original_name)}
              </span>
            </motion.button>
          ))}

          {/* Web search tab */}
          <AnimatePresence>
            {isWebSearchActive && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                  padding: '0.5rem 0.75rem', borderRadius: '8px 8px 0 0', border: 'none',
                  background: 'var(--color-badge-bg)',
                  color: 'var(--color-badge-text)',
                  fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                  borderBottom: '2px solid var(--color-primary-500)',
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  fontFamily: 'inherit',
                }}
              >
                🌐 Web Search
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Warning if no processed docs */}
      {!hasChunks && !isWebSearchActive && (
        <div style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--color-warning)', background: 'var(--color-warning-light)', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
          ⚠️ No processed documents yet. Upload and wait for processing to complete.
        </div>
      )}

      {/* Web Search Input Bar */}
      <AnimatePresence>
        {isWebSearchActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              overflow: 'hidden',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <form
              onSubmit={(e) => { e.preventDefault(); handleWebSearch(webSearchQuery); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: 'var(--color-card-bg)',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>🔍</span>
              <input
                type="text"
                value={webSearchQuery}
                onChange={(e) => setWebSearchQuery(e.target.value)}
                placeholder="Search the web with AI..."
                autoFocus
                disabled={webSearching}
                style={{
                  flex: 1, padding: '0.6rem 0.85rem', borderRadius: '10px',
                  border: '1px solid var(--color-border)', fontSize: '0.9rem',
                  outline: 'none', fontFamily: 'inherit',
                  background: 'var(--color-input-bg)', color: 'var(--color-text)',
                }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!webSearchQuery.trim() || webSearching}
                style={{
                  padding: '0.6rem 1.25rem', borderRadius: '10px', border: 'none',
                  background: 'var(--color-primary-600)', color: 'white',
                  fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                  opacity: !webSearchQuery.trim() || webSearching ? 0.5 : 1,
                  fontFamily: 'inherit',
                }}
              >
                {webSearching ? '⏳' : 'Search'}
              </motion.button>
              <button
                type="button"
                onClick={() => { setWebSearchMode(false); onCloseWebSearch?.(); }}
                style={{
                  border: 'none', background: 'none', cursor: 'pointer',
                  color: 'var(--color-text-muted)', fontSize: '1.1rem',
                }}
              >
                ✕
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <MessageList messages={messages} onReask={handleReask} />
      <ChatInput
        onSend={sendMessage}
        disabled={isStreaming || (!hasChunks && !isWebSearchActive)}
      />
    </div>
  );
}
