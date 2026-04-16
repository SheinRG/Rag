import { useState } from 'react';

export default function ChatInput({ onSend, disabled }) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim() || disabled) return;
    onSend(question.trim());
    setQuestion('');
  };

  return (
    <form onSubmit={handleSubmit} style={{
      padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)',
      background: 'white', display: 'flex', gap: '0.75rem',
    }}>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question about your documents..."
        disabled={disabled}
        style={{
          flex: 1, padding: '0.75rem 1rem', borderRadius: '10px',
          border: '1px solid var(--color-border)', fontSize: '0.95rem',
          outline: 'none', fontFamily: 'inherit',
        }}
      />
      <button type="submit" disabled={disabled || !question.trim()} style={{
        padding: '0.75rem 1.5rem', borderRadius: '10px', border: 'none',
        background: 'var(--color-primary-600)', color: 'white',
        fontWeight: 600, cursor: 'pointer', opacity: disabled || !question.trim() ? 0.5 : 1,
        fontFamily: 'inherit',
      }}>Send</button>
    </form>
  );
}
