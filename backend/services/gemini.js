const DEFAULT_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const DEFAULT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";
const DEFAULT_TIMEOUT_MS = Number.parseInt(process.env.GEMINI_TIMEOUT_MS || "", 10) || 10000;

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

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        reply: null,
        provider: "gemini",
        model: DEFAULT_MODEL,
        error: `Gemini assistant failed: ${response.status} ${errorText}`,
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
        provider: "gemini",
        model: DEFAULT_MODEL,
        error: "assistant reply empty",
      };
    }

    return {
      success: true,
      reply,
      provider: "gemini",
      model: DEFAULT_MODEL,
      error: null,
    };
  } catch (error) {
    const isTimeout = error && (error.name === "AbortError" || error.code === "ABORT_ERR");
    return {
      success: false,
      reply: null,
      provider: "gemini",
      model: DEFAULT_MODEL,
      error: isTimeout ? `assistant timeout after ${DEFAULT_TIMEOUT_MS}ms` : error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  generateGeminiAssistantReply,
};
