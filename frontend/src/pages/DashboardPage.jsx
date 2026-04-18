import { useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import DocumentSidebar from '../components/documents/DocumentSidebar';
import ChatPanel from '../components/chat/ChatPanel';
import StudioPanel from '../components/studio/StudioPanel';
import useChatStore from '../store/chatStore';

export default function DashboardPage() {
  const [showWebSearch, setShowWebSearch] = useState(false);
  const activeDocumentId = useChatStore((s) => s.activeDocumentId);

  return (
    <div className="h-screen w-full flex relative font-sans overflow-hidden bg-[#FAFAFA]" style={{ fontFamily: '"Inter", "system-ui", sans-serif' }}>
      
      {/* Background Mesh Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-[#0ea5e9]/10 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none z-0"></div>
      
      <div className="flex-1 w-full h-full p-4 overflow-hidden relative z-10">
        <Group orientation="horizontal" id="docmind-layout-v2" style={{ height: '100%' }}>
          {/* Left Column: Sources */}
          <Panel id="sidebar" defaultSize="20%" minSize="15%" maxSize="35%">
            <DocumentSidebar />
          </Panel>

          <Separator className="w-4 group flex items-center justify-center cursor-col-resize outline-none">
             <div className="h-16 w-1 rounded-full bg-gray-300/60 group-hover:bg-[#0ea5e9] transition-colors duration-300"></div>
          </Separator>

          {/* Center Column: Chat */}
          <Panel id="chat" defaultSize="55%" minSize="30%">
            <ChatPanel
              showWebSearch={showWebSearch}
              onCloseWebSearch={() => setShowWebSearch(false)}
            />
          </Panel>

          <Separator className="w-4 group flex items-center justify-center cursor-col-resize outline-none">
             <div className="h-16 w-1 rounded-full bg-gray-300/60 group-hover:bg-[#0ea5e9] transition-colors duration-300"></div>
          </Separator>

          {/* Right Column: Studio */}
          <Panel id="studio" defaultSize="25%" minSize="18%" maxSize="40%">
            <StudioPanel
              activeDocumentId={activeDocumentId}
              onWebSearch={() => setShowWebSearch(true)}
            />
          </Panel>
        </Group>
      </div>
    </div>
  );
}
