import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FlashcardsModal({ data, onClose }) {
  const cards = data?.cards || [];
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) return null;

  const card = cards[currentCard];

  const handleNext = () => {
    setFlipped(false);
    setTimeout(() => {
      setCurrentCard((c) => (c + 1) % cards.length);
    }, 150);
  };

  const handlePrev = () => {
    setFlipped(false);
    setTimeout(() => {
      setCurrentCard((c) => (c - 1 + cards.length) % cards.length);
    }, 150);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.15)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '2rem',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(255, 245, 245, 0.85)',
          backdropBlur: '20px',
          borderRadius: '32px',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '520px',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 600, color: '#E3342F', tracking: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M7 8h10" />
              <path d="M7 12h10" />
              <path d="M7 16h6" />
            </svg>
            Flashcards
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#E3342F', fontWeight: 600 }}>
              {currentCard + 1}/{cards.length}
            </span>
            <button onClick={onClose} style={{
              border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer',
              padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', transition: 'all 0.2s ease'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E3342F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Flashcard 3D Container */}
        <div style={{
          perspective: '1200px',
          height: '240px',
          width: '100%',
          cursor: 'pointer',
        }}
        onClick={() => setFlipped(!flipped)}>
          <motion.div
            initial={false}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
            }}
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Front Side */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                background: 'white',
                borderRadius: '24px',
                padding: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                border: '1.5px solid rgba(227, 52, 47, 0.1)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
              }}
            >
              <p style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: '#1e293b',
                lineHeight: 1.6,
                margin: 0,
              }}>
                {card.front}
              </p>
              <span style={{ position: 'absolute', bottom: '1rem', right: '1.25rem', fontSize: '0.75rem', color: '#E3342F', fontWeight: 600, opacity: 0.6 }}>
                Tap to reveal
              </span>
            </div>

            {/* Back Side */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                background: 'linear-gradient(135deg, #E3342F, #991b1b)',
                borderRadius: '24px',
                padding: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                transform: 'rotateY(180deg)',
                color: 'white',
                boxShadow: '0 15px 40px rgba(227, 52, 47, 0.2)',
              }}
            >
              <p style={{
                fontSize: '1rem',
                fontWeight: 400,
                lineHeight: 1.6,
                margin: 0,
              }}>
                {card.back}
              </p>
              <span style={{ position: 'absolute', bottom: '1rem', right: '1.25rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                Answer
              </span>
            </div>
          </motion.div>
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: '1.75rem', gap: '1rem',
        }}>
          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(227, 52, 47, 0.05)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrev}
            style={{
              flex: 1, padding: '0.85rem', borderRadius: '16px',
              border: '1.5px solid #E3342F',
              background: 'white', color: '#E3342F',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', gap: '0.6rem', transition: 'all 0.2s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Previous
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(227, 52, 47, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            style={{
              flex: 1, padding: '0.85rem', borderRadius: '16px',
              border: 'none', background: '#E3342F',
              color: 'white', cursor: 'pointer', fontWeight: 600,
              fontSize: '0.95rem', fontFamily: 'inherit', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
              transition: 'all 0.2s ease'
            }}
          >
            Next
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
