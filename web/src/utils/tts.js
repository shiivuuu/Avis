/**
 * Web SpeechSynthesis wrapper with queuing, deduplication, and flush priority.
 */
class TtsService {
  constructor() {
    this.lastSpokenText = '';
    this.lastSpokenTime = 0;
    this.deduplicationWindowMs = 2500;
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  }

  speak(text, { flush = false, deduplicate = true, rate = 1.05 } = {}) {
    if (!this.synth || !text || !text.trim()) return;

    const now = Date.now();
    const cleanText = text.trim();

    if (deduplicate && cleanText.toLowerCase() === this.lastSpokenText.toLowerCase() && (now - this.lastSpokenTime) < this.deduplicationWindowMs) {
      return;
    }

    if (flush) {
      this.synth.cancel();
    }

    this.lastSpokenText = cleanText;
    this.lastSpokenTime = now;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate;
    utterance.pitch = 1.0;
    
    // Pick standard English voice if available
    const voices = this.synth.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && !v.localService) || voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  isSpeaking() {
    return Boolean(this.synth && this.synth.speaking);
  }
}

export const tts = new TtsService();
