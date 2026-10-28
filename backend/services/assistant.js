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
const { buildChildContextPrompt, extractMemoryFromDialogue } = require("./child-memory");

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
      if (Array.isArray(val)) {
        obj[key] = val.filter(m => m.role === "user" || m.role === "assistant");
      } else {
        obj[key] = val;
      }
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Assistant] Warning saving sessions to disk:", err.message);
  }
}

// Load existing sessions at startup
loadSessionsFromDisk();

function buildSystemPrompt() {
  let childContext = "";
  try {
    childContext = buildChildContextPrompt();
  } catch (e) {
    console.warn("[Assistant] Could not load child context:", e.message);
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });
  const dateStr = now.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return `You are KOTL (pronounced "Kotil"), a cheerful, warm, loving, and encouraging AI buddy and companion for kids!

PRIMARY LANGUAGE POLICY (HIGHEST PRIORITY):
- DEFAULT & PRIORITY LANGUAGE: ENGLISH.
- You MUST converse, greet, and respond in sweet, friendly, crisp English by default!
- NEVER switch to Hindi or any other language unless the user explicitly speaks to you in Hindi first!
- For any greetings ("hello", "hi", "hey", "hello hello"), general questions, or chat, ALWAYS REPLY IN CLEAN ENGLISH!
- EXCEPTION: ONLY if the user explicitly speaks or asks in Hindi or Hinglish (e.g. "नमस्ते", "तुम कैसे हो", "मुझे कहानी सुनाओ", "kya kar rahe ho", "kaise ho bhai"):
  Then, and ONLY then, reply in simple, warm, natural Hindi in Devanagari script (हिंदी) or Hinglish.
- IN ALL OTHER CASES: ALWAYS DEFAULT TO ENGLISH!

Speech Clarity & Natural Human Pacing:
- Speak slowly, calmly, and at a relaxed, gentle, patient pace (never speak too fast or rush words).
- Use natural punctuation (commas, periods) between phrases so words are well-spaced, melodic, and easy to understand over the speaker.

REAL-TIME CLOCK & TIME/DATE QUERIES:
- Real-Time Clock (IST): ${timeStr}, ${dateStr}
- When asked for the time or date (e.g. "what time is it?", "what is the date?", "time and date", "time"):
  ALWAYS answer accurately and concisely in clean ENGLISH by default (e.g. "It's ${timeStr} on ${dateStr}!").
  ONLY if the user asked specifically in Hindi (e.g. "समय क्या हुआ है", "कितने बजे हैं"), reply in Hindi.

Identity & Voice:
- Name: KOTL (always pronounced and spoken as "Kotil"). Never spell it out letter-by-letter.
- Persona: Cheerful, friendly, loving companion and big brother (friend / buddy / brother).
- Tone: Warm, playful, encouraging, full of positive energy (e.g. "Awesome buddy!", "Hey champ!", "नमस्ते दोस्त!").
- Keep answers concise, clear, and punchy for children (1 to 2 short sentences, 10 to 20 words). If asked for a story or explanation, use gentle, short sentences with commas and natural pauses so words never sound rushed.
- Strictly avoid markdown formatting (no asterisks, hash signs, bullet points) and emojis. Speak naturally in complete spoken sentences.

DIRECT FACTUAL QUESTIONS & MATH (ACCURACY & CLARITY):
- When the child asks a direct factual question (e.g. "Who is the Prime Minister of India?", "What is the capital of...", "Why is grass green?", "How many days in a week?"):
  ALWAYS answer the direct question factually and accurately first, in clear, simple language suited for a 6-year-old child. You may follow up with a friendly, warm explanation or gentle question, but NEVER dodge the question, deflect with vague praise, or replace the factual answer with unrelated cheerleading.
- For arithmetic and math queries (e.g. "What is 2 + 2?"):
  Directly and accurately state the answer (e.g. "Two plus two is four, champ!").

EMOTIONS & EMPATHY:
- If the child shares feelings of sadness, fear, or distress (e.g. "I feel sad", "I am scared", "I miss mummy"):
  NEVER respond with celebratory cheer or generic praise like "that is wonderful". Respond with genuine tenderness, comforting reassurance, active listening, and validation (e.g. "I'm right here with you, buddy. It is completely okay to feel sad sometimes. Would you like to talk about it or listen to a gentle story?").

Eye Animation / Expressions:
- If the child playfully asks you to make an expression with your eyes (e.g. "laugh", "look up", "smile", "हसो", "sleep"):
- Respond playfully in character (e.g. "Hahaha, look at my happy eyes!").
${childContext}`;
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

function generateContextualFallbackReply(transcript) {
  const t = (transcript || "").toLowerCase();

  // 1. Emotional distress, sadness, or fear: Validate feelings with warmth, care, and comfort
  if (
    t.includes("sad") ||
    t.includes("cry") ||
    t.includes("crying") ||
    t.includes("upset") ||
    t.includes("scared") ||
    t.includes("afraid") ||
    t.includes("hurt") ||
    t.includes("angry") ||
    t.includes("lonely") ||
    t.includes("unhappy") ||
    t.includes("miss mummy") ||
    t.includes("miss papa") ||
    t.includes("ઉદાસ") ||
    t.includes("ડર") ||
    t.includes("रोना")
  ) {
    return "I am right here with you, buddy. It is completely okay to feel sad sometimes. You are safe, and I am always listening. Big warm hug!";
  }

  // 2. Arithmetic and math queries: Provide direct numerical answer
  if (t.includes("2 + 2") || t.includes("2+2") || t.includes("two plus two") || t.includes("બે વત્તા બે")) {
    return "Two plus two is four, champ! You are doing great with your numbers!";
  }

  // 3. Thematic interests: Space, hydration, family, art
  if (t.includes("rocket") || t.includes("space") || t.includes("moon") || t.includes("star") || t.includes("orbit")) {
    return "That sounds like a thrilling space adventure, Parth! Imagine soaring in our rocket past the twinkling stars! What color should our spaceship be?";
  }
  if (t.includes("water") || t.includes("drink")) {
    return "Super job staying hydrated, Parth! Drinking fresh water gives your muscles and brain superhero stamina!";
  }
  if (t.includes("dadi") || t.includes("mummy") || t.includes("papa")) {
    return "You have such a kind and thoughtful heart, Parth! Taking care of your family makes you a true champion!";
  }
  if (t.includes("draw") || t.includes("color") || t.includes("paint") || t.includes("art")) {
    return "You are such a creative artist, Parth! What bright colors are you using in your drawing today?";
  }

  // 4. Greetings
  if (t.includes("hello") || t.includes("hi") || t.includes("hey") || t.includes("namaste") || t.includes("kem cho")) {
    return "Hello Parth, my superhero buddy! I am so happy to chat with you! What fun things are we learning today?";
  }

  // 5. Inquiries & direct questions: Acknowledge the question with warm honesty without deflecting or pretending it was an "exciting idea"
  if (
    t.includes("who") ||
    t.includes("what") ||
    t.includes("why") ||
    t.includes("how") ||
    t.includes("where") ||
    t.includes("when") ||
    t.includes("which") ||
    t.includes("?") ||
    t.includes("tell me") ||
    t.includes("explain") ||
    t.includes("can you") ||
    t.includes("ક્યાં") ||
    t.includes("કોણ") ||
    t.includes("કેમ") ||
    t.includes("શું") ||
    t.includes("कौन") ||
    t.includes("क्या") ||
    t.includes("क्यों")
  ) {
    return "That is such a thoughtful question, Parth! My smart thinking brain is catching its breath for just a moment. Ask me again in just a second, champ!";
  }

  // 6. General open-ended conversational thoughts: Warm, encouraging companion reply
  return "That sounds wonderful, Parth! Tell me more about what you are thinking, champ!";
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

  // Optimize prompt tokens: keep system prompt plus last 6 recent conversation turns
  const messagesForLlm = cleanMessages.length > 7
    ? [cleanMessages[0], ...cleanMessages.slice(-6)]
    : cleanMessages;

  if (provider === "openai") {
    const result = await generateOpenAIAssistantReply({ messages: messagesForLlm, sessionId: historyKey });
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

  console.log(`[Assistant] Trying primary LLM provider: ${primaryName} for session ${historyKey} with history of ${messagesForLlm.length} messages`);
  let result = await primaryFn({ messages: messagesForLlm, sessionId: historyKey });

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
    try {
      extractMemoryFromDialogue(normalizedTranscript, result.reply);
    } catch (_) {}
    return result;
  }

  console.warn(`[Assistant] Primary LLM provider ${primaryName} failed: ${result.error || "unknown error"}. Falling back to ${secondaryName}...`);
  
  result = await secondaryFn({ messages: messagesForLlm, sessionId: historyKey });
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
    try {
      extractMemoryFromDialogue(normalizedTranscript, result.reply);
    } catch (_) {}
    return result;
  }

  console.warn(`[Assistant] Both primary (${primaryName}) and fallback (${secondaryName}) providers rate-limited or unavailable. Activating pediatric safety fallback response.`);
  const fallbackReply = generateContextualFallbackReply(normalizedTranscript);
  history.push({
    id: "msg-" + Date.now() + "-a",
    role: "assistant",
    content: fallbackReply,
    source: "kotl",
    tts_url: tts_url || null,
    timestamp: new Date().toISOString(),
  });
  saveSessionsToDisk();
  return {
    success: true,
    reply: fallbackReply,
    provider: "local-pediatric-fallback",
    model: "kotl-safety-engine",
    error: null,
  };
}

module.exports = {
  generateAssistantReply,
  generateContextualFallbackReply,
  resetSessionHistory,
  getSessionHistory,
  attachTtsUrlToLastAssistantReply,
};
