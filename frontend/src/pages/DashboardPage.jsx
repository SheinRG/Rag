import { useState } from 'react';
import { motion } from 'framer-motion';
import DocumentSidebar from '../components/documents/DocumentSidebar';
import ChatPanel from '../components/chat/ChatPanel';
import StudioPanel from '../components/studio/StudioPanel';
import useChatStore from '../store/chatStore';

const PANEL_OPEN_WIDTH = 300;
const PANEL_CLOSED_WIDTH = 52;

const springTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

export default function DashboardPage() {
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [showWebSearch, setShowWebSearch] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(true);
  const [studioOpen, setStudioOpen] = useState(true);
  const activeDocumentId = useChatStore((s) => s.activeDocumentId);

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

      {/* Main layout — explicit height so children can stretch */}
      <div
        className="flex gap-3 px-3 relative z-10"
        style={{ height: 'calc(100vh - 24px)', marginTop: '12px' }}
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
