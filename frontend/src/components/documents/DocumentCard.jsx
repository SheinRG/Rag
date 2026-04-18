import { useEffect } from 'react';
import { motion } from 'framer-motion';
import useDocumentStore from '../../store/documentStore';
import useChatStore from '../../store/chatStore';

const statusColors = {
  processing: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)', label: 'Processing...' },
  ready: { bg: 'var(--color-success-light)', color: 'var(--color-success)', label: 'Ready' },
  failed: { bg: 'var(--color-error-light)', color: 'var(--color-error)', label: 'Failed' },
};

const typeIcons = { pdf: '📕', txt: '📄', md: '📝' };

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function DocumentCard({ doc, onDelete }) {
  const st = statusColors[doc.status] || statusColors.processing;
  const pollStatus = useDocumentStore((state) => state.pollDocumentStatus);
  const { activeDocumentId, setActiveDocument } = useChatStore();
  const isActive = activeDocumentId === doc.id;

  useEffect(() => {
    let intervalId;
    if (doc.status === 'processing') {
      intervalId = setInterval(() => {
        pollStatus(doc.id);
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [doc.status, doc.id, pollStatus]);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => doc.status === 'ready' && setActiveDocument(doc.id)}
      style={{
        background: isActive ? 'var(--color-badge-bg)' : 'var(--color-card-bg)',
        borderRadius: '10px',
        padding: '0.75rem',
        border: `1px solid ${isActive ? 'var(--color-primary-400)' : 'var(--color-border)'}`,
        display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
        cursor: doc.status === 'ready' ? 'pointer' : 'default',
      }}
    >
      <span style={{ fontSize: '1.25rem' }}>{typeIcons[doc.file_type] || '📄'}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          margin: 0,
        }}>{doc.original_name}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.65rem', fontWeight: 600,
            padding: '0.1rem 0.4rem', borderRadius: '5px',
            background: st.bg, color: st.color,
          }}>{st.label}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{formatSize(doc.file_size)}</span>
          {doc.num_chunks > 0 && (
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>• {doc.num_chunks} chunks</span>
          )}
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
        title="Delete document"
        style={{
          border: 'none', background: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)', fontSize: '0.85rem', padding: '0.15rem',
        }}
      >
        🗑️
      </motion.button>
    </motion.div>
  );
}
