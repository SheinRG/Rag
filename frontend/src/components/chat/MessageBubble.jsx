import React, { memo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SourceBadge from './SourceBadge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useChatStore from '../../store/chatStore';

// Memoized markdown components — created once, not on every render
const markdownComponents = {
  p: ({ node, ...props }) => <p style={{ margin: '0 0 0.5rem 0' }} {...props} />,
  ul: ({ node, ...props }) => <ul style={{ marginLeft: '1.5rem', marginBottom: '0.5rem', listStyleType: 'disc' }} {...props} />,
  ol: ({ node, ...props }) => <ol style={{ marginLeft: '1.5rem', marginBottom: '0.5rem', listStyleType: 'decimal' }} {...props} />,
  li: ({ node, ...props }) => <li style={{ marginBottom: '0.25rem' }} {...props} />,
  h1: ({ node, ...props }) => <h1 style={{ fontSize: '1.1rem', fontWeight: 400, margin: '0.75rem 0 0.35rem 0', color: '#1e293b' }} {...props} />,
  h2: ({ node, ...props }) => <h2 style={{ fontSize: '1.02rem', fontWeight: 400, margin: '0.65rem 0 0.3rem 0', color: '#1e293b' }} {...props} />,
  h3: ({ node, ...props }) => <h3 style={{ fontSize: '0.97rem', fontWeight: 400, margin: '0.5rem 0 0.25rem 0', color: '#475569' }} {...props} />,
  pre: ({ node, ...props }) => <pre style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '12px', overflowX: 'auto', marginBottom: '0.5rem' }} {...props} />,
  code: ({ node, inline, ...props }) => inline ? <code style={{ background: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '6px', fontSize: '0.85em' }} {...props} /> : <code {...props} />,
  a: ({ node, ...props }) => <a style={{ color: '#64748b', textDecoration: 'underline', transition: 'color 0.2s' }} target="_blank" rel="noopener noreferrer" className="hover:text-black" {...props} />,
};

const remarkPlugins = [remarkGfm];

function StreamingText({ content }) {
  const [displayedLen, setDisplayedLen] = useState(0);
  const lenRef = useRef(0);
  const rafRef = useRef(null);
  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    const tick = () => {
      const target = contentRef.current.length;
      if (lenRef.current < target) {
        const remaining = target - lenRef.current;
        const step = Math.min(2, Math.max(1, Math.ceil(remaining * 0.02)));
        lenRef.current = Math.min(lenRef.current + step, target);
        setDisplayedLen(lenRef.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const visibleText = content.slice(0, displayedLen);

  return (
    <div style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
      {visibleText}
      <span
        style={{
          display: 'inline-block',
          width: '2px',
          height: '1em',
          background: '#000',
          marginLeft: '2px',
          verticalAlign: 'text-bottom',
          animation: 'blink 1s step-end infinite',
        }}
      />
    </div>
  );
}

const AiContent = memo(function AiContent({ content, isStreaming }) {
  if (isStreaming) {
    return <StreamingText content={content} />;
  }

  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
});

const MessageBubble = memo(function MessageBubble({ message, onReask, isLastMessage }) {
  const isUser = message.role === 'user';
  const isStreaming = useChatStore((s) => s.isStreaming);
  const [isHovered, setIsHovered] = useState(false);

  const isActivelyStreaming = isStreaming && isLastMessage && !isUser && !message.isError;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', 
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{
        maxWidth: '85%', padding: '0.8rem 1.1rem', borderRadius: '22px',
        background: isUser ? '#1e293b' : '#ffffff',
        color: isUser ? '#ffffff' : '#1e293b',
        border: isUser ? 'none' : '1px solid #e2e8f0',
        boxShadow: isUser ? '0 8px 24px rgba(0,0,0,0.12)' : '0 4px 20px rgba(0,0,0,0.03)',
        lineHeight: 1.55, fontSize: '0.92rem',
        overflowWrap: 'break-word',
        position: 'relative',
        letterSpacing: '-0.01em'
      }}>
        {message.isError ? (
          <p style={{ color: isUser ? 'white' : 'var(--color-error)', margin: 0 }}>{message.content}</p>
        ) : isUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {message.isWebSearch && (
               <div className="shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center -ml-1.5">
                 <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
                   <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                 </svg>
               </div>
            )}
            <p style={{ whiteSpace: 'pre-wrap', margin: 0, flex: 1 }}>{message.content}</p>
          </div>
        ) : (
          <AiContent content={message.content} isStreaming={isActivelyStreaming} />
        )}

        {/* Web sources (from global search) */}
        {message.webSources && message.webSources.length > 0 && (
          <div style={{ marginTop: '0.8rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.6rem' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Search Sources
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {message.webSources.map((s, idx) => (
                <a
                  key={idx}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.72rem',
                    color: '#64748b',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                  className="hover:underline hover:text-black"
                >
                  <span style={{ opacity: 0.5 }}>🔗</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.title}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Document sources */}
        {message.sources && message.sources.length > 0 && (
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {message.sources.map((s, idx) => <SourceBadge key={idx} source={s} />)}
          </div>
        )}

        {!message.content && !message.isError && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.25rem 0' }}>
            {message.status && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                {message.status}
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}
      </div>

      {/* Action Icons below User Message */}
      {isUser && (
        <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem', marginRight: '0.5rem'
                }}
              >
                 <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginRight: '0.6rem', fontWeight: 500 }}>
                   {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                 </span>
                 <button 
                    onClick={() => onReask?.(message.content)} 
                    className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100/80 rounded-lg transition-all"
                    title="Regenerate"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
                    </svg>
                 </button>
                 <button 
                    className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100/80 rounded-lg transition-all"
                    title="Edit"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                 </button>
                 <button 
                    onClick={handleCopy}
                    className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100/80 rounded-lg transition-all"
                    title="Copy"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                 </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});

export default MessageBubble;
