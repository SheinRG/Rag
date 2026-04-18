import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useDocumentStore from '../../store/documentStore';
import useChatStore from '../../store/chatStore';
import DocumentCard from './DocumentCard';
import UploadZone from './UploadZone';
import DocumentOverview from './DocumentOverview';

export default function DocumentSidebar() {
  const { documents, fetchDocuments, deleteDocument, loading } = useDocumentStore();
  const { activeDocumentId } = useChatStore();

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 10000);
    return () => clearInterval(interval);
  }, [fetchDocuments]);

  // Find the active document for overview
  const activeDoc = documents.find(d => d.id === activeDocumentId);

  return (
    <div className="w-full flex flex-col h-full bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[32px] overflow-hidden">
      <div style={{
        padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)',
        fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text)',
      }}>
        📁 Sources
      </div>

      <div style={{ padding: '0.75rem 1rem' }}>
        <UploadZone />
      </div>

      {/* Document List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 1rem 1rem' }}>
        {loading && documents.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0', fontSize: '0.9rem' }}>
            Loading documents...
          </p>
        ) : documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0.5rem' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>📄</span>
            <p style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
              Saved sources will appear here
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
              Upload PDFs, text, or Markdown files to begin exploring with AI.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <AnimatePresence>
              {documents.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <DocumentCard doc={doc} onDelete={deleteDocument} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Document Overview Panel (shown when a document is selected and ready) */}
      <AnimatePresence>
        {activeDoc && activeDoc.status === 'ready' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              borderTop: '1px solid var(--color-border)',
              overflow: 'hidden',
            }}
          >
            <DocumentOverview document={activeDoc} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
