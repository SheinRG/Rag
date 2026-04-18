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
        background: 'var(--color-modal-overlay)',
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
          background: 'var(--color-card-bg)',
          borderRadius: '20px',
          padding: '2rem',
          width: '100%',
          maxWidth: '750px',
          maxHeight: '85vh',
          overflow: 'auto',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
            🗺️ Mind Map
          </h2>
          <button onClick={onClose} style={{
            border: 'none', background: 'none', cursor: 'pointer',
            fontSize: '1.25rem', color: 'var(--color-text-muted)',
          }}>✕</button>
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
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              navigator.clipboard.writeText(mermaid);
            }}
            style={{
              flex: 1, padding: '0.7rem', borderRadius: '10px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-card-bg)', color: 'var(--color-text)',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
              fontFamily: 'inherit',
            }}
          >
            📋 Copy Mermaid Code
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              window.open(`https://mermaid.live/edit#pako:${btoa(mermaid)}`, '_blank');
            }}
            style={{
              flex: 1, padding: '0.7rem', borderRadius: '10px',
              border: 'none', background: 'var(--color-primary-600)',
              color: 'white', cursor: 'pointer', fontWeight: 600,
              fontSize: '0.9rem', fontFamily: 'inherit',
            }}
          >
            🔗 Open in Mermaid Live
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
