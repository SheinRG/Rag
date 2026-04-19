import { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import DocumentOverview from '../documents/DocumentOverview';

export default function MessageList({ messages, onReask, activeDoc }) {
  const prevLenRef = useRef(messages.length);
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100;
      const hasNewMessage = messages.length > prevLenRef.current;

      // 1. Always scroll to bottom if a brand new message was added
      // 2. Or if we are already at the bottom while streaming
      if (hasNewMessage || isAtBottom) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }
    prevLenRef.current = messages.length;
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start', color: 'var(--color-text-muted)',
        padding: '4rem 2rem 120px 2rem', minHeight: 0, overflowY: 'auto'
      }}>
        {activeDoc ? (
          <div style={{ width: '100%', maxWidth: '600px' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
               <h2 style={{ fontSize: '1.75rem', fontWeight: 400, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                 {activeDoc.original_name}
               </h2>
               <div style={{ h: '2px', w: '40px', background: 'var(--color-primary-500)', margin: '0 auto' }}></div>
            </div>
            
            <div style={{ background: 'white/50', borderRadius: '24px', border: '1px solid white', padding: '1.5rem', backdropBlur: 'xl' }}>
              <DocumentOverview document={activeDoc} />
            </div>
          </div>
        ) : (
          <>
            <span style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>💬</span>
            <h3 style={{ fontWeight: 400, color: 'var(--color-text)', fontSize: '1.5rem' }}>How can I help you today?</h3>
            <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', maxWidth: '400px', textAlign: 'center', marginTop: '0.5rem' }}>
              Select a document from the left to get started, or ask a general question.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.5rem', paddingBottom: '120px' }}>
      {messages.map((msg, i) => (
        <MessageBubble
          key={i}
          message={msg}
          onReask={msg.role === 'user' ? onReask : undefined}
          isLastMessage={i === messages.length - 1}
        />
      ))}
    </div>
  );
}
