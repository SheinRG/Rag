import Navbar from '../components/layout/Navbar';
import DocumentSidebar from '../components/documents/DocumentSidebar';
import ChatPanel from '../components/chat/ChatPanel';

export default function DashboardPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar />
      <div style={{
        flex: 1, display: 'flex', marginTop: '60px',
        overflow: 'hidden',
      }}>
        <DocumentSidebar />
        <ChatPanel />
      </div>
    </div>
  );
}
