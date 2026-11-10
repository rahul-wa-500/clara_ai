import { useState, useEffect } from "react";
import "./VoiceSettingsModal.css";
import {
  getAvailableVoices,
  subscribeToVoiceChanges,
  speakResponse,
  stopSpeech,
  isSpeechSupported,
} from "../../utils/speechService.js";

/**
 * Voice & Speech Settings Modal:
 * - Allows user to toggle Auto-Speak (automatically read Clara responses)
 * - Select browser voices (categorized with language/voice name)
 * - Adjust speech rate (speed) and pitch
 * - Test voice preview
 */
const VoiceSettingsModal = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  activeSpeakingId,
  onStopSpeech,
}) => {
  const [voices, setVoices] = useState(() => getAvailableVoices());
  const [autoSpeak, setAutoSpeak] = useState(settings?.autoSpeak || false);
  const [voiceURI, setVoiceURI] = useState(settings?.voiceURI || "");
  const [rate, setRate] = useState(settings?.rate || 1.0);
  const [pitch, setPitch] = useState(settings?.pitch || 1.0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Listen for browser voice updates (some browsers load voices asynchronously)
  useEffect(() => {
    const unsubscribe = subscribeToVoiceChanges((loadedVoices) => {
      setVoices(loadedVoices);
      // If no voice is selected yet, pick an English default
      if (!voiceURI && loadedVoices.length > 0) {
        const enVoice = loadedVoices.find((v) => (v.lang || "").startsWith("en"));
        if (enVoice) {
          setVoiceURI(enVoice.voiceURI);
        }
      }
    });

    return unsubscribe;
  }, [voiceURI]);

  // Stop preview speech if the modal closes while audio is playing.
  useEffect(() => {
    if (!isOpen && isPlayingPreview) {
      stopSpeech();
    }
  }, [isOpen, isPlayingPreview]);

  if (!isOpen) return null;

  const supported = isSpeechSupported();

  const handleClose = () => {
    if (isPlayingPreview) {
      stopSpeech();
      setIsPlayingPreview(false);
    }
    onClose();
  };

  const handleToggleAutoSpeak = () => {
    setAutoSpeak((prev) => !prev);
  };

  const handleTestVoice = () => {
    if (isPlayingPreview) {
      stopSpeech();
      setIsPlayingPreview(false);
      return;
    }

    const previewText = "Hello! I am Clara, your AI assistant. How can I help you today?";
    speakResponse({
      id: "preview_sample",
      text: previewText,
      settings: {
        voiceURI,
        rate,
        pitch,
      },
      onStart: () => setIsPlayingPreview(true),
      onEnd: () => setIsPlayingPreview(false),
      onError: () => setIsPlayingPreview(false),
    });
  };

  const handleSave = () => {
    if (isPlayingPreview) {
      stopSpeech();
      setIsPlayingPreview(false);
    }
    onSaveSettings({
      autoSpeak,
      voiceURI,
      rate: parseFloat(rate),
      pitch: parseFloat(pitch),
    });
    onClose();
  };

  const handleResetDefaults = () => {
    setAutoSpeak(false);
    setRate(1.0);
    setPitch(1.0);
    if (voices.length > 0) {
      const enVoice = voices.find((v) => (v.lang || "").startsWith("en"));
      setVoiceURI(enVoice ? enVoice.voiceURI : voices[0].voiceURI);
    }
  };

  return (
    <div className="voice-modal-overlay" onClick={handleClose}>
      <div className="voice-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="voice-modal-header">
          <div className="voice-modal-title-group">
            <div className="voice-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            </div>
            <div>
              <h3>Voice & Speech Options</h3>
              <p>Configure speech output and voice response behavior</p>
            </div>
          </div>
          <button className="voice-modal-close" onClick={handleClose} title="Close settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {!supported ? (
          <div className="voice-unsupported-alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>Your browser does not support the Web Speech API. Please try using Google Chrome, Microsoft Edge, or Safari.</p>
          </div>
        ) : (
          <div className="voice-modal-body">
            {/* Auto-Speak Toggle Card */}
            <div className="voice-card">
              <div className="voice-card-info">
                <div className="voice-card-label">
                  <strong>Auto-Read Responses</strong>
                  {autoSpeak && <span className="voice-status-pill">Active</span>}
                </div>
                <p className="voice-card-desc">
                  Automatically speak Clara&apos;s answer aloud as soon as it arrives.
                </p>
              </div>
              <label className="voice-switch">
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={handleToggleAutoSpeak}
                />
                <span className="slider"></span>
              </label>
            </div>

            {/* Voice Selection */}
            <div className="voice-form-group">
              <div className="voice-label-row">
                <label htmlFor="voice-select">Speech Voice</label>
                <span className="voice-count-tag">{voices.length} available</span>
              </div>
              <div className="voice-select-wrapper">
                <select
                  id="voice-select"
                  value={voiceURI}
                  onChange={(e) => setVoiceURI(e.target.value)}
                  className="voice-select"
                >
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang}) {v.default ? "— System Default" : ""}
                    </option>
                  ))}
                </select>
                <svg className="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>

            {/* Speed / Rate Slider */}
            <div className="voice-form-group">
              <div className="voice-label-row">
                <label htmlFor="voice-rate">Speech Speed</label>
                <span className="voice-val-badge">{rate.toFixed(1)}x</span>
              </div>
              <input
                id="voice-rate"
                type="range"
                min="0.7"
                max="1.5"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="voice-range"
              />
              <div className="range-presets">
                <button
                  type="button"
                  className={`preset-btn ${rate === 0.8 ? "active" : ""}`}
                  onClick={() => setRate(0.8)}
                >
                  0.8x Slow
                </button>
                <button
                  type="button"
                  className={`preset-btn ${rate === 1.0 ? "active" : ""}`}
                  onClick={() => setRate(1.0)}
                >
                  1.0x Normal
                </button>
                <button
                  type="button"
                  className={`preset-btn ${rate === 1.2 ? "active" : ""}`}
                  onClick={() => setRate(1.2)}
                >
                  1.2x Fast
                </button>
              </div>
            </div>

            {/* Pitch Slider */}
            <div className="voice-form-group">
              <div className="voice-label-row">
                <label htmlFor="voice-pitch">Voice Pitch</label>
                <span className="voice-val-badge">{pitch.toFixed(1)}</span>
              </div>
              <input
                id="voice-pitch"
                type="range"
                min="0.8"
                max="1.3"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="voice-range"
              />
              <div className="range-labels">
                <span>Deeper</span>
                <span>Default</span>
                <span>Higher</span>
              </div>
            </div>

            {/* Active Speech Notice if playing */}
            {activeSpeakingId && (
              <div className="voice-speaking-banner">
                <div className="sound-wave-bars">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span>Speech is currently playing in your conversation</span>
                <button
                  className="voice-stop-btn-sm"
                  onClick={onStopSpeech}
                  type="button"
                >
                  Stop Audio
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="voice-modal-footer">
          <button
            type="button"
            className="voice-preview-btn"
            onClick={handleTestVoice}
            disabled={!supported}
            title={isPlayingPreview ? "Stop test" : "Test current voice"}
          >
            {isPlayingPreview ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2"></rect>
                </svg>
                <span>Stop Test</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <span>Test Voice</span>
              </>
            )}
          </button>

          <div className="footer-right-actions">
            <button
              type="button"
              className="voice-reset-btn"
              onClick={handleResetDefaults}
              title="Reset to default settings"
            >
              Reset
            </button>
            <button
              type="button"
              className="voice-save-btn"
              onClick={handleSave}
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceSettingsModal;
