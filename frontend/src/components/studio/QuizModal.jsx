import { useState } from 'react';
import { motion } from 'framer-motion';

export default function QuizModal({ data, onClose }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const questions = data?.questions || [];
  if (questions.length === 0) return null;

  const question = questions[currentQ];

  const getOptionLetter = (opt) => opt.trim().charAt(0).toUpperCase();
  
  const getCorrectLetter = (ans) => {
    if (!ans) return '';
    const cleaned = ans.trim().toUpperCase();
    if (cleaned.startsWith('OPTION ')) return cleaned.charAt(7);
    return cleaned.charAt(0);
  };

  const handleSelect = (optionLetter) => {
    if (showAnswer) return;
    setSelected(optionLetter);
    setShowAnswer(true);
    if (optionLetter === getCorrectLetter(question.answer)) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentQ(c => c + 1);
      setSelected(null);
      setShowAnswer(false);
    }
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
          background: 'rgba(236, 254, 255, 0.85)',
          backdropBlur: '20px',
          borderRadius: '32px',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '85vh',
          overflow: 'auto',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 600, color: '#0891B2', tracking: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Knowledge Quiz
          </h2>
          <button onClick={onClose} style={{
            border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer',
            padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', transition: 'all 0.2s ease'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {finished ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>
              {score >= questions.length * 0.8 ? '🎉' : score >= questions.length * 0.5 ? '👍' : '📚'}
            </span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
              Score: {score}/{questions.length}
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              {score >= questions.length * 0.8 ? 'Excellent! You know this material well!' :
               score >= questions.length * 0.5 ? 'Good job! Keep studying.' : 
               'Review the material and try again!'}
            </p>
            <button onClick={onClose} style={{
              padding: '0.85rem 2.5rem', borderRadius: '16px', border: 'none',
              background: '#0891B2', color: 'white',
              fontWeight: 600, cursor: 'pointer', fontSize: '1rem',
              boxShadow: '0 4px 15px rgba(8, 145, 178, 0.25)',
              transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '0.6rem',
              margin: '0 auto'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{
                flex: 1, height: '8px', borderRadius: '4px',
                background: 'rgba(0,0,0,0.05)',
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{
                    height: '100%', borderRadius: '4px',
                    background: '#0891B2',
                  }}
                />
              </div>
              <span style={{ fontSize: '0.9rem', color: '#0891B2', fontWeight: 600 }}>
                {currentQ + 1}/{questions.length}
              </span>
            </div>

            {/* Question */}
            <p style={{
              fontSize: '1.2rem', fontWeight: 500, lineHeight: 1.6,
              color: '#1e293b', marginBottom: '1.75rem', letterSpacing: '-0.01em'
            }}>
              {question.question}
            </p>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {question.options.map((opt) => {
                const letter = getOptionLetter(opt);
                const isCorrect = letter === getCorrectLetter(question.answer);
                const isSelected = letter === selected;

                let bg = 'rgba(255, 255, 255, 0.6)';
                let border = 'rgba(255, 255, 255, 0.8)';
                let textColor = '#2c3e50';
                
                if (showAnswer) {
                  if (isSelected) {
                    bg = isCorrect ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
                    border = isCorrect ? '#22c55e' : '#ef4444';
                  } else if (isCorrect) {
                    bg = 'rgba(34, 197, 94, 0.1)';
                    border = '#22c55e';
                  }
                } else if (isSelected) {
                  bg = 'rgba(8, 145, 178, 0.1)';
                  border = '#0891B2';
                }

                return (
                  <motion.button
                    key={opt}
                    whileHover={!showAnswer ? { scale: 1.01 } : {}}
                    whileTap={!showAnswer ? { scale: 0.99 } : {}}
                    onClick={() => handleSelect(letter)}
                    style={{
                      padding: '0.85rem 1rem', borderRadius: '10px',
                      border: `2px solid ${border}`, background: bg,
                      textAlign: 'left', cursor: showAnswer ? 'default' : 'pointer',
                      fontSize: '0.9rem', color: 'var(--color-text)',
                      fontFamily: 'inherit',
                    }}
                  >
                    {opt}
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation + Next */}
            {showAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {question.explanation && (
                  <p style={{
                    fontSize: '0.85rem', color: 'var(--color-text-secondary)',
                    background: 'var(--color-surface-secondary)', padding: '0.75rem 1rem',
                    borderRadius: '8px', marginBottom: '1rem', lineHeight: 1.5,
                  }}>
                    💡 {question.explanation}
                  </p>
                )}
                <button onClick={handleNext} style={{
                  width: '100%', padding: '0.85rem', borderRadius: '16px',
                  border: 'none', background: '#0891B2',
                  color: 'white', fontWeight: 600, cursor: 'pointer',
                  fontSize: '1rem', fontFamily: 'inherit',
                  boxShadow: '0 4px 12px rgba(8, 145, 178, 0.2)',
                  transition: 'all 0.2s ease'
                }}>
                  {currentQ + 1 >= questions.length ? 'See Results' : 'Next Question →'}
                </button>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
