/**
 * AI Identity and Persona Response Handler for Clara AI
 * 
 * Provides predefined, deterministic responses for queries related to:
 * - Who Clara is ("who are you", "what is your name", "tell me about yourself")
 * - Who created/designed Clara ("who made you", "who designed this ai", "who is your developer")
 * - Who Rahulwa is ("who is rahulwa", "who is rahul")
 * - AI nature and capabilities ("are you an ai", "what are you", "what model are you")
 * - Hindi / Hinglish equivalents ("tum kaun ho", "tumhe kisne banaya", "tumhara naam kya hai")
 */

/**
 * Normalizes input text: lowercases, replaces non-alphanumeric unicode characters with spaces,
 * and collapses multiple spaces.
 */
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks if a given user prompt is an identity or creator query.
 * @param {string} prompt - The raw user input message.
 * @returns {string | null} - The predefined response, or null if it should be handled by Gemini API.
 */
export function getIdentityResponse(prompt) {
  if (!prompt || typeof prompt !== "string") return null;

  const clean = normalize(prompt);
  if (!clean) return null;

  // 1. Queries specifically about Rahulwa
  const rahulPatterns = [
    /\bwho\s+is\s+rahulwa\b/,
    /\bwho\s+is\s+rahul\b/,
    /\btell\s+me\s+about\s+rahulwa\b/,
    /\b(rahulwa|rahul)\s+(kaun|kon)\s+(hai|h)\b/,
  ];
  for (const pattern of rahulPatterns) {
    if (pattern.test(clean)) {
      return `**Rahulwa** is my creator and developer who designed this AI!\n\nHe built and designed me (**Clara**) to assist you with coding, learning, problem-solving, and answering your questions with high speed and accuracy.`;
    }
  }

  // 2. Who made you / who designed you / who created you
  const creatorPatterns = [
    /\b(who|hu)\s+(made|make|created|create|designed|design|built|build|developed|develop|coded|code|programmed|program)\s+(you|u|clara|this\s+ai|this\s+bot|this\s+app|this\s+website|this)\b/,
    /\b(who|hu)\s+is\s+(your|ur)\s+(creator|maker|developer|designer|author|builder|programmer|founder|boss|owner|father|parent|master)\b/,
    /\b(who|hu)\s+(owns|created|designed|built|coded|developed|made)\s+(you|u|clara)\b/,
    /\b(who|hu)\s+is\s+the\s+(creator|maker|developer|designer|author|builder)\s+of\s+(clara|this\s+ai|this\s+bot|you)\b/,
    /\b(who|hu)\s+(designed|made|built|created)\s+(this|the)\s+ai\b/,
    /\b(tell\s+me\s+)?who\s+(made|created|designed|built|developed)\s+(you|u|clara)\b/,
    // Hindi / Hinglish
    /\b(kisne|kine)\s+(banaya|design\s+kiya|build\s+kiya|create\s+kiya|develop\s+kiya)\s*(hai)?\s*(tumhe|tumko|aapko|tujhe|ye\s+ai|is\s+ai\s+ko)?\b/,
    /\b(tumhe|tumko|aapko|tujhe)\s+(kisne|kine)\s+(banaya|design\s+kiya|create\s+kiya)\b/,
    /\b(tumhara|apka|tera)\s+(creator|developer|maker|designer|malik|baap)\s+(kaun|kon)\s+(hai|h)\b/,
  ];

  for (const pattern of creatorPatterns) {
    if (pattern.test(clean)) {
      return `**Rahulwa Designed this Ai!**\n\nMy name is **Clara**, and I was designed and developed by **Rahulwa** to be your personal, intelligent AI assistant. Whether you need help coding, learning, problem-solving, or brainstorming ideas, Rahulwa built me to assist you!`;
    }
  }

  // 3. Name & Identity: who are you / what is your name / introduce yourself / tell me about yourself
  const identityPatterns = [
    /\bwho\s+(are|r)\s+(you|u)\b/,
    /\bwho\s+(you|u)\s+are\b/,
    /\bwhat\s+is\s+(your|ur)\s+name\b/,
    /\bwhat\s*s\s+(your|ur)\s+name\b/,
    /\bwhats\s+(your|ur)\s+name\b/,
    /\btell\s+me\s+(your|ur)\s+name\b/,
    /\b(your|ur)\s+name\s+please\b/,
    /\bwhat\s+should\s+i\s+call\s+(you|u)\b/,
    /\bwho\s+is\s+clara\b/,
    /\bwhat\s+is\s+clara\b/,
    /\btell\s+me\s+about\s+(yourself|clara|you)\b/,
    /\bintroduce\s+(yourself|clara)\b/,
    /\bwho\s+(are|r)\s+(you|u)\s+and\s+who\s+(made|designed|created)\s+(you|u)\b/,
    // Hindi / Hinglish
    /\b(tum|aap|tu)\s+(kaun|kon)\s+(ho|hai|h)\b/,
    /\b(kaun|kon)\s+(ho|hai|h)\s+(tum|aap|tu)\b/,
    /\b(tumhara|apka|tera)\s+naam\s+(kya|kya\s+h|kya\s+hai)\b/,
    /\bapna\s+naam\s+batao\b/,
    /\bnaam\s+kya\s+hai\b/,
  ];

  for (const pattern of identityPatterns) {
    if (pattern.test(clean)) {
      return `**My name is Clara and Rahulwa Designed this Ai.**\n\nI am your friendly and intelligent AI assistant. Rahulwa built me to assist you with:\n- 💻 **Coding & Debugging** — write clean code, troubleshoot errors, and understand frameworks.\n- 💡 **Learning & Explanations** — break down complex topics into simple steps.\n- 🚀 **Productivity & Brainstorming** — draft ideas, write content, and organize tasks.\n\nHow can I help you today?`;
    }
  }

  // 4. Are you an AI / What are you / What model are you / Are you a bot / robot / human
  const naturePatterns = [
    /\b(are|r)\s+(you|u)\s+(an\s+ai|ai|a\s+robot|a\s+bot|human|real)\b/,
    /\bwhat\s+(are|r)\s+(you|u)\b/,
    /\bwhat\s+kind\s+of\s+ai\s+are\s+(you|u)\b/,
    /\bwhat\s+model\s+are\s+(you|u)\b/,
    /\bwhat\s+is\s+(your|ur)\s+model\b/,
    /\bkya\s+(tum|aap)\s+(ai|robot|bot)\s+(ho|hai)\b/,
  ];

  for (const pattern of naturePatterns) {
    if (pattern.test(clean)) {
      return `Yes! **My name is Clara and Rahulwa Designed this Ai.**\n\nI am an artificial intelligence designed to assist, chat, and help you solve problems, write code, and learn anything new. What can I do for you today?`;
    }
  }

  // 5. Catch-all for AI identity targeting Clara/You
  const targetsMe = /\b(you|u|your|ur|clara)\b/.test(clean);
  if (targetsMe) {
    const asksIdentity = /\b(identity|who|creator|maker|developer|designer)\b/.test(clean);
    const mentionsCreation = /\b(made|created|designed|built|developed)\b/.test(clean);
    if (asksIdentity && (clean.startsWith("who") || mentionsCreation || clean.includes("name"))) {
      return `**My name is Clara and Rahulwa Designed this Ai.**\n\nFeel free to ask me anything — from coding questions to general knowledge, I am here to help you!`;
    }
  }

  return null;
}

export default getIdentityResponse;
