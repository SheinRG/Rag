import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import useDocumentStore from '../../store/documentStore';
import useChatStore from '../../store/chatStore';

const statusColors = {
  processing: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)', label: 'Processing...' },
  ready: { bg: 'var(--color-success-light)', color: 'var(--color-success)', label: 'Ready' },
  failed: { bg: 'var(--color-error-light)', color: 'var(--color-error)', label: 'Failed' },
};

const typeIcons = {
  pdf: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <path d="M10 18v-4"></path>
      <path d="M14 18v-4"></path>
      <path d="M10 14h4"></path>
    </svg>
  ),
  txt: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <line x1="10" y1="9" x2="8" y2="9"></line>
    </svg>
  ),
  md: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <path d="M8 15V9l2.5 4L13 9v6"></path>
      <path d="M16 11v4"></path>
      <path d="M16 11l-2 2"></path>
      <path d="M16 11l2 2"></path>
    </svg>
  )
};

const defaultIcon = (
   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
   </svg>
);

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const typeStyles = {
  pdf: { color: 'text-rose-500', bg: 'bg-rose-50/50', border: 'border-rose-100/50' },
  txt: { color: 'text-blue-500', bg: 'bg-blue-50/50', border: 'border-blue-100/50' },
  md: { color: 'text-emerald-500', bg: 'bg-emerald-50/50', border: 'border-emerald-100/50' },
};

export default function DocumentCard({ doc, onDelete }) {
  const st = statusColors[doc.status] || statusColors.processing;
  const pollStatus = useDocumentStore((state) => state.pollDocumentStatus);
  const renameDocument = useDocumentStore((state) => state.renameDocument);
  const { activeDocumentId, setActiveDocument } = useChatStore();
  const isSelected = activeDocumentId === doc.id;
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(doc.original_name);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef(null);

  const style = typeStyles[doc.file_type] || { color: 'text-gray-500', bg: 'bg-gray-50/50', border: 'border-gray-100/50' };

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleRename = async () => {
    if (editName.trim() && editName !== doc.original_name) {
      await renameDocument(doc.id, editName.trim());
    }
    setIsEditing(false);
    setShowMenu(false);
  };

return (
    <motion.div
      whileHover={{ scale: 1.015, y: -1 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      onClick={() => doc.status === 'ready' && setActiveDocument(doc.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isSelected ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '0.75rem',
        border: `1.2px solid ${isSelected ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.4)'}`,
        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        cursor: doc.status === 'ready' ? 'pointer' : 'default',
        boxShadow: isSelected ? '0 4px 15px rgba(0,0,0,0.03)' : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      <div className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-xl border ${style.bg} ${style.border} ${style.color}`}>
        {typeIcons[doc.file_type] || defaultIcon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-[0.8rem] text-gray-800 truncate m-0 leading-tight">
          {doc.original_name}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <span className={`text-[0.62rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${st.bg} ${st.color}`}>
            {st.label}
          </span>
          <span className="text-[0.65rem] text-gray-400 font-medium">{formatSize(doc.file_size)}</span>
          {doc.num_chunks > 0 && (
            <span className="text-[0.65rem] text-gray-400 font-medium">• {doc.num_chunks} chunks</span>
          )}
        </div>
      </div>

      <div className="relative" ref={menuRef}>
        {showMenu && !isEditing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-0 top-6 z-50 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden min-w-[140px]"
          >
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-card-hover)] flex items-center gap-2"
              style={{ color: 'var(--color-text)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
              </svg>
              Rename
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-card-hover)] flex items-center gap-2"
              style={{ color: 'var(--color-error)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
              Delete
            </button>
          </motion.div>
        )}

        {isEditing ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              onBlur={handleRename}
              autoFocus
              className="w-24 px-1 py-0.5 text-xs rounded border border-[var(--color-primary-400)] bg-[var(--color-input-bg)] outline-none"
              style={{ color: 'var(--color-text)' }}
            />
          </div>
        ) : isHovered || showMenu ? (
          <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            title="More options"
            style={{
              border: 'none', background: 'none', cursor: 'pointer',
              color: 'var(--color-text-muted)', fontSize: '0.85rem', padding: '0.15rem',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2"></circle>
              <circle cx="12" cy="12" r="2"></circle>
              <circle cx="12" cy="19" r="2"></circle>
            </svg>
          </motion.button>
        ) : null}
      </div>
    </motion.div>
  );
}
