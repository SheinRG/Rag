import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SourceBadge({ source }) {
  const [isOpen, setIsOpen] = useState(false);
  const name = typeof source === 'string' ? source : source.name;
  const chunks = typeof source === 'string' ? [] : source.chunks;

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => chunks.length > 0 && setIsOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          background: 'var(--color-badge-bg)', color: 'var(--color-badge-text)',
          padding: '0.25rem 0.65rem', borderRadius: '6px', border: 'none',
          fontSize: '0.75rem', fontWeight: 600, cursor: chunks.length > 0 ? 'pointer' : 'default',
          fontFamily: 'inherit',
        }}
      >
        📄 {name}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'var(--color-modal-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: '2rem'
            }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'var(--color-card-bg)', borderRadius: '16px', padding: '1.5rem',
                width: '100%', maxWidth: '600px', maxHeight: '80vh', overflow: 'auto',
                border: '1px solid var(--color-border)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text)', fontWeight: 700 }}>📄 {name} — Retrieved Context</h3>
                <button onClick={() => setIsOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>✕</button>
              </div>
              {chunks.map((chunk, idx) => (
                <div key={idx} style={{
                  background: 'var(--color-surface-secondary)', padding: '1rem', borderRadius: '8px',
                  marginBottom: '0.75rem', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text)',
                  whiteSpace: 'pre-wrap', border: '1px solid var(--color-border)',
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chunk {idx + 1}</div>
                  {chunk}
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
