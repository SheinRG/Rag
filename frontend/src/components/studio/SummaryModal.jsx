import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function SummaryModal({ data, onClose, type = 'dashboard' }) {
  const [copied, setCopied] = useState(false);
  const summary = data?.summary || 'No summary generated.';

  const isDashboard = type === 'dashboard';
  const themeColor = isDashboard ? '#4F46E5' : '#D97706';
  const bgAccent = isDashboard ? '#EEF2FF' : '#FFF7ED';

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
          background: 'rgba(255, 255, 255, 0.98)',
          backdropBlur: '20px',
          borderRadius: '32px',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '85vh',
          overflow: 'auto',
          border: `1px solid ${isDashboard ? 'rgba(226, 232, 240, 0.8)' : 'rgba(251, 191, 36, 0.3)'}`,
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.12)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', background: bgAccent, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: themeColor }}>
              {isDashboard ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              )}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
                {isDashboard ? 'Notebook Intelligence Dashboard' : 'Source Document Summary'}
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                {isDashboard ? 'High-level thematic synthesis of your workspace' : 'Condensed overview of the selected source'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            border: 'none', background: '#F8FAFC', cursor: 'pointer',
            width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', transition: 'all 0.2s ease', color: '#94A3B8'
          }} className="hover:bg-gray-100 hover:text-gray-900">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Markdown Content */}
        <div style={{
          fontSize: '0.95rem', lineHeight: 1.75, color: '#334155',
        }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, ...props }) => <p style={{ margin: '0 0 1.25rem 0' }} {...props} />,
              ul: ({ node, ...props }) => <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', listStyleType: 'none' }} {...props} />,
              li: ({ node, ...props }) => (
                <li style={{ marginBottom: '0.6rem', position: 'relative' }} {...props}>
                  <span style={{ position: 'absolute', left: '-1.25rem', color: themeColor, fontWeight: 'bold' }}>•</span>
                  {props.children}
                </li>
              ),
              h1: ({ node, ...props }) => <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '2rem 0 1rem 0', color: '#0F172A', letterSpacing: '-0.02em' }} {...props} />,
              h2: ({ node, ...props }) => <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '1.75rem 0 0.75rem 0', color: '#1E293B', letterSpacing: '-0.01em' }} {...props} />,
              h3: ({ node, ...props }) => <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '1.5rem 0 0.5rem 0', color: '#334155' }} {...props} />,
              strong: ({ node, ...props }) => <strong style={{ fontWeight: 700, color: themeColor }} {...props} />,
              blockquote: ({ node, ...props }) => <blockquote style={{ borderLeft: `4px solid ${isDashboard ? '#E0E7FF' : '#FFEDD5'}`, paddingLeft: '1.25rem', margin: '1.5rem 0', color: '#475569', fontStyle: 'italic', background: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '0 12px 12px 0' }} {...props} />,
            }}
          >
            {summary}
          </ReactMarkdown>
        </div>

        {/* Footer Actions */}
        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '1.5rem' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              navigator.clipboard.writeText(summary);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            style={{
              padding: '0.7rem 1.5rem',
              background: copied ? '#10B981' : themeColor,
              color: '#ffffff',
              borderRadius: '14px',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: copied ? '0 10px 15px -3px rgba(16, 185, 129, 0.2)' : `0 10px 15px -3px ${isDashboard ? 'rgba(79, 70, 229, 0.2)' : 'rgba(217, 119, 6, 0.2)'}`,
            }}
          >
            {copied ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied Content
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy Content
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
