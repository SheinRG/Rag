import { useEffect } from 'react';
import useDocumentStore from '../../store/documentStore';

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
    <div style={{
      background: 'white', borderRadius: '12px', padding: '1rem',
      border: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
    }}>
      <span style={{ fontSize: '1.5rem' }}>{typeIcons[doc.file_type] || '📄'}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontWeight: 600, fontSize: '0.9rem',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{doc.original_name}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
          <span style={{
            fontSize: '0.7rem', fontWeight: 600,
            padding: '0.15rem 0.5rem', borderRadius: '6px',
            background: st.bg, color: st.color,
          }}>{st.label}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{formatSize(doc.file_size)}</span>
          {doc.num_chunks > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>• {doc.num_chunks} chunks</span>
          )}
        </div>
      </div>

      <button onClick={() => onDelete(doc.id)} title="Delete document" style={{
        border: 'none', background: 'none', cursor: 'pointer',
        color: 'var(--color-text-muted)', fontSize: '1rem', padding: '0.25rem',
      }}>🗑️</button>
    </div>
  );
}
