import { motion } from 'framer-motion';

export default function MindMapModal({ data, onClose }) {
  const mermaid = data?.mermaid || '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.15)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '2rem',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(245, 243, 255, 0.85)',
          backdropBlur: '20px',
          borderRadius: '32px',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '85vh',
          overflow: 'auto',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 600, color: '#8B5CF6', tracking: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3z" />
              <path d="M6 3a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3 3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" />
              <line x1="9" y1="12" x2="15" y2="12" />
            </svg>
            Mind Map
          </h2>
          <button onClick={onClose} style={{
            border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer',
            padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', transition: 'all 0.2s ease'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Mermaid Code Display */}
        <div style={{
          background: 'var(--color-surface-secondary)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid var(--color-border)',
          marginBottom: '1rem',
        }}>
          <p style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Document Structure
          </p>
          <pre style={{
            fontFamily: '"Fira Code", "Cascadia Code", monospace',
            fontSize: '0.82rem',
            lineHeight: 1.7,
            color: 'var(--color-text)',
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {mermaid}
          </pre>
        </div>

        {/* Copy button */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              navigator.clipboard.writeText(mermaid);
            }}
            style={{
              flex: 1, padding: '0.85rem', borderRadius: '16px',
              border: '1.5px solid #8B5CF6',
              background: 'white', color: '#8B5CF6',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', gap: '0.6rem', transition: 'all 0.2s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy Mermaid Code
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(139, 92, 246, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              window.open(`https://mermaid.live/edit#pako:${btoa(mermaid)}`, '_blank');
            }}
            style={{
              flex: 1, padding: '0.85rem', borderRadius: '16px',
              border: 'none', background: '#8B5CF6',
              color: 'white', cursor: 'pointer', fontWeight: 600,
              fontSize: '0.95rem', fontFamily: 'inherit', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            Open in Mermaid Live
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
