import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DocumentSidebar from '../components/documents/DocumentSidebar';
import ChatPanel from '../components/chat/ChatPanel';
import StudioPanel from '../components/studio/StudioPanel';
import useChatStore from '../store/chatStore';
import useNotebookStore from '../store/notebookStore';
import useAuthStore from '../store/authStore';

const PANEL_OPEN_WIDTH = 300;
const PANEL_CLOSED_WIDTH = 52;

const springTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

export default function DashboardPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const notebookId = searchParams.get('notebook');

  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [showWebSearch, setShowWebSearch] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(true);
  const [studioOpen, setStudioOpen] = useState(true);
  const activeDocumentId = useChatStore((s) => s.activeDocumentId);
  const switchNotebook = useChatStore((s) => s.switchNotebook);
  const { activeNotebook, setActiveNotebook, createNotebook } = useNotebookStore();
  const user = useAuthStore((s) => s.user);

  const handleCreateNotebook = async () => {
    try {
      const newNotebook = await createNotebook('New Notebook', '📓');
      if (newNotebook && newNotebook.id) {
        navigate(`/dashboard?notebook=${newNotebook.id}`);
      }
    } catch (err) {
      console.error('Failed to create notebook:', err);
    }
  };

  // Switch chat context when notebookId changes
  useEffect(() => {
    switchNotebook(notebookId);
  }, [notebookId, switchNotebook]);

  // Fetch notebook details when notebookId changes
  useEffect(() => {
    if (notebookId) {
      import('../api/client').then(({ default: api }) => {
        api.get(`/notebooks/${notebookId}`)
          .then(({ data }) => setActiveNotebook(data))
          .catch(() => setActiveNotebook(null));
      });
    } else {
      setActiveNotebook(null);
    }
  }, [notebookId, setActiveNotebook]);

  return (
    <div
      className="w-full font-sans overflow-hidden bg-[#D4D4D4] relative"
      style={{
        fontFamily: '"Inter", "system-ui", sans-serif',
        height: '100vh',
      }}
    >
      {/* Background Mesh Orbs — more intense for glass contrast */}
      <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[70%] rounded-full bg-[#0ea5e9]/15 blur-[160px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[60%] rounded-full bg-blue-500/15 blur-[160px] pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full bg-indigo-400/10 blur-[140px] pointer-events-none z-0" />

      {/* Floating Header Elements (Ultra Minimal) */}
      {activeNotebook && (
        <>
          {/* Top Left: Notebook Title Only */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 left-6 z-20 flex items-center cursor-pointer"
            onClick={() => navigate('/notebooks')}
          >
            <span className="text-[#1f2937] text-[1.1rem] font-medium tracking-tight hover:opacity-70 transition-opacity">
              {activeNotebook.title}
            </span>
          </motion.div>

          {/* Top Right: Create Button Only */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-2 right-6 z-20 flex items-center"
          >
            <button 
              onClick={handleCreateNotebook}
              className="flex items-center gap-2 bg-black hover:bg-neutral-800 text-white px-4 py-[6px] rounded-full font-medium text-[0.85rem] transition-colors shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Create notebook
            </button>
          </motion.div>
        </>
      )}

      {/* Main layout — explicit height so children can stretch */}
      <div
        className="flex gap-3 px-3 relative z-10"
        style={{
          height: activeNotebook ? 'calc(100vh - 60px)' : 'calc(100vh - 24px)',
          marginTop: activeNotebook ? '52px' : '12px',
        }}
      >
        {/* Left Panel: Sources */}
        <motion.div
          animate={{ width: sourcesOpen ? PANEL_OPEN_WIDTH : PANEL_CLOSED_WIDTH }}
          transition={springTransition}
          className="relative flex-shrink-0"
          style={{ height: '100%' }}
        >
          <DocumentSidebar
            isOpen={sourcesOpen}
            onToggle={() => setSourcesOpen(!sourcesOpen)}
            onWebSearch={(query) => { setWebSearchQuery(query); setShowWebSearch(true); }}
            notebookId={notebookId}
          />
        </motion.div>

        {/* Center: Chat */}
        <div className="flex-1 min-w-0 h-full overflow-hidden" style={{ height: '100%' }}>
          <ChatPanel
            showWebSearch={showWebSearch}
            initialWebSearchQuery={webSearchQuery}
            onCloseWebSearch={() => { setShowWebSearch(false); setWebSearchQuery(''); }}
          />
        </div>

        {/* Right Panel: Studio */}
        <motion.div
          animate={{ width: studioOpen ? PANEL_OPEN_WIDTH : PANEL_CLOSED_WIDTH }}
          transition={springTransition}
          className="relative flex-shrink-0"
          style={{ height: '100%' }}
        >
          <StudioPanel
            isOpen={studioOpen}
            onToggle={() => setStudioOpen(!studioOpen)}
            activeDocumentId={activeDocumentId}
            onWebSearch={() => setShowWebSearch(true)}
          />
        </motion.div>
      </div>
    </div>
  );
}
