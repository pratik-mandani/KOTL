require("dotenv").config();
const DEFAULT_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-120b";
const DEFAULT_TIMEOUT_MS = Number.parseInt(process.env.GROQ_TIMEOUT_MS || "", 10) || 15000;

let lastGroqQuota = {
  remainingRequests: "14,380",
  limitRequests: "14,400",
  remainingTokens: "498,200",
  limitTokens: "500,000",
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
      model: DEFAULT_MODEL,
      error: "GROQ_API_KEY not configured",
    };
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      success: false,
      reply: null,
      provider: "groq",
      model: DEFAULT_MODEL,
      error: "invalid or empty messages history",
    };
  }

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
        model: DEFAULT_MODEL,
        messages: messages,
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
      return {
        success: false,
        reply: null,
        provider: "groq",
        model: DEFAULT_MODEL,
        error: `Groq assistant failed: ${response.status} ${errorText}`,
      };
    }

    const data = await response.json();
    const reply = typeof data.choices?.[0]?.message?.content === "string" 
      ? data.choices[0].message.content.trim() 
      : "";

    if (!reply) {
      return {
        success: false,
        reply: null,
        provider: "groq",
        model: DEFAULT_MODEL,
        error: "assistant reply empty",
      };
    }

    console.log(`[Groq LLM Output]: ${reply}`);

    return {
      success: true,
      reply,
      provider: "groq",
      model: DEFAULT_MODEL,
      error: null,
    };
  } catch (error) {
    const isTimeout = error && (error.name === "AbortError" || error.code === "ABORT_ERR");
    return {
      success: false,
      reply: null,
      provider: "groq",
      model: DEFAULT_MODEL,
      error: isTimeout ? `assistant timeout after ${DEFAULT_TIMEOUT_MS}ms` : error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  generateGroqAssistantReply,
  getGroqQuotaStats,
};
