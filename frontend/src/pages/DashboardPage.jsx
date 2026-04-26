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
  const [addNoteTrigger, setAddNoteTrigger] = useState(0);
  const [notePrefill, setNotePrefill] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // 'sources', 'chat', 'studio'
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAddToNote = (content) => {
    setNotePrefill(content);
    setAddNoteTrigger(prev => prev + 1);
  };
  const activeDocumentIds = useChatStore((s) => s.activeDocumentIds);
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
        <motion.div 
          className="absolute top-0 left-0 right-0 h-[42px] px-3 flex items-center justify-between z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Top Left: Notebook Title Only */}
          <div
            className="flex items-center cursor-pointer group min-w-0 flex-1 mr-2"
            onClick={() => navigate('/notebooks')}
            title="Back to Notebooks"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-gray-400 group-hover:text-black transition-colors flex-shrink-0"><path d="m15 18-6-6 6-6"/></svg>
            <span className="text-[#1f2937] text-[1.05rem] font-semibold tracking-tight group-hover:opacity-70 transition-opacity truncate">
              {activeNotebook.title}
            </span>
          </div>

          {/* Top Right: Create Button + Add Note */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setAddNoteTrigger(t => t + 1)}
              className="flex items-center gap-1.5 bg-black hover:bg-neutral-800 text-white px-2.5 sm:px-3.5 py-[5.5px] rounded-full font-medium text-[0.8rem] transition-colors shadow-sm whitespace-nowrap shrink-0"
              title="Add note"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              <span className="hidden sm:inline">Add note</span>
            </button>
            <button
              onClick={handleCreateNotebook}
              className="flex items-center gap-2 bg-black hover:bg-neutral-800 text-white px-2.5 sm:px-3.5 py-[5.5px] rounded-full font-medium text-[0.8rem] transition-colors shadow-sm whitespace-nowrap shrink-0"
              title="Create notebook"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span className="hidden sm:inline">Create notebook</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Mobile Tab Bar */}
      <div className="md:hidden px-3 mt-14 mb-2 relative z-20">
        <div className="flex bg-white/50 backdrop-blur-md rounded-full p-1 shadow-sm border border-white/60">
          {['sources', 'chat', 'studio'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-full transition-all capitalize ${
                activeTab === tab 
                  ? 'bg-white shadow-sm text-black' 
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout — explicit height so children can stretch */}
      <div
        className="flex gap-3 px-3 relative z-10"
        style={{
          height: activeNotebook ? 'calc(100vh - 50px)' : 'calc(100vh - 24px)',
          marginTop: activeNotebook ? '42px' : '12px',
        }}
      >
        {/* Left Panel: Sources */}
        <motion.div
          animate={{ width: isMobile ? '100%' : (sourcesOpen ? PANEL_OPEN_WIDTH : PANEL_CLOSED_WIDTH) }}
          transition={springTransition}
          className={`${activeTab === 'sources' ? 'flex' : 'hidden'} md:flex relative flex-shrink-0 w-full md:w-auto`}
          style={{ height: '100%' }}
        >
          <DocumentSidebar
            isOpen={isMobile ? true : sourcesOpen}
            onToggle={() => setSourcesOpen(!sourcesOpen)}
            onWebSearch={(query) => { setWebSearchQuery(query); setShowWebSearch(true); }}
            notebookId={notebookId}
            addNoteTrigger={addNoteTrigger}
            notePrefill={notePrefill}
          />
        </motion.div>

        {/* Center: Chat */}
        <div 
          className={`${activeTab === 'chat' ? 'flex' : 'hidden'} md:flex flex-1 min-w-0 h-full overflow-hidden`} 
          style={{ height: '100%' }}
        >
          <ChatPanel
            showWebSearch={showWebSearch}
            initialWebSearchQuery={webSearchQuery}
            onCloseWebSearch={() => { setShowWebSearch(false); setWebSearchQuery(''); }}
            onAddToNote={handleAddToNote}
          />
        </div>

        {/* Right Panel: Studio */}
        <motion.div
          animate={{ width: isMobile ? '100%' : (studioOpen ? PANEL_OPEN_WIDTH : PANEL_CLOSED_WIDTH) }}
          transition={springTransition}
          className={`${activeTab === 'studio' ? 'flex' : 'hidden'} md:flex relative flex-shrink-0 w-full md:w-auto`}
          style={{ height: '100%' }}
        >
          <StudioPanel
            isOpen={isMobile ? true : studioOpen}
            onToggle={() => setStudioOpen(!studioOpen)}
            activeDocumentIds={activeDocumentIds}
            notebookId={notebookId}
            onWebSearch={() => setShowWebSearch(true)}
          />
        </motion.div>
      </div>
    </div>
  );

}
