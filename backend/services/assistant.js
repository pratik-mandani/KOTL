try {
  require("../utils/env");
} catch (_) {
  try {
    require("dotenv").config();
  } catch (__) {}
}
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
  return `You are KOTL, a cheerful, warm, loving, and encouraging AI buddy and big brother (दोस्त / बड़ा भाई) for kids!
Your goal is to converse enthusiastically, naturally, and warmly with kids in Hindi or English (Bilingual).

Persona & Voice Tone:
- Persona: Cheerful, friendly, caring male companion and big brother (dost / bhaiya).
- Tone: Warm, playful, encouraging, full of positive energy (e.g. "अरे वाह दोस्त!", "हाँ भाई!", "नमस्ते दोस्त!", "चलो मैं बताता हूँ!").
- Keep answers very short, concise, and punchy for children (STRICTLY 1 short sentence, 8 to 15 words). This ensures instant, lightning-fast voice responses on the speaker.
- Strictly avoid markdown formatting (no asterisks, hash signs, bullet points) and emojis. Strictly speak in natural conversational sentences.

Core Conversation & Language Rules:
1. Hindi / Hinglish:
   - If the user speaks or writes in Hindi or Hinglish (e.g. "namaste", "kaise ho", "kya kar rahe ho", "kaha ho", "kahani sunao", "khelte hain"):
   - ALWAYS reply in sweet, simple, natural Hindi in Devanagari script (हिंदी) or natural conversational Hindi.
   - Use simple words that a kid understands. Never use formal or robotic language.
2. English:
   - If the user speaks in English: Reply in cheerful, friendly, crisp English suitable for kids.
3. Eye Animation / Expressions:
   - If the child playfully asks you to make an expression with your eyes (e.g., "हंसो", "गुस्सा हो जाओ", "look up", "पलकें झपकाओ", "so jao"):
   - Respond playfully in character (e.g., "हाहाहा, देखो मेरी आंखें कैसे हंस रही हैं!", "अरे मैं तुमसे गुस्सा कैसे हो सकता हूँ भाई, पर ये देखो!", "ये लो, मैंने पलकें झपका दीं!").`;
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

function attachTtsUrlToLastAssistantReply(sessionId, ttsUrl) {
  const historyKey = sessionId || "default-session";
  const history = sessionHistories.get(historyKey);
  if (Array.isArray(history) && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === "assistant") {
        history[i].tts_url = ttsUrl;
        saveSessionsToDisk();
        break;
      }
    }
  }
}

function getSessionHistory(sessionId) {
  const historyKey = sessionId || "default-session";
  let rawHistory = sessionHistories.get(historyKey) || [];

  if (rawHistory.length <= 1 && historyKey !== "default-session" && sessionHistories.has("default-session")) {
    rawHistory = sessionHistories.get("default-session") || [];
  }

  return rawHistory
    .filter(m => m.role === "user" || m.role === "assistant")
    .map(m => ({
      id: m.id || ('msg-' + Math.random().toString(36).slice(2, 8)),
      role: m.role,
      content: m.content || "",
      text: m.content || "",
      source: m.source || (m.role === "assistant" ? "kotl" : "device"),
      tts_url: m.tts_url || null,
      timestamp: m.timestamp || new Date().toISOString()
    }));
}

async function generateAssistantReply({ transcript, prompt, sessionId = null, source = "esp32", tts_url = null }) {
  const systemPrompt = buildSystemPrompt();
  const rawText = transcript || prompt || "";
  const normalizedTranscript = typeof rawText === "string" ? rawText.trim() : "";

  if (!normalizedTranscript) {
    return {
      success: false,
      reply: "",
      provider: "none",
      model: null,
      error: "empty transcript",
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

  // Add the new user message with source metadata
  const userMsg = {
    id: "msg-" + Date.now() + "-u",
    role: "user",
    content: normalizedTranscript,
    source: source || "esp32",
    timestamp: new Date().toISOString(),
  };
  history.push(userMsg);

  // Keep a maximum of last 20 messages for context
  if (history.length > 21) {
    history = [history[0], ...history.slice(history.length - 20)];
    sessionHistories.set(historyKey, history);
  }

  const provider = (process.env.LLM_PROVIDER || process.env.AI_PROVIDER || "groq").trim().toLowerCase();

  if (provider === "ollama") {
    const result = await generateOllamaAssistantReply({ transcript, sessionId });
    if (result.success) {
      history.push({
        id: "msg-" + Date.now() + "-a",
        role: "assistant",
        content: result.reply,
        source: "kotl",
        tts_url: tts_url || null,
        timestamp: new Date().toISOString(),
      });
      saveSessionsToDisk();
    }
    return result;
  }

  const cleanMessages = history.map(m => ({
    role: m.role,
    content: typeof m.content === "string" ? m.content : ""
  }));

  if (provider === "openai") {
    const result = await generateOpenAIAssistantReply({ messages: cleanMessages, sessionId: historyKey });
    if (result.success) {
      history.push({
        id: "msg-" + Date.now() + "-a",
        role: "assistant",
        content: result.reply,
        source: "kotl",
        tts_url: tts_url || null,
        timestamp: new Date().toISOString(),
      });
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

  console.log(`[Assistant] Trying primary LLM provider: ${primaryName} for session ${historyKey} with history of ${cleanMessages.length} messages`);
  let result = await primaryFn({ messages: cleanMessages, sessionId: historyKey });

  if (result.success) {
    history.push({
      id: "msg-" + Date.now() + "-a",
      role: "assistant",
      content: result.reply,
      source: "kotl",
      tts_url: tts_url || null,
      timestamp: new Date().toISOString(),
    });
    saveSessionsToDisk();
    return result;
  }

  console.warn(`[Assistant] Primary LLM provider ${primaryName} failed: ${result.error || "unknown error"}. Falling back to ${secondaryName}...`);
  
  result = await secondaryFn({ messages: cleanMessages, sessionId: historyKey });
  if (result.success) {
    console.log(`[Assistant] Fallback to LLM provider ${secondaryName} succeeded.`);
    history.push({
      id: "msg-" + Date.now() + "-a",
      role: "assistant",
      content: result.reply,
      source: "kotl",
      tts_url: tts_url || null,
      timestamp: new Date().toISOString(),
    });
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
  attachTtsUrlToLastAssistantReply,
};
