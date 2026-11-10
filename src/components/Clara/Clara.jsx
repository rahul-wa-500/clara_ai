import { useState, useRef, useEffect, useCallback } from "react";
import "./Clara.css";
import FormattedResponse from "../FormattedResponse/FormattedResponse.jsx";
import {
  createVoiceRecognition,
  isVoiceInputSupported,
  detectLanguageFromText,
} from "../../utils/voiceInputService.js";

/**
 * Clara Main Chat Component:
 * - Displays welcome screen with starter cards when no chat is active
 * - Renders the full conversation thread with user and AI messages
 * - Handles text input and voice input (microphone)
 * - Detects language from text/voice and notifies parent
 * - Shows loading state with animated indicator
 */
const Clara = ({
  activeChat,
  loading,
  onSendMessage,
  onToggleSaveChat,
  activeSpeakingId,
  onToggleSpeech,
  speechSettings,
  onOpenVoiceSettings,
  onLanguageDetected,
}) => {
  const [prompt, setPrompt] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const messages = activeChat?.messages ?? [];
  const voiceSupported = isVoiceInputSupported();

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages, loading]);

  // Focus input when switching chats
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, [activeChat?.id]);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  // ── Send Handler ───────────────────────────────────────────
  const handleSend = useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    // Detect language from typed text and notify parent
    const lang = detectLanguageFromText(trimmed);
    if (onLanguageDetected) onLanguageDetected(lang);

    onSendMessage(trimmed, lang);
    setPrompt("");
    setInterimText("");
  }, [prompt, loading, onSendMessage, onLanguageDetected]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCardClick = (text) => {
    if (loading) return;
    onSendMessage(text, "en");
  };

  // ── Voice Input ────────────────────────────────────────────
  const handleMicClick = () => {
    if (!voiceSupported) return;

    if (isListening) {
      // Stop listening
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimText("");
      return;
    }

    const recognition = createVoiceRecognition({
      onStart: () => {
        setIsListening(true);
        setInterimText("");
      },
      onInterim: (text) => {
        setInterimText(text);
      },
      onFinal: (text, lang) => {
        setPrompt(text);
        setInterimText("");
        if (lang && onLanguageDetected) onLanguageDetected(lang);
        setIsListening(false);
        // Focus input so user can review or edit before sending
        setTimeout(() => inputRef.current?.focus(), 100);
      },
      onEnd: () => {
        setIsListening(false);
        setInterimText("");
      },
      onError: (err) => {
        console.warn("Voice input error:", err.message);
        setIsListening(false);
        setInterimText("");
      },
    });

    recognitionRef.current = recognition;
    recognition?.start();
  };

  // ── Render ─────────────────────────────────────────────────
  const displayValue = isListening && interimText ? interimText : prompt;

  return (
    <main className={`main ${messages.length === 0 && !loading ? "empty-home" : ""}`}>
      <div className="response">

        {/* Chat Meta Bar */}
        {activeChat && messages.length > 0 && (
          <div className="chat-meta-bar">
            <div className="chat-meta-info">
              <span className="chat-meta-title">{activeChat.title}</span>
              <span className="chat-meta-count">
                {messages.length} message{messages.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="chat-meta-actions">
              <button
                className={`meta-voice-btn ${speechSettings?.autoSpeak ? "auto-active" : ""} ${activeSpeakingId ? "playing" : ""}`}
                onClick={onOpenVoiceSettings}
                title="Voice & Speech Settings"
                type="button"
              >
                {activeSpeakingId ? (
                  <span className="equalizer-bars">
                    <span className="bar bar1" />
                    <span className="bar bar2" />
                    <span className="bar bar3" />
                  </span>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                )}
                <span>{speechSettings?.autoSpeak ? "Auto-Speak ON" : "Voice"}</span>
              </button>

              <button
                className={`meta-save-btn ${activeChat.isSaved ? "saved" : ""}`}
                onClick={() => onToggleSaveChat(activeChat.id)}
                title={activeChat.isSaved ? "Remove from saved" : "Save this chat"}
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={activeChat.isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>{activeChat.isSaved ? "Saved" : "Save Chat"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Empty State — Starter Cards */}
        {messages.length === 0 && !loading ? (
          <div className="chat empty-view">
            <div className="welcome-banner">
              <div className="welcome-logo">C</div>
              <h2>What can I help you with today?</h2>
              <p>Choose a card below or type anything to get started</p>
            </div>
            <div className="cards">
              <div
                className="card"
                onClick={() => handleCardClick("Explain how AI and neural networks work in simple terms")}
              >
                <div className="card-icon">🧠</div>
                <div className="card-text">
                  <strong>Learn</strong>
                  <p>How neural networks work in simple terms</p>
                </div>
              </div>

              <div
                className="card"
                onClick={() => handleCardClick("Write a clean React component for a responsive navbar")}
              >
                <div className="card-icon">💻</div>
                <div className="card-text">
                  <strong>Code</strong>
                  <p>React component for a responsive navbar</p>
                </div>
              </div>

              <div
                className="card"
                onClick={() => handleCardClick("Give me 5 actionable productivity tips for developers")}
              >
                <div className="card-icon">🚀</div>
                <div className="card-text">
                  <strong>Productivity</strong>
                  <p>5 actionable tips for developers</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Active Chat Thread */
          <div className="chat result">
            <div className="chat-content">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`message-bubble ${isUser ? "user-bubble" : "assistant-bubble"}`}
                  >
                    {isUser && (
                      <div className="bubble-header">
                        <div className="sender-tag user-tag">
                          <strong>You</strong>
                        </div>
                        {msg.timestamp && (
                          <span className="bubble-time">
                            {formatMessageTime(msg.timestamp)}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="bubble-body">
                      {isUser ? (
                        <p className="query-text">{msg.content}</p>
                      ) : (
                        <div className="reply-text">
                          <FormattedResponse
                            content={msg.content}
                            messageId={msg.id}
                            isSpeaking={activeSpeakingId === msg.id}
                            onToggleSpeech={onToggleSpeech}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Loading Indicator */}
              {loading && (
                <div className="message-bubble assistant-bubble loading-bubble">
                  <div className="reply-text loading-box">
                    <p className="loading-text">
                      Ruko bhai sochne do
                      <span className="loading-dots">
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                      </span>
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="input-section">
          {isListening && (
            <div className="listening-indicator">
              <span className="listening-dot" />
              <span>Listening… speak now</span>
            </div>
          )}

          <div className="input-box">
            {/* Voice Settings shortcut */}
            <button
              type="button"
              className={`input-icon-btn ${speechSettings?.autoSpeak ? "auto-active" : ""} ${activeSpeakingId ? "playing" : ""}`}
              onClick={onOpenVoiceSettings}
              title={activeSpeakingId ? "Speech playing — click for settings" : "Voice & Speech settings"}
            >
              {activeSpeakingId ? (
                <span className="equalizer-bars sm">
                  <span className="bar bar1" />
                  <span className="bar bar2" />
                  <span className="bar bar3" />
                </span>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>

            {/* Text input */}
            <input
              ref={inputRef}
              id="prompt"
              type="text"
              placeholder={isListening ? "Listening…" : "Ask Clara anything…"}
              value={displayValue}
              onChange={(e) => {
                if (!isListening) setPrompt(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className={isListening ? "listening" : ""}
              autoComplete="off"
            />

            {/* Microphone button */}
            {voiceSupported && (
              <button
                type="button"
                className={`input-icon-btn mic-btn ${isListening ? "listening" : ""}`}
                onClick={handleMicClick}
                title={isListening ? "Stop listening" : "Voice input — speak your question"}
              >
                {isListening ? (
                  /* Animated mic-stop */
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  /* Microphone icon */
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="2" width="6" height="11" rx="3" />
                    <path d="M5 10a7 7 0 0 0 14 0" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                    <line x1="9" y1="22" x2="15" y2="22" />
                  </svg>
                )}
              </button>
            )}

            {/* Send button */}
            <button
              id="sendButton"
              onClick={handleSend}
              disabled={loading || !prompt.trim()}
              title="Send message"
              type="button"
            >
              {loading ? (
                <span className="sending-spinner" />
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>

          <div className="warn">
            <p>AI can make mistakes — always verify important information.</p>
          </div>
        </div>
      </div>
    </main>
  );
};

/**
 * Format ISO timestamp into "10:45 AM"
 */
function formatMessageTime(isoString) {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default Clara;
