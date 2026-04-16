import SourceBadge from './SourceBadge';

export default function MessageBubble({ message }) {
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
      }}>
        {message.isError ? (
          <p style={{ color: isUser ? 'white' : 'var(--color-error)' }}>{message.content}</p>
        ) : (
          <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
        )}

        {message.sources && message.sources.length > 0 && (
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {message.sources.map((s) => <SourceBadge key={s} source={s} />)}
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
}
