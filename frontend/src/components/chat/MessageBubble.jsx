import React, { memo } from 'react';
import { motion } from 'framer-motion';
import SourceBadge from './SourceBadge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MessageBubble = memo(function MessageBubble({ message, onReask }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '1rem',
      }}
    >
      <div style={{
        maxWidth: '75%', padding: '0.85rem 1.15rem', borderRadius: '16px',
        background: isUser ? 'var(--color-user-bubble)' : 'var(--color-ai-bubble)',
        color: isUser ? 'white' : 'var(--color-text)',
        border: isUser ? 'none' : '1px solid var(--color-border)',
        boxShadow: isUser ? 'none' : '0 1px 4px rgba(0,0,0,0.04)',
        lineHeight: 1.6, fontSize: '0.95rem',
        overflowWrap: 'break-word',
        position: 'relative',
      }}>
        {message.isError ? (
          <p style={{ color: isUser ? 'white' : 'var(--color-error)', margin: 0 }}>{message.content}</p>
        ) : isUser ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <p style={{ whiteSpace: 'pre-wrap', margin: 0, flex: 1 }}>{message.content}</p>
            {onReask && (
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onReask(message.content)}
                title="Ask again"
                style={{
                  border: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  padding: '0.2rem 0.35rem',
                  fontSize: '0.75rem',
                  flexShrink: 0,
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                🔄
              </motion.button>
            )}
          </div>
        ) : (
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({node, ...props}) => <p style={{ margin: '0 0 0.5rem 0' }} {...props} />,
              ul: ({node, ...props}) => <ul style={{ marginLeft: '1.5rem', marginBottom: '0.5rem', listStyleType: 'disc' }} {...props} />,
              ol: ({node, ...props}) => <ol style={{ marginLeft: '1.5rem', marginBottom: '0.5rem', listStyleType: 'decimal' }} {...props} />,
              li: ({node, ...props}) => <li style={{ marginBottom: '0.25rem' }} {...props} />,
              h1: ({node, ...props}) => <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '1rem 0 0.5rem 0' }} {...props} />,
              h2: ({node, ...props}) => <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '1rem 0 0.5rem 0' }} {...props} />,
              h3: ({node, ...props}) => <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0.75rem 0 0.5rem 0' }} {...props} />,
              pre: ({node, ...props}) => <pre style={{ background: 'var(--color-surface-secondary)', padding: '0.75rem', borderRadius: '8px', overflowX: 'auto', marginBottom: '0.5rem' }} {...props} />,
              code: ({node, inline, ...props}) => inline ? <code style={{ background: 'var(--color-surface-secondary)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.85em' }} {...props} /> : <code {...props} />,
              a: ({node, ...props}) => <a style={{ color: 'var(--color-primary-500)', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer" {...props} />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}

        {/* Web sources (from global search) */}
        {message.webSources && message.webSources.length > 0 && (
          <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.6rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Web Sources
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {message.webSources.map((s, idx) => (
                <a
                  key={idx}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-primary-500)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <span>🔗</span>
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
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
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
    </motion.div>
  );
});

export default MessageBubble;
