import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Mic,
  Square,
  Send,
  Volume2,
  Sparkles,
  Command,
  Eye,
  FileText,
  RotateCcw,
  Gauge,
  Sliders,
  HelpCircle,
  Camera,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { speechInput } from '../utils/speechInput';
import { CommandRegistry } from '../services/commandRegistry';
import AudioPlayer from '../components/AudioPlayer';
import { useApp } from '../context/AppContext';

export default function AssistantView() {
  const {
    navigateTo,
    playSpeech,
    stopSpeech,
    repeatSpeech,
    settings,
    updateSetting,
    addActivity,
    announce
  } = useApp();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [statusMessage, setStatusMessage] = useState('Tap the microphone or say a command.');
  const [answer, setAnswer] = useState('');
  const [isConsultingAi, setIsConsultingAi] = useState(false);
  const [activeCameraPreview, setActiveCameraPreview] = useState(false);

  const videoRef = useRef(null);

  // Command Registry Handlers
  const commandRegistry = useMemo(() => {
    return new CommandRegistry({
      onDescribe: () => {
        announce('Opening AI Vision to describe scene.');
        playSpeech('Opening AI Vision.', 'assistant');
        setTimeout(() => navigateTo('vision'), 600);
      },
      onReadText: () => {
        announce('Opening Smart Reader to scan text.');
        playSpeech('Opening Smart Reader.', 'assistant');
        setTimeout(() => navigateTo('reader'), 600);
      },
      onRepeat: () => {
        repeatSpeech();
      },
      onSpeakSlower: () => {
        const newRate = Math.max(0.75, (settings.speechRate || 1.0) - 0.25);
        updateSetting('speechRate', newRate);
        const msg = `Speech speed set to ${newRate}x`;
        announce(msg);
        playSpeech(msg, 'assistant');
      },
      onSpeakFaster: () => {
        const newRate = Math.min(1.75, (settings.speechRate || 1.0) + 0.25);
        updateSetting('speechRate', newRate);
        const msg = `Speech speed set to ${newRate}x`;
        announce(msg);
        playSpeech(msg, 'assistant');
      },
      onStop: () => {
        stopSpeech();
        announce('Speech stopped.');
      },
      onCapture: () => {
        announce('Navigating to Vision to capture new image.');
        navigateTo('vision');
      },
      onOpenSettings: () => {
        announce('Opening accessibility settings.');
        navigateTo('settings');
      },
      onHelp: () => {
        const helpText = 'Available voice commands: Describe my surroundings, Read this text, Repeat the answer, Speak slower, Speak faster, Stop speaking, Capture another image, or Open accessibility settings.';
        setStatusMessage(helpText);
        playSpeech(helpText, 'assistant');
      },
      onGeneralQuery: (query) => {
        handleAiQuery(query);
      }
    });
  }, [navigateTo, playSpeech, stopSpeech, repeatSpeech, settings.speechRate, updateSetting, announce]);

  // Start / Stop camera stream for visual Q&A
  useEffect(() => {
    let stream = null;
    if (activeCameraPreview) {
      (async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }
        } catch (e) {
          console.warn('Camera preview error:', e);
        }
      })();
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [activeCameraPreview]);

  // Handle voice listening
  const toggleListening = () => {
    if (isListening) {
      speechInput.stop();
      setIsListening(false);
      announce('Microphone stopped.');
      return;
    }

    stopSpeech();
    setIsListening(true);
    setStatusMessage('Listening... Speak now.');
    announce('Microphone active. Speak your command or question.');

    speechInput.start({
      onResult: (text) => {
        setIsListening(false);
        setTranscript(text);
        setStatusMessage(`Recognized: "${text}"`);
        commandRegistry.execute(text);
      },
      onError: (err) => {
        setIsListening(false);
        setStatusMessage(err);
        playSpeech(err, 'assistant');
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  };

  // General AI Query
  const handleAiQuery = async (queryText) => {
    setIsConsultingAi(true);
    announce('Consulting multimodal assistant...');
    playSpeech('Consulting vision assistant.', 'assistant');

    let base64Image = null;

    // If camera preview is active, capture frame
    if (videoRef.current && activeCameraPreview) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        base64Image = canvas.toDataURL('image/jpeg', 0.8);
      } catch (_) {}
    }

    try {
      const backendUrl = settings.backendUrl || '';
      let reply = '';

      if (backendUrl) {
        const res = await fetch(`${backendUrl.replace(/\/+$/, '')}/api/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: queryText, image: base64Image || 'data:image/jpeg;base64,' })
        });
        if (res.ok) {
          const data = await res.json();
          reply = data.answer;
        }
      }

      if (!reply) {
        reply = `You asked: "${queryText}". To receive deep multimodal answers with vision reasoning, ensure the backend service with your Gemini API key is connected.`;
      }

      setAnswer(reply);
      playSpeech(reply, 'assistant');

      addActivity({
        type: 'assistant',
        title: queryText,
        text: reply
      });
    } catch (e) {
      const err = 'Could not contact assistant: ' + e.message;
      setAnswer(err);
      playSpeech(err, 'assistant');
    } finally {
      setIsConsultingAi(false);
    }
  };

  const commandButtons = [
    { label: 'Describe surroundings', icon: Eye, action: () => commandRegistry.execute('describe surroundings') },
    { label: 'Read this text', icon: FileText, action: () => commandRegistry.execute('read this text') },
    { label: 'Repeat answer', icon: RotateCcw, action: () => commandRegistry.execute('repeat') },
    { label: 'Speak slower', icon: Gauge, action: () => commandRegistry.execute('speak slower') },
    { label: 'Speak faster', icon: Gauge, action: () => commandRegistry.execute('speak faster') },
    { label: 'Stop speaking', icon: Square, action: () => commandRegistry.execute('stop') },
    { label: 'Capture image', icon: Camera, action: () => commandRegistry.execute('capture another image') },
    { label: 'Settings', icon: Sliders, action: () => commandRegistry.execute('open accessibility settings') },
    { label: 'Help commands', icon: HelpCircle, action: () => commandRegistry.execute('help') }
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#204C3A] tracking-tight">
          Voice Assistant
        </h1>
        <p className="text-xs sm:text-sm text-[#535E56] font-medium">
          Hands-free voice navigation, reading triggers, and conversational questions
        </p>
      </div>

      {/* Main Microphone Button */}
      <div className="bg-[#EFECE2] border-2 border-[#DDD8CB] rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-card">
        <button
          onClick={toggleListening}
          aria-label={isListening ? 'Stop listening' : 'Start voice recognition'}
          aria-pressed={isListening}
          className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center shadow-elevated transition-all ${
            isListening
              ? 'bg-[#A62C2C] text-white animate-pulse ring-8 ring-[#A62C2C]/20'
              : 'bg-[#204C3A] hover:bg-[#163A2C] text-white focus-visible:ring-4 focus-visible:ring-[#204C3A]'
          }`}
        >
          {isListening ? <Square size={36} fill="white" /> : <Mic size={40} />}
        </button>

        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#204C3A] block">
            {isListening ? 'Microphone Active — Speak Now' : 'Voice Input Standby'}
          </span>
          <p className="text-base font-bold text-[#202821] mt-1">
            {statusMessage}
          </p>
        </div>

        {transcript && (
          <div className="bg-white p-3 rounded-xl border border-[#DDD8CB] text-xs font-semibold text-[#535E56]">
            Heard: <span className="text-[#202821]">"{transcript}"</span>
          </div>
        )}
      </div>

      {/* Text Question Input (Keyboard alternative) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const val = document.getElementById('assistantTextInput')?.value;
          if (val) {
            setTranscript(val);
            commandRegistry.execute(val);
            document.getElementById('assistantTextInput').value = '';
          }
        }}
        className="flex gap-2"
      >
        <input
          id="assistantTextInput"
          type="text"
          placeholder="Type any command or question (e.g. Describe my surroundings)..."
          className="flex-1 min-h-[52px] bg-white border-2 border-[#DDD8CB] focus:border-[#204C3A] rounded-xl px-4 text-sm text-[#202821] placeholder-gray-400"
        />
        <button
          type="submit"
          aria-label="Send typed command or question"
          className="px-5 bg-[#204C3A] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shrink-0"
        >
          <Send size={18} />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>

      {/* Optional Visual Context Toggle */}
      <div className="flex items-center justify-between p-3 bg-[#E9EFE5] rounded-xl border border-[#A8B9A0] text-xs">
        <span className="font-bold text-[#204C3A]">
          Attach Live Camera View to Questions
        </span>
        <button
          onClick={() => setActiveCameraPreview(!activeCameraPreview)}
          className={`px-3 py-1.5 rounded-lg font-bold ${
            activeCameraPreview ? 'bg-[#204C3A] text-white' : 'bg-[#DDD8CB] text-[#535E56]'
          }`}
        >
          {activeCameraPreview ? 'Camera Attached' : 'Enable Camera'}
        </button>
      </div>

      {activeCameraPreview && (
        <div className="relative aspect-video max-w-sm mx-auto bg-black rounded-xl overflow-hidden border">
          <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
        </div>
      )}

      {/* Assistant Answer Card */}
      {answer && (
        <div className="bg-white border-2 border-[#204C3A] rounded-3xl p-5 shadow-card space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-[#204C3A]">
            Assistant Response
          </span>
          <p className="text-base text-[#202821] font-medium leading-relaxed select-text">
            {answer}
          </p>
          <AudioPlayer text={answer} source="Assistant Response" />
        </div>
      )}

      {/* Command Registry Quick Buttons (Accessible alternative for every voice command) */}
      <section aria-labelledby="commands-title" className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#535E56]">
          <Command size={14} />
          <h2 id="commands-title">One-Tap Command Shortcuts</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {commandButtons.map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              onClick={action}
              className="min-h-[48px] p-2.5 bg-[#FFFFFF] hover:bg-[#FBF9F4] border border-[#DDD8CB] hover:border-[#204C3A] rounded-xl text-left text-xs font-bold text-[#202821] flex items-center gap-2 transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-[#204C3A]"
            >
              <Icon size={16} className="text-[#204C3A] shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
