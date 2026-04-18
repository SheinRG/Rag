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
          maxWidth: '700px',
          maxHeight: '85vh',
          overflow: 'auto',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
            📋 Executive Summary
          </h2>
          <button onClick={onClose} style={{
            border: 'none', background: 'none', cursor: 'pointer',
            fontSize: '1.25rem', color: 'var(--color-text-muted)',
          }}>✕</button>
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
