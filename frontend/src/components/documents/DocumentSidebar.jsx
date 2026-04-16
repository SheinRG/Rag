import { useEffect } from 'react';
import useDocumentStore from '../../store/documentStore';
import DocumentCard from './DocumentCard';
import UploadZone from './UploadZone';

export default function DocumentSidebar() {
  const { documents, fetchDocuments, deleteDocument, loading } = useDocumentStore();

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 10000);
    return () => clearInterval(interval);
  }, [fetchDocuments]);

  return (
    <div style={{
      width: '360px', borderRight: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column', background: 'white', height: '100%',
    }}>
      <div style={{
        padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)',
        fontWeight: 700, fontSize: '1.1rem',
      }}>
        📁 Documents
      </div>

      <div style={{ padding: '1rem 1.25rem' }}>
        <UploadZone />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 1.25rem 1.25rem' }}>
        {loading && documents.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0', fontSize: '0.9rem' }}>
            Loading documents...
          </p>
        ) : documents.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0', fontSize: '0.9rem' }}>
            No documents yet. Upload one to get started!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {documents.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} onDelete={deleteDocument} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
