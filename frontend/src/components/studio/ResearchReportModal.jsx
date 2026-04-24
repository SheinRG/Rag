import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ResearchReportModal({ onClose, activeDocumentId }) {
  const [prompt, setPrompt] = useState('');
  const [steps, setSteps] = useState([]);
  const [sections, setSections] = useState([]);
  const [fullReport, setFullReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [phase, setPhase] = useState('input');
  const scrollRef = useRef(null);

  const readerRef = useRef(null);

  const handleStop = () => {
    if (readerRef.current) {
      readerRef.current.cancel();
      setIsGenerating(false);
      setSteps(prev => [...prev, 'Research stopped by user.']);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setPhase('generating');
    setSteps(['Initializing research agent...']);
    setSections([]);

    try {
      const { streamPost } = await import('../../api/client');
      const stream = await streamPost('/media/research-report', {
        prompt: prompt.trim(),
        document_ids: activeDocumentId ? [activeDocumentId] : [],
      });

      const reader = stream.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value);
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.substring(6));
            if (data.type === 'status' || data.type === 'step') {
              setSteps(prev => [...prev, data.content]);
            } else if (data.type === 'section') {
              setSections(prev => [...prev, { title: data.content.title, text: data.content.text }]);
            } else if (data.type === 'complete') {
              setFullReport(data.content);
              setPhase('complete');
            } else if (data.type === 'error') {
              throw new Error(data.content);
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.message.includes('cancel')) {
        console.log('Stream cancelled');
      } else {
        console.error(err);
        setSteps(prev => [...prev, 'Error: ' + err.message]);
      }
    } finally {
      setIsGenerating(false);
      readerRef.current = null;
    }
  };

  const handleCopy = () => {
    if (fullReport) {
      navigator.clipboard.writeText(fullReport);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps, sections]);

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-3xl max-h-[85vh] rounded-[24px] shadow-2xl overflow-hidden flex flex-col bg-white/95 backdrop-blur-2xl border border-white/80 relative z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-rose-100 bg-rose-50/30">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white border border-rose-200 text-rose-600 shadow-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-[1.1rem] font-extrabold text-rose-900 tracking-tight uppercase">Research Dossier</h3>
              <p className="text-[0.7rem] font-bold text-rose-500/80 tracking-wider">DEEP-DIVE ANALYTICAL INTELLIGENCE</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isGenerating && (
              <button 
                onClick={handleStop}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[0.7rem] font-black uppercase tracking-widest bg-white text-rose-600 hover:bg-rose-600 hover:text-white transition-all duration-300 border-2 border-rose-600 shadow-sm group"
              >
                <div className="w-2.5 h-2.5 rounded-sm bg-rose-600 group-hover:bg-white animate-pulse"></div>
                Abort Investigation
              </button>
            )}
            <button onClick={onClose} className="p-2.5 text-rose-400 hover:text-rose-900 hover:bg-white rounded-xl transition-all duration-200 border border-transparent hover:border-rose-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {phase === 'input' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Provide a specific research objective. Nexus will analyze your documents and compile a comprehensive report with citations.
              </p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Write a 5-page investment thesis on ESG scores..."
                className="w-full min-h-[120px] p-4 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 transition-colors resize-none"
              />
              <button
                onClick={handleGenerate}
                className="w-full py-3 bg-black text-white rounded-xl font-semibold text-sm hover:bg-neutral-800 transition-colors"
              >
                Start Research
              </button>
            </div>
          )}

          {phase === 'generating' && (
            <div className="space-y-4">
              {/* Progress Steps */}
              <div className="space-y-2">
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 text-sm text-gray-500"
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[0.6rem] font-bold shrink-0 bg-emerald-100 text-emerald-600">
                      {i === steps.length - 1 && isGenerating ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v4" /></svg>
                        </motion.div>
                      ) : '✓'}
                    </div>
                    {step}
                  </motion.div>
                ))}
              </div>

              {/* Live Sections */}
              {sections.map((section, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <h4 className="text-sm font-semibold mb-2 text-gray-800">{section.title}</h4>
                  <div className="text-sm leading-relaxed text-gray-600">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.text}</ReactMarkdown>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {phase === 'complete' && fullReport && (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{fullReport}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        {phase === 'complete' && fullReport && (
          <div className="px-6 py-3 border-t flex justify-end gap-2 border-gray-100 bg-gray-50/50">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy Report
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-black text-white hover:bg-neutral-800"
            >
              Done
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Padding to force line number change for cache testing
// -----------------------------------------------------------------------------
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
