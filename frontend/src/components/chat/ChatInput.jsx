import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HoverBorderGradient } from '../ui/HoverBorderGradient';

export default function ChatInput({ onSend, disabled, editValue = '', onClearEdit }) {
  const [question, setQuestion] = useState('');
  const [useWebSearch, setUseWebSearch] = useState(false);

  // Sync with external edit request
  React.useEffect(() => {
    if (editValue) {
      setQuestion(editValue);
      onClearEdit?.();
      // Auto-focus and adjust height
      const el = document.getElementById('chat-textarea');
      if (el) {
        el.focus();
        el.style.height = 'inherit';
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
      }
    }
  }, [editValue, onClearEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim() || disabled) return;
    onSend(question.trim(), useWebSearch);
    setQuestion('');
    // Reset height
    const el = document.getElementById('chat-textarea');
    if (el) el.style.height = '52px';
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
    <div className="absolute bottom-6 left-0 right-0 px-4 md:px-8 pointer-events-none z-10 flex justify-center">
      <HoverBorderGradient
        as="form"
        onSubmit={handleSubmit}
        containerClassName="max-w-4xl w-full pointer-events-auto rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
        className="w-full flex items-end bg-[#E5E7EB] focus-within:bg-white border border-black/5 transition-all p-1"
      >
        <textarea
          id="chat-textarea"
          rows="1"
          value={question}
          onChange={adjustHeight}
          onKeyDown={handleKeyDown}
          placeholder={useWebSearch ? "Search the web..." : "Ask about your documents..."}
          disabled={disabled}
          className="flex-1 w-full px-4 py-3.5 text-[0.95rem] outline-none bg-transparent text-gray-800 placeholder-gray-400 resize-none min-h-[52px] max-h-[200px] leading-relaxed"
          style={{ height: '52px' }}
        />
        <div className="flex items-center gap-1 pb-2.5 pr-2">
          {/* Web Search Toggle */}
          <button
            type="button"
            onClick={() => setUseWebSearch(!useWebSearch)}
            disabled={disabled}
            className={`p-2 rounded-full flex items-center justify-center transition-all ${
              useWebSearch 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
            title="Toggle Web Search"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </button>
          
          {/* Send Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
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
      </HoverBorderGradient>
    </div>
  );
}
