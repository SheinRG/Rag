import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ChatInput({ onSend, disabled }) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim() || disabled) return;
    onSend(question.trim());
    setQuestion('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustHeight = (e) => {
    const target = e.target;
    target.style.height = 'inherit';
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
    setQuestion(target.value);
  };

  return (
    <div className="absolute bottom-6 left-0 right-0 px-4 md:px-8 pointer-events-none z-10">
      <form
        onSubmit={handleSubmit}
        className="relative max-w-4xl mx-auto flex items-end bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-[28px] overflow-hidden focus-within:ring-2 focus-within:ring-white focus-within:border-white/50 transition-all p-1 pointer-events-auto"
      >
        <textarea
          rows="1"
          value={question}
          onChange={adjustHeight}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
          disabled={disabled}
          className="flex-1 w-full px-5 py-3.5 text-[0.95rem] outline-none bg-transparent text-gray-800 placeholder-gray-400 resize-none min-h-[52px] max-h-[200px] leading-relaxed"
          style={{ height: '52px' }}
        />
        <div className="pb-2.5 pr-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={disabled || !question.trim()}
            className={`p-2 rounded-full flex items-center justify-center transition-all ${
              disabled || !question.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800 shadow-sm'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </motion.button>
        </div>
      </form>
    </div>
  );
}
