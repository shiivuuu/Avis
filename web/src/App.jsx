import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import AppShell from './components/AppShell';
import HomeView from './views/HomeView';
import VisionView from './views/VisionView';
import ReaderView from './views/ReaderView';
import AssistantView from './views/AssistantView';
import ActivityView from './views/ActivityView';
import SettingsView from './views/SettingsView';
import HelpView from './views/HelpView';

function AppContent() {
  const { currentRoute, navigateTo, stopSpeech } = useApp();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is currently typing inside an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
      }

      const key = e.key.toUpperCase();

      if (e.code === 'Space') {
        e.preventDefault();
        stopSpeech();
        return;
      }

      switch (key) {
        case 'H':
          navigateTo('home');
          break;
        case 'V':
          navigateTo('vision');
          break;
        case 'R':
          navigateTo('reader');
          break;
        case 'A':
          navigateTo('assistant');
          break;
        case 'C':
          navigateTo('activity');
          break;
        case 'S':
          navigateTo('settings');
          break;
        case '?':
          navigateTo('help');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateTo, stopSpeech]);

  const renderActiveView = () => {
    switch (currentRoute) {
      case 'home':
        return <HomeView />;
      case 'vision':
        return <VisionView />;
      case 'reader':
        return <ReaderView />;
      case 'assistant':
        return <AssistantView />;
      case 'activity':
        return <ActivityView />;
      case 'settings':
        return <SettingsView />;
      case 'help':
        return <HelpView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <AppShell>
      {renderActiveView()}
    </AppShell>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
