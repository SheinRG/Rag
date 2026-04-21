import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { createPortal } from 'react-dom';

const CONNECTORS = [
  {
    id: 'gdrive',
    name: 'Google Drive',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24">
        <path fill="#4285F4" d="m7.126 15.654 3.748-6.49H3.374l1.874 3.245z"/>
        <path fill="#34A853" d="m15.002 15.654 1.874-3.245H13.12l-1.874-3.245h-3.748l3.748 6.49z"/>
        <path fill="#FBBC05" d="m18.75 18.898-3.748-6.49h-3.748l3.748 6.49z"/>
      </svg>
    ),
    description: 'Import PDFs and docs directly from your Drive.',
    status: 'Coming Soon'
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24">
        <path fill="#E01E5A" d="M6 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/>
        <path fill="#36C5F0" d="M15 6a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/>
        <path fill="#2EB67D" d="M18 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/>
        <path fill="#ECB22E" d="M6 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/>
      </svg>
    ),
    description: 'Index channel conversations and shared files.',
    status: 'Coming Soon'
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24">
        <path fill="currentColor" d="M4.125 3H19.875C20.496 3 21 3.504 21 4.125V19.875C21 20.496 20.496 21 19.875 21H4.125C3.504 21 3 20.496 3 19.875V4.125C3 3.504 3.504 3 4.125 3ZM16.208 17.152L17.144 16.216V6.786L16.208 5.85H15.272L9.208 5.85H8.272L7.336 6.786V16.216L8.272 17.152H16.208ZM15.272 15.28H9.208V7.72H15.272V15.28Z"/>
      </svg>
    ),
    description: 'Sync your workspace pages and databases.',
    status: 'Coming Soon'
  }
];

export default function ConnectorsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl bg-white/95 backdrop-blur-2xl border border-white rounded-[32px] shadow-2xl p-8 relative overflow-hidden"
        >
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connectors</h2>
          <p className="text-sm text-gray-500 mb-8">
            Integrate DocMind with your existing tools to automatically sync and index knowledge.
          </p>

          <div className="space-y-4">
            {CONNECTORS.map((connector) => (
              <div
                key={connector.id}
                className="flex items-center gap-5 p-5 rounded-[24px] border bg-gray-50 border-gray-100 hover:bg-white hover:border-gray-200 transition-all"
              >
                <div className="p-3 bg-white shadow-sm rounded-2xl">
                  {connector.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{connector.name}</h3>
                    <span className="text-[0.65rem] font-bold uppercase tracking-widest px-2 py-0.5 bg-gray-200 text-gray-500 rounded-full">
                      {connector.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {connector.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-[24px] text-center">
            <p className="text-sm font-medium text-blue-600">
              Want to suggest a connector? 
              <button className="ml-1 underline font-bold">Contact Support</button>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
