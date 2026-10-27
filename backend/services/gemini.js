try {
  require("../utils/env");
} catch (_) {
  try {
    require("dotenv").config();
  } catch (__) {}
}
const DEFAULT_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const DEFAULT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-3.5-flash-lite";
const DEFAULT_TIMEOUT_MS = Number.parseInt(process.env.GEMINI_TIMEOUT_MS || "", 10) || 15000;
const { recordLlmUsage } = require("./api-usage");

async function generateGeminiAssistantReply({ messages, sessionId = null }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      reply: null,
      provider: "gemini",
      model: DEFAULT_MODEL,
      error: "GEMINI_API_KEY not configured",
    };
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      success: false,
      reply: null,
      provider: "gemini",
      model: DEFAULT_MODEL,
      error: "invalid or empty messages history",
    };
  }

  const primaryModel = process.env.GEMINI_CHAT_MODEL || "gemini-2.0-flash";
  // Prioritize active Gemini models and filter out known non-existent model identifiers to avoid delay
  const isKnownInvalidGemini = (m) => m && (m.includes("3.5") || m.includes("2.5"));
  const candidateModels = [
    !isKnownInvalidGemini(primaryModel) ? primaryModel : null,
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    isKnownInvalidGemini(primaryModel) ? primaryModel : null,
  ].filter((m, i, arr) => m && arr.indexOf(m) === i);

  const cleanMessages = messages.map((m) => ({
    role: m.role,
    content: typeof m.content === "string" ? m.content : "",
  }));

  let lastError = null;

  for (const modelToUse of candidateModels) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(DEFAULT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: cleanMessages,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Gemini LLM] Model ${modelToUse} returned ${response.status}: ${errorText.slice(0, 100)}. Trying next candidate...`);
        lastError = `Gemini assistant failed (${modelToUse}): ${response.status} ${errorText}`;
        continue;
      }

      const data = await response.json();
      const reply = typeof data.choices?.[0]?.message?.content === "string" 
        ? data.choices[0].message.content.trim() 
        : "";

      if (!reply) {
        console.warn(`[Gemini LLM] Model ${modelToUse} returned empty reply.`);
        lastError = `Gemini model ${modelToUse} returned empty reply`;
        continue;
      }

      const usage = data.usage || null;
      try {
        recordLlmUsage({
          provider: "gemini",
          model: modelToUse,
          promptTokens: usage?.prompt_tokens ?? null,
          completionTokens: usage?.completion_tokens ?? null,
          totalTokens: usage?.total_tokens ?? null,
        });
      } catch (_) {}

      return {
        success: true,
        reply,
        provider: "gemini",
        model: modelToUse,
        usage: usage,
        error: null,
      };
    } catch (error) {
      const isTimeout = error && (error.name === "AbortError" || error.code === "ABORT_ERR");
      lastError = isTimeout ? `Gemini timeout after ${DEFAULT_TIMEOUT_MS}ms` : error.message;
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    success: false,
    reply: null,
    provider: "gemini",
    model: DEFAULT_MODEL,
    error: lastError || "All Gemini candidate models failed",
  };
}

module.exports = {
  generateGeminiAssistantReply,
};
