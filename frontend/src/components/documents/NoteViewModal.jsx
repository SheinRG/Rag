import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function NoteViewModal({ isOpen, onClose, note, onEdit }) {
  if (!isOpen || !note) return null;

  const formattedDate = note.date
    ? new Date(note.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '600px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '32px',
            overflow: 'hidden',
            boxShadow: '0 40px 100px -20px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.8)',
            display: 'flex', flexDirection: 'column',
            maxHeight: '85vh',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '2rem 2.5rem 1.5rem',
            background: 'linear-gradient(to bottom, #f8fafc, transparent)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                 <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#E11D48', background: '#FFF1F2', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                   Note
                 </span>
                 {formattedDate && <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>{formattedDate}</span>}
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                {note.title}
              </h2>
              {note.subtitle && (
                <p style={{ fontSize: '1rem', color: '#64748b', marginTop: '0.4rem', fontWeight: 500 }}>
                  {note.subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                width: '36px', height: '36px', borderRadius: '12px',
                border: 'none', background: '#f1f5f9', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94a3b8', transition: 'all 0.2s', marginTop: '-0.5rem', marginRight: '-0.5rem'
              }}
              className="hover:bg-white hover:text-gray-900 hover:shadow-sm"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Content Area */}
          <div style={{
            padding: '0 2.5rem 2rem',
            overflowY: 'auto',
            flex: 1,
            scrollbarWidth: 'none',
          }}>
            <div className="prose prose-slate prose-sm max-w-none" style={{ color: '#334155', lineHeight: 1.8 }}>
               <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 style={{fontSize: '1.5rem', fontWeight: 800, margin: '2rem 0 1rem', color: '#0f172a'}} {...props} />,
                  h2: ({node, ...props}) => <h2 style={{fontSize: '1.25rem', fontWeight: 700, margin: '1.75rem 0 0.75rem', color: '#1e293b'}} {...props} />,
                  p: ({node, ...props}) => <p style={{margin: '0 0 1.25rem'}} {...props} />,
                  ul: ({node, ...props}) => <ul style={{listStyleType: 'disc', paddingLeft: '1.5rem', margin: '1rem 0'}} {...props} />,
                  li: ({node, ...props}) => <li style={{margin: '0.5rem 0'}} {...props} />,
                  strong: ({node, ...props}) => <strong style={{fontWeight: 700, color: '#0f172a'}} {...props} />,
                  blockquote: ({node, ...props}) => <blockquote style={{borderLeft: '4px solid #e2e8f0', paddingLeft: '1rem', fontStyle: 'italic', color: '#64748b', margin: '1.5rem 0'}} {...props} />,
                }}
               >
                 {note.content || '*No content.*'}
               </ReactMarkdown>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{
            padding: '1.5rem 2.5rem 2rem',
            background: 'white',
            borderTop: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'flex-end', gap: '1rem'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.75rem 1.75rem',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                background: 'white',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              className="hover:border-gray-300 hover:text-gray-900 shadow-sm"
            >
              Close
            </button>
            <button
              onClick={() => { onClose(); onEdit(note); }}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: '16px',
                border: 'none',
                background: '#0f172a',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                boxShadow: '0 10px 20px -5px rgba(15, 23, 42, 0.3)'
              }}
              className="hover:bg-slate-800"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Note
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
