import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function SummaryModal({ data, onClose }) {
  const summary = data?.summary || 'No summary generated.';

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
          background: 'rgba(253, 247, 230, 0.85)',
          backdropBlur: '20px',
          borderRadius: '32px',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '85vh',
          overflow: 'auto',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 600, color: '#D97706', tracking: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
            Executive Summary
          </h2>
          <button onClick={onClose} style={{
            border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer',
            padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', transition: 'all 0.2s ease'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Markdown Content */}
        <div style={{
          fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--color-text)',
        }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, ...props }) => <p style={{ margin: '0 0 0.75rem 0' }} {...props} />,
              ul: ({ node, ...props }) => <ul style={{ marginLeft: '1.5rem', marginBottom: '0.75rem', listStyleType: 'disc' }} {...props} />,
              ol: ({ node, ...props }) => <ol style={{ marginLeft: '1.5rem', marginBottom: '0.75rem', listStyleType: 'decimal' }} {...props} />,
              li: ({ node, ...props }) => <li style={{ marginBottom: '0.3rem' }} {...props} />,
              h1: ({ node, ...props }) => <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '1.25rem 0 0.5rem 0', color: 'var(--color-text)' }} {...props} />,
              h2: ({ node, ...props }) => <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '1rem 0 0.5rem 0', color: 'var(--color-text)' }} {...props} />,
              h3: ({ node, ...props }) => <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: '0.75rem 0 0.5rem 0', color: 'var(--color-text)' }} {...props} />,
              strong: ({ node, ...props }) => <strong style={{ fontWeight: 700, color: 'var(--color-text)' }} {...props} />,
              blockquote: ({ node, ...props }) => <blockquote style={{ borderLeft: '3px solid var(--color-primary-400)', paddingLeft: '1rem', margin: '0.75rem 0', color: 'var(--color-text-secondary)' }} {...props} />,
            }}
          >
            {summary}
          </ReactMarkdown>
        </div>
      </motion.div>
    </motion.div>
  );
}
