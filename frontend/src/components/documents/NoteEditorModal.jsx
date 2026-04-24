import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

export default function NoteEditorModal({ isOpen, onClose, onSave, editNote, prefillContent }) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editNote) {
        setTitle(editNote.title || '');
        setSubtitle(editNote.subtitle || '');
        setContent(editNote.content || '');
        setDate(editNote.date || new Date().toISOString().split('T')[0]);
      } else {
        setTitle('');
        setSubtitle('');
        setContent(prefillContent || '');
        setDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [isOpen, editNote, prefillContent]);

  const [viewMode, setViewMode] = useState('edit'); // 'edit' or 'preview'

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      id: editNote?.id || `note_${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim(),
      date,
      content: content.trim(),
      createdAt: editNote?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '520px',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            borderRadius: '28px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.2), 0 0 1px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.8)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '1.25rem 1.75rem',
            background: '#f8fafc',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '12px',
                background: 'white', border: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#475569', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  {editNote ? 'Edit Note' : 'Create New Note'}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
                  Save your thoughts and citations
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '32px', height: '32px', borderRadius: '10px',
                border: 'none', background: 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94a3b8', transition: 'all 0.2s'
              }}
              className="hover:bg-white hover:text-gray-900 hover:shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Title */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Summary of Chapter 4"
                style={{
                  width: '100%', padding: '0.75rem 1rem',
                  borderRadius: '14px', border: '1px solid #e2e8f0',
                  fontSize: '0.9rem', fontWeight: 500, color: '#1e293b',
                  outline: 'none', transition: 'all 0.2s',
                  background: '#fcfcfc',
                }}
                className="focus:border-indigo-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(129,140,248,0.1)]"
                autoFocus
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
              {/* Subtitle */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>
                  Category / Subtitle
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  placeholder="Optional"
                  style={{
                    width: '100%', padding: '0.75rem 1rem',
                    borderRadius: '14px', border: '1px solid #e2e8f0',
                    fontSize: '0.85rem', color: '#475569',
                    outline: 'none', transition: 'all 0.2s',
                    background: '#fcfcfc',
                  }}
                  className="focus:border-indigo-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(129,140,248,0.1)]"
                />
              </div>

              {/* Date */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  style={{
                    width: '100%', padding: '0.75rem 1rem',
                    borderRadius: '14px', border: '1px solid #e2e8f0',
                    fontSize: '0.85rem', color: '#475569',
                    outline: 'none', transition: 'all 0.2s',
                    background: '#fcfcfc',
                  }}
                  className="focus:border-indigo-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(129,140,248,0.1)]"
                />
              </div>
            </div>

            {/* Content with Toolbar */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                  Content
                </label>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.25rem',
                  padding: '2px',
                  background: '#f1f5f9',
                  borderRadius: '10px',
                }}>
                  {[
                    { icon: 'B', tag: '**', label: 'Bold', weight: 800 },
                    { icon: 'I', tag: '*', label: 'Italic', style: 'italic' },
                    { icon: 'H1', tag: '# ', label: 'Heading 1' },
                    { icon: 'H2', tag: '## ', label: 'Heading 2' },
                    { icon: '•', tag: '- ', label: 'List' },
                    { icon: '“', tag: '> ', label: 'Quote' },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      title={btn.label}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        const textarea = document.getElementById('note-textarea');
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const text = content;
                        
                        const before = text.substring(0, start);
                        const selection = text.substring(start, end);
                        const after = text.substring(end);
                        
                        let newText;
                        if (btn.tag.endsWith(' ')) {
                          newText = before + btn.tag + selection + after;
                        } else {
                          newText = before + btn.tag + selection + btn.tag + after;
                        }
                        
                        setContent(newText);
                        setTimeout(() => {
                          textarea.focus();
                          if (selection.length > 0) {
                            textarea.setSelectionRange(start + btn.tag.length, start + btn.tag.length + selection.length);
                          } else {
                            textarea.setSelectionRange(start + btn.tag.length, start + btn.tag.length);
                          }
                        }, 0);
                      }}
                      style={{
                        width: '28px', height: '28px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: btn.weight || 600, fontStyle: btn.style || 'normal',
                        border: 'none', background: 'transparent', cursor: 'pointer',
                        borderRadius: '6px', color: '#475569', transition: 'all 0.2s'
                      }}
                      className="hover:bg-white hover:text-indigo-600 hover:shadow-sm"
                    >
                      {btn.icon}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                id="note-textarea"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write your notes here... (Markdown supported)"
                rows={6}
                style={{
                  width: '100%', padding: '1rem',
                  borderRadius: '14px', border: '1px solid #e2e8f0',
                  fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.6,
                  outline: 'none', resize: 'vertical',
                  transition: 'all 0.2s',
                  background: '#fcfcfc',
                  minHeight: '180px',
                }}
                className="focus:border-indigo-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(129,140,248,0.1)]"
              />
              <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.5rem', textAlign: 'right' }}>
                Pro tip: Use Markdown for beautiful formatting
              </p>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '1rem 1.75rem 1.75rem',
            display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
            background: '#f8fafc', borderTop: '1px solid #f1f5f9',
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.65rem 1.5rem',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                background: 'white',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              className="hover:border-gray-300 hover:text-gray-900 shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              style={{
                padding: '0.65rem 2rem',
                borderRadius: '14px',
                border: 'none',
                background: title.trim() ? '#0f172a' : '#e2e8f0',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: title.trim() ? 'white' : '#94a3b8',
                cursor: title.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                boxShadow: title.trim() ? '0 10px 15px -3px rgba(15, 23, 42, 0.2)' : 'none',
              }}
              className={title.trim() ? 'hover:bg-slate-800' : ''}
            >
              {editNote ? 'Update Note' : 'Save Note'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
