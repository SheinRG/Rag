import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useNotebookStore from '../store/notebookStore';
import useAuthStore from '../store/authStore';
import api from '../api/client';

const emojiOptions = ['📓', '📚', '🧪', '💡', '🎯', '🔬', '📊', '🗂️', '🎓', '🧠', '⚡', '🌍', '📝', '🏗️', '🎨', '🔧'];

const harmonicPalettes = [
  { bg: 'from-blue-400 to-cyan-400', accent: 'text-blue-600', iconBg: 'bg-blue-100/40', iconBorder: 'border-blue-200/50', gradient: 'rgba(56, 189, 248, 0.07)' },
  { bg: 'from-purple-400 to-pink-400', accent: 'text-purple-600', iconBg: 'bg-purple-100/40', iconBorder: 'border-purple-200/50', gradient: 'rgba(192, 38, 211, 0.07)' },
  { bg: 'from-emerald-400 to-teal-400', accent: 'text-emerald-600', iconBg: 'bg-emerald-100/40', iconBorder: 'border-emerald-200/50', gradient: 'rgba(16, 185, 129, 0.07)' },
  { bg: 'from-orange-400 to-rose-400', accent: 'text-orange-600', iconBg: 'bg-orange-100/40', iconBorder: 'border-orange-200/50', gradient: 'rgba(251, 146, 60, 0.07)' },
  { bg: 'from-indigo-400 to-blue-400', accent: 'text-indigo-600', iconBg: 'bg-indigo-100/40', iconBorder: 'border-indigo-200/50', gradient: 'rgba(99, 102, 241, 0.07)' },
  { bg: 'from-rose-400 to-red-400', accent: 'text-rose-600', iconBg: 'bg-rose-100/40', iconBorder: 'border-rose-200/50', gradient: 'rgba(244, 63, 94, 0.07)' },
  { bg: 'from-amber-400 to-yellow-400', accent: 'text-amber-600', iconBg: 'bg-amber-100/40', iconBorder: 'border-amber-200/50', gradient: 'rgba(245, 158, 11, 0.07)' },
  { bg: 'from-cyan-400 to-sky-400', accent: 'text-cyan-600', iconBg: 'bg-cyan-100/40', iconBorder: 'border-cyan-200/50', gradient: 'rgba(6, 182, 212, 0.07)' },
];

function getNotebookVisuals(title = '') {
  const t = title.toLowerCase();
  let icon = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>;

  if (t.includes('compute') || t.includes('cloud') || t.includes('tech') || t.includes('dev')) {
    icon = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>;
  } else if (t.includes('interview') || t.includes('prep') || t.includes('guide') || t.includes('career')) {
    icon = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
  } else if (t.includes('module') || t.includes('unit') || t.includes('lesson') || t.includes('study') || t.includes('learn')) {
    icon = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>;
  } else if (t.includes('legal') || t.includes('law') || t.includes('court') || t.includes('compliance')) {
    icon = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v20M2 12h20M7 7l10 10M7 17L17 7"/></svg>;
  } else if (t.includes('finance') || t.includes('money') || t.includes('gold') || t.includes('trade')) {
    icon = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
  } else if (t.includes('science') || t.includes('bio') || t.includes('chem') || t.includes('health')) {
    icon = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8.5 2v20M15.5 2v20M2 12h20"></path><path d="M2 7a5 5 0 0 1 5-5h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7z"></path></svg>;
  } else if (t.includes('music') || t.includes('song') || t.includes('audio') || t.includes('beat')) {
    icon = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>;
  } else if (t.includes('art') || t.includes('paint') || t.includes('creative') || t.includes('design')) {
    icon = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.8-.1 2.6-.4.7-.2 1.3-.7 1.6-1.4.3-.7.3-1.4.1-2.1-.2-.7-.1-1.4.2-2.1.3-.7.9-1.2 1.6-1.4.7-.2 1.4-.2 2.1 0 .7.1 1.4 0 2.1-.3.7-.3 1.2-.9 1.4-1.6.3-.8.4-1.7.4-2.6 0-5.5-4.5-10-10-10z"></path></svg>;
  }

  // Pick a stable palette based on string sum
  const sum = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const palette = harmonicPalettes[sum % harmonicPalettes.length];

  return { icon, palette };
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function NotebookCard({ notebook, onOpen, onDelete, onUpdate }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(notebook.title);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRename = async () => {
    if (editTitle.trim() && editTitle !== notebook.title) {
      await onUpdate(notebook.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  const { icon, palette } = getNotebookVisuals(notebook.title);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.02, y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={() => !isEditing && onOpen(notebook.id)}
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)`,
        backgroundBlendMode: 'overlay',
        backgroundColor: palette.gradient,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '28px',
        border: '1.5px solid rgba(255,255,255,0.8)',
        padding: '1.75rem',
        cursor: 'pointer',
        position: 'relative',
        minHeight: '220px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 12px 40px rgba(0,0,0,0.04)',
        transition: 'all 0.3s ease',
        overflow: 'hidden'
      }}
    >
      {/* Visual Accent Flourish */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-20 rounded-full bg-gradient-to-br ${palette.bg}`} />

      {/* Dynamic Logo/Icon */}
      <div className={`relative w-[56px] h-[56px] rounded-2xl flex items-center justify-center border-b-[2px] shadow-sm mb-4 transition-transform group-hover:scale-110 ${palette.iconBg} ${palette.iconBorder} ${palette.accent}`}>
        {icon}
      </div>

      {/* 3-dot menu */}
      <div ref={menuRef} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }}>
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          style={{
            border: 'none',
            background: 'rgba(0,0,0,0.04)',
            cursor: 'pointer',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#666">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>

        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              right: 0,
              top: '40px',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              minWidth: '150px',
              zIndex: 50,
            }}
          >
            <button
              onClick={() => setIsEditing(true)}
              style={{
                width: '100%',
                padding: '0.6rem 1rem',
                border: 'none',
                background: 'none',
                textAlign: 'left',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#111',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
              Rename
            </button>
            <button
              onClick={() => { onDelete(notebook.id); setShowMenu(false); }}
              style={{
                width: '100%',
                padding: '0.6rem 1rem',
                border: 'none',
                background: 'none',
                textAlign: 'left',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#EF4444',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              Delete
            </button>
          </motion.div>
        )}
      </div>

      {/* Title + Meta */}
      <div>
        {isEditing ? (
          <div onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              onBlur={handleRename}
              autoFocus
              style={{
                width: '100%',
                padding: '0.4rem 0.6rem',
                borderRadius: '8px',
                border: '1.5px solid #111',
                outline: 'none',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                background: 'white',
              }}
            />
          </div>
        ) : (
          <h3 style={{
            margin: '0 0 0.5rem 0',
            fontSize: '1rem',
            fontWeight: 600,
            color: '#111',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {notebook.title}
          </h3>
        )}
        <p style={{
          margin: 0,
          fontSize: '0.78rem',
          color: '#9ca3af',
          fontWeight: 400,
        }}>
          {formatDate(notebook.created_at)} · {notebook.source_count || 0} source{notebook.source_count !== 1 ? 's' : ''}
        </p>
      </div>
    </motion.div>
  );
}

export default function NotebooksPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { notebooks, fetchNotebooks, createNotebook, deleteNotebook, updateNotebook, loading } = useNotebookStore();
  const [orphanCount, setOrphanCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotebooks();
      // Fetch orphan documents (no notebook_id assigned)
      api.get('/documents').then(({ data }) => {
        const orphans = data.filter(d => !d.notebook_id);
        setOrphanCount(orphans.length);
      }).catch(err => {
        console.error('Error fetching orphan docs:', err);
      });
    }
  }, [fetchNotebooks, user]);

  const handleCreate = async () => {
    try {
      const nb = await createNotebook();
      navigate(`/dashboard?notebook=${nb.id}`);
    } catch (err) {
      console.error('Failed to create notebook:', err);
    }
  };

  const handleOpen = (id) => {
    navigate(`/dashboard?notebook=${id}`);
  };

  return (
    <div
      className="min-h-screen relative font-sans"
      style={{ background: '#D4D4D4', fontFamily: '"Inter", "system-ui", sans-serif' }}
    >
      {/* Background Orbs */}
      {/* Enhanced Background Orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[70%] h-[80%] rounded-full bg-blue-400/15 blur-[180px] pointer-events-none z-0" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[70%] rounded-full bg-indigo-500/15 blur-[180px] pointer-events-none z-0" />
      <div className="absolute top-1/4 right-0 w-[40%] h-[40%] rounded-full bg-emerald-400/10 blur-[160px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 left-0 w-[40%] h-[40%] rounded-full bg-purple-400/10 blur-[160px] pointer-events-none z-0" />

      {/* Custom Header Bar */}
      <div className="relative z-20 px-5 sm:px-8 py-5 flex items-center justify-between">
        <Link to="/" className="no-underline">
          <span style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.04em', color: '#111' }}>Nexus</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{user?.email}</span>
          <button
            onClick={async () => { await logout(); navigate('/'); }}
            style={{
              border: 'none',
              background: 'rgba(0,0,0,0.05)',
              padding: '0.45rem 1rem',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              color: '#666',
              transition: 'all 0.2s',
            }}
          >
            Log out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-10">
          <div>
            <h1 className="m-0 text-3xl sm:text-[2.2rem] font-semibold text-[#111] font-[Rubik] tracking-tight">
              My Notebooks
            </h1>
            <p className="mt-2 mb-0 text-sm sm:text-[0.95rem] text-gray-500 font-normal">
              Organize your research sessions into focused projects
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCreate}
            className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-full bg-[#111] text-white text-sm font-semibold cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.15)] w-full sm:w-auto"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create new
          </motion.button>
        </div>

        {/* Grid */}
        {loading && notebooks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem 0', color: '#9ca3af' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'inline-block', marginBottom: '1rem' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </motion.div>
            <p>Loading your notebooks...</p>
          </div>
        ) : (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {/* Create New Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -6 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreate}
              style={{
                background: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRadius: '28px',
                border: '2px dashed rgba(0,0,0,0.08)',
                padding: '1.75rem',
                cursor: 'pointer',
                minHeight: '220px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: '#4b5563', letterSpacing: '-0.01em' }}>
                Create new notebook
              </span>
            </motion.div>



            {/* Notebook Cards */}
            <AnimatePresence>
              {notebooks.map((nb) => (
                <NotebookCard
                  key={nb.id}
                  notebook={nb}
                  onOpen={handleOpen}
                  onDelete={deleteNotebook}
                  onUpdate={updateNotebook}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!loading && notebooks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: 'rgba(255,255,255,0.4)',
              backdropFilter: 'blur(16px)',
              borderRadius: '32px',
              border: '1px solid rgba(255,255,255,0.6)',
              marginTop: '2rem',
            }}
          >
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📓</span>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#111', marginBottom: '0.5rem' }}>
              No notebooks yet
            </h3>
            <p style={{ fontSize: '0.95rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
              Create your first notebook to start organizing your research
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCreate}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: '999px',
                border: 'none',
                background: '#111',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              + Create your first notebook
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
