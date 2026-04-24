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
  ),
  youtube: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  image: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
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
  youtube: { color: 'text-red-500', bg: 'bg-red-50/50', border: 'border-red-100/50' },
  image: { color: 'text-cyan-500', bg: 'bg-cyan-50/50', border: 'border-cyan-100/50' },
};

export default function DocumentCard({ doc, onDelete }) {
  const st = statusColors[doc.status] || statusColors.processing;
  const pollStatus = useDocumentStore((state) => state.pollDocumentStatus);
  const renameDocument = useDocumentStore((state) => state.renameDocument);
  const { activeDocumentIds, toggleDocument } = useChatStore();
  const isSelected = activeDocumentIds.includes(doc.id);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(doc.original_name);
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      onClick={() => {
        if (doc.status === 'ready') {
          toggleDocument(doc.id);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isSelected ? '#ffffff' : 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '0.75rem',
        border: `1.5px solid ${isSelected ? '#000000' : 'rgba(255,255,255,0.6)'}`,
        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        cursor: doc.status === 'ready' ? 'pointer' : 'default',
        boxShadow: isSelected ? '0 8px 24px rgba(0,0,0,0.08)' : '0 2px 10px rgba(0,0,0,0.02)',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
        opacity: isDeleting ? 0.3 : 1,
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-xl border ${style.bg} ${style.border} ${style.color}`}>
        {typeIcons[doc.file_type] || defaultIcon}
      </div>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            onBlur={handleRename}
            autoFocus
            className="w-full bg-white/50 border border-black/10 rounded px-1.5 py-0.5 text-[0.8rem] font-medium text-gray-900 outline-none focus:border-black/30"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p className="font-medium text-[0.8rem] text-gray-800 truncate m-0 leading-tight">
            {doc.original_name}
          </p>
        )}

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
              onClick={(e) => { 
                e.stopPropagation(); 
                setEditName(doc.original_name);
                setIsEditing(true); 
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-card-hover)] flex items-center gap-2"
              style={{ color: 'var(--color-text)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
              </svg>
              Rename
            </button>
            <button
              onClick={async (e) => { 
                e.stopPropagation(); 
                setShowMenu(false);
                setIsDeleting(true);
                try {
                  await onDelete(doc.id);
                } catch (err) {
                  setIsDeleting(false);
                }
              }}
              disabled={isDeleting}
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-card-hover)] flex items-center gap-2 disabled:opacity-50"
              style={{ color: 'var(--color-error)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </motion.div>
        )}

        {(isHovered || showMenu) && (
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
        )}
      </div>
    </motion.div>
  );
}
