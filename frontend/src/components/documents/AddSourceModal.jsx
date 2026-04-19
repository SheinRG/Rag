import { motion, AnimatePresence } from 'framer-motion';
import SpotlightCard from '../ui/SpotlightCard';
import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { createPortal } from 'react-dom';
import useDocumentStore from '../../store/documentStore';

export default function AddSourceModal({ isOpen, onClose }) {
  const { uploadDocument, uploading, uploadProgress } = useDocumentStore();
  const [error, setError] = useState('');

  const onDrop = useCallback(async (accepted, rejected) => {
    setError('');
    if (rejected.length > 0) {
      setError('Invalid file type. Please upload PDF, TXT, or MD files.');
      return;
    }
    for (const file of accepted) {
      try {
        await uploadDocument(file);
        if (accepted.length === 1 || file === accepted[accepted.length - 1]) {
           onClose(); // Close modal on successful upload of last file
        }
      } catch (err) {
        setError(err.message);
      }
    }
  }, [uploadDocument, onClose]);

  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxSize: 20 * 1024 * 1024,
    disabled: uploading,
    noClick: true, // We will trigger it manually with the button
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            {...getRootProps()}
            className={`w-full max-w-2xl bg-[#f8fafc]/90 backdrop-blur-2xl border border-white rounded-[24px] shadow-2xl p-8 relative overflow-hidden transition-colors ${isDragActive ? 'bg-blue-50/90 border-blue-200' : ''}`}
          >
            <input {...getInputProps()} />
            
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-800 transition-colors rounded-full hover:bg-gray-200/50">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <h2 className="text-[1.35rem] font-semibold text-center text-gray-800 mb-6">
              Add Sources
            </h2>

            <div className="bg-white/40 border border-white/60 rounded-[20px] p-8 text-center backdrop-blur-md">
               <p className="text-gray-800 font-medium text-[1.1rem] mb-1">
                 {uploading ? `Uploading... ${uploadProgress}%` : isDragActive ? "Drop PDF here" : "or drop your PDF files"}
               </p>
               {!uploading && !isDragActive && (
                 <p className="text-gray-500 text-[13px] mb-6">Upload .pdf files to analyze.</p>
               )}
               {uploading && (
                  <div className="w-full max-w-xs mx-auto mb-6 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
                    <motion.div animate={{ width: `${uploadProgress}%` }} className="h-full bg-blue-500 rounded-full" />
                  </div>
               )}

               <div className="flex justify-center gap-3 flex-wrap">
                  <button onClick={openFileDialog} className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200/80 hover:bg-gray-50 transition-colors text-[13px] font-medium text-gray-700 bg-white shadow-sm">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                     Upload PDF
                  </button>
               </div>
            </div>

            {error && (
              <p className="mt-4 text-[13px] text-red-500 bg-red-50 p-2 rounded-lg text-center">{error}</p>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
