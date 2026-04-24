import { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import DocumentOverview from '../documents/DocumentOverview';

export default function MessageList({ messages, onReask, activeDoc, onSuggestionClick, onAddToNote, onEditMessage }) {
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
            <h3 style={{ fontWeight: 600, color: '#111', fontSize: '1.75rem', fontFamily: '"Rubik", sans-serif', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
              What's on your mind?
            </h3>
            <p style={{ fontSize: '1rem', color: '#6b7280', maxWidth: '420px', textAlign: 'center', lineHeight: '1.6', fontWeight: 400 }}>
              Connect your documents or search the web to start a research session. I'll help you dive deep into your data.
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
          onSuggestionClick={onSuggestionClick}
          onAddToNote={onAddToNote}
          onEditMessage={onEditMessage}
        />
      ))}
    </div>
  );
}
