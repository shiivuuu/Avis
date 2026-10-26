import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Languages,
  Loader2,
  AlertCircle,
  Volume2,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { createWorker } from 'tesseract.js';
import CameraWorkspace from '../components/CameraWorkspace';
import AudioPlayer from '../components/AudioPlayer';
import { translateText } from '../services/translator';
import { useApp } from '../context/AppContext';

export default function ReaderView() {
  const {
    settings,
    playSpeech,
    addActivity,
    announce
  } = useApp();

  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [paragraphs, setParagraphs] = useState([]);
  const [selectedParagraphIdx, setSelectedParagraphIdx] = useState(null);
  const [ocrStatus, setOcrStatus] = useState('Position document or printed text in view, then tap Capture.');
  const [targetLang, setTargetLang] = useState('en'); // 'en' | 'hi' | 'gu'
  const [translation, setTranslation] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Process captured image via Tesseract.js
  const handleImageCaptured = async (imageDataUrl) => {
    setIsOcrProcessing(true);
    setExtractedText('');
    setParagraphs([]);
    setSelectedParagraphIdx(null);
    setTranslation(null);
    setOcrStatus('Extracting text locally on device with Tesseract OCR...');
    announce('Running on-device OCR...');
    playSpeech('Scanning document for text.', 'reader');

    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(imageDataUrl);
      await worker.terminate();

      const raw = ret.data.text.trim();

      if (!raw) {
        const feedback = 'No legible text detected. Please hold the camera flat, ensure adequate room lighting, and capture again.';
        setOcrStatus(feedback);
        playSpeech(feedback, 'reader');
        return;
      }

      setExtractedText(raw);

      // Split into distinct paragraphs for selective reading
      const parsedParas = raw
        .split(/\n{2,}/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

      setParagraphs(parsedParas.length > 0 ? parsedParas : [raw]);

      const lineCount = raw.split('\n').filter(l => l.trim().length > 0).length;
      const summaryMsg = `Text recognized: ${lineCount} lines across ${parsedParas.length} paragraphs.`;
      setOcrStatus(summaryMsg);

      if (settings.audioFirst) {
        playSpeech(raw, 'reader');
      }

      // Add to persistent activity history
      addActivity({
        type: 'reader',
        title: 'Document OCR',
        text: raw,
        thumbnail: imageDataUrl,
        metadata: { lineCount, paragraphCount: parsedParas.length }
      });
    } catch (err) {
      console.error('Tesseract error:', err);
      const errMsg = 'Error extracting text: ' + err.message;
      setOcrStatus(errMsg);
      playSpeech(errMsg, 'reader');
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Translation handling
  const handleLanguageChange = async (lang) => {
    setTargetLang(lang);
    if (!extractedText || lang === 'en') {
      setTranslation(null);
      return;
    }

    setIsTranslating(true);
    announce(`Translating text to ${lang === 'hi' ? 'Hindi' : 'Gujarati'}...`);

    try {
      const result = await translateText(extractedText, lang, settings.backendUrl);
      setTranslation(result);
      if (settings.audioFirst && result.translated) {
        playSpeech(result.translated, 'reader');
      }
    } catch (err) {
      console.warn('Translation failed:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopyText = () => {
    const textToCopy = translation ? translation.translated : extractedText;
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    announce('Text copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReadParagraph = (para, index) => {
    setSelectedParagraphIdx(index);
    playSpeech(para, 'reader');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn">
      {/* Title & Introduction */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#204C3A] tracking-tight">
          Smart Reader &amp; OCR
        </h1>
        <p className="text-xs sm:text-sm text-[#535E56] font-medium">
          Capture or upload documents, labels, and signs to read aloud instantly
        </p>
      </div>

      {/* Camera Capture Workspace */}
      <CameraWorkspace
        onCapture={handleImageCaptured}
        onCancel={() => {
          setExtractedText('');
          setParagraphs([]);
          setTranslation(null);
          setOcrStatus('Position document or printed text in view, then tap Capture.');
        }}
        isProcessing={isOcrProcessing}
        captureButtonText="Scan & Read Document"
      />

      {/* Processing Loader */}
      {isOcrProcessing && (
        <div className="bg-[#EFECE2] border border-[#DDD8CB] rounded-2xl p-4 flex items-center justify-center gap-3 text-sm font-bold text-[#204C3A]">
          <Loader2 className="animate-spin text-[#204C3A]" size={22} />
          <span>Recognizing text on-device...</span>
        </div>
      )}

      {/* Status Feedback */}
      <div
        className="bg-[#EFECE2] border border-[#DDD8CB] rounded-xl p-3.5 text-xs sm:text-sm font-bold text-[#202821] flex items-center gap-2"
        aria-live="polite"
      >
        <BookOpen size={18} className="text-[#204C3A] shrink-0" />
        <span>{ocrStatus}</span>
      </div>

      {/* Reading Result View */}
      {extractedText && (
        <div className="bg-white border-2 border-[#204C3A] rounded-3xl p-5 sm:p-7 shadow-card space-y-5">
          {/* Controls Bar: Translation & Copy */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EFECE2]">
            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <Languages size={18} className="text-[#204C3A]" />
              <label htmlFor="ocrLangSelect" className="text-xs font-bold text-[#535E56]">
                Language:
              </label>
              <select
                id="ocrLangSelect"
                value={targetLang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-[#F7F5EE] border border-[#DDD8CB] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#202821] focus:ring-2 focus:ring-[#204C3A]"
              >
                <option value="en">Original (English)</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
              </select>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopyText}
              aria-label="Copy extracted text to clipboard"
              className="px-3.5 py-2 bg-[#EFECE2] hover:bg-[#E5DFD1] text-[#204C3A] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check size={16} className="text-[#1B5E20]" /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>

          {/* Central Audio Player */}
          <AudioPlayer
            text={translation ? translation.translated : extractedText}
            source="Document Reader"
          />

          {/* Translation View (if selected) */}
          {translation && translation.translated && (
            <div className="bg-[#E9EFE5] border border-[#A8B9A0] rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[#204C3A] flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Translation ({targetLang === 'hi' ? 'Hindi' : 'Gujarati'})
                </span>
                <span className="text-[11px] text-[#535E56]">Original preserved below</span>
              </div>
              <p className="text-base text-[#202821] font-medium leading-relaxed select-text">
                {translation.translated}
              </p>
            </div>
          )}

          {/* Paragraph by Paragraph Reader */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#535E56]">
                Extracted Text (Tap any paragraph to read aloud)
              </span>
              <button
                onClick={() => { setSelectedParagraphIdx(null); playSpeech(extractedText, 'reader'); }}
                className="text-xs font-bold text-[#204C3A] underline"
              >
                Read All
              </button>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {paragraphs.map((para, idx) => {
                const isSelected = selectedParagraphIdx === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => handleReadParagraph(para, idx)}
                    role="button"
                    tabIndex="0"
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleReadParagraph(para, idx); }}
                    aria-label={`Paragraph ${idx + 1}: ${para.slice(0, 40)}... Click to read aloud.`}
                    className={`p-3.5 rounded-xl border transition-all text-sm leading-relaxed cursor-pointer select-text ${
                      isSelected
                        ? 'bg-[#E9EFE5] border-[#204C3A] font-bold text-[#204C3A] ring-2 ring-[#204C3A]'
                        : 'bg-[#FDF9F4] border-[#DDD8CB] text-[#202821] hover:border-[#204C3A]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-[#535E56] font-bold mb-1">
                      <Volume2 size={12} />
                      <span>Paragraph {idx + 1}</span>
                    </div>
                    <p>{para}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* OCR Limitation Notice */}
          <div className="bg-[#FFF9E6] border border-[#FFE082] rounded-xl p-3 text-xs text-[#855A0B] flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>
              <strong>Accuracy Notice:</strong> On-device OCR works best with clear, printed type. Handwriting, curved paper, or low lighting may introduce recognition errors.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
