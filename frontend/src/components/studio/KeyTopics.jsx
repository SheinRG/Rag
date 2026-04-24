import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/client';
import useChatStore from '../../store/chatStore';

export default function KeyTopics({ activeDocumentIds = [], onTopicClick }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [docName, setDocName] = useState('');
  
  // Use the most recently selected document for the study guide
  const focusDocId = activeDocumentIds?.[activeDocumentIds.length - 1] || null;

  const [exploredTopics, setExploredTopics] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nexus-explored-topics') || '{}');
    } catch { return {}; }
  });
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Fetch topics when document changes
  useEffect(() => {
    if (!focusDocId) {
      setTopics([]);
      setDocName('');
      return;
    }

    const fetchTopics = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/documents/${focusDocId}/topics`);
        setTopics(data.topics || []);
        setDocName(data.document_name || '');
      } catch (err) {
        console.error('Failed to fetch topics:', err);
        setError('Could not extract topics');
        setTopics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [focusDocId]);

  const handleTopicClick = (topic) => {
    // Mark as explored
    const key = `${focusDocId}::${topic.topic}`;
    const updated = { ...exploredTopics, [key]: true };
    setExploredTopics(updated);
    localStorage.setItem('nexus-explored-topics', JSON.stringify(updated));

    // Send to chat
    onTopicClick?.(`Explain "${topic.topic}" in detail from this document`);
  };

  const isExplored = (topic) => {
    return exploredTopics[`${focusDocId}::${topic.topic}`] || false;
  };

  const exploredCount = topics.filter(t => isExplored(t)).length;
  const totalCount = topics.length;

  if (!focusDocId) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
      borderRadius: '20px',
      border: '1px solid #FDE68A',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    }}>
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '10px',
            background: '#FCD34D',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px',
          }}>
            📚
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#92400E' }}>
              Key Topics
            </div>
            {totalCount > 0 && (
              <div style={{ fontSize: '0.65rem', color: '#B45309', fontWeight: 500 }}>
                {exploredCount}/{totalCount} explored
              </div>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
          style={{ color: '#92400E' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.div>
      </button>

      {/* Progress Bar */}
      {totalCount > 0 && !isCollapsed && (
        <div style={{ padding: '0 1rem', marginBottom: '0.5rem' }}>
          <div style={{
            height: '3px', borderRadius: '2px', background: '#FDE68A',
            overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(exploredCount / totalCount) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                height: '100%', borderRadius: '2px',
                background: 'linear-gradient(90deg, #F59E0B, #D97706)',
              }}
            />
          </div>
        </div>
      )}

      {/* Topics List */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 0.75rem 0.75rem', maxHeight: '280px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.25rem 0' }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                      height: '38px', borderRadius: '12px',
                      background: 'rgba(253, 230, 138, 0.5)',
                      animation: 'pulse 1.5s ease-in-out infinite',
                      animationDelay: `${i * 0.15}s`,
                    }} />
                  ))}
                </div>
              ) : error ? (
                <p style={{ fontSize: '0.75rem', color: '#B45309', textAlign: 'center', padding: '0.5rem 0' }}>
                  {error}
                </p>
              ) : topics.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: '#B45309', textAlign: 'center', padding: '0.5rem 0' }}>
                  No topics found yet
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {topics.map((topic, idx) => {
                    const explored = isExplored(topic);
                    return (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ x: 3, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleTopicClick(topic)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.65rem',
                          borderRadius: '12px',
                          border: 'none',
                          background: explored ? 'rgba(217, 119, 6, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s ease',
                          width: '100%',
                        }}
                        className="hover:bg-white/80"
                      >
                        {/* Status indicator */}
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '6px', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: explored ? '#D97706' : '#FDE68A',
                          transition: 'all 0.3s ease',
                        }}>
                          {explored ? (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#92400E' }}>
                              {idx + 1}
                            </span>
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            color: explored ? '#92400E' : '#78350F',
                            textDecoration: explored ? 'line-through' : 'none',
                            opacity: explored ? 0.7 : 1,
                            lineHeight: 1.3,
                          }}>
                            {topic.topic}
                          </div>
                          {topic.description && (
                            <div style={{
                              fontSize: '0.65rem',
                              color: '#B45309',
                              opacity: 0.7,
                              lineHeight: 1.3,
                              marginTop: '1px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {topic.description}
                            </div>
                          )}
                        </div>

                        {/* Arrow */}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, flexShrink: 0 }}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
