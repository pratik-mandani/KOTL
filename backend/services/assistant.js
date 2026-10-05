const fs = require("fs");
const path = require("path");
const { generateOllamaAssistantReply } = require("./ollama");
const { generateGroqAssistantReply } = require("./groq");
const { generateGeminiAssistantReply } = require("./gemini");

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = Number.parseInt(process.env.OPENAI_TIMEOUT_MS || "", 10) || 15000;

// Persistent Session Storage (sessionId -> Array of messages)
const SESSIONS_FILE = path.join(__dirname, "..", "uploads", "sessions.json");
const sessionHistories = new Map();

function loadSessionsFromDisk() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8"));
      for (const [key, val] of Object.entries(data)) {
        if (Array.isArray(val)) {
          sessionHistories.set(key, val);
        }
      }
      console.log(`[Assistant] Loaded ${sessionHistories.size} persistent sessions from disk.`);
    }
  } catch (err) {
    console.warn("[Assistant] Warning loading sessions from disk:", err.message);
  }
}

function saveSessionsToDisk() {
  try {
    const obj = {};
    for (const [key, val] of sessionHistories.entries()) {
      obj[key] = val;
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Assistant] Warning saving sessions to disk:", err.message);
  }
}

// Load existing sessions at startup
loadSessionsFromDisk();

function buildSystemPrompt() {
  return `You are KOTL, a highly intelligent, polite, friendly, and quick-witted AI voice assistant.
Your goal is to converse smoothly and naturally with the user in Gujarati or English.

Core Conversation & Language Rules:
1. Gujarati / Gujlish:
   - If the user speaks or writes in Gujarati (whether in Gujarati script like "કેમ છો" or Latin/Gujlish like "kem cho", "taru naam su che", "tane kone banavyo", "su chale che", "mane guide kar"):
   - ALWAYS reply in authentic, pure, fluent Gujarati script (ગુજરાતી).
   - Use a natural, sweet, and helpful Gujarati conversational tone (e.g. "હું એકદમ મજામાં છું! તમે કેમ છો?", "મારું નામ KOTL છે. હું તમારો સ્માર્ટ વોઇસ આસિસ્ટન્ટ છું.").
   - Never output broken sentences or robotic translations.

2. English:
   - If the user asks in English: Reply in natural, crisp English.

3. Voice Synthesis Formatting:
   - Keep answers concise and natural for voice speech (1 to 2 sentences, 10 to 30 words).
   - Strictly avoid markdown formatting (no asterisks, hash signs, bullet points) and emojis.`;
}

function extractOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim().length > 0) {
    return data.output_text.trim();
  }

  if (!Array.isArray(data.output)) {
    return "";
  }

  const parts = [];
  for (const item of data.output) {
    if (!Array.isArray(item.content)) {
      continue;
    }

    for (const contentItem of item.content) {
      if (contentItem.type === "output_text" && typeof contentItem.text === "string") {
        parts.push(contentItem.text);
      }
    }
  }

  return parts.join("").trim();
}

async function generateOpenAIAssistantReply({ messages, sessionId = null }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      reply: null,
      provider: "openai",
      model: DEFAULT_MODEL,
      error: "OPENAI_API_KEY not configured",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        input: messages,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        reply: null,
        provider: "openai",
        model: DEFAULT_MODEL,
        error: `OpenAI assistant failed: ${response.status} ${errorText}`,
      };
    }

    const data = await response.json();
    const reply = extractOutputText(data);

    if (!reply) {
      return {
        success: false,
        reply: null,
        provider: "openai",
        model: DEFAULT_MODEL,
        error: "assistant reply empty",
      };
    }

    return {
      success: true,
      reply,
      provider: "openai",
      model: DEFAULT_MODEL,
      error: null,
    };
  } catch (error) {
    const isTimeout = error && (error.name === "AbortError" || error.code === "ABORT_ERR");
    return {
      success: false,
      reply: null,
      provider: "openai",
      model: DEFAULT_MODEL,
      error: isTimeout ? `assistant timeout after ${DEFAULT_TIMEOUT_MS}ms` : error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// Helper to manually clear or reset history for testing/timeout
function resetSessionHistory(sessionId) {
  if (sessionId) {
    sessionHistories.delete(sessionId);
    saveSessionsToDisk();
    console.log(`[Session ${sessionId}] History cleared.`);
  }
}

function getSessionHistory(sessionId) {
  const historyKey = sessionId || "default-session";
  const rawHistory = sessionHistories.get(historyKey) || [];
  // Return user and assistant messages (omit system prompt)
  return rawHistory
    .filter(m => m.role === "user" || m.role === "assistant")
    .map(m => ({ role: m.role, content: m.content }));
}

async function generateAssistantReply({ transcript, sessionId = null }) {
  const systemPrompt = buildSystemPrompt();
  const normalizedTranscript = typeof transcript === "string" ? transcript.trim() : "";

  if (!normalizedTranscript) {
    return {
      success: true,
      reply: "My ears detect only silence or static. Speak more clearly, or check my microphone wiring.",
      provider: "groq",
      model: null,
      error: null,
    };
  }

  // Resolve or initialize session history
  const historyKey = sessionId || "default-session";
  let history = sessionHistories.get(historyKey);

  if (!history) {
    history = [{ role: "system", content: systemPrompt }];
    sessionHistories.set(historyKey, history);
  } else {
    // Refresh system prompt dynamically at start of history
    history[0] = { role: "system", content: systemPrompt };
  }

  // Add the new user message to the context history
  history.push({ role: "user", content: normalizedTranscript });

  // Limit conversation context history to last 10 messages to avoid token bloat
  if (history.length > 11) {
    history = [history[0], ...history.slice(history.length - 10)];
    sessionHistories.set(historyKey, history);
  }

  const provider = (process.env.LLM_PROVIDER || process.env.AI_PROVIDER || "groq").trim().toLowerCase();

  if (provider === "ollama") {
    const result = await generateOllamaAssistantReply({ transcript, sessionId });
    if (result.success) {
      history.push({ role: "assistant", content: result.reply });
      saveSessionsToDisk();
    }
    return result;
  }

  if (provider === "openai") {
    const result = await generateOpenAIAssistantReply({ messages: history, sessionId: historyKey });
    if (result.success) {
      history.push({ role: "assistant", content: result.reply });
      saveSessionsToDisk();
    }
    return result;
  }

  // Handle Groq and Gemini routing with fallback mechanism
  let primaryFn, secondaryFn;
  let primaryName, secondaryName;

  if (provider === "gemini") {
    primaryFn = generateGeminiAssistantReply;
    primaryName = "gemini";
    secondaryFn = generateGroqAssistantReply;
    secondaryName = "groq";
  } else {
    primaryFn = generateGroqAssistantReply;
    primaryName = "groq";
    secondaryFn = generateGeminiAssistantReply;
    secondaryName = "gemini";
  }

  console.log(`[Assistant] Trying primary LLM provider: ${primaryName} for session ${historyKey} with history of ${history.length} messages`);
  let result = await primaryFn({ messages: history, sessionId: historyKey });

  if (result.success) {
    history.push({ role: "assistant", content: result.reply });
    saveSessionsToDisk();
    return result;
  }

  console.warn(`[Assistant] Primary LLM provider ${primaryName} failed: ${result.error || "unknown error"}. Falling back to ${secondaryName}...`);
  
  result = await secondaryFn({ messages: history, sessionId: historyKey });
  if (result.success) {
    console.log(`[Assistant] Fallback to LLM provider ${secondaryName} succeeded.`);
    history.push({ role: "assistant", content: result.reply });
    saveSessionsToDisk();
    return result;
  }

  console.error(`[Assistant] Both primary and fallback LLM providers failed.`);
  return result;
}

module.exports = {
  generateAssistantReply,
  resetSessionHistory,
  getSessionHistory,
};
