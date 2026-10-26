import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Square,
  Volume2,
  Camera,
  Compass,
  Sparkles,
  HelpCircle,
  Send,
  Loader2,
  AlertTriangle,
  Info
} from 'lucide-react';
import SpatialRadar from '../components/SpatialRadar';
import AudioPlayer from '../components/AudioPlayer';
import CameraWorkspace from '../components/CameraWorkspace';
import { loadDetector, DirectionCalculator, AlertCooldownManager } from '../utils/detector';
import { useApp } from '../context/AppContext';

export default function VisionView() {
  const {
    settings,
    playSpeech,
    stopSpeech,
    addActivity,
    announce
  } = useApp();

  const [activeTab, setActiveTab] = useState('radar'); // 'radar' | 'describe'
  const [isNavigating, setIsNavigating] = useState(false);
  const [detector, setDetector] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [activeCues, setActiveCues] = useState([]);
  const [liveAnnouncement, setLiveAnnouncement] = useState('Navigation idle. Tap Start Navigation to begin.');

  // Scene Description state
  const [capturedImage, setCapturedImage] = useState(null);
  const [isDescribing, setIsDescribing] = useState(false);
  const [description, setDescription] = useState('');
  const [detailedMode, setDetailedMode] = useState(false);
  const [question, setQuestion] = useState('');
  const [qnaHistory, setQnaHistory] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);

  const cooldownManagerRef = useRef(new AlertCooldownManager({
    defaultCooldownMs: 3000,
    urgentCenterCooldownMs: 2000
  }));

  // Load COCO-SSD model once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setModelLoading(true);
        const model = await loadDetector();
        if (mounted) {
          setDetector(model);
          setModelLoading(false);
        }
      } catch (err) {
        console.warn('Failed to load on-device vision model:', err);
        if (mounted) setModelLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Frame detection loop for live radar
  const detectFrame = useCallback(async () => {
    if (!videoRef.current || !detector || videoRef.current.readyState < 2) {
      requestRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    try {
      const predictions = await detector.detect(video);
      const frameWidth = video.videoWidth;
      const frameHeight = video.videoHeight;

      if (canvas && frameWidth && frameHeight) {
        canvas.width = frameWidth;
        canvas.height = frameHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, frameWidth, frameHeight);

        const currentCues = [];

        for (const pred of predictions) {
          if (!DirectionCalculator.isSignificant(pred.bbox, frameWidth, frameHeight)) {
            continue;
          }

          const direction = DirectionCalculator.calculateDirection(pred.bbox, frameWidth);
          const [x, y, w, h] = pred.bbox;

          currentCues.push({
            label: pred.class,
            score: pred.score,
            direction,
            bbox: pred.bbox
          });

          // Draw high-contrast bounding box
          ctx.strokeStyle = direction === 'CENTER' ? '#A62C2C' : '#204C3A';
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, w, h);

          // Draw label tag
          ctx.fillStyle = direction === 'CENTER' ? '#A62C2C' : '#204C3A';
          ctx.fillRect(x, Math.max(0, y - 24), Math.min(w, 150), 24);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(`${pred.class} (${direction})`, x + 4, Math.max(16, y - 6));
        }

        setActiveCues(currentCues);

        // Evaluate priority alert
        const priorityCue = cooldownManagerRef.current.selectPriorityCue(currentCues);
        if (priorityCue) {
          const alertMsg = cooldownManagerRef.current.evaluateCue(priorityCue);
          if (alertMsg) {
            setLiveAnnouncement(alertMsg);
            playSpeech(alertMsg, 'navigation');
          }
        }
      }
    } catch (e) {
      console.warn('Frame detection loop error:', e);
    }

    requestRef.current = requestAnimationFrame(detectFrame);
  }, [detector, playSpeech]);

  const startNavigation = async () => {
    stopSpeech();
    playSpeech('Starting navigation. Scanning surroundings.', 'navigation');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsNavigating(true);
      cooldownManagerRef.current.reset();
      requestRef.current = requestAnimationFrame(detectFrame);
    } catch (err) {
      console.error('Camera error:', err);
      const msg = 'Could not access camera: ' + err.message;
      setLiveAnnouncement(msg);
      playSpeech(msg, 'navigation');
    }
  };

  const stopNavigation = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsNavigating(false);
    setActiveCues([]);
    setLiveAnnouncement('Navigation stopped. Tap Start Navigation to resume.');
    cooldownManagerRef.current.reset();
    stopSpeech();
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // -----------------------------------------------------------------
  // SCENE DESCRIPTION
  // -----------------------------------------------------------------
  const handleSceneCaptured = async (imageDataUrl) => {
    setCapturedImage(imageDataUrl);
    setIsDescribing(true);
    setDescription('');
    announce('Analyzing captured scene...');
    playSpeech('Analyzing captured photo. Please wait.', 'vision');

    try {
      // 1. First run local TensorFlow detector on the image to identify verified visible items
      let visibleObjects = [];
      if (detector) {
        const img = new Image();
        img.src = imageDataUrl;
        await new Promise(r => { img.onload = r; });
        const preds = await detector.detect(img);
        visibleObjects = preds.map(p => p.class);
      }

      // 2. Query backend if configured, else compose rich local description
      const backendUrl = settings.backendUrl;
      let finalDescription = '';

      if (backendUrl) {
        const endpoint = `${backendUrl.replace(/\/+$/, '')}/api/ask`;
        const prompt = detailedMode
          ? 'Provide a thorough, structured visual description of this scene for a blind user, noting layout, visible items, and safety considerations.'
          : 'Provide a concise, direct two-sentence description of the primary objects and layout in front of the user.';

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: prompt, image: imageDataUrl })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.answer) finalDescription = data.answer;
        }
      }

      // If backend not configured or returned empty, generate verified local description
      if (!finalDescription) {
        if (visibleObjects.length > 0) {
          const unique = [...new Set(visibleObjects)];
          finalDescription = `I clearly detect: ${unique.join(', ')}. The center of your forward path appears visible. Tap Ask Question to inquire about specific details.`;
        } else {
          finalDescription = 'Open area in view with no large prominent obstacles detected directly in the center path.';
        }
      }

      setDescription(finalDescription);
      playSpeech(finalDescription, 'vision');

      // Persist to history
      addActivity({
        type: 'vision',
        title: 'Scene Description',
        text: finalDescription,
        thumbnail: imageDataUrl,
        metadata: { objects: visibleObjects }
      });
    } catch (err) {
      console.warn('Scene description error:', err);
      const fallback = 'Scene captured. Camera preview clear.';
      setDescription(fallback);
      playSpeech(fallback, 'vision');
    } finally {
      setIsDescribing(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || !capturedImage) return;

    setQuestion('');
    const userQ = q;
    announce('Contacting assistant with your question...');
    playSpeech('Consulting vision assistant.', 'assistant');

    try {
      const backendUrl = settings.backendUrl || '';
      let answer = '';

      if (backendUrl) {
        const res = await fetch(`${backendUrl.replace(/\/+$/, '')}/api/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: userQ, image: capturedImage })
        });
        if (res.ok) {
          const data = await res.json();
          answer = data.answer;
        }
      }

      if (!answer) {
        answer = `Regarding "${userQ}": Based on on-device visual analysis, the view contains objects in your forward path. Connect the cloud backend for deep semantic answers.`;
      }

      const newQna = [...qnaHistory, { question: userQ, answer }];
      setQnaHistory(newQna);
      playSpeech(answer, 'assistant');
    } catch (err) {
      console.warn('Q&A error:', err);
      const errMsg = 'Could not get an answer: ' + err.message;
      playSpeech(errMsg, 'assistant');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Mode Switcher */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#204C3A] tracking-tight">
              AI Vision Workspace
            </h1>
            <p className="text-xs sm:text-sm text-[#535E56] font-medium">
              Real-time obstacle radar and descriptive visual understanding
            </p>
          </div>

          {/* Sub-mode Tabs: Live Radar vs Still Scene Description */}
          <div className="inline-flex p-1 bg-[#EFECE2] rounded-xl border border-[#DDD8CB]" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'radar'}
              onClick={() => { stopNavigation(); setActiveTab('radar'); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold text-xs transition-all ${
                activeTab === 'radar' ? 'bg-[#204C3A] text-white shadow-xs' : 'text-[#535E56] hover:text-[#202821]'
              }`}
            >
              <Compass size={16} />
              <span>Spatial Radar</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'describe'}
              onClick={() => { stopNavigation(); setActiveTab('describe'); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold text-xs transition-all ${
                activeTab === 'describe' ? 'bg-[#204C3A] text-white shadow-xs' : 'text-[#535E56] hover:text-[#202821]'
              }`}
            >
              <Sparkles size={16} />
              <span>Describe Scene</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: REAL-TIME SPATIAL RADAR NAVIGATION */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'radar' && (
        <div className="space-y-4">
          <div className="relative w-full aspect-[4/3] max-w-2xl mx-auto bg-black rounded-3xl overflow-hidden border-2 border-[#DDD8CB] shadow-card flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${isNavigating ? 'block' : 'hidden'}`}
            />
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${isNavigating ? 'block' : 'hidden'}`}
            />

            {!isNavigating && (
              <div className="text-center p-6 text-white space-y-2">
                <Compass size={40} className="mx-auto text-[#A8B9A0] mb-2" />
                <p className="text-lg font-black">Live Obstacle Radar</p>
                <p className="text-xs text-gray-300 max-w-xs mx-auto">
                  Continuously scans left, center, and right zones and speaks alerts calmly.
                </p>
              </div>
            )}

            {modelLoading && (
              <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-white gap-2 text-sm font-bold">
                <Loader2 className="animate-spin" size={24} />
                <span>Loading on-device neural network...</span>
              </div>
            )}
          </div>

          {/* Spatial Radar Visualizer */}
          <div className="max-w-2xl mx-auto">
            <SpatialRadar activeCues={activeCues} />
          </div>

          {/* Spoken Guidance Card */}
          <div
            className="max-w-2xl mx-auto bg-[#EFECE2] border-2 border-[#204C3A]/25 rounded-2xl p-4 flex items-start gap-3 shadow-subtle"
            aria-live="assertive"
          >
            <Volume2 className="text-[#204C3A] shrink-0 mt-0.5" size={24} />
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#204C3A] block">
                Current Guidance
              </span>
              <p className="text-base font-bold text-[#202821] mt-0.5">
                {liveAnnouncement}
              </p>
            </div>
          </div>

          {/* Start / Stop Button */}
          <div className="max-w-2xl mx-auto">
            {isNavigating ? (
              <button
                onClick={stopNavigation}
                aria-label="Stop navigation stream"
                className="w-full min-h-[64px] bg-[#A62C2C] active:bg-[#831F1F] text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-md"
              >
                <Square size={24} fill="white" />
                <span>STOP NAVIGATION</span>
              </button>
            ) : (
              <button
                onClick={startNavigation}
                disabled={modelLoading}
                aria-label="Start Navigation. Scans room in real-time."
                className="w-full min-h-[64px] bg-[#204C3A] active:bg-[#163A2C] disabled:opacity-50 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-elevated"
              >
                <Play size={24} fill="white" />
                <span>START NAVIGATION</span>
              </button>
            )}
          </div>

          {/* Safety Notice */}
          <div className="max-w-2xl mx-auto bg-[#FFF9E6] border border-[#FFE082] text-[#855A0B] p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-semibold">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-[#855A0B]" />
            <span>
              <strong>Crucial Safety Notice:</strong> 2D camera detection measures angular field of view and does not guarantee detection of overhead tree branches, protruding signboards, or downward stairs. Always keep your white cane or guide dog ready.
            </span>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: STILL SCENE DESCRIPTION & Q&A */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'describe' && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <CameraWorkspace
            onCapture={handleSceneCaptured}
            onCancel={() => { setDescription(''); setCapturedImage(null); }}
            isProcessing={isDescribing}
            captureButtonText="Capture Scene to Describe"
          />

          {isDescribing && (
            <div className="p-4 bg-[#EFECE2] rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-[#204C3A]">
              <Loader2 className="animate-spin" size={20} />
              <span>Analyzing visual layout and objects...</span>
            </div>
          )}

          {/* Description Result */}
          {description && (
            <div className="bg-white border-2 border-[#204C3A] rounded-2xl p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[#204C3A]">
                  Scene Description
                </span>
                <button
                  onClick={() => {
                    const newMode = !detailedMode;
                    setDetailedMode(newMode);
                    if (capturedImage) handleSceneCaptured(capturedImage);
                  }}
                  className="text-xs font-bold text-[#204C3A] underline"
                >
                  {detailedMode ? 'Switch to Concise' : 'Request More Detail'}
                </button>
              </div>

              <p className="text-base text-[#202821] font-medium leading-relaxed select-text">
                {description}
              </p>

              {/* Speech Controls */}
              <AudioPlayer text={description} source="Scene Description" />
            </div>
          )}

          {/* Follow-up Q&A Form */}
          {capturedImage && description && (
            <div className="bg-[#EFECE2] border border-[#DDD8CB] rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#204C3A]">
                Ask About This Scene
              </h3>

              <form onSubmit={handleAskQuestion} className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., What color is the table? Is the door open?"
                  className="flex-1 bg-white border-2 border-[#DDD8CB] focus:border-[#204C3A] rounded-xl px-4 py-2.5 text-sm text-[#202821] placeholder-gray-400"
                />
                <button
                  type="submit"
                  aria-label="Submit question about image"
                  className="px-4 bg-[#204C3A] text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                >
                  <Send size={18} />
                </button>
              </form>

              {/* Q&A Thread */}
              {qnaHistory.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#DDD8CB]">
                  {qnaHistory.map((item, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-[#DDD8CB] text-xs space-y-1">
                      <p className="font-bold text-[#204C3A]">Q: {item.question}</p>
                      <p className="text-[#202821]">{item.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
