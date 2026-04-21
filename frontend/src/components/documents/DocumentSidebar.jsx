import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useDocumentStore from '../../store/documentStore';
import useChatStore from '../../store/chatStore';
import DocumentCard from './DocumentCard';
import DocumentOverview from './DocumentOverview';
import AddSourceModal from './AddSourceModal';
import SpotlightCard from '../ui/SpotlightCard';
import { HoverBorderGradient } from '../ui/HoverBorderGradient';
import ConnectorsModal from './ConnectorsModal';

export default function DocumentSidebar({ isOpen, onToggle, onWebSearch, notebookId }) {
  const { documents, fetchDocuments, deleteDocument, loading } = useDocumentStore();
  const { activeDocumentId, setActiveDocument } = useChatStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnectorsOpen, setIsConnectorsOpen] = useState(false);
  const [webSearchQuery, setWebSearchQuery] = useState('');

  useEffect(() => {
    // Clear stale documents immediately when switching notebooks
    useDocumentStore.getState().documents.length > 0 && useDocumentStore.setState({ documents: [] });
    fetchDocuments(notebookId);
    const interval = setInterval(() => fetchDocuments(notebookId), 10000);
    return () => clearInterval(interval);
  }, [fetchDocuments, notebookId]);

  const activeDoc = documents.find(d => d.id === activeDocumentId);

  // ─── Collapsed Icon Bar ───
  if (!isOpen) {
    return (
      <div className="w-full h-full flex flex-col items-center bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[20px] overflow-hidden py-4">
        {/* Toggle button */}
        <button
          onClick={onToggle}
          className="w-full py-2 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100/50 transition-all duration-200"
          title="Open Sources"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
        </button>

        {/* Divider */}
        <div className="w-6 h-px bg-gray-200/60 my-2"></div>

        {/* Search shortcut instead of number */}
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all duration-200"
          title="Search the web"
          onClick={onToggle}
        >
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* Document type indicators */}
        <div className="flex-1 flex flex-col items-center gap-3 mt-4 px-1 overflow-auto no-scrollbar">
          {documents.map((doc) => (
            <div 
              key={doc.id}
              onClick={() => setActiveDocument(doc.id)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs transition-all duration-200 cursor-pointer shadow-sm ${
                activeDocumentId === doc.id 
                  ? 'bg-black text-white scale-110 shadow-md' 
                  : 'bg-white/80 text-gray-400 hover:bg-white hover:text-black'
              }`}
              title={doc.original_name}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                 <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
          ))}
        </div>

        {/* Connectors shortcut */}
        <button
          className="mt-2 w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all duration-200"
          title="Connectors"
          onClick={() => setIsConnectorsOpen(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
        </button>

        {/* Add source shortcut */}
        <button
          className="mt-2 w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-black hover:text-white transition-all duration-200"
          title="Add Source"
          onClick={() => { onToggle(); setTimeout(() => setIsModalOpen(true), 200); }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
    );
  }

  // ─── Full Open Panel ───
  return (
    <div className="w-full flex flex-col h-full bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[24px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/60">
        <span className="font-bold text-[1rem] text-gray-900 tracking-tight">Sources</span>
        <button
          onClick={onToggle}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100/60 transition-all duration-200"
          title="Close Sources"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[18px] h-[18px]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
        </button>
      </div>

      {/* Search Header Area */}
      <div className="px-4 mt-3">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full py-2.5 bg-white border border-gray-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-[20px] text-gray-700 text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Add sources
        </button>
      </div>

      <div className="px-4 mt-2">
        <button 
          onClick={() => setIsConnectorsOpen(true)}
          className="w-full py-2 bg-white border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.01)] rounded-[16px] text-[12px] font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 text-gray-500 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
          Connectors
        </button>
      </div>

      <div className="px-3 mt-4 mb-3">
        <HoverBorderGradient
          as="div"
          containerClassName="w-full rounded-[24px]"
          className="w-full bg-white/60 dark:bg-black/60 backdrop-blur-xl p-1"
        >
          <form
            onSubmit={(e) => { 
                e.preventDefault(); 
                if (webSearchQuery.trim()) {
                    onWebSearch(webSearchQuery.trim()); 
                    setWebSearchQuery('');
                }
            }}
            className="flex flex-col pt-1 pl-1 pr-1 text-gray-700 w-full"
          >
             <div className="flex items-end gap-1.5 w-full">
                <div className="flex-1 min-h-[40px] flex items-center">
                    <textarea
                        value={webSearchQuery}
                        onChange={(e) => {
                            const target = e.target;
                            target.style.height = 'inherit';
                            target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                            setWebSearchQuery(target.value);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (webSearchQuery.trim()) {
                                    onWebSearch(webSearchQuery.trim());
                                    setWebSearchQuery('');
                                }
                            }
                        }}
                        rows="1"
                        placeholder="Search the web for"
                        className="w-full bg-transparent border-none outline-none text-[13px] placeholder-gray-500 py-2.5 px-2 resize-none leading-relaxed text-center"
                        style={{ height: '40px' }}
                    />
                </div>
                <div className="pb-1.5 pr-1">
                    <button type="submit" disabled={!webSearchQuery.trim()} className="w-7 h-7 shrink-0 rounded-full bg-[#f1f5f9] hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                </div>
             </div>
          </form>
        </HoverBorderGradient>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-auto px-3 pb-3">
        {loading && documents.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">
            Loading documents...
          </p>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 px-2">
            <span className="text-3xl block mb-3">📄</span>
            <p className="font-semibold text-gray-500 text-sm mb-1">
              Saved sources will appear here
            </p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Click Add source above to add PDFs, websites, text, videos or audio files.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {documents.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <DocumentCard doc={doc} onDelete={deleteDocument} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Document Overview Panel removed - now in chat panel */}

      <AddSourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} notebookId={notebookId} />
      <ConnectorsModal isOpen={isConnectorsOpen} onClose={() => setIsConnectorsOpen(false)} />
    </div>
  );
}
