import { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';

export default function MessageList({ messages }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)',
        gap: '1rem', padding: '2rem',
      }}>
        <span style={{ fontSize: '3rem' }}>💬</span>
        <h3 style={{ fontWeight: 700, color: 'var(--color-text-secondary)' }}>Ask anything about your documents</h3>
        <p style={{ fontSize: '0.9rem', maxWidth: '400px', textAlign: 'center', lineHeight: 1.5 }}>
          Upload a document first, then ask questions. The AI will find answers from your content with source citations.
        </p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
