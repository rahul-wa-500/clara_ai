# 📖 Clara AI - Project Documentation & Code Guide

Welcome! This guide explains the structure, architecture, and step-by-step code implementation of **Clara AI**. Everything has been organized into a clean, industry-standard React folder structure to stay simple, modular, and easy to maintain while matching your carbon-black theme with neon pink accents.

---

## 📁 1. Project Directory Structure

Here is how your project is organized:

```text
Clara/
├── index.html                   # HTML entry point
├── package.json                 # Project dependencies & scripts
├── vite.config.js               # Vite build configuration
├── config/
│   └── gemini.js                  # Express API server; keeps the Gemini key server-side
├── PROJECT_EXPLANATION.md       # This complete architecture & code guide
└── src/
    ├── main.jsx                 # Mounts the React application to #root
    ├── index.css                # Global CSS reset, font imports & dark background
    ├── App.jsx                  # Main coordinator (state, storage & API flow)
    ├── App.css                  # Full-screen layout container styling
    │
    ├── components/              # 📂 ALL UI COMPONENTS
    │   ├── Clara/               # Main chat window component
    │   │   ├── Clara.jsx
    │   │   └── Clara.css
    │   │
    │   ├── Navbar/              # Top header with sidebar toggle button & branding
    │   │   ├── Navbar.jsx
    │   │   └── Navbar.css
    │   │
    │   ├── Sidebar/             # Collapsible sidebar with Recents & Saved chats
    │   │   ├── Sidebar.jsx
    │   │   └── Sidebar.css
    │   │
    │   ├── FormattedResponse/   # Formats AI answers (code blocks, bold, lists, copy & speech buttons)
    │   │   ├── FormattedResponse.jsx
    │   │   └── FormattedResponse.css
    │   │
    │   └── VoiceSettings/       # 🎙️ Voice & Speech Options Modal (voice selector, speed, pitch, auto-speak)
    │       ├── VoiceSettingsModal.jsx
    │       └── VoiceSettingsModal.css
    │
    ├── services/                # 📂 EXTERNAL APIS & SERVICES
    │   └── gemini.js            # Sends chat requests to the local API server
    │
    └── utils/                   # 📂 HELPER UTILITIES
        ├── chatStorage.js       # Handles browser localStorage for saving & loading chats
        ├── speechService.js     # 🎙️ SpeechSynthesis engine, markdown text cleaning & sentence chunking
        ├── voiceInputService.js # 🎙️ SpeechRecognition and language detection
        └── aiIdentity.js        # AI persona & identity responses (Rahulwa Designed this Ai)
```

### Why this structure is clean and standard:
1. **`components/`**: All UI components live in one place. Each component has its own dedicated folder containing its `.jsx` logic and `.css` styling paired together.
2. **`services/`**: API calls, network requests, and external AI integrations (e.g., `gemini.js`) live separate from the UI components.
3. **`utils/`**: Generic helper functions (e.g., `chatStorage.js` for `localStorage`) live in their own clean utility folder.
4. **Root of `src/`**: Remains uncluttered with only `App.jsx`, `App.css`, `main.jsx`, and `index.css`.

---

## 🧩 2. What Each File Does & Code Explanation

### 2.1. `src/utils/chatStorage.js` (Persistent Chat Storage)
**Purpose:** Saves your conversations in the user's browser via `localStorage` so chats are **never lost when you refresh or close the page**.

**Key Functions:**
- `loadChatsFromStorage()`: Reads stored chats from `localStorage`. If no history exists, it safely returns an empty array `[]`.
- `saveChatsToStorage(chats)`: Converts your chat array into JSON and saves it in `localStorage`.
- `getStoredActiveChatId()` / `setStoredActiveChatId(id)`: Remembers which conversation you currently have open.
- `createNewChatObject(title)`: Creates a new chat object structure:
  ```javascript
  {
    id: "chat_172927...",      // Unique ID for the chat
    title: "How to code...",    // Title derived from first prompt
    createdAt: "...",           // Timestamp
    updatedAt: "...",           // Last updated timestamp
    isSaved: false,             // true when you click the star ⭐
    messages: []                // Array containing all conversation messages
  }
  ```

---

### 2.2. `src/components/Sidebar/Sidebar.jsx` & `Sidebar.css` (The Sidebar)
**Purpose:** Gives you a modern AI sidebar (like ChatGPT or Gemini) to manage all your chats.

**Features Included:**
1. **Brand Header**: Displays the Clara logo badge `C` and a collapse/close button.
2. **"New Chat" Button**: Click to start a fresh discussion at any time.
3. **Tabs ("Recents" vs "Saved")**:
   - **Recents Tab**: Shows all your conversations sorted chronologically with timestamps.
   - **Saved Tab**: Shows only conversations where you clicked the Star ⭐ button.
4. **Search Bar**: Lets you filter your chat history instantly by typing keywords.
5. **Chat Item Actions**:
   - **Click Chat**: Opens that conversation in the main chat view.
   - **Star Button (⭐)**: Stars or un-stars the chat to bookmark it in "Saved".
   - **Trash Button (🗑️)**: Deletes that individual conversation with confirmation.
6. **Footer**:
   - **Clear History Button**: Allows resetting all past chats with a confirmation alert.
7. **Responsive & Collapsible**:
   - Can collapse smoothly to 0 width.
   - On mobile screens, slides in over an overlay backdrop.

---

### 2.3. `src/components/FormattedResponse/FormattedResponse.jsx` & `FormattedResponse.css`
**Purpose:** Makes Clara's AI responses look clean, readable, and structured instead of raw unformatted text.

**What It Formats:**
- **Code Blocks**:
  When Gemini responds with code (e.g. ` ```javascript ... ``` `):
  - Renders inside a sleek dark code box.
  - Displays the code language badge (e.g. `JAVASCRIPT`, `PYTHON`, `HTML`).
  - Includes a dedicated **"Copy code"** button that copies just that snippet to clipboard.
- **Headings**:
  Translates `#`, `##`, `###` into nicely styled title text.
- **Lists**:
  Converts bullet points (`* item` or `- item`) and numbered lists into neat indented lists.
- **Bold Text & Inline Code**:
  Renders `**bold**` with bold contrast and `` `inline code` `` with a soft gray badge.
- **Copy Response Button**:
  Provides a one-click button at the bottom of Clara's message to copy the entire response.

---

### 2.4. `src/components/Clara/Clara.jsx` & `Clara.css` (Main Chat View)
**Purpose:** Displays the conversation messages, starter cards, loading indicator, and input box.

**Key Elements:**
1. **Chat Meta Bar**:
   - Appears at the top of an active chat showing the chat title, message count, and a quick **"Save Chat"** bookmark button.
2. **Starter Cards (Empty Chat State)**:
   - When you start a New Chat, you are greeted with a welcome message and your signature **3 cards**:
     1. *Learn*: "How neural networks work in simple terms"
     2. *Code*: "React component for a responsive navbar"
     3. *Productivity*: "5 actionable tips for developers"
   - Clicking any card immediately sends the question or starts your chat!
3. **Continuous Conversation Thread**:
   - Preserves the **full conversation thread**!
   - Displays user messages with a pink **"You"** badge.
   - Displays Clara's responses with an AI dot indicator and formatted text.
4. **Loading State**:
   - Keeps your custom loading text: `"Ruko bhai sochne do..."` with animated bouncing dots and a pulsing neon pink dot!
5. **Auto-Scroll**:
   - Automatically scrolls smoothly to the latest message as soon as Clara replies.
6. **Input Box**:
   - Accepts prompt text, submits on **Enter** or on clicking the pink Send arrow button.

---

### 2.5. `src/components/Navbar/Navbar.jsx` & `Navbar.css`
**Purpose:** Top navigation bar.

**Enhancements:**
- Added a **Sidebar Toggle Hamburger Button** on the left. If you collapse the sidebar, you can click this button at any time to reopen it.
- Shows an active conversation pill tag displaying the current chat topic.
- Has a quick **"New Chat"** button in the top menu.
- Fixed layout width to `100%` with blur backdrop to avoid horizontal scrollbar issues.

---

### 2.6. `src/services/gemini.js` (Gemini API Integration)
**Purpose:** Sends the prompt, conversation history, and detected language to the same-origin `/api/chat` endpoint. In development, Vite proxies that request to the Express server in `config/gemini.js`; the Google Gemini API key stays on the server and is not included in the frontend bundle. The server tries its configured models in order and returns the generated text answer.

**Server setup:** Copy `.env.example` to `.env` and replace the placeholder with a valid Google Gemini API key. Keep `.env` local; it is ignored by Git.

For local development, leave `VITE_API_BASE_URL` empty so Vite uses its `/api` proxy. For production, deploy the Express API and Vite frontend separately:

1. Deploy the API with `npm start`. Configure `GEMINI_API_KEY` as a secret environment variable and `PORT` if required by the host.
2. Set the API's `CORS_ORIGIN` to the frontend's exact origin (for example, `https://clara.example.com`). Multiple origins can be comma-separated. The default allows only `http://localhost:5173`.
3. Build the frontend with `VITE_API_BASE_URL` set to the deployed API's base URL (for example, `https://clara-api.example.com`), then publish the generated `dist/` directory using a static host.
4. Verify the deployed API's `/api/health` endpoint and test a chat request from the deployed frontend.

Never put `GEMINI_API_KEY` in a `VITE_` variable or in frontend hosting settings; only the backend should receive it. `.gitignore` excludes `.env`, dependency folders, and build output; commit `.env.example` as the safe configuration template. Rotate any API key that has been shared publicly.

---

### 2.7. `src/utils/aiIdentity.js` (AI Persona & Identity Responses)
**Purpose:** Handles custom, deterministic persona and identity responses before sending queries over the network.

**Key Behaviors:**
- Responds specifically to questions like *"Who are you?"*, *"What is your name?"*, *"Who made you?"*, *"Who designed this AI?"*, *"Who is Rahulwa?"*, and general AI identity queries.
- Ensures Clara reliably replies with: **"My name is Clara and Rahulwa Designed this Ai."**
- Provides fast, offline-capable responses without consuming Gemini API tokens.
- Supports English and Hindi/Hinglish phrasing (e.g., *"tum kaun ho"*, *"tumhe kisne banaya"*).

---

### 2.8. `src/App.jsx` (Application State Coordinator)
**Purpose:** Connects all parts together cleanly.

**How the Data Flows:**
1. Loads `chats` from `localStorage` using `loadChatsFromStorage()`.
2. Manages `activeChatId` (which chat is currently open).
3. When the user sends a message in `Clara`:
   - If it's a new conversation, it generates a new chat object, titles it from the first prompt, adds the user message, and adds it to `chats`.
   - If it's an existing conversation, it appends the user message to that chat.
   - It sets `loading = true`.
   - It calls `generateGeminiResponse(promptText, historyMessages, currentLang)` from `services/gemini.js`.
   - It appends Clara's answer to the chat's messages.
   - It saves everything to `localStorage` via `saveChatsToStorage()`.
   - It sets `loading = false`.
4. Handles deleting chats, toggling stars/saves, and clearing history.
5. Manages speech synthesis playback state (`activeSpeakingId`), speech settings, and voice modal visibility.

---

### 2.9. 🎙️ Voice & Speech Features (`src/utils/speechService.js` & `VoiceSettingsModal`)
**Purpose:** Provides full Text-to-Speech (TTS) capabilities for Clara's AI responses.

**Key Capabilities:**
1. **Per-Response Speech ("Listen" / "Stop" Button)**:
   - Each Clara response features a **"Listen"** button alongside the **"Copy"** button in the message action bar.
   - Clicking **"Listen"** begins clear, fluent audio narration of Clara's response.
   - While audio plays, the button transitions to **"Stop"** with an animated pulsing equalizer wave.
   - Clicking **"Stop"** immediately halts speech.
   - Seamlessly cancels previous speech if the user plays another response or switches conversations.

2. **Smart Markdown Text Preprocessing**:
   - Strips code blocks, markdown symbols (`**bold**`, `*italic*`, `### headers`, `> blockquotes`, `- lists`, `[links]`) before speaking so Clara never awkwardly recites brackets, hashtags, or raw code syntax.

3. **Chromium Long-Text Sentence Chunking**:
   - Splits long responses into natural sentence chunks to eliminate Chrome's known 15-second utterance pause bug, ensuring uninterrupted narration of long answers.

4. **Global Voice & Speech Options Modal**:
   - Accessible via the **Voice** button in the Navbar and beside the prompt input box.
   - **Auto-Read Responses**: Toggle switch to have Clara automatically speak all new answers out loud as soon as they arrive.
   - **Voice Selector**: Dynamically lists all installed browser/system voices (with natural/English prioritization).
   - **Speech Speed (Rate)**: Slider from 0.7x to 1.5x with quick presets (0.8x Slow, 1.0x Normal, 1.2x Fast).
   - **Pitch Adjuster**: Slider to customize the tone of Clara's voice.
   - **Voice Preview Button**: Lets you preview how Clara sounds with the current settings.
   - Preferences are automatically saved in `localStorage`.

---

## 🎨 3. Design & Theme Consistency

The application uses a minimal monochrome design:
- **Background:** Black with near-black surfaces and white text.
- **Components:** Clean surfaces without visible borders or logo backgrounds.
- **Typography:** Google Font `'Poppins', sans-serif` for clean readability.
- **Interactions:** Subtle hover states, smooth sidebar transitions, and copy feedback ("Copied!").

---

## 🚀 4. How to Run & Test

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and add your Gemini API key.
3. Start the API server and frontend together:
   ```bash
   npm run dev
   ```
4. Open the URL printed by Vite (normally `http://localhost:5173/`).

The development command waits for the API health check before starting Vite, preventing proxy errors when the backend is not ready. The API uses port `5000` by default; set `PORT` in `.env` to change it. Production hosting is provider-specific; no deployment provider or infrastructure is configured in this repository.

Run the available checks before shipping:
```bash
npm run lint
npm run build
```
