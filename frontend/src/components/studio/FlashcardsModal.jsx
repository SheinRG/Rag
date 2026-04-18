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
        background: 'var(--color-modal-overlay)',
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
          background: 'var(--color-card-bg)',
          borderRadius: '20px',
          padding: '2rem',
          width: '100%',
          maxWidth: '500px',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
            📇 Flashcards
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              {currentCard + 1}/{cards.length}
            </span>
            <button onClick={onClose} style={{
              border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '1.25rem', color: 'var(--color-text-muted)',
            }}>✕</button>
          </div>
        </div>

        {/* Flashcard */}
        <motion.div
          onClick={() => setFlipped(!flipped)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            minHeight: '200px',
            borderRadius: '16px',
            padding: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            cursor: 'pointer',
            background: flipped
              ? 'linear-gradient(135deg, var(--color-primary-600), #7c3aed)'
              : 'var(--color-surface-secondary)',
            color: flipped ? 'white' : 'var(--color-text)',
            border: `1px solid ${flipped ? 'transparent' : 'var(--color-border)'}`,
            position: 'relative',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentCard}-${flipped}`}
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -90 }}
              transition={{ duration: 0.25 }}
            >
              <p style={{
                fontSize: flipped ? '0.95rem' : '1.05rem',
                fontWeight: flipped ? 400 : 600,
                lineHeight: 1.6,
                margin: 0,
              }}>
                {flipped ? card.back : card.front}
              </p>
            </motion.div>
          </AnimatePresence>

          <span style={{
            position: 'absolute',
            bottom: '0.75rem',
            right: '1rem',
            fontSize: '0.7rem',
            opacity: 0.6,
          }}>
            {flipped ? 'Answer' : 'Tap to flip'}
          </span>
        </motion.div>

        {/* Navigation */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: '1.25rem', gap: '0.75rem',
        }}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handlePrev}
            style={{
              flex: 1, padding: '0.7rem', borderRadius: '10px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-card-bg)', color: 'var(--color-text)',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
              fontFamily: 'inherit',
            }}
          >
            ← Previous
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            style={{
              flex: 1, padding: '0.7rem', borderRadius: '10px',
              border: 'none', background: 'var(--color-primary-600)',
              color: 'white', cursor: 'pointer', fontWeight: 600,
              fontSize: '0.9rem', fontFamily: 'inherit',
            }}
          >
            Next →
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
