import process from "node:process";
import { GoogleGenAI } from "@google/genai";
import { getIdentityResponse } from "../utils/aiIdentity.js";

const MODELS = ["gemma-4-31b-it", "gemma-4-26b-a4b-it"];
let ai;

const buildSystemInstruction = (detectedLang = "en") => {
  const langNote =
    detectedLang === "hi" || detectedLang === "hi-Latn"
      ? "The user appears to be communicating in Hindi or Hinglish. Respond in the same language and style."
      : detectedLang !== "en"
        ? `The user appears to be communicating in language code: ${detectedLang}. Respond in the same language.`
        : "";

  return (
    "You are Clara, an intelligent, friendly, and helpful AI assistant designed and created by Rahulwa.\n" +
    "Always detect the language of the user's message and respond in exactly the same language, style, tone, and level of formality.\n" +
    (langNote ? `${langNote}\n` : "") +
    'If asked about your identity, name, or creator, say: "My name is Clara and Rahulwa Designed this AI."\n' +
    "Be concise, accurate, and helpful."
  );
};

function getGeminiClient() {
  if (ai) return ai;

  const rawKey = process.env.GEMINI_API_KEY || "";
  const cleanedKey = rawKey.replace(/^["']|["';\s]+$/g, "");
  if (!cleanedKey) return null;

  ai = new GoogleGenAI({ apiKey: cleanedKey });
  return ai;
}

export async function handleGeminiChat(req, res) {
  try {
    const body =
      req.body && typeof req.body === "object" && !Array.isArray(req.body)
        ? req.body
        : {};
    const { prompt, history = [], detectedLang = "en" } = body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Please enter a prompt." });
    }
    if (
      !Array.isArray(history) ||
      !history.every(
        (message) =>
          message &&
          ["user", "assistant"].includes(message.role) &&
          typeof message.content === "string",
      )
    ) {
      return res.status(400).json({ error: "Invalid conversation history." });
    }

    const identityReply = getIdentityResponse(prompt);
    if (identityReply) {
      return res.json({ reply: identityReply });
    }

    const client = getGeminiClient();
    if (!client) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured for this deployment.",
      });
    }

    const contents = history.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
    contents.push({ role: "user", parts: [{ text: prompt }] });

    let response;
    let lastError;
    for (const model of MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          response = await client.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: buildSystemInstruction(detectedLang),
              temperature: 0.85,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            },
          });
          if (response.text) break;
          lastError = new Error("Empty response from model.");
        } catch (error) {
          lastError = error;
          if (Number(error?.status) < 500 || attempt === 1) break;
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
      if (response?.text) break;
    }

    if (!response?.text) {
      throw lastError || new Error("Could not generate a response.");
    }

    return res.json({ reply: response.text });
  } catch (error) {
    console.error("Gemini request failed:", error);
    const status = Number(error?.status || error?.statusCode);
    let message = "Gemini could not generate a response. Please try again.";

    if (status === 400) {
      message =
        "Gemini rejected the request. Please check the prompt and conversation history.";
    } else if (status === 401 || status === 403) {
      message =
        "Gemini API authentication failed. Check that GEMINI_API_KEY is valid and has access to the selected models.";
    } else if (status === 404) {
      message =
        "The configured Gemini models are unavailable. Check the model names in src/server/geminiChat.js.";
    } else if (status === 429) {
      message =
        "Gemini API quota or rate limit reached. Check your Google AI Studio quota and try again later.";
    } else if (status >= 500) {
      message = "The Gemini service is temporarily unavailable. Please try again later.";
    }

    const responseStatus =
      status === 429 ? 429 : status >= 500 ? 503 : 500;
    return res.status(responseStatus).json({ error: message });
  }
}
