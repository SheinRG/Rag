import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/client';
import useChatStore from '../../store/chatStore';

export default function DocumentOverview({ document }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(null); // track which doc was fetched
  const sendMessage = useChatStore((s) => s.sendMessage);

  useEffect(() => {
    if (!document?.id || document.id === fetched) return;

    const fetchOverview = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/documents/${document.id}/overview`);
        setOverview(data);
        setFetched(document.id);
      } catch (err) {
        console.error('Overview fetch failed:', err);
        setOverview({ summary: 'Could not load overview.', suggestions: [] });
        setFetched(document.id);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [document?.id, fetched]);

  if (loading) {
    return (
      <div style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ display: 'inline-block', fontSize: '0.9rem' }}
          >
            ⏳
          </motion.span>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            Generating overview...
          </span>
        </div>
        <div className="shimmer-bg" style={{ height: '40px', borderRadius: '8px' }} />
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div style={{ padding: '1.5rem 0' }}>
      {/* Summary */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{
          fontSize: '1.1rem', lineHeight: 1.8,
          color: 'var(--color-text)',
          marginBottom: '1rem',
          fontWeight: 400
        }}>
          {overview.summary}
        </p>
      </div>

      {/* Suggestion Prompts */}
      {overview.suggestions && overview.suggestions.length > 0 && (
        <div>
          <p style={{
            fontSize: '0.85rem', fontWeight: 400,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            Suggested questions
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {overview.suggestions.map((suggestion, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.02, y: -2, backgroundColor: 'white' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => sendMessage(suggestion)}
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '16px',
                  border: '1px solid var(--color-border)',
                  background: 'rgba(255, 255, 255, 0.4)',
                  color: 'var(--color-text)',
                  fontSize: '0.9rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  lineHeight: 1.5,
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <div style={{ 
                  width: '24px', height: '24px', borderRadius: '50%', 
                  background: 'var(--color-primary-100)', color: 'var(--color-primary-600)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', flexShrink: 0
                }}>→</div>
                {suggestion}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
