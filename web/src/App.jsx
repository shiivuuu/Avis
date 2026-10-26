import React, { useState } from 'react';
import StatusHeader from './components/StatusHeader';
import NavigationView from './views/NavigationView';
import DocumentView from './views/DocumentView';
import AssistantView from './views/AssistantView';
import { tts } from './utils/tts';

export default function App() {
  const [currentMode, setCurrentMode] = useState('navigation');
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);

  const handleModeChange = (mode) => {
    tts.stop();
    setCurrentMode(mode);
    const modeName = mode === 'navigation' ? 'Navigation' : mode === 'document' ? 'Document Reader' : 'AI Assistant';
    tts.speak(`Switched to ${modeName} mode.`, { flush: true });

    if ('vibrate' in navigator) {
      navigator.vibrate(40);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#111613] flex flex-col font-sans">
      <StatusHeader
        currentMode={currentMode}
        onModeChange={handleModeChange}
        cameraActive={cameraActive}
        micActive={micActive}
        backendConnected={backendConnected}
      />

      <main className="flex-1 pb-8">
        {currentMode === 'navigation' && <NavigationView onCameraStateChange={setCameraActive} />}
        {currentMode === 'document' && <DocumentView onCameraStateChange={setCameraActive} />}
        {currentMode === 'assistant' && <AssistantView onCameraStateChange={setCameraActive} />}
      </main>
    </div>
  );
}
