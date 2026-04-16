import { useState } from 'react';

export default function SourceBadge({ source }) {
  const [isOpen, setIsOpen] = useState(false);
  const name = typeof source === 'string' ? source : source.name;
  const chunks = typeof source === 'string' ? [] : source.chunks;

  return (
    <>
      <button 
        onClick={() => chunks.length > 0 && setIsOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          background: 'var(--color-primary-50)', color: 'var(--color-primary-700)',
          padding: '0.25rem 0.65rem', borderRadius: '6px', border: 'none',
          fontSize: '0.75rem', fontWeight: 600, cursor: chunks.length > 0 ? 'pointer' : 'default',
        }}
      >
        📄 {name}
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '2rem'
        }} onClick={() => setIsOpen(false)}>
          <div style={{
            background: 'white', borderRadius: '12px', padding: '1.5rem',
            width: '100%', maxWidth: '600px', maxHeight: '80vh', overflow: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-primary-900)' }}>📄 {name} - AI Retrieval Context</h3>
              <button onClick={() => setIsOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✖</button>
            </div>
            {chunks.map((chunk, idx) => (
              <div key={idx} style={{
                background: 'var(--color-background)', padding: '1rem', borderRadius: '8px', 
                marginBottom: '1rem', fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--color-text)',
                whiteSpace: 'pre-wrap'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem', fontWeight: 'bold' }}>CHUNK {idx + 1}</div>
                {chunk}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
