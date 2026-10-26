/**
 * Command Registry for the Voice Assistant.
 * Uses pattern matching and keyword normalization to trigger actions.
 */
export class CommandRegistry {
  constructor(handlers = {}) {
    this.handlers = handlers;
  }

  setHandlers(handlers) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  execute(transcript) {
    if (!transcript || typeof transcript !== 'string') return null;

    const text = transcript.toLowerCase().trim();

    // 1. Describe surroundings / scene
    if (
      text.includes('describe') ||
      text.includes('surroundings') ||
      text.includes('what do you see') ||
      text.includes('what is in front of me') ||
      text.includes('look around')
    ) {
      this.handlers.onDescribe?.();
      return {
        matched: true,
        command: 'describe',
        feedback: 'Describing your surroundings.'
      };
    }

    // 2. Read text / scan document
    if (
      text.includes('read this') ||
      text.includes('read text') ||
      text.includes('scan document') ||
      text.includes('read document') ||
      text.includes('read page')
    ) {
      this.handlers.onReadText?.();
      return {
        matched: true,
        command: 'read_text',
        feedback: 'Opening Smart Reader to scan text.'
      };
    }

    // 3. Repeat answer
    if (
      text.includes('repeat') ||
      text.includes('say that again') ||
      text.includes('what did you say')
    ) {
      this.handlers.onRepeat?.();
      return {
        matched: true,
        command: 'repeat',
        feedback: 'Repeating previous answer.'
      };
    }

    // 4. Speak slower
    if (
      text.includes('slower') ||
      text.includes('slow down') ||
      text.includes('speak slower')
    ) {
      this.handlers.onSpeakSlower?.();
      return {
        matched: true,
        command: 'speak_slower',
        feedback: 'Decreasing speech speed.'
      };
    }

    // 5. Speak faster
    if (
      text.includes('faster') ||
      text.includes('speed up') ||
      text.includes('speak faster')
    ) {
      this.handlers.onSpeakFaster?.();
      return {
        matched: true,
        command: 'speak_faster',
        feedback: 'Increasing speech speed.'
      };
    }

    // 6. Stop speaking
    if (
      text === 'stop' ||
      text.includes('stop speaking') ||
      text.includes('be quiet') ||
      text.includes('shut up') ||
      text.includes('silence')
    ) {
      this.handlers.onStop?.();
      return {
        matched: true,
        command: 'stop',
        feedback: 'Speech stopped.'
      };
    }

    // 7. Capture another image
    if (
      text.includes('capture') ||
      text.includes('take photo') ||
      text.includes('snap photo') ||
      text.includes('another image') ||
      text.includes('take picture')
    ) {
      this.handlers.onCapture?.();
      return {
        matched: true,
        command: 'capture',
        feedback: 'Capturing new image.'
      };
    }

    // 8. Open accessibility settings
    if (
      text.includes('settings') ||
      text.includes('accessibility settings') ||
      text.includes('preferences')
    ) {
      this.handlers.onOpenSettings?.();
      return {
        matched: true,
        command: 'settings',
        feedback: 'Opening accessibility settings.'
      };
    }

    // 9. Help
    if (
      text.includes('help') ||
      text.includes('what can you do') ||
      text.includes('commands')
    ) {
      this.handlers.onHelp?.();
      return {
        matched: true,
        command: 'help',
        feedback: 'You can say: Describe my surroundings, Read this text, Repeat the answer, Speak slower, Speak faster, Stop speaking, Capture another image, or Open accessibility settings.'
      };
    }

    // Default: General query to assistant
    this.handlers.onGeneralQuery?.(transcript);
    return {
      matched: false,
      command: 'query',
      query: transcript
    };
  }
}
