import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { createPortal } from 'react-dom';
import useDocumentStore from '../../store/documentStore';
import api from '../../api/client';

export default function AddSourceModal({ isOpen, onClose, notebookId }) {
  const { uploadDocument, uploading, uploadProgress } = useDocumentStore();
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('file');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  const onDrop = useCallback(async (accepted, rejected) => {
    setError('');
    if (rejected.length > 0) {
      setError('Invalid file type. Please upload PDF, TXT, or MD files.');
      return;
    }
    for (const file of accepted) {
      try {
        await uploadDocument(file, notebookId);
        if (accepted.length === 1 || file === accepted[accepted.length - 1]) {
           onClose();
        }
      } catch (err) {
        setError(err.message);
      }
    }
  }, [uploadDocument, onClose, notebookId]);

  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv'],
    },
    maxSize: 20 * 1024 * 1024,
    disabled: uploading,
  });

  const handleYoutubeSubmit = async () => {
    if (!youtubeUrl.trim()) return;
    setError('');
    setYoutubeLoading(true);
    try {
      await api.post('/media/youtube', {
        url: youtubeUrl.trim(),
        notebook_id: notebookId,
      });
      setYoutubeUrl('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to ingest YouTube video.');
    } finally {
      setYoutubeLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setImageLoading(true);
    setImageAnalysis(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (notebookId) formData.append('notebook_id', notebookId);
      const { data } = await api.post('/media/analyze-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageAnalysis(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Image analysis failed.');
    } finally {
      setImageLoading(false);
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!isOpen) {
      setError('');
      setActiveTab('file');
      setImageAnalysis(null);
    }
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-[8px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
            className="w-full max-w-[600px] bg-white border border-gray-100 rounded-[24px] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.12)] p-8 relative overflow-hidden"
          >
            <button 
              onClick={onClose} 
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-gray-100/80 rounded-full transition-all"
            >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>

            <h2 className="text-[1.4rem] font-bold text-gray-900 tracking-tight mb-1.5 flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Add Source
            </h2>
            <p className="text-gray-500 text-[0.95rem] mb-8 font-medium">Upload files, import links, or scan images to enhance your workspace.</p>

            {/* Premium Tab Selector */}
            <div className="flex gap-2 mb-8 bg-gray-50 p-1.5 rounded-[16px] w-full border border-gray-100/50 shadow-inner">
              {[
                { 
                  id: 'file', 
                  label: 'Document', 
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                  )
                },
                { 
                  id: 'youtube', 
                  label: 'Web / YT Link', 
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  )
                },
                { 
                  id: 'image', 
                  label: 'Image OCR', 
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  )
                }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-[12px] text-[0.85rem] font-semibold transition-all duration-200 ${
                    activeTab === tab.id 
                      ? 'bg-white text-black shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-gray-900/5' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'file' && (
                <motion.div key="file" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <div 
                    {...getRootProps()} 
                    className={`rounded-[20px] p-12 text-center border-2 border-dashed transition-all duration-200 cursor-pointer ${
                      isDragActive 
                        ? 'border-blue-400 bg-blue-50/50' 
                        : 'border-gray-200 bg-gray-50/30 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <input {...getInputProps()} />
                    
                    <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors ${isDragActive ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-400 shadow-sm border border-gray-100'}`}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                    </div>

                    <p className="font-semibold text-[1.05rem] mb-1.5 text-gray-800">
                      {uploading ? `Uploading document... ${uploadProgress}%` : isDragActive ? "Drop documents here" : "Click or drag documents here"}
                    </p>
                    
                    {!uploading && !isDragActive && (
                      <p className="text-[0.85rem] text-gray-400 font-medium">Supports PDF, TXT, CSV, and Markdown files</p>
                    )}
                    
                    {uploading && (
                      <div className="w-full max-w-xs mx-auto mb-2 h-1.5 bg-gray-200/80 rounded-full overflow-hidden mt-6">
                        <motion.div animate={{ width: `${uploadProgress}%` }} className="h-full rounded-full bg-blue-500" />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'youtube' && (
                <motion.div key="youtube" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <div className="flex flex-col gap-5">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                      </div>
                      <input
                         type="text"
                         value={youtubeUrl}
                         onChange={(e) => setYoutubeUrl(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleYoutubeSubmit()}
                         placeholder="Paste any YouTube video or web link..."
                         className="w-full pl-11 pr-32 py-4 bg-gray-50 border border-gray-200 rounded-[16px] text-[0.95rem] outline-none focus:bg-white focus:border-black focus:ring-4 focus:ring-gray-900/5 transition-all"
                      />
                      <button
                         onClick={handleYoutubeSubmit}
                         disabled={youtubeLoading || !youtubeUrl.trim()}
                         className="absolute right-2 top-2 bottom-2 px-6 bg-black text-white rounded-[12px] font-bold text-[0.85rem] disabled:opacity-50 hover:bg-gray-800 transition-colors shadow-sm"
                      >
                         {youtubeLoading ? (
                           <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-t-transparent border-white rounded-full mx-auto" />
                         ) : 'Import'}
                      </button>
                    </div>
                    
                    <div className="flex items-start gap-3 p-4 rounded-[16px] bg-blue-50/50 border border-blue-100/50">
                      <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-[0.85rem] font-bold text-gray-900 mb-0.5">Smart Extraction</h4>
                        <p className="text-[0.8rem] text-gray-500 leading-relaxed">
                          YouTube transcripts will be automatically extracted, optimized, and indexed for instant semantic search.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'image' && (
                <motion.div key="image" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <div className="rounded-[20px] p-8 text-center bg-gray-50/50 border border-gray-200">
                     {!imageAnalysis ? (
                       <>
                         <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-white shadow-sm border border-gray-100 text-gray-800">
                           <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                             <circle cx="8.5" cy="8.5" r="1.5"></circle>
                             <polyline points="21 15 16 10 5 21"></polyline>
                           </svg>
                         </div>
                         <p className="font-semibold text-[1.1rem] mb-1.5 text-gray-900">Upload an Image</p>
                         <p className="text-[0.85rem] mb-6 text-gray-500 px-4">Our Vision AI will analyze diagrams, handwritten notes, charts, or any visual content to add to your knowledge base.</p>
                         
                         <label className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[0.9rem] font-bold shadow-sm cursor-pointer transition-all border border-gray-200/80 hover:bg-white hover:border-gray-300 text-gray-800 bg-white">
                           {imageLoading ? 'Analyzing visually...' : 'Browse Image'}
                           <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={imageLoading} />
                         </label>
                         
                         {imageLoading && (
                           <div className="mt-6">
                             <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} className="w-6 h-6 mx-auto border-2 border-t-transparent border-black rounded-full" />
                           </div>
                         )}
                       </>
                     ) : (
                       <div className="text-left bg-white p-5 rounded-[16px] shadow-sm border border-gray-100">
                         <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                           <h3 className="text-[0.9rem] font-bold text-gray-900 flex items-center gap-2">
                             <svg className="text-green-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                             Analysis Complete
                           </h3>
                           <button onClick={() => setImageAnalysis(null)} className="text-[0.75rem] font-semibold px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-black rounded-full transition-colors">
                             Analyze Another
                           </button>
                         </div>
                         <div className="text-[0.85rem] leading-relaxed max-h-48 overflow-y-auto p-4 rounded-[12px] bg-gray-50 text-gray-800 border border-gray-100 prose prose-sm hide-scrollbar">
                           {imageAnalysis.analysis}
                         </div>
                       </div>
                     )}
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
 
             {error && (
               <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-[0.85rem] font-medium p-3 bg-red-50/80 text-red-600 border border-red-100 rounded-xl text-center flex items-center justify-center gap-2">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                 {error}
               </motion.p>
             )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
