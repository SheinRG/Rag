import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import useDocumentStore from '../../store/documentStore';

export default function UploadZone() {
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
      } catch (err) {
        setError(err.message);
      }
    }
  }, [uploadDocument]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxSize: 20 * 1024 * 1024,
    disabled: uploading,
  });

  return (
    <div>
      <motion.div
        {...getRootProps()}
        whileHover={{ scale: 1.01 }}
        style={{
          border: `2px dashed ${isDragActive ? 'var(--color-primary-400)' : 'var(--color-border)'}`,
          borderRadius: '12px', padding: '1.25rem 0.75rem', textAlign: 'center',
          cursor: 'pointer',
          background: isDragActive ? 'var(--color-badge-bg)' : 'transparent',
        }}
      >
        <input {...getInputProps()} />
        <p style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>📤</p>
        {uploading ? (
          <div style={{ marginTop: '0.35rem' }}>
            <p style={{ fontWeight: 600, color: 'var(--color-primary-600)', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
              Uploading... {uploadProgress}%
            </p>
            <div style={{
              width: '100%', height: '6px', background: 'var(--color-border)',
              borderRadius: '3px', overflow: 'hidden'
            }}>
              <motion.div
                animate={{ width: `${uploadProgress}%` }}
                style={{
                  height: '100%', background: 'var(--color-primary-500)',
                  borderRadius: '3px',
                }}
              />
            </div>
          </div>
        ) : isDragActive ? (
          <p style={{ fontWeight: 600, color: 'var(--color-primary-600)', fontSize: '0.85rem' }}>Drop files here</p>
        ) : (
          <>
            <p style={{ fontWeight: 600, marginBottom: '0.15rem', fontSize: '0.82rem', color: 'var(--color-text)' }}>Drag & drop files here</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>PDF, TXT, MD up to 20 MB</p>
          </>
        )}
      </motion.div>
      {error && (
        <p style={{
          marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-error)',
          background: 'var(--color-error-light)', padding: '0.4rem 0.65rem', borderRadius: '8px',
        }}>{error}</p>
      )}
    </div>
  );
}
