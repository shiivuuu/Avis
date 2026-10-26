import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext(null);

const DEFAULT_SETTINGS = {
  textSize: 'standard', // 'standard' | 'large' | 'xl'
  highContrast: false,
  reducedMotion: false,
  speechRate: 1.0,
  preferredLanguage: 'en', // 'en' | 'hi' | 'gu'
  responseDetail: 'concise', // 'concise' | 'detailed'
  audioFirst: true,
  backendUrl: typeof window !== 'undefined' ? (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '') : ''
};

export function AppProvider({ children }) {
  // Navigation
  const [currentRoute, setCurrentRoute] = useState('home');

  // Settings
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('avis_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch (_) {
      return DEFAULT_SETTINGS;
    }
  });

  // Recent Activity History
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('avis_history');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  // Global Audio/Speech State
  const [audioState, setAudioState] = useState({
    isPlaying: false,
    isPaused: false,
    text: '',
    source: ''
  });

  // Live Screen Reader Announcement
  const [announcement, setAnnouncement] = useState({ message: '', priority: 'polite' });

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('avis_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }

    // Apply classes to root element
    const root = document.documentElement;
    root.classList.remove('text-size-standard', 'text-size-large', 'text-size-xl');
    root.classList.add(`text-size-${settings.textSize}`);

    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [settings]);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem('avis_history', JSON.stringify(history.slice(0, 50))); // Keep last 50
    } catch (e) {
      console.warn('Failed to save history:', e);
    }
  }, [history]);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const addActivity = useCallback((item) => {
    const entry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...item
    };
    setHistory(prev => [entry, ...prev]);
    return entry;
  }, []);

  const removeActivity = useCallback((id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // Screen reader announcer
  const announce = useCallback((message, priority = 'polite') => {
    setAnnouncement({ message, priority });
  }, []);

  // Central Audio Controls
  const playSpeech = useCallback((text, source = '') => {
    if (!('speechSynthesis' in window) || !text) return;

    window.speechSynthesis.cancel();

    const cleanText = text.trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = settings.speechRate || 1.0;

    // Pick language
    if (settings.preferredLanguage === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (settings.preferredLanguage === 'gu') {
      utterance.lang = 'gu-IN';
    } else {
      utterance.lang = 'en-US';
    }

    utterance.onstart = () => {
      setAudioState({ isPlaying: true, isPaused: false, text: cleanText, source });
    };

    utterance.onend = () => {
      setAudioState(prev => ({ ...prev, isPlaying: false, isPaused: false }));
    };

    utterance.onerror = (e) => {
      console.warn('TTS playback error:', e);
      setAudioState(prev => ({ ...prev, isPlaying: false, isPaused: false }));
    };

    window.speechSynthesis.speak(utterance);
  }, [settings.speechRate, settings.preferredLanguage]);

  const pauseSpeech = useCallback(() => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setAudioState(prev => ({ ...prev, isPaused: true, isPlaying: false }));
    }
  }, []);

  const resumeSpeech = useCallback(() => {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setAudioState(prev => ({ ...prev, isPaused: false, isPlaying: true }));
    }
  }, []);

  const stopSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setAudioState(prev => ({ ...prev, isPlaying: false, isPaused: false }));
    }
  }, []);

  const repeatSpeech = useCallback(() => {
    if (audioState.text) {
      playSpeech(audioState.text, audioState.source);
    }
  }, [audioState.text, audioState.source, playSpeech]);

  // Navigate with announcement
  const navigateTo = useCallback((route) => {
    stopSpeech();
    setCurrentRoute(route);
    const titles = {
      home: 'Home page',
      vision: 'AI Vision camera workspace',
      reader: 'Smart Reader document scanner',
      assistant: 'Voice Assistant',
      activity: 'Recent Activity history',
      settings: 'Accessibility Settings',
      help: 'Privacy and Help documentation'
    };
    announce(`Navigated to ${titles[route] || route}`);
  }, [announce, stopSpeech]);

  return (
    <AppContext.Provider
      value={{
        currentRoute,
        navigateTo,
        settings,
        updateSetting,
        history,
        addActivity,
        removeActivity,
        clearHistory,
        audioState,
        playSpeech,
        pauseSpeech,
        resumeSpeech,
        stopSpeech,
        repeatSpeech,
        announce,
        announcement
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
