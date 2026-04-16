import MessageList from './MessageList';
import ChatInput from './ChatInput';
import useChatStore from '../../store/chatStore';
import useDocumentStore from '../../store/documentStore';

const typeIcons = { pdf: '📕', txt: '📄', md: '📝' };

function truncate(str, len = 20) {
  return str.length > len ? str.slice(0, len) + '...' : str;
}

export default function ChatPanel() {
  const { messages, isStreaming, sendMessage, activeDocumentId, setActiveDocument } = useChatStore();
  const { documents } = useDocumentStore();

  const readyDocs = documents.filter(d => d.status === 'ready');
  const activeDoc = documents.find(d => d.id === activeDocumentId);
  const hasChunks = readyDocs.some(d => d.num_chunks > 0);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      height: '100%', background: 'var(--color-background)',
    }}>
      <div style={{
        padding: '0.5rem 1rem 0', background: 'white', borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'flex-end' }}>
          <button
            onClick={() => setActiveDocument(null)}
            style={{
              padding: '0.5rem 1rem', borderRadius: '8px 8px 0 0', border: 'none',
              background: !activeDocumentId ? 'var(--color-primary-50)' : 'transparent',
              color: !activeDocumentId ? 'var(--color-primary-700)' : 'var(--color-text-muted)',
              fontWeight: !activeDocumentId ? 600 : 400, fontSize: '0.9rem', cursor: 'pointer',
              borderBottom: !activeDocumentId ? '2px solid var(--color-primary-500)' : '2px solid transparent',
            }}
          >
            💬 All
          </button>
          {readyDocs.map(doc => (
            <button
              key={doc.id}
              onClick={() => setActiveDocument(doc.id)}
              style={{
                padding: '0.5rem 0.75rem', borderRadius: '8px 8px 0 0', border: 'none',
                background: activeDocumentId === doc.id ? 'var(--color-primary-50)' : 'transparent',
                color: activeDocumentId === doc.id ? 'var(--color-primary-700)' : 'var(--color-text-muted)',
                fontWeight: activeDocumentId === doc.id ? 600 : 400, fontSize: '0.85rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                borderBottom: activeDocumentId === doc.id ? '2px solid var(--color-primary-500)' : '2px solid transparent',
                maxWidth: '150px',
              }}
            >
              <span>{typeIcons[doc.file_type] || '📄'}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {truncate(doc.original_name)}
              </span>
            </button>
          ))}
        </div>
      </div>
      {!hasChunks && (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-warning)', background: 'var(--color-warning-light)', borderBottom: '1px solid var(--color-border)' }}>
          ⚠️ No processed documents yet. Upload and wait for processing to complete.
        </div>
      )}
      <MessageList messages={messages} />
      <ChatInput onSend={sendMessage} disabled={isStreaming || !hasChunks} />
    </div>
  );
}
