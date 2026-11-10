import "./Navbar.css";

/**
 * Navbar component:
 * - Sidebar toggle (hamburger)
 * - Clara logo & branding
 * - Active chat pill
 * - Voice settings button
 * - New Chat button
 */
const Navbar = ({
  onToggleSidebar,
  isSidebarOpen,
  onNewChat,
  activeChatTitle,
  onOpenVoiceSettings,
  speechSettings,
  activeSpeakingId,
}) => {
  return (
    <header className="navbar">
      <div className="nav-left">
        {/* Sidebar hamburger toggle */}
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Logo */}
        <div className="logo">
          <div className="logo-badge">C</div>
          <span className="logo-name">Clara</span>
        </div>

        {/* Active chat pill */}
        {activeChatTitle && (
          <div className="nav-chat-pill" title={activeChatTitle}>
            <span className="pill-dot" />
            <span className="pill-text">{activeChatTitle}</span>
          </div>
        )}
      </div>

      <div className="nav-right">
        {/* Voice / Speech Settings button */}
        <button
          className={`nav-btn nav-voice-btn ${speechSettings?.autoSpeak ? "auto-on" : ""} ${activeSpeakingId ? "playing" : ""}`}
          onClick={onOpenVoiceSettings}
          title={
            activeSpeakingId
              ? "Speech is playing — click for voice settings"
              : speechSettings?.autoSpeak
              ? "Voice & Speech (Auto-Speak ON)"
              : "Voice & Speech settings"
          }
          type="button"
        >
          {activeSpeakingId ? (
            <span className="equalizer-bars">
              <span className="bar bar1" />
              <span className="bar bar2" />
              <span className="bar bar3" />
            </span>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
          <span>{speechSettings?.autoSpeak ? "Voice (Auto)" : "Voice"}</span>
        </button>

        {/* New Chat */}
        <button
          className="nav-btn"
          onClick={onNewChat}
          title="Start a new conversation"
          type="button"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>New Chat</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
