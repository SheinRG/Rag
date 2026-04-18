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

  const handleSelect = (optionLetter) => {
    if (showAnswer) return;
    setSelected(optionLetter);
    setShowAnswer(true);
    if (optionLetter === question.answer) {
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

  const getOptionLetter = (opt) => opt.charAt(0);

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
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
            🧠 Knowledge Quiz
          </h2>
          <button onClick={onClose} style={{
            border: 'none', background: 'none', cursor: 'pointer',
            fontSize: '1.25rem', color: 'var(--color-text-muted)',
          }}>✕</button>
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
              padding: '0.75rem 2rem', borderRadius: '10px', border: 'none',
              background: 'var(--color-primary-600)', color: 'white',
              fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem',
            }}>Done</button>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{
                flex: 1, height: '6px', borderRadius: '3px',
                background: 'var(--color-border)',
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                  style={{
                    height: '100%', borderRadius: '3px',
                    background: 'var(--color-primary-500)',
                  }}
                />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                {currentQ + 1}/{questions.length}
              </span>
            </div>

            {/* Question */}
            <p style={{
              fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.5,
              color: 'var(--color-text)', marginBottom: '1.25rem',
            }}>
              {question.question}
            </p>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {question.options.map((opt) => {
                const letter = getOptionLetter(opt);
                const isCorrect = letter === question.answer;
                const isSelected = letter === selected;

                let bg = 'var(--color-surface-secondary)';
                let border = 'var(--color-border)';
                if (showAnswer && isCorrect) {
                  bg = 'var(--color-success-light)';
                  border = 'var(--color-success)';
                } else if (showAnswer && isSelected && !isCorrect) {
                  bg = 'var(--color-error-light)';
                  border = 'var(--color-error)';
                } else if (isSelected) {
                  border = 'var(--color-primary-500)';
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
                  width: '100%', padding: '0.75rem', borderRadius: '10px',
                  border: 'none', background: 'var(--color-primary-600)',
                  color: 'white', fontWeight: 600, cursor: 'pointer',
                  fontSize: '0.95rem', fontFamily: 'inherit',
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
