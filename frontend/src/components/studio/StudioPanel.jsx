import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/client';
import QuizModal from './QuizModal';
import SummaryModal from './SummaryModal';
import FlashcardsModal from './FlashcardsModal';
import MindMapModal from './MindMapModal';

const studioFeatures = [
  {
    id: 'audio',
    icon: '🎙️',
    title: 'Audio Overview',
    desc: 'AI-generated podcast-style overview',
    color: '#6366F1',
    comingSoon: true,
  },
  {
    id: 'summary',
    icon: '📋',
    title: 'Executive Summary',
    desc: 'Comprehensive document summary',
    color: '#10B981',
  },
  {
    id: 'quiz',
    icon: '🧠',
    title: 'Quiz',
    desc: 'Test your knowledge',
    color: '#F59E0B',
  },
  {
    id: 'flashcards',
    icon: '📇',
    title: 'Flashcards',
    desc: 'Study key concepts',
    color: '#8B5CF6',
  },
  {
    id: 'mindmap',
    icon: '🗺️',
    title: 'Mind Map',
    desc: 'Visualize connections',
    color: '#06B6D4',
  },
  {
    id: 'websearch',
    icon: '🌐',
    title: 'Web Search',
    desc: 'Search the web with AI',
    color: '#EC4899',
  },
];

export default function StudioPanel({ activeDocumentId, onWebSearch }) {
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [loadingFeature, setLoadingFeature] = useState(null);

  const handleFeatureClick = async (feature) => {
    if (feature.comingSoon) return;

    if (feature.id === 'websearch') {
      onWebSearch?.();
      return;
    }

    setLoadingFeature(feature.id);
    try {
      const { data } = await api.post(`/studio/${feature.id}`, {
        document_id: activeDocumentId || null,
      });
      setModalData(data);
      setActiveModal(feature.id);
    } catch (err) {
      console.error(`Studio ${feature.id} failed:`, err);
      alert(err.response?.data?.detail || 'Failed to generate. Make sure you have uploaded documents.');
    } finally {
      setLoadingFeature(null);
    }
  };

  return (
    <div className="w-full flex flex-col h-full bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[32px] overflow-hidden">
      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--color-border)',
        fontWeight: 700,
        fontSize: '1.1rem',
        color: 'var(--color-text)',
      }}>
        ✨ Studio
      </div>

      {/* Feature Grid */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '1rem',
      }}>
        <p style={{
          fontSize: '0.8rem',
          color: 'var(--color-text-muted)',
          marginBottom: '1rem',
          lineHeight: 1.5,
        }}>
          Generate AI-powered insights from your documents with one click.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
        }}>
          {studioFeatures.map((feature, index) => (
            <motion.button
              key={feature.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleFeatureClick(feature)}
              disabled={loadingFeature === feature.id}
              className="studio-card"
              style={{
                padding: '1rem 0.75rem',
                cursor: feature.comingSoon ? 'not-allowed' : 'pointer',
                textAlign: 'center',
                opacity: feature.comingSoon ? 0.5 : 1,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              {feature.comingSoon && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  fontSize: '0.55rem',
                  fontWeight: 700,
                  background: 'var(--color-primary-500)',
                  color: 'white',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  letterSpacing: '0.05em',
                }}>
                  SOON
                </span>
              )}

              {loadingFeature === feature.id ? (
                <div style={{ fontSize: '1.5rem' }}>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block' }}
                  >
                    ⏳
                  </motion.span>
                </div>
              ) : (
                <span style={{ fontSize: '1.5rem' }}>{feature.icon}</span>
              )}

              <span style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                lineHeight: 1.2,
              }}>
                {feature.title}
              </span>
              <span style={{
                fontSize: '0.65rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.3,
              }}>
                {feature.desc}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Output info */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          borderRadius: '12px',
          border: '1px dashed var(--color-border)',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>✏️</span>
          <p style={{
            fontSize: '0.78rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
          }}>
            Studio output will appear in modals.{' '}
            Select a document for focused insights, or use "All" for cross-document analysis.
          </p>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal === 'quiz' && modalData && (
          <QuizModal data={modalData} onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'summary' && modalData && (
          <SummaryModal data={modalData} onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'flashcards' && modalData && (
          <FlashcardsModal data={modalData} onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'mindmap' && modalData && (
          <MindMapModal data={modalData} onClose={() => setActiveModal(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
