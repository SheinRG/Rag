import { useState } from 'react';
import { motion } from 'framer-motion';

export default function NoteCard({ note, onView, onEdit, onDelete }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formattedDate = note.date
    ? new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <motion.div
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.08, ease: 'easeOut' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onView?.(note)}
      style={{
        background: 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '0.75rem',
        border: `1.5px solid ${isHovered ? '#E11D48' : 'rgba(255,255,255,0.6)'}`,
        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        cursor: 'pointer',
        boxShadow: isHovered ? '0 8px 24px rgba(225, 29, 72, 0.08)' : '0 2px 10px rgba(0,0,0,0.02)',
        opacity: isDeleting ? 0.3 : 1,
        transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease-out',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Reddish Icon Div - Matches DocumentCard structure */}
      <div style={{
        width: '36px', height: '36px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '12px',
        background: '#FFF1F2',
        border: '1px solid #FECDD3',
        color: '#E11D48'
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '0.8rem', fontWeight: 600, color: '#1e293b',
          lineHeight: 1.3, margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {note.title}
        </p>

        {/* Subtitle + Date */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          marginTop: '4px',
        }}>
          {note.subtitle && (
            <span style={{
              fontSize: '0.68rem', color: '#64748b',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: '100px',
            }}>
              {note.subtitle}
            </span>
          )}
          {note.subtitle && formattedDate && (
            <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>•</span>
          )}
          {formattedDate && (
            <span style={{ fontSize: '0.65rem', color: '#94a3b8', flexShrink: 0 }}>
              {formattedDate}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons on hover */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.1 }}
          style={{ display: 'flex', gap: '0.25rem', flexShrink: 0, position: 'absolute', right: '0.5rem', top: '0.5rem' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(note); }}
            style={{
              width: '24px', height: '24px', borderRadius: '8px',
              border: 'none', background: '#ffffff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
            className="hover:bg-gray-50 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={async (e) => { 
              e.stopPropagation();
              setIsDeleting(true);
              try {
                await onDelete?.(note.id);
              } catch (err) {
                setIsDeleting(false);
              }
            }}
            disabled={isDeleting}
            style={{
              width: '24px', height: '24px', borderRadius: '8px',
              border: 'none', background: '#FFF1F2', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#E11D48', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
            className="hover:bg-red-100 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
