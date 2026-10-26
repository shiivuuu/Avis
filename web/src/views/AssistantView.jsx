import React, { useRef, useState, useEffect } from 'react';
import { Send, Mic, Volume2, Cloud, Settings, Loader2 } from 'lucide-react';
import { tts } from '../utils/tts';
import { speechInput } from '../utils/speechInput';

export default function AssistantView() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [question, setQuestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [answer, setAnswer] = useState('');
  const [statusMessage, setStatusMessage] = useState('Ask a question about your visual surroundings.');
  const [backendUrl, setBackendUrl] = useState(() => {
    return localStorage.getItem('avis_backend_url') || 'http://localhost:3001';
  });
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    let stream = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.warn('Camera preview error:', err);
      }
    })();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      tts.stop();
    };
  }, []);

  const handleVoicePrompt = () => {
    if (isListening) {
      speechInput.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setStatusMessage('Listening for your question...');
    tts.speak('Listening for your question.', { flush: true });

    speechInput.start({
      onResult: (text) => {
        setIsListening(false);
        setQuestion(text);
        submitQuestion(text);
      },
      onError: (err) => {
        setIsListening(false);
        setStatusMessage(err);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  };

  const submitQuestion = async (queryToUse) => {
    const q = (queryToUse || question).trim();
    if (!q) {
      const msg = 'Please enter or speak a question first.';
      setStatusMessage(msg);
      tts.speak(msg, { flush: true });
      return;
    }

    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    setStatusMessage('Capturing view and contacting AI assistant...');
    tts.speak('Analyzing your question.', { flush: true });

    // Capture still frame
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg', 0.85);

    try {
      const endpoint = `${backendUrl.replace(/\/+$/, '')}/api/ask`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          image: base64Image
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Server responded with ${response.status}`);
      }

      setAnswer(data.answer);
      setStatusMessage('Answer received.');
      tts.speak(data.answer, { flush: true, deduplicate: false });
    } catch (err) {
      console.error('Assistant error:', err);
      const errMsg = `Could not reach AI assistant: ${err.message}. (Local navigation and OCR remain fully functional).`;
      setStatusMessage(errMsg);
      tts.speak(`Assistant could not answer. ${err.message}`, { flush: true });
    } finally {
      setIsProcessing(false);
    }
  };

  const saveBackendUrl = (url) => {
    setBackendUrl(url);
    localStorage.setItem('avis_backend_url', url);
    setShowConfig(false);
    tts.speak('Backend URL saved.', { flush: true });
  };

  return (
    <div className="space-y-4 max-w-md mx-auto p-4">
      {/* Viewfinder */}
      <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border-2 border-[#DDD5C7] shadow-inner flex items-center justify-center">
        <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {isProcessing && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white gap-2 p-4 text-center">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-base font-bold">Contacting multimodal assistant...</p>
          </div>
        )}
      </div>

      {/* Voice Query Button */}
      {speechInput.isAvailable() && (
        <button
          onClick={handleVoicePrompt}
          aria-label="Speak question using microphone"
          className={`w-full min-h-[64px] font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-md transition-colors ${
            isListening ? 'bg-[#931A08] text-white animate-pulse' : 'bg-[#2D6A4F] text-white active:bg-[#1B4332]'
          }`}
        >
          <Mic size={24} />
          <span>{isListening ? 'LISTENING... (TAP TO STOP)' : 'SPEAK QUESTION'}</span>
        </button>
      )}

      {/* Text Question Input Row */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitQuestion();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., What color is this shirt? Is there a chair?"
          className="flex-1 bg-white border-2 border-[#DDD5C7] focus:border-[#1B4332] rounded-xl px-4 py-3 text-base text-[#111613] placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={isProcessing}
          aria-label="Send question"
          className="w-14 h-14 bg-[#1B4332] text-white rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition-transform"
        >
          <Send size={20} />
        </button>
      </form>

      {/* Status feedback */}
      <div className="bg-[#F4EFE6] border border-[#DDD5C7] rounded-xl p-3 text-sm font-semibold text-[#111613]" aria-live="polite">
        {statusMessage}
      </div>

      {/* AI Answer Card */}
      {answer && (
        <div className="bg-white border-2 border-[#1B4332] rounded-2xl p-4 shadow-sm space-y-3" aria-live="assertive">
          <span className="text-xs font-black uppercase tracking-wider text-[#1B4332] block">
            AI Assistant Answer
          </span>
          <p className="text-base text-[#111613] leading-relaxed">
            {answer}
          </p>
          <button
            onClick={() => tts.speak(answer, { flush: true, deduplicate: false })}
            className="w-full min-h-[50px] bg-[#1B4332] text-white font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <Volume2 size={18} />
            <span>READ ANSWER ALOUD</span>
          </button>
        </div>
      )}

      {/* Server Config Settings */}
      <div className="bg-[#F7F2E7] border border-[#DDD5C7] rounded-xl p-3 text-xs text-[#536257] space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold flex items-center gap-1.5 text-[#1B4332]">
            <Cloud size={14} />
            Backend: {backendUrl}
          </span>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-xs font-bold text-[#1B4332] underline flex items-center gap-1"
          >
            <Settings size={12} />
            {showConfig ? 'Hide' : 'Configure'}
          </button>
        </div>

        {showConfig && (
          <div className="pt-2 space-y-2">
            <input
              type="text"
              defaultValue={backendUrl}
              id="backendUrlInput"
              placeholder="e.g. https://your-backend.onrender.com"
              className="w-full bg-white border border-[#DDD5C7] rounded-lg px-2.5 py-1.5 text-xs text-[#111613]"
            />
            <button
              onClick={() => {
                const val = document.getElementById('backendUrlInput')?.value;
                if (val) saveBackendUrl(val);
              }}
              className="px-3 py-1.5 bg-[#1B4332] text-white font-bold rounded-lg text-xs"
            >
              Save Server URL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
