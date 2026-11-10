import { handleGeminiChat } from "../src/server/geminiChat.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  return handleGeminiChat(req, res);
}
