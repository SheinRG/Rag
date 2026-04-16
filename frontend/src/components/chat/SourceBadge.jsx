export default function SourceBadge({ source }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      background: 'var(--color-primary-50)', color: 'var(--color-primary-700)',
      padding: '0.25rem 0.65rem', borderRadius: '6px',
      fontSize: '0.75rem', fontWeight: 600,
    }}>
      📄 {source}
    </span>
  );
}
