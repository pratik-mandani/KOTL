try {
  require("../utils/env");
} catch (_) {
  try {
    require("dotenv").config();
  } catch (__) {}
}
const DEFAULT_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-20b";
const DEFAULT_TIMEOUT_MS = Number.parseInt(process.env.GROQ_TIMEOUT_MS || "", 10) || 8000;
const { recordLlmUsage } = require("./api-usage");

let lastGroqQuota = {
  remainingRequests: null,
  limitRequests: null,
  remainingTokens: null,
  limitTokens: null,
  requestsCountToday: 0,
  lastUpdated: null,
};

function getGroqQuotaStats() {
  return lastGroqQuota;
}

async function generateGroqAssistantReply({ messages, sessionId = null }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      reply: null,
      provider: "groq",
      model: "qwen/qwen3.8-27b",
      error: "GROQ_API_KEY not configured",
    };
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      success: false,
      reply: null,
      provider: "groq",
      model: "qwen/qwen3.8-27b",
      error: "invalid or empty messages history",
    };
  }

  const primaryModel = process.env.GROQ_CHAT_MODEL || "qwen/qwen3.8-27b";
  // Always prioritize the configured primary model first, followed by supported Groq candidate models
  const candidateModels = [
    primaryModel,
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
  ].filter((m, i, arr) => m && arr.indexOf(m) === i);

  let lastError = null;

  for (const modelToUse of candidateModels) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const cleanMessages = messages.map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : "",
      }));

      const response = await fetch(DEFAULT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: cleanMessages,
          max_tokens: 300,
          temperature: 0.3,
          stream: false,
        }),
        signal: controller.signal,
      });

      // Capture dynamic rate limit telemetry from Groq headers
      if (response.headers) {
        const remReq = response.headers.get("x-ratelimit-remaining-requests");
        const limReq = response.headers.get("x-ratelimit-limit-requests");
        const remTok = response.headers.get("x-ratelimit-remaining-tokens");
        const limTok = response.headers.get("x-ratelimit-limit-tokens");

        if (remReq) lastGroqQuota.remainingRequests = remReq;
        if (limReq) lastGroqQuota.limitRequests = limReq;
        if (remTok) lastGroqQuota.remainingTokens = remTok;
        if (limTok) lastGroqQuota.limitTokens = limTok;
        lastGroqQuota.requestsCountToday += 1;
        lastGroqQuota.lastUpdated = new Date().toISOString();
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Groq LLM] Model ${modelToUse} returned ${response.status}: ${errorText.slice(0, 150)}. Trying next candidate model...`);
        lastError = `Groq assistant failed (${modelToUse}): ${response.status} ${errorText}`;
        continue;
      }

      const data = await response.json();
      const reply = typeof data.choices?.[0]?.message?.content === "string" 
        ? data.choices[0].message.content.trim() 
        : "";

      if (!reply) {
        console.warn(`[Groq LLM] Model ${modelToUse} returned empty reply. Trying next candidate model...`);
        lastError = `Groq model ${modelToUse} returned empty reply`;
        continue;
      }

      console.log(`[Groq LLM Output (${modelToUse})]: ${reply}`);

      const usage = data.usage || null;
      try {
        recordLlmUsage({
          provider: "groq",
          model: modelToUse,
          promptTokens: usage?.prompt_tokens ?? null,
          completionTokens: usage?.completion_tokens ?? null,
          totalTokens: usage?.total_tokens ?? null,
          headers: response.headers,
        });
      } catch (_) {}

      return {
        success: true,
        reply,
        provider: "groq",
        model: modelToUse,
        usage: usage,
        error: null,
      };
    } catch (err) {
      lastError = err.message;
      const isTimeout = err.name === "AbortError" || String(err.message || "").toLowerCase().includes("aborted");
      console.warn(`[Groq LLM] Fetch exception on ${modelToUse}: ${err.message}. ${isTimeout ? "Aborting candidate loop due to timeout." : "Trying next candidate model..."}`);
      if (isTimeout) {
        break;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    success: false,
    reply: null,
    provider: "groq",
    model: primaryModel,
    error: lastError || "All candidate Groq models failed",
  };
}

module.exports = {
  generateGroqAssistantReply,
  getGroqQuotaStats,
};
