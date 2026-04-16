import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
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
      <div {...getRootProps()} style={{
        border: `2px dashed ${isDragActive ? 'var(--color-primary-400)' : 'var(--color-border)'}`,
        borderRadius: '12px', padding: '2rem 1rem', textAlign: 'center',
        cursor: 'pointer', transition: 'all 0.2s',
        background: isDragActive ? 'var(--color-primary-50)' : 'transparent',
      }}>
        <input {...getInputProps()} />
        <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📤</p>
        {uploading ? (
          <div style={{ marginTop: '0.5rem' }}>
            <p style={{ fontWeight: 600, color: 'var(--color-primary-600)', marginBottom: '0.5rem' }}>
              Uploading... {uploadProgress}%
            </p>
            <div style={{ 
              width: '100%', height: '8px', background: 'var(--color-border)', 
              borderRadius: '4px', overflow: 'hidden' 
            }}>
              <div style={{ 
                height: '100%', background: 'var(--color-primary-500)', 
                width: `${uploadProgress}%`,
                transition: 'width 0.2s ease-in-out'
              }} />
            </div>
          </div>
        ) : isDragActive ? (
          <p style={{ fontWeight: 600, color: 'var(--color-primary-600)' }}>Drop files here</p>
        ) : (
          <>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Drag & drop files here</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>PDF, TXT, MD up to 20 MB</p>
          </>
        )}
      </div>
      {error && (
        <p style={{
          marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-error)',
          background: 'var(--color-error-light)', padding: '0.5rem 0.75rem', borderRadius: '8px',
        }}>{error}</p>
      )}
    </div>
  );
}
