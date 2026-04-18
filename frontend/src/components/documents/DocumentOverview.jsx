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
    <div style={{ padding: '0.75rem 1.25rem', maxHeight: '250px', overflow: 'auto' }}>
      {/* Summary */}
      <p style={{
        fontSize: '0.78rem', lineHeight: 1.6,
        color: 'var(--color-text-secondary)',
        marginBottom: '0.75rem',
      }}>
        {overview.summary}
      </p>

      {/* Suggestion Prompts */}
      {overview.suggestions && overview.suggestions.length > 0 && (
        <div>
          <p style={{
            fontSize: '0.7rem', fontWeight: 700,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem',
          }}>
            Suggested questions
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {overview.suggestions.map((suggestion, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.01, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => sendMessage(suggestion)}
                style={{
                  padding: '0.5rem 0.65rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-secondary)',
                  color: 'var(--color-text)',
                  fontSize: '0.75rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  lineHeight: 1.4,
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span style={{ color: 'var(--color-primary-500)', flexShrink: 0 }}>→</span>
                {suggestion}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
