import React, { useRef, useState, useEffect } from 'react';
import { Camera, Volume2, Square, RefreshCw, Trash2, Mic, Loader2 } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { tts } from '../utils/tts';
import { speechInput } from '../utils/speechInput';

export default function DocumentView() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [streamActive, setStreamActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [statusMessage, setStatusMessage] = useState('Position document in camera view and tap Capture.');
  const [isReading, setIsReading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Start camera preview on mount
  useEffect(() => {
    let currentStream = null;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
        currentStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setStreamActive(true);
        }
      } catch (err) {
        console.error('Document camera preview error:', err);
        setStatusMessage('Could not open camera preview: ' + err.message);
      }
    })();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
      }
      tts.stop();
    };
  }, []);

  const captureAndRead = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    tts.speak('Capturing photo. Please hold steady.', { flush: true });
    setIsProcessing(true);
    setStatusMessage('Capturing high-resolution photo...');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(dataUrl);

    setStatusMessage('Analyzing document with on-device OCR...');

    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(dataUrl);
      await worker.terminate();

      const text = ret.data.text.trim();
      const lines = text ? text.split('\n').filter(l => l.trim().length > 0) : [];

      if (!text) {
        const feedback = 'No legible text detected. Please hold camera flat with good lighting and retry.';
        setStatusMessage(feedback);
        tts.speak(feedback, { flush: true });
        setIsProcessing(false);
        return;
      }

      setRecognizedText(text);
      const summary = `Text recognized. ${lines.length} lines found. Tap Read Aloud to listen.`;
      setStatusMessage(summary);
      tts.speak(summary, { flush: true });
    } catch (err) {
      console.error('OCR Error:', err);
      const errMsg = 'Error processing text: ' + err.message;
      setStatusMessage(errMsg);
      tts.speak(errMsg, { flush: true });
    } finally {
      setIsProcessing(false);
    }
  };

  const readAloud = () => {
    if (!recognizedText) return;
    setIsReading(true);
    tts.speak(recognizedText, { flush: true, deduplicate: false });
  };

  const stopReading = () => {
    tts.stop();
    setIsReading(false);
  };

  const clearDocument = () => {
    tts.stop();
    setCapturedImage(null);
    setRecognizedText('');
    setIsReading(false);
    setStatusMessage('Position document in camera view and tap Capture.');
  };

  const handleVoiceCommand = () => {
    if (isListening) {
      speechInput.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    tts.speak('Listening for command.', { flush: true });

    speechInput.start({
      onResult: (text) => {
        setIsListening(false);
        const lower = text.toLowerCase();
        if (lower.includes('read') || lower.includes('speak')) {
          readAloud();
        } else if (lower.includes('capture') || lower.includes('take')) {
          captureAndRead();
        } else if (lower.includes('clear') || lower.includes('reset')) {
          clearDocument();
        } else {
          tts.speak(`Heard: ${text}. Say Read, Capture, or Clear.`);
        }
      },
      onError: (err) => {
        setIsListening(false);
        tts.speak(err);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  };

  return (
    <div className="space-y-4 max-w-md mx-auto p-4">
      {/* Viewfinder or Captured Still Image */}
      <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border-2 border-[#DDD5C7] shadow-inner flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${!capturedImage ? 'block' : 'hidden'}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured document"
            className="w-full h-full object-contain bg-black"
          />
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white gap-2 p-4 text-center">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-base font-bold">Extracting text locally...</p>
          </div>
        )}
      </div>

      {/* Primary Capture / Retake Controls */}
      {!capturedImage ? (
        <button
          onClick={captureAndRead}
          disabled={isProcessing}
          aria-label="Capture Document. Takes a photo and runs text recognition."
          className="w-full min-h-[64px] bg-[#1B4332] active:bg-[#143225] disabled:opacity-50 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-md"
        >
          <Camera size={26} />
          <span>CAPTURE DOCUMENT</span>
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={captureAndRead}
            disabled={isProcessing}
            className="min-h-[56px] bg-[#1B4332] text-white font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            <span>RETAKE</span>
          </button>
          <button
            onClick={clearDocument}
            className="min-h-[56px] bg-[#931A08] text-white font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <Trash2 size={18} />
            <span>CLEAR</span>
          </button>
        </div>
      )}

      {/* Read Aloud Controls */}
      {recognizedText && (
        isReading ? (
          <button
            onClick={stopReading}
            className="w-full min-h-[60px] bg-[#931A08] text-white font-black text-base rounded-2xl flex items-center justify-center gap-2"
          >
            <Square size={20} />
            <span>STOP READING</span>
          </button>
        ) : (
          <button
            onClick={readAloud}
            className="w-full min-h-[60px] bg-[#2D6A4F] text-white font-black text-base rounded-2xl flex items-center justify-center gap-2"
          >
            <Volume2 size={22} />
            <span>READ ALOUD</span>
          </button>
        )
      )}

      {/* Voice Command Button */}
      {speechInput.isAvailable() && (
        <button
          onClick={handleVoiceCommand}
          className={`w-full min-h-[52px] rounded-xl font-bold flex items-center justify-center gap-2 border ${
            isListening ? 'bg-[#931A08] text-white animate-pulse' : 'bg-[#EFE9DC] text-[#1B4332] border-[#DDD5C7]'
          }`}
        >
          <Mic size={18} />
          <span>{isListening ? 'Listening for Command...' : 'Voice Command (Read/Retake)'}</span>
        </button>
      )}

      {/* Status Feedback */}
      <div className="bg-[#F4EFE6] border border-[#DDD5C7] rounded-xl p-3 text-sm font-semibold text-[#111613]" aria-live="polite">
        {statusMessage}
      </div>

      {/* Recognized Text Card */}
      {recognizedText && (
        <div className="bg-white border-2 border-[#1B4332]/40 rounded-2xl p-4 shadow-sm space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-[#1B4332] block">
            Recognized Text
          </span>
          <div className="text-base text-[#111613] leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap select-text">
            {recognizedText}
          </div>
        </div>
      )}
    </div>
  );
}
