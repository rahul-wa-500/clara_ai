/**
 * Speech Service for Clara AI
 * - Provides Web Speech API (speechSynthesis) integration
 * - Handles markdown-to-speech cleaning so Clara speaks naturally without reciting code/markdown syntax
 * - Handles browser voice enumeration (including async voiceschanged event)
 * - Implements sentence-chunked playback to prevent Chromium's 15-second speech cutoff bug
 * - Manages speech settings persistence (auto-speak, voice, rate, pitch)
 */

const STORAGE_KEY = "clara_speech_settings";

export const DEFAULT_SPEECH_SETTINGS = {
  autoSpeak: false,
  voiceURI: "",
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
};

// Tracks active speech state
let currentUtteranceId = null;
let currentChunks = [];
let currentChunkIndex = 0;
let isPlaybackActive = false;
let activeCallbacks = {
  onStart: null,
  onEnd: null,
  onError: null,
};

/**
 * Check if Web Speech API is supported in current environment
 */
export const isSpeechSupported = () => {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
};

/**
 * Load user speech preferences from localStorage
 */
export const loadSpeechSettings = () => {
  if (typeof window === "undefined") return DEFAULT_SPEECH_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_SPEECH_SETTINGS;
    return { ...DEFAULT_SPEECH_SETTINGS, ...JSON.parse(saved) };
  } catch (e) {
    console.error("Failed to load speech settings:", e);
    return DEFAULT_SPEECH_SETTINGS;
  }
};

/**
 * Save user speech preferences to localStorage
 */
export const saveSpeechSettings = (settings) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save speech settings:", e);
  }
};

/**
 * Get available browser voices, prioritizing English and natural voices
 */
export const getAvailableVoices = () => {
  if (!isSpeechSupported()) return [];
  const voices = window.speechSynthesis.getVoices() || [];

  // Sort: English first, then preferred natural/enhanced voices
  return [...voices].sort((a, b) => {
    const aLang = (a.lang || "").toLowerCase();
    const bLang = (b.lang || "").toLowerCase();
    const aIsEn = aLang.startsWith("en");
    const bIsEn = bLang.startsWith("en");

    if (aIsEn && !bIsEn) return -1;
    if (!aIsEn && bIsEn) return 1;

    // Prioritize natural / online voices
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const aNatural = aName.includes("natural") || aName.includes("google") || aName.includes("premium");
    const bNatural = bName.includes("natural") || bName.includes("google") || bName.includes("premium");

    if (aNatural && !bNatural) return -1;
    if (!aNatural && bNatural) return 1;

    return a.name.localeCompare(b.name);
  });
};

/**
 * Register a listener for voice changes (voices often load asynchronously)
 */
export const subscribeToVoiceChanges = (callback) => {
  if (!isSpeechSupported()) return () => {};

  const handleVoices = () => {
    callback(getAvailableVoices());
  };

  window.speechSynthesis.addEventListener("voiceschanged", handleVoices);
  // Initial check
  handleVoices();

  return () => {
    window.speechSynthesis.removeEventListener("voiceschanged", handleVoices);
  };
};

/**
 * Cleans markdown formatting for smooth, human-like speech output.
 * - Replaces long code blocks with a brief conversational notice
 * - Removes markdown headers, asterisks, brackets, link URLs, horizontal rules
 * - Keeps numbers and sentences intact
 */
export const cleanMarkdownForSpeech = (markdown) => {
  if (!markdown) return "";

  let text = markdown;

  // Replace code blocks: ```javascript ... ``` -> "Here is a code snippet in javascript."
  text = text.replace(/```([a-zA-Z0-9_-]+)?\s*[\s\S]*?```/g, (match, lang) => {
    const language = lang ? lang.trim() : "code";
    return ` Here is a ${language} code snippet provided in the text. `;
  });

  // Remove inline code ticks: `let x = 10` -> "let x = 10"
  text = text.replace(/`([^`]+)`/g, "$1");

  // Remove images: ![alt](url) -> ""
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, "");

  // Remove links: [text](url) -> "text"
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

  // Remove markdown headers: # Title -> "Title."
  text = text.replace(/^#{1,6}\s*(.*)$/gm, "$1.");

  // Remove bold / italic markers: ***text***, **text**, *text*, __text__, _text_
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, "$1");
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/_([^_]+)_/g, "$1");

  // Remove strikethrough: ~~text~~
  text = text.replace(/~~([^~]+)~~/g, "$1");

  // Remove blockquote marks: > quote -> "quote"
  text = text.replace(/^>\s?/gm, "");

  // Remove horizontal rules
  text = text.replace(/^(?:---|\*\*\*|___)\s*$/gm, "");

  // Clean markdown table formatting
  text = text.replace(/\|/g, " ");
  text = text.replace(/-{3,}/g, " ");

  // Convert bullet points to natural sentences
  text = text.replace(/^\s*[-*+]\s+/gm, ". ");
  text = text.replace(/^\s*\d+\.\s+/gm, (match) => `. Step ${match.trim()} `);

  // Clean extra whitespace and repeated periods/newlines
  text = text
    .replace(/\s+/g, " ")
    .replace(/\.{2,}/g, ".")
    .replace(/\s\./g, ".")
    .trim();

  return text;
};

/**
 * Splits text into small sentence chunks (max ~160 chars) to prevent
 * Chromium's known bug where long utterances freeze after 15 seconds.
 */
function splitIntoSentenceChunks(text, maxChunkLen = 160) {
  if (!text) return [];

  // Match sentences ending in . ! ? or semicolon
  const rawSentences = text.match(/[^.!?;\n]+[.!?;\n]+|[^.!?;\n]+$/g) || [text];
  const chunks = [];

  for (let s of rawSentences) {
    s = s.trim();
    if (!s) continue;

    if (s.length <= maxChunkLen) {
      chunks.push(s);
    } else {
      // If a single sentence is very long, split by comma or words
      const words = s.split(" ");
      let current = "";
      for (let word of words) {
        if ((current + " " + word).trim().length > maxChunkLen) {
          if (current.trim()) chunks.push(current.trim());
          current = word;
        } else {
          current = current ? current + " " + word : word;
        }
      }
      if (current.trim()) chunks.push(current.trim());
    }
  }

  return chunks;
}

/**
 * Stop any ongoing speech immediately
 */
export const stopSpeech = () => {
  if (!isSpeechSupported()) return;

  isPlaybackActive = false;
  currentUtteranceId = null;
  currentChunks = [];
  currentChunkIndex = 0;

  try {
    window.speechSynthesis.cancel();
  } catch (e) {
    console.error("Error cancelling speech:", e);
  }

  if (activeCallbacks.onEnd) {
    activeCallbacks.onEnd();
  }
  activeCallbacks = { onStart: null, onEnd: null, onError: null };
};

function failPlayback(error) {
  const callbacks = activeCallbacks;
  activeCallbacks = { onStart: null, onEnd: null, onError: null };
  stopSpeech();
  callbacks.onError?.(error);
}

/**
 * Play the next chunk in sequence
 */
function playNextChunk(voice, settings) {
  if (!isPlaybackActive || currentChunkIndex >= currentChunks.length) {
    const finishedId = currentUtteranceId;
    isPlaybackActive = false;
    currentUtteranceId = null;
    currentChunks = [];
    currentChunkIndex = 0;
    if (activeCallbacks.onEnd) {
      activeCallbacks.onEnd(finishedId);
    }
    return;
  }

  const chunkText = currentChunks[currentChunkIndex];
  const utterance = new SpeechSynthesisUtterance(chunkText);

  if (voice) {
    utterance.voice = voice;
  }
  utterance.rate = Math.max(0.5, Math.min(2.0, settings?.rate || 1.0));
  utterance.pitch = Math.max(0.5, Math.min(1.5, settings?.pitch || 1.0));
  utterance.volume = Math.max(0.0, Math.min(1.0, settings?.volume || 1.0));

  utterance.onend = () => {
    if (!isPlaybackActive) return;
    currentChunkIndex++;
    playNextChunk(voice, settings);
  };

  utterance.onerror = (e) => {
    // If canceled by user, don't treat as an error
    if (e.error === "canceled" || e.error === "interrupted") {
      return;
    }
    if (!isPlaybackActive) return;
    failPlayback(new Error(`Speech synthesis chunk failed: ${e.error}`));
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error("Failed to speak chunk:", err);
    failPlayback(err);
  }
}

/**
 * Speak a specific AI response text
 * @param {Object} params
 * @param {string} params.id - Unique ID of the message being spoken
 * @param {string} params.text - Markdown or plain text content
 * @param {Object} params.settings - { voiceURI, rate, pitch, volume }
 * @param {Function} params.onStart - Callback when speech begins
 * @param {Function} params.onEnd - Callback when speech ends normally or is stopped
 * @param {Function} params.onError - Callback on error
 */
export const speakResponse = ({
  id,
  text,
  settings,
  onStart,
  onEnd,
  onError,
}) => {
  if (!isSpeechSupported()) {
    if (onError) onError(new Error("Web Speech API is not supported in this browser."));
    return;
  }

  // Stop previous speech
  stopSpeech();

  const cleaned = cleanMarkdownForSpeech(text);
  if (!cleaned) {
    if (onEnd) onEnd(id);
    return;
  }

  const chunks = splitIntoSentenceChunks(cleaned);
  if (chunks.length === 0) {
    if (onEnd) onEnd(id);
    return;
  }

  const config = settings || loadSpeechSettings();
  const voices = window.speechSynthesis.getVoices() || [];
  let selectedVoice = null;

  if (config.voiceURI) {
    selectedVoice = voices.find((v) => v.voiceURI === config.voiceURI);
  }
  if (!selectedVoice) {
    // Default to an English voice if available, else first voice
    selectedVoice =
      voices.find((v) => (v.lang || "").startsWith("en")) || voices[0] || null;
  }

  isPlaybackActive = true;
  currentUtteranceId = id;
  currentChunks = chunks;
  currentChunkIndex = 0;
  activeCallbacks = { onStart, onEnd, onError };

  if (onStart) {
    onStart(id);
  }

  playNextChunk(selectedVoice, config);
};

/**
 * Returns the ID of the message currently being spoken, or null
 */
export const getActiveSpeakingId = () => {
  return isPlaybackActive ? currentUtteranceId : null;
};
