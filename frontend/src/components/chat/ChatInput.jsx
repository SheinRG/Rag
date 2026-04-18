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

  return (
    <form onSubmit={handleSubmit} className="p-4 md:p-6 border-t border-gray-200/60 bg-white/40 backdrop-blur-sm flex gap-3">
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question about your documents..."
        disabled={disabled}
        className="flex-1 px-4 py-3 rounded-[14px] border border-gray-200/80 text-[0.95rem] outline-none bg-white/70 backdrop-blur-md shadow-sm focus:border-[#0ea5e9] focus:ring-4 focus:ring-[#e0f2fe] transition-all text-gray-800 placeholder-gray-400"
      />
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        type="submit"
        disabled={disabled || !question.trim()}
        className={`px-6 py-3 rounded-[14px] font-bold text-white shadow-md bg-[#0ea5e9] hover:bg-[#0284c7] transition-all ${disabled || !question.trim() ? 'opacity-50 blur-[0.5px] shadow-none' : ''}`}
      >
        Send
      </motion.button>
    </form>
  );
}
