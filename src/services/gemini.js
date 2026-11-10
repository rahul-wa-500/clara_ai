import { getIdentityResponse } from "../utils/aiIdentity.js";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

/**
 * Generates a Gemini AI response.
 *
 * @param {string} prompt - The latest user message
 * @param {Array<{role: string, content: string}>} history - Prior conversation messages
 * @param {string} detectedLang - BCP 47 language hint (e.g. "hi", "en", "hi-Latn")
 * @returns {Promise<string>} - AI reply text
 */
export async function generateGeminiResponse(
  prompt,
  history = [],
  detectedLang = "en"
) {
  // Built-in identity responses (instant, no API call)
  const identityReply = getIdentityResponse(prompt);
  if (identityReply) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return identityReply;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, history, detectedLang }),
    });
  } catch (error) {
    throw new Error(
      "Could not connect to Clara's API. Check that the API server is running and that VITE_API_BASE_URL is configured correctly. For local development, run `npm run server`.",
      { cause: error }
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    const message = response.ok
      ? `Server returned invalid JSON (HTTP ${response.status}).`
      : `API request failed (HTTP ${response.status}).`;
    throw new Error(message);
  }

  if (!response.ok) {
    const message =
      typeof data?.error === "string" && data.error.trim()
        ? data.error
        : `API request failed (HTTP ${response.status}).`;
    throw new Error(message);
  }

  if (typeof data?.reply !== "string" || !data.reply.trim()) {
    throw new Error("Server returned an empty or invalid reply.");
  }

  return data.reply;
}

export default generateGeminiResponse;
