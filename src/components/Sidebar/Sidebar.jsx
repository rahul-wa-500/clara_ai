import { useState } from "react";
import "./Sidebar.css";

/**
 * Sidebar component that provides:
 * 1. "New Chat" button to start a fresh discussion.
 * 2. Tab switching between "Recents" (all conversations) and "Saved" (bookmarked conversations).
 * 3. Quick search to filter through past conversations by keyword.
 * 4. Actions per chat: select to view, toggle save/star, and delete.
 * 5. Clear all history option.
 */
const Sidebar = ({
  isOpen,
  onToggle,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onToggleSaveChat,
  onClearAll,
}) => {
  const [activeTab, setActiveTab] = useState("recents"); // "recents" or "saved"
  const [searchQuery, setSearchQuery] = useState("");

  // Filter chats by tab ("recents" vs "saved")
  const tabFilteredChats = chats.filter((chat) => {
    if (activeTab === "saved") {
      return chat.isSaved;
    }
    return true; // "recents" shows all
  });

  // Further filter by search term if user typed something
  const displayChats = tabFilteredChats.filter((chat) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = (chat.title || "").toLowerCase().includes(query);
    const messageMatch = chat.messages?.some((m) =>
      (m.content || "").toLowerCase().includes(query)
    );
    return titleMatch || messageMatch;
  });

  const savedCount = chats.filter((c) => c.isSaved).length;

  return (
    <>
      {/* Mobile background overlay when sidebar is open */}
      <div
        className={`sidebar-overlay ${isOpen ? "active" : ""}`}
        onClick={onToggle}
      />

      <aside className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
        {/* Top Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-logo">C</div>
            <span className="brand-text">Clara AI</span>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={onToggle}
            title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="sidebar-action-wrap">
          <button className="new-chat-btn" onClick={onNewChat}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>New Chat</span>
          </button>
        </div>

        {/* Tab switch: Recents vs Saved */}
        <div className="sidebar-tabs">
          <button
            className={`tab-btn ${activeTab === "recents" ? "active" : ""}`}
            onClick={() => setActiveTab("recents")}
          >
            <span>Recents</span>
            <span className="tab-badge">{chats.length}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "saved" ? "active" : ""}`}
            onClick={() => setActiveTab("saved")}
          >
            <span>Saved</span>
            {savedCount > 0 && <span className="tab-badge saved">{savedCount}</span>}
          </button>
        </div>

        {/* Search input for finding past chats */}
        {chats.length > 0 && (
          <div className="sidebar-search">
            <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Chat List */}
        <div className="chat-history-list">
          {displayChats.length === 0 ? (
            <div className="empty-history">
              {activeTab === "saved" ? (
                <>
                  <p className="empty-title">No saved chats</p>
                  <p className="empty-desc">
                    Click the star icon ⭐ next to any chat to save it for quick access.
                  </p>
                </>
              ) : (
                <>
                  <p className="empty-title">No chats yet</p>
                  <p className="empty-desc">
                    Your conversations with Clara will appear here automatically.
                  </p>
                </>
              )}
            </div>
          ) : (
            displayChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              const formattedDate = formatChatDate(chat.updatedAt || chat.createdAt);

              return (
                <div
                  key={chat.id}
                  className={`chat-item ${isActive ? "active" : ""}`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <div className="chat-item-main">
                    <svg className="chat-item-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <div className="chat-item-text">
                      <span className="chat-title" title={chat.title}>
                        {chat.title || "Untitled Conversation"}
                      </span>
                      <span className="chat-date">{formattedDate}</span>
                    </div>
                  </div>

                  {/* Action buttons (Save/Star & Delete) */}
                  <div className="chat-item-actions">
                    <button
                      className={`star-btn ${chat.isSaved ? "starred" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSaveChat(chat.id);
                      }}
                      title={chat.isSaved ? "Remove from saved" : "Save this chat"}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={chat.isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    </button>

                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                      title="Delete chat"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Area */}
        <div className="sidebar-footer">
          {chats.length > 0 && (
            <button className="clear-all-btn" onClick={onClearAll}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Clear History</span>
            </button>
          )}
          <div className="sidebar-footnote">
            <span>Clara AI Assistant</span>
          </div>
        </div>
      </aside>
    </>
  );
};

/**
 * Format timestamp into friendly date string: "Today", "Yesterday", or "MMM DD"
 */
function formatChatDate(isoString) {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diffHours < 48) {
      return "Yesterday";
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default Sidebar;
