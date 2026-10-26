import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  Upload,
  AlertCircle,
  Sun,
  Moon,
  CheckCircle2,
  XCircle,
  SwitchCamera
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function CameraWorkspace({
  onCapture,
  onCancel,
  isProcessing = false,
  captureButtonText = 'Capture Image',
  showQualityFeedback = true,
  className = ''
}) {
  const { announce } = useApp();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [hasPermission, setHasPermission] = useState(null); // null = unknown, true = granted, false = denied
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [capturedImage, setCapturedImage] = useState(null);
  const [qualityWarning, setQualityWarning] = useState(null);
  const [streamReady, setStreamReady] = useState(false);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    setQualityWarning(null);
    try {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreamReady(true);
        setHasPermission(true);
        announce('Camera stream active. Point camera at scene or document.');
      }
    } catch (err) {
      console.warn('Camera initialization error:', err);
      setHasPermission(false);
      announce('Camera access failed or denied. You can upload an image instead.');
    }
  }, [facingMode, announce]);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [startCamera]);

  // Flip between rear and front camera
  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Analyze image quality: brightness and contrast
  const analyzeQuality = (ctx, width, height) => {
    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      let totalLuminance = 0;
      const step = 4 * 16; // Sample every 16th pixel for speed
      let samples = 0;

      for (let i = 0; i < data.length; i += step) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Relative luminance formula
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuminance += lum;
        samples++;
      }

      const avgLuminance = totalLuminance / samples;

      if (avgLuminance < 45) {
        return {
          type: 'dark',
          message: 'Lighting is low. Consider turning on a room light for clearer text and vision.'
        };
      } else if (avgLuminance > 225) {
        return {
          type: 'bright',
          message: 'Very bright glare detected. Angle camera slightly away from direct lights.'
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // Perform Capture
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (showQualityFeedback) {
      const warning = analyzeQuality(ctx, canvas.width, canvas.height);
      setQualityWarning(warning);
      if (warning) {
        announce(warning.message, 'assertive');
      }
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);

    if (onCapture) {
      onCapture(dataUrl);
    }
  };

  // Handle local image file upload fallback
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        setCapturedImage(dataUrl);
        setQualityWarning(null);
        announce('Image uploaded successfully.');
        if (onCapture) onCapture(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setQualityWarning(null);
    if (onCancel) onCancel();
    startCamera();
  };

  return (
    <div className={`space-y-3 ${className}`} role="region" aria-label="Camera Workspace">
      {/* Viewfinder Frame */}
      <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border-2 border-[#DDD8CB] shadow-inner flex items-center justify-center">
        {/* Hidden Canvas for Still Extraction */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Live Video Feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${!capturedImage && hasPermission ? 'block' : 'hidden'}`}
        />

        {/* Captured Still Preview */}
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured viewpoint for visual analysis"
            className="w-full h-full object-contain bg-black"
          />
        )}

        {/* Permission Denied / Error State */}
        {hasPermission === false && !capturedImage && (
          <div className="p-6 text-center text-white space-y-3 max-w-sm">
            <XCircle size={40} className="mx-auto text-[#E57373]" />
            <h3 className="font-black text-lg">Camera Access Needed</h3>
            <p className="text-xs text-gray-300">
              Avis needs camera access to describe your surroundings and read documents.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={startCamera}
                className="w-full min-h-[48px] bg-[#204C3A] text-white font-bold text-sm rounded-xl"
              >
                Try Camera Again
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[48px] bg-[#EFECE2] text-[#202821] font-bold text-sm rounded-xl"
              >
                Upload Photo Instead
              </button>
            </div>
          </div>
        )}

        {/* Camera Switch Button (Top Right of Viewfinder) */}
        {!capturedImage && hasPermission && (
          <button
            onClick={toggleFacingMode}
            aria-label="Switch between front and back camera"
            className="absolute top-3 right-3 p-2.5 rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 transition-all focus-visible:ring-2 focus-visible:ring-white"
          >
            <SwitchCamera size={20} />
          </button>
        )}
      </div>

      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        aria-hidden="true"
      />

      {/* Image Quality Warning Pill */}
      {qualityWarning && (
        <div
          role="status"
          className="bg-[#FFF9E6] border border-[#FFE082] text-[#855A0B] p-3 rounded-xl flex items-start gap-2.5 text-xs font-semibold"
        >
          {qualityWarning.type === 'dark' ? <Moon size={18} className="shrink-0 mt-0.5" /> : <Sun size={18} className="shrink-0 mt-0.5" />}
          <span>{qualityWarning.message}</span>
        </div>
      )}

      {/* Action Buttons: Capture / Retake / Upload */}
      {!capturedImage ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <button
            onClick={handleCapture}
            disabled={!streamReady || isProcessing}
            aria-label={captureButtonText}
            className="sm:col-span-3 min-h-[58px] bg-[#204C3A] active:bg-[#163A2C] disabled:opacity-50 text-white font-black text-base rounded-2xl flex items-center justify-center gap-2.5 shadow-md transition-all focus-visible:ring-2 focus-visible:ring-[#204C3A]"
          >
            <Camera size={22} />
            <span>{captureButtonText}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            aria-label="Upload an image from device files"
            className="sm:col-span-1 min-h-[58px] bg-[#EFECE2] border-2 border-[#DDD8CB] text-[#202821] active:bg-[#E5DFD1] font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-[#204C3A]"
          >
            <Upload size={18} />
            <span>Upload</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleRetake}
            disabled={isProcessing}
            aria-label="Retake photo"
            className="min-h-[56px] bg-[#204C3A] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw size={18} />
            <span>Retake Photo</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            aria-label="Upload different photo"
            className="min-h-[56px] bg-[#EFECE2] border-2 border-[#DDD8CB] text-[#202821] font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <Upload size={18} />
            <span>Upload Other</span>
          </button>
        </div>
      )}
    </div>
  );
}
