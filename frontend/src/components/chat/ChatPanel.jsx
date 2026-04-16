import MessageList from './MessageList';
import ChatInput from './ChatInput';
import useChatStore from '../../store/chatStore';

export default function ChatPanel() {
  const { messages, isStreaming, sendMessage } = useChatStore();

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      height: '100%', background: 'var(--color-background)',
    }}>
      <div style={{
        padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)',
        background: 'white', fontWeight: 700, fontSize: '1.1rem',
      }}>
        💬 Chat
      </div>
      <MessageList messages={messages} />
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
