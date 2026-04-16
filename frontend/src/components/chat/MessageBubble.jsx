import React, { memo } from 'react';
import SourceBadge from './SourceBadge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MessageBubble = memo(function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div style={{
      display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '1rem',
    }}>
      <div style={{
        maxWidth: '75%', padding: '0.85rem 1.15rem', borderRadius: '16px',
        background: isUser ? 'var(--color-primary-600)' : 'white',
        color: isUser ? 'white' : 'var(--color-text)',
        border: isUser ? 'none' : '1px solid var(--color-border)',
        boxShadow: isUser ? 'none' : '0 1px 4px rgba(0,0,0,0.04)',
        lineHeight: 1.6, fontSize: '0.95rem',
        overflowWrap: 'break-word',
      }}>
        {message.isError ? (
          <p style={{ color: isUser ? 'white' : 'var(--color-error)' }}>{message.content}</p>
        ) : isUser ? (
          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{message.content}</p>
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
              pre: ({node, ...props}) => <pre style={{ background: '#f4f4f5', padding: '0.75rem', borderRadius: '8px', overflowX: 'auto', marginBottom: '0.5rem' }} {...props} />,
              code: ({node, inline, ...props}) => inline ? <code style={{ background: '#f4f4f5', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.85em' }} {...props} /> : <code {...props} />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}

        {message.sources && message.sources.length > 0 && (
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {message.sources.map((s, idx) => <SourceBadge key={idx} source={s} />)}
          </div>
        )}

        {!message.content && !message.isError && (
          <div style={{ display: 'flex', gap: '0.3rem', padding: '0.25rem 0' }}>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
          </div>
        )}
      </div>
    </div>
  );
});

export default MessageBubble;
