/**
 * Voice Input Service for Clara AI
 * Uses Web Speech API SpeechRecognition for microphone-based text input.
 * Handles interim results (live transcript), final transcript,
 * and automatic language/script detection from spoken text.
 */

/**
 * Returns true if browser supports SpeechRecognition
 */
export const isVoiceInputSupported = () =>
  typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

/**
 * Detects script/language from text using Unicode block ranges.
 * Returns a BCP 47 locale string hint.
 */
export const detectLanguageFromText = (text) => {
  if (!text) return "en";

  // Devanagari → Hindi, Marathi, Sanskrit
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  // Arabic script
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  // CJK Unified Ideographs → Chinese
  if (/[\u4E00-\u9FFF\u3400-\u4DBF]/.test(text)) return "zh";
  // Hiragana / Katakana → Japanese
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return "ja";
  // Hangul → Korean
  if (/[\uAC00-\uD7AF]/.test(text)) return "ko";
  // Cyrillic → Russian, Ukrainian, etc.
  if (/[\u0400-\u04FF]/.test(text)) return "ru";
  // Bengali
  if (/[\u0980-\u09FF]/.test(text)) return "bn";
  // Tamil
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  // Telugu
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";

  // Hinglish (Hindi written in Latin characters)
  const hinglishWords =
    /\b(kya|hai|nahi|haan|aur|mera|tera|yaar|bhai|matlab|thik|sahi|bol|kar|karo|kaise|kyun|yeh|woh|iss|usse|chahiye|theek|bilkul|zaroor|accha|bahut|dekho|sunno|bata|dost|samajh|sirf|toh|phir|abhi|hoga|kuch|sab|gaya|raha|rahi|hua|hoon|hun|main|mein|ap|apna|apni|hum|tumhe|mujhe|koi|kitna|kitni|kaisa|kaisi|sochna|dekhna|batao|batana|lena|dena|milna|rehna|aana|jaana)\b/i;
  if (hinglishWords.test(text)) return "hi-Latn";

  return "en";
};

/**
 * Creates and starts a SpeechRecognition session.
 *
 * @param {Object} callbacks
 * @param {Function} callbacks.onStart       - Fired when mic becomes active
 * @param {Function} callbacks.onInterim     - Fired with live (partial) transcript string
 * @param {Function} callbacks.onFinal       - Fired with (finalTranscript, detectedLang)
 * @param {Function} callbacks.onEnd         - Fired when session ends (any reason)
 * @param {Function} callbacks.onError       - Fired with Error object
 *
 * @returns {{ start: Function, stop: Function } | null}
 */
export const createVoiceRecognition = ({
  onStart,
  onInterim,
  onFinal,
  onEnd,
  onError,
}) => {
  if (!isVoiceInputSupported()) {
    if (onError)
      onError(
        new Error(
          "Voice input is not supported in this browser. Please use Chrome or Edge."
        )
      );
    return null;
  }

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  // Settings
  recognition.continuous = false;   // Single utterance per click
  recognition.interimResults = true; // Stream partial results
  recognition.maxAlternatives = 1;
  recognition.lang = "";            // Leave empty for auto language detection

  recognition.onstart = () => {
    if (onStart) onStart();
  };

  recognition.onresult = (event) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    if (interimTranscript && onInterim) {
      onInterim(interimTranscript);
    }

    if (finalTranscript && onFinal) {
      const detectedLang = detectLanguageFromText(finalTranscript);
      onFinal(finalTranscript.trim(), detectedLang);
    }
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  recognition.onerror = (event) => {
    // These are non-critical — treat as "no result" rather than errors
    if (event.error === "aborted" || event.error === "no-speech") {
      if (onEnd) onEnd();
      return;
    }
    if (onError) onError(new Error(`Voice recognition error: ${event.error}`));
    if (onEnd) onEnd();
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch {
        // Already started
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch {
        // Already stopped
      }
    },
  };
};
