import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/client';
import useChatStore from '../../store/chatStore';
import QuizModal from './QuizModal';
import SummaryModal from './SummaryModal';
import FlashcardsModal from './FlashcardsModal';
import MindMapModal from './MindMapModal';
import ResearchReportModal from './ResearchReportModal';
import KeyTopics from './KeyTopics';

const studioFeatures = [
  {
    id: 'audio',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1v22M17 5v14M2 10v4M22 10v4M7 8v8" />
      </svg>
    ),
    title: 'Audio Overview',
    color: '#EEF2FF',
    textColor: '#6366F1',
    comingSoon: true
  },
  {
    id: 'summary',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
    title: 'Quick Summary',
    color: '#FFF7ED',
    textColor: '#D97706'
  },
  {
    id: 'quiz',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    title: 'Quiz',
    color: '#ECFEFF',
    textColor: '#0891B2'
  },
  {
    id: 'flashcards',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M7 8h10" />
        <path d="M7 12h10" />
        <path d="M7 16h6" />
      </svg>
    ),
    title: 'Flashcards',
    color: '#FFF5F5',
    textColor: '#E3342F'
  },
  {
    id: 'mindmap',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3z" />
        <path d="M6 3a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3 3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" />
        <line x1="9" y1="12" x2="15" y2="12" />
      </svg>
    ),
    title: 'Mind Map',
    color: '#F5F3FF',
    textColor: '#8B5CF6'
  },
  {
    id: 'research',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    ),
    title: 'Research Report',
    color: '#EDE9FE',
    textColor: '#7C3AED'
  },
  {
    id: 'synthesize',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
        <path d="M15 9h-6"/>
        <path d="M15 13h-6"/>
      </svg>
    ),
    title: 'Notebook Synthesis',
    color: '#ECFDF5',
    textColor: '#10B981'
  },
];

export default function StudioPanel({ isOpen, onToggle, activeDocumentId, notebookId }) {
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [loadingFeature, setLoadingFeature] = useState(null);
  const sendMessage = useChatStore((s) => s.sendMessage);

  const handleFeatureClick = async (feature) => {
    if (feature.comingSoon) return;

    // Research report opens its own modal directly
    if (feature.id === 'research') {
      setActiveModal('research');
      return;
    }

    setLoadingFeature(feature.id);
    try {
      let endpoint = `/studio/${feature.id}`;
      let payload = { document_id: activeDocumentId || null };

      if (feature.id === 'synthesize') {
        if (!notebookId) throw new Error("Please select a notebook first.");
        endpoint = `/notebooks/${notebookId}/synthesize`;
        payload = {};
      }

      const { data } = await api.post(endpoint, payload);
      
      // Map synthesize output to summary data structure so we can reuse the modal
      if (feature.id === 'synthesize') {
        setModalData({ summary: data.report, type: 'dashboard' });
        setActiveModal('summary');
      } else if (feature.id === 'summary') {
        setModalData({ ...data, type: 'summary' });
        setActiveModal('summary');
      } else {
        setModalData(data);
        setActiveModal(feature.id);
      }
    } catch (err) {
      console.error(`Studio ${feature.id} failed:`, err);
      alert(err.response?.data?.detail || err.message || 'Failed to generate. Make sure you have uploaded documents.');
    } finally {
      setLoadingFeature(null);
    }
  };

  const renderModals = () => {
    return createPortal(
      <AnimatePresence>
        {activeModal === 'quiz' && modalData && (
          <QuizModal data={modalData} onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'summary' && modalData && (
          <SummaryModal 
            data={modalData} 
            type={modalData.type} 
            onClose={() => setActiveModal(null)} 
          />
        )}
        {activeModal === 'flashcards' && modalData && (
          <FlashcardsModal data={modalData} onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'mindmap' && modalData && (
          <MindMapModal data={modalData} onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'research' && (
          <ResearchReportModal onClose={() => setActiveModal(null)} activeDocumentId={activeDocumentId} />
        )}
      </AnimatePresence>,
      document.body
    );
  };

  if (!isOpen) {
    return (
      <div className="w-full h-full flex flex-col items-center bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[20px] overflow-hidden">
        <button
          onClick={onToggle}
          className="w-full py-4 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100/50 transition-all duration-200"
          title="Open Studio"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
             <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
        </button>
        <div className="w-6 h-px bg-gray-200/60 my-1"></div>
        <div className="flex-1 flex flex-col items-center gap-1.5 mt-2 px-1">
          {studioFeatures.map((feature) => (
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              key={feature.id}
              onClick={() => handleFeatureClick(feature)}
              disabled={loadingFeature === feature.id}
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                feature.comingSoon 
                  ? 'opacity-40 cursor-not-allowed text-gray-400' 
                  : 'hover:bg-white cursor-pointer'
              }`}
              style={{ 
                backgroundColor: !feature.comingSoon ? feature.color : 'transparent',
                color: feature.textColor
              }}
              title={feature.title}
            >
              {loadingFeature === feature.id ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                </motion.div>
              ) : (
                <div className="scale-75">{feature.icon}</div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-full bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[32px] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/60">
        <span className="font-semibold text-[1.1rem] text-gray-900 tracking-tight">Studio</span>
        <button
          onClick={onToggle}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100/60 transition-all duration-200"
          title="Close Studio"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[20px] h-[20px]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
        {/* Key Topics — Study Guide */}
        <KeyTopics
          activeDocumentId={activeDocumentId}
          onTopicClick={sendMessage}
        />

        <div className="flex flex-col gap-3">
          {studioFeatures.map((feature, index) => (
            <motion.button
              key={feature.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                delay: index * 0.04, 
                duration: 0.15,
                scale: { type: 'spring', stiffness: 500, damping: 25 },
                x: { type: 'spring', stiffness: 500, damping: 25 }
              }}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleFeatureClick(feature)}
              disabled={loadingFeature === feature.id}
              style={{ backgroundColor: feature.color }}
              className={`group relative flex items-center justify-between p-4 rounded-[24px] border border-white/40 shadow-sm ${feature.comingSoon ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex flex-col items-start gap-3">
                <div style={{ color: feature.textColor }} className="bg-white/40 p-2 rounded-xl">
                  {loadingFeature === feature.id ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    </motion.div>
                   ) : feature.icon}
                </div>
                <div>
                  <span className="text-[0.95rem] font-medium text-gray-800 flex items-center gap-2">
                    {feature.title}
                    {feature.comingSoon && <span className="text-[0.6rem] bg-gray-400 text-white px-1.5 py-0.5 rounded-full uppercase tracking-widest">Soon</span>}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-600/5 flex items-center justify-center text-gray-600 group-hover:bg-white transition-colors duration-200">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                   <polyline points="9 18 15 12 9 6"></polyline>
                 </svg>
              </div>
            </motion.button>
          ))}
        </div>
        <div className="mt-4 p-4 rounded-[20px] bg-gray-50/50 border border-dashed border-gray-200 text-center">
          <p className="text-[0.75rem] text-gray-400 leading-relaxed font-medium">
            Studio insights and generated reports will appear in interactive modals.
          </p>
        </div>
      </div>
      {renderModals()}
    </div>
  );
}
