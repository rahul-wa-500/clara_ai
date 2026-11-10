import { useState, useEffect } from "react";
import "./App.css";
import Navbar from "./components/Navbar/Navbar.jsx";
import Sidebar from "./components/Sidebar/Sidebar.jsx";
import Clara from "./components/Clara/Clara.jsx";
import VoiceSettingsModal from "./components/VoiceSettings/VoiceSettingsModal.jsx";
import { generateGeminiResponse } from "./services/gemini.js";
import {
  loadChatsFromStorage,
  saveChatsToStorage,
  getStoredActiveChatId,
  setStoredActiveChatId,
  createNewChatObject,
} from "./utils/chatStorage.js";
import {
  loadSpeechSettings,
  saveSpeechSettings,
  speakResponse,
  stopSpeech,
} from "./utils/speechService.js";

/**
 * Root Application Component:
 * - Coordinates sidebar, navbar, and Clara chat view.
 * - Handles chat history, Gemini API calls, and speech synthesis.
 * - Passes detected language from voice/text input to Gemini for language-aware replies.
 */
const App = () => {
  // ── Detected Language (from voice input or text script detection) ──
  const [detectedLanguage, setDetectedLanguage] = useState("en");

  const handleLanguageDetected = (lang) => {
    if (lang && lang !== detectedLanguage) {
      setDetectedLanguage(lang);
    }
  };

  // ── Chat State ───────────────────────────────────────────
  const [chats, setChats] = useState(() => loadChatsFromStorage());

  const [activeChatId, setActiveChatId] = useState(() => {
    const savedId = getStoredActiveChatId();
    const storedChats = loadChatsFromStorage();
    if (savedId && storedChats.some((c) => c.id === savedId)) return savedId;
    return storedChats.length > 0 ? storedChats[0].id : null;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Speech State ─────────────────────────────────────────
  const [speechSettings, setSpeechSettings] = useState(() =>
    loadSpeechSettings()
  );
  const [activeSpeakingId, setActiveSpeakingId] = useState(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Persist chats to localStorage whenever they change
  useEffect(() => {
    saveChatsToStorage(chats);
  }, [chats]);

  useEffect(() => {
    setStoredActiveChatId(activeChatId);
  }, [activeChatId]);

  // ── Speech Handlers ──────────────────────────────────────
  const handleStopSpeech = () => {
    stopSpeech();
    setActiveSpeakingId(null);
  };

  const handleToggleSpeech = (messageId, content) => {
    if (activeSpeakingId === messageId) {
      handleStopSpeech();
      return;
    }
    speakResponse({
      id: messageId,
      text: content,
      settings: speechSettings,
      onStart: () => setActiveSpeakingId(messageId),
      onEnd: () =>
        setActiveSpeakingId((curr) => (curr === messageId ? null : curr)),
      onError: (err) => {
        console.error("Speech playback error:", err);
        setActiveSpeakingId(null);
      },
    });
  };

  const handleSaveSpeechSettings = (newSettings) => {
    setSpeechSettings(newSettings);
    saveSpeechSettings(newSettings);
  };

  // ── Active Chat ──────────────────────────────────────────
  const activeChat = chats.find((chat) => chat.id === activeChatId) || null;

  // ── Chat Actions ─────────────────────────────────────────
  const handleNewChat = () => {
    handleStopSpeech();
    setActiveChatId(null);
  };

  const handleSelectChat = (chatId) => {
    handleStopSpeech();
    setActiveChatId(chatId);
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const handleDeleteChat = (chatId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this chat?"
    );
    if (!confirmDelete) return;
    handleStopSpeech();
    setChats((prevChats) => {
      const remaining = prevChats.filter((c) => c.id !== chatId);
      if (activeChatId === chatId) {
        setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
  };

  const handleToggleSaveChat = (chatId) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, isSaved: !chat.isSaved } : chat
      )
    );
  };

  const handleClearAll = () => {
    const confirmClear = window.confirm("Sahi me uda du ? Sabkuch ?");
    if (!confirmClear) return;
    handleStopSpeech();
    setChats([]);
    setActiveChatId(null);
  };

  /**
   * Send a message: adds it to the chat, calls Gemini with full history,
   * and appends the AI reply. Language-aware via detectedLanguage state.
   */
  const handleSendMessage = async (promptText, langHint) => {
    if (!promptText.trim() || loading) return;

    // Update detected language if a hint was provided with this message
    const currentLang = langHint || detectedLanguage;
    if (langHint) handleLanguageDetected(langHint);

    const userMessage = {
      id: "msg_" + Date.now() + "_user",
      role: "user",
      content: promptText,
      timestamp: new Date().toISOString(),
    };

    let targetChatId = activeChatId;
    let updatedChats = [...chats];

    if (!targetChatId || !updatedChats.some((c) => c.id === targetChatId)) {
      // Start a brand new conversation
      const title =
        promptText.length > 40 ? promptText.slice(0, 40) + "…" : promptText;
      const newChat = createNewChatObject(title);
      newChat.messages.push(userMessage);
      updatedChats = [newChat, ...updatedChats];
      targetChatId = newChat.id;
      setChats(updatedChats);
      setActiveChatId(targetChatId);
    } else {
      // Append to existing conversation and bubble it to top
      updatedChats = updatedChats.map((c) =>
        c.id === targetChatId
          ? {
              ...c,
              updatedAt: new Date().toISOString(),
              messages: [...c.messages, userMessage],
            }
          : c
      );
      const idx = updatedChats.findIndex((c) => c.id === targetChatId);
      if (idx > 0) {
        const [chat] = updatedChats.splice(idx, 1);
        updatedChats = [chat, ...updatedChats];
      }
      setChats(updatedChats);
    }

    setLoading(true);

    try {
      // Build conversation history (all messages before the latest user message)
      const currentMessages =
        updatedChats.find((c) => c.id === targetChatId)?.messages || [];
      const historyMessages = currentMessages.slice(0, -1);

      const reply = await generateGeminiResponse(
        promptText,
        historyMessages,
        currentLang
      );

      const assistantMessage = {
        id: "msg_" + Date.now() + "_assistant",
        role: "assistant",
        content: reply,
        timestamp: new Date().toISOString(),
      };

      setChats((prevChats) =>
        prevChats.map((c) =>
          c.id === targetChatId
            ? {
                ...c,
                updatedAt: new Date().toISOString(),
                messages: [...c.messages, assistantMessage],
              }
            : c
        )
      );

      // Auto-read if autoSpeak is enabled
      if (speechSettings?.autoSpeak) {
        speakResponse({
          id: assistantMessage.id,
          text: reply,
          settings: speechSettings,
          onStart: () => setActiveSpeakingId(assistantMessage.id),
          onEnd: () =>
            setActiveSpeakingId((curr) =>
              curr === assistantMessage.id ? null : curr
            ),
          onError: () => setActiveSpeakingId(null),
        });
      }
    } catch (error) {
      const errorMessage = {
        id: "msg_" + Date.now() + "_error",
        role: "assistant",
        content:
          error.message ||
          "Sorry, I encountered an issue generating a response. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setChats((prevChats) =>
        prevChats.map((c) =>
          c.id === targetChatId
            ? {
                ...c,
                updatedAt: new Date().toISOString(),
                messages: [...c.messages, errorMessage],
              }
            : c
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onToggleSaveChat={handleToggleSaveChat}
        onClearAll={handleClearAll}
      />

      {/* Main Content */}
      <div className="main-content-area">
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
          onNewChat={handleNewChat}
          activeChatTitle={activeChat?.title}
          onOpenVoiceSettings={() => setIsVoiceModalOpen(true)}
          speechSettings={speechSettings}
          activeSpeakingId={activeSpeakingId}
        />

        <Clara
          activeChat={activeChat}
          loading={loading}
          onSendMessage={handleSendMessage}
          onToggleSaveChat={handleToggleSaveChat}
          activeSpeakingId={activeSpeakingId}
          onToggleSpeech={handleToggleSpeech}
          speechSettings={speechSettings}
          onOpenVoiceSettings={() => setIsVoiceModalOpen(true)}
          onLanguageDetected={handleLanguageDetected}
        />
      </div>

      {/* Voice Settings Modal */}
      {isVoiceModalOpen && (
        <VoiceSettingsModal
          key={speechSettings?.voiceURI || "default-settings"}
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          settings={speechSettings}
          onSaveSettings={handleSaveSpeechSettings}
          activeSpeakingId={activeSpeakingId}
          onStopSpeech={handleStopSpeech}
        />
      )}
    </div>
  );
};

export default App;
