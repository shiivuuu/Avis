import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Square, Volume2, Info, Loader2 } from 'lucide-react';
import SpatialRadar from '../components/SpatialRadar';
import { loadDetector, DirectionCalculator, AlertCooldownManager } from '../utils/detector';
import { tts } from '../utils/tts';

export default function NavigationView() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);

  const [isNavigating, setIsNavigating] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [detector, setDetector] = useState(null);
  const [activeCues, setActiveCues] = useState([]);
  const [lastAnnouncement, setLastAnnouncement] = useState('Navigation idle. Tap Start Navigation to begin.');
  const [cameraError, setCameraError] = useState(null);

  const cooldownManagerRef = useRef(new AlertCooldownManager({
    defaultCooldownMs: 3000,
    urgentCenterCooldownMs: 2000
  }));

  // Pre-load detector model
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
        console.error('Failed to load TensorFlow COCO-SSD model:', err);
        if (mounted) {
          setModelLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Frame detection loop
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
          ctx.strokeStyle = direction === 'CENTER' ? '#931A08' : '#1B4332';
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, w, h);

          // Draw label badge
          ctx.fillStyle = direction === 'CENTER' ? '#931A08' : '#1B4332';
          ctx.fillRect(x, Math.max(0, y - 24), Math.min(w, 140), 24);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText(`${pred.class} (${direction})`, x + 4, Math.max(16, y - 6));
        }

        setActiveCues(currentCues);

        // Evaluate priority announcement
        const priorityCue = cooldownManagerRef.current.selectPriorityCue(currentCues);
        if (priorityCue) {
          const alertMsg = cooldownManagerRef.current.evaluateCue(priorityCue);
          if (alertMsg) {
            setLastAnnouncement(alertMsg);
            tts.speak(alertMsg, { flush: false, deduplicate: true });
          }
        }
      }
    } catch (e) {
      console.warn('Inference error:', e);
    }

    requestRef.current = requestAnimationFrame(detectFrame);
  }, [detector]);

  const startNavigation = async () => {
    setCameraError(null);
    tts.speak('Starting navigation. Scanning surroundings.', { flush: true });

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
        videoRef.current.play();
      }

      setIsNavigating(true);
      cooldownManagerRef.current.reset();
      requestRef.current = requestAnimationFrame(detectFrame);
    } catch (err) {
      console.error('Camera access failed:', err);
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please grant camera access in browser settings.'
        : `Camera error: ${err.message}`;
      setCameraError(msg);
      tts.speak(msg, { flush: true });
    }
  };

  const stopNavigation = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsNavigating(false);
    setActiveCues([]);
    setLastAnnouncement('Navigation stopped. Tap Start Navigation to resume.');
    cooldownManagerRef.current.reset();
    tts.speak('Navigation stopped.', { flush: true });
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-4 max-w-md mx-auto p-4">
      {/* Video Viewfinder & Canvas Overlay */}
      <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border-2 border-[#DDD5C7] shadow-inner flex items-center justify-center">
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
            <p className="text-lg font-bold">Camera Standby</p>
            <p className="text-xs text-gray-300">Tap the large button below to activate real-time obstacle guidance</p>
          </div>
        )}

        {modelLoading && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white gap-2">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-sm font-semibold">Loading on-device vision model...</span>
          </div>
        )}
      </div>

      {cameraError && (
        <div className="p-3 bg-[#FBE8E5] border border-[#931A08] text-[#931A08] rounded-xl text-sm font-bold" role="alert">
          {cameraError}
        </div>
      )}

      {/* Spatial Radar */}
      <SpatialRadar activeCues={activeCues} />

      {/* Spoken Announcement Card */}
      <div
        className="bg-[#F4EFE6] border-2 border-[#1B4332]/30 rounded-2xl p-4 flex items-start gap-3 shadow-sm"
        aria-live="assertive"
      >
        <Volume2 className="text-[#1B4332] shrink-0 mt-0.5" size={24} />
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-[#1B4332] block">
            Current Guidance
          </span>
          <p className="text-base font-bold text-[#111613] mt-0.5">
            {lastAnnouncement}
          </p>
        </div>
      </div>

      {/* Prominent Start/Stop Navigation Button */}
      {isNavigating ? (
        <button
          onClick={stopNavigation}
          aria-label="Stop Navigation. Ceases camera analysis and announcements."
          className="w-full min-h-[64px] bg-[#931A08] active:bg-[#721406] text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-md transition-transform active:scale-[0.98]"
        >
          <Square size={24} />
          <span>STOP NAVIGATION</span>
        </button>
      ) : (
        <button
          onClick={startNavigation}
          disabled={modelLoading}
          aria-label="Start Navigation. Activates camera and real-time obstacle announcements."
          className="w-full min-h-[64px] bg-[#1B4332] active:bg-[#143225] disabled:opacity-50 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-md transition-transform active:scale-[0.98]"
        >
          <Play size={24} />
          <span>START NAVIGATION</span>
        </button>
      )}

      {/* Safety Notice */}
      <div className="bg-[#F7F2E7] border border-[#DDD5C7] rounded-xl p-3 flex items-start gap-2 text-xs text-[#536257]">
        <Info size={16} className="text-[#856404] shrink-0 mt-0.5" />
        <p>
          <strong>Safety Notice:</strong> generic camera object detection does not guarantee detection of overhead hazards (branches, signs) or drop-offs. Always rely primarily on your white cane or guide dog.
        </p>
      </div>
    </div>
  );
}
