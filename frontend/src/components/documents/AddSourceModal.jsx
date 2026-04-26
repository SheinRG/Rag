import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { createPortal } from 'react-dom';
import useDocumentStore from '../../store/documentStore';

export default function AddSourceModal({ isOpen, onClose, notebookId }) {
  const { uploadDocument, uploading, uploadProgress } = useDocumentStore();
  const [error, setError] = useState('');

  const onDrop = useCallback(async (accepted, rejected) => {
    setError('');
    if (rejected.length > 0) {
      setError('Invalid file type. Please upload PDF, Word, PPT, Excel, TXT, or MD files.');
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
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize: 20 * 1024 * 1024,
    disabled: uploading,
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!isOpen) {
      setError('');
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
            <p className="text-gray-500 text-[0.95rem] mb-8 font-medium">Upload documents to enhance your workspace.</p>

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
                <p className="text-[0.85rem] text-gray-400 font-medium">Supports PDF, Word, PPT, Excel, and Text files</p>
              )}
              
              {uploading && (
                <div className="w-full max-w-xs mx-auto mb-2 h-1.5 bg-gray-200/80 rounded-full overflow-hidden mt-6">
                  <motion.div animate={{ width: `${uploadProgress}%` }} className="h-full rounded-full bg-blue-500" />
                </div>
              )}
            </div>


 
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
