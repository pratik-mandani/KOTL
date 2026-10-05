const DEFAULT_OLLAMA_URL = process.env.OLLAMA_API_URL || "http://localhost:11434/api/generate";
const DEFAULT_MODEL = process.env.OLLAMA_CHAT_MODEL || "llama3.2:3b";
const DEFAULT_ASSISTANT_NAME = process.env.KOTL_ASSISTANT_NAME || "KOTL";
const DEFAULT_TIMEOUT_MS = Number.parseInt(process.env.OLLAMA_TIMEOUT_MS || process.env.OPENAI_TIMEOUT_MS || "", 10) || 60000;

function buildSystemPrompt() {
  return [
    `You are ${DEFAULT_ASSISTANT_NAME}, a small friendly robot assistant.`,
    "Reply warmly, simply, and helpfully.",
    "Keep every reply voice-friendly and concise.",
    "Use a maximum of 2 sentences.",
    "Do not use markdown, bullet points, code blocks, or roleplay actions.",
    "Match the user's language style.",
    "Gujarati input should get a Gujarati reply.",
    "Hinglish input should get a Hinglish reply.",
    "English input should get an English reply.",
  ].join(" ");
}

async function generateOllamaAssistantReply({ transcript, sessionId = null }) {
  if (typeof transcript !== "string" || transcript.trim().length === 0) {
    return {
      success: false,
      reply: null,
      provider: "ollama",
      model: DEFAULT_MODEL,
      error: "empty transcript",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const prompt = sessionId
    ? `Session ID: ${sessionId}\nUser said: ${transcript}`
    : `User said: ${transcript}`;

  try {
    const response = await fetch(DEFAULT_OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt,
        system: buildSystemPrompt(),
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        reply: null,
        provider: "ollama",
        model: DEFAULT_MODEL,
        error: `Ollama assistant failed: ${response.status} ${errorText}`,
      };
    }

    const data = await response.json();
    const reply = typeof data.response === "string" ? data.response.trim() : "";

    if (!reply) {
      return {
        success: false,
        reply: null,
        provider: "ollama",
        model: DEFAULT_MODEL,
        error: "assistant reply empty",
      };
    }

    return {
      success: true,
      reply,
      provider: "ollama",
      model: DEFAULT_MODEL,
      error: null,
    };
  } catch (error) {
    const isTimeout = error && (error.name === "AbortError" || error.code === "ABORT_ERR");
    return {
      success: false,
      reply: null,
      provider: "ollama",
      model: DEFAULT_MODEL,
      error: isTimeout ? `assistant timeout after ${DEFAULT_TIMEOUT_MS}ms` : error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  generateOllamaAssistantReply,
};
