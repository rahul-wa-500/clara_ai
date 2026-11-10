// Utility helper for saving and loading chat history using browser's localStorage.
// This allows chats to stay saved even after the page is refreshed.

const STORAGE_KEY = "clara_ai_chats_v1";
const ACTIVE_CHAT_KEY = "clara_ai_active_chat_id";

/**
 * Load all saved chats from localStorage.
 * Returns an array of chat objects.
 */
export function loadChatsFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load chats from storage:", error);
    return [];
  }
}

/**
 * Save all chats back to localStorage.
 */
export function saveChatsToStorage(chats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch (error) {
    console.error("Failed to save chats to storage:", error);
  }
}

/**
 * Get the currently selected chat ID from localStorage.
 */
export function getStoredActiveChatId() {
  try {
    return localStorage.getItem(ACTIVE_CHAT_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Store the active chat ID in localStorage.
 */
export function setStoredActiveChatId(chatId) {
  try {
    if (chatId) {
      localStorage.setItem(ACTIVE_CHAT_KEY, chatId);
    } else {
      localStorage.removeItem(ACTIVE_CHAT_KEY);
    }
  } catch (error) {
    console.error("Failed to set active chat id:", error);
  }
}

/**
 * Helper to generate a new chat session object.
 */
export function createNewChatObject(title = "New Conversation") {
  return {
    id: "chat_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    title: title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSaved: false, // Flag indicating whether the user saved/starred this chat
    messages: [], // Array of { id, role: 'user' | 'assistant', content, timestamp }
  };
}
