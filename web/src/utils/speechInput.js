/**
 * Web Speech Recognition wrapper (WebKitSpeechRecognition / SpeechRecognition)
 */
class SpeechInputService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  isAvailable() {
    return Boolean(this.recognition);
  }

  start({ onResult, onError, onEnd }) {
    if (!this.recognition) {
      onError?.('Voice recognition is not supported in this browser. Please use text input.');
      return;
    }

    try {
      this.recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          onResult?.(transcript);
        }
      };

      this.recognition.onerror = (event) => {
        onError?.(`Voice error: ${event.error}`);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd?.();
      };

      this.recognition.start();
      this.isListening = true;
    } catch (err) {
      onError?.(err.message);
      this.isListening = false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (_) {}
      this.isListening = false;
    }
  }
}

export const speechInput = new SpeechInputService();
