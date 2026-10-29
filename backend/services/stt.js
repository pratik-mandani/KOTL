try {
  require("../utils/env");
} catch (_) {
  try {
    require("dotenv").config();
  } catch (__) {}
}
const { execFile } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);
const { recordSttUsage } = require("./api-usage");

const OPENAI_TRANSCRIPTION_URL = "https://api.openai.com/v1/audio/transcriptions";
const GROQ_TRANSCRIPTION_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

const DEFAULT_PROVIDER = (process.env.STT_PROVIDER || "groq").trim().toLowerCase();
const DEFAULT_MODEL = process.env.OPENAI_TRANSCRIPTION_MODEL || "whisper-1";
const WHISPER_BIN = process.env.WHISPER_BIN || "";
const WHISPER_MODEL_PATH = process.env.WHISPER_MODEL_PATH || "";
const WHISPER_LANGUAGE = process.env.WHISPER_LANGUAGE || "auto";
const WHISPER_TIMEOUT_MS = Number.parseInt(process.env.WHISPER_TIMEOUT_MS || process.env.OPENAI_TIMEOUT_MS || "", 10) || 45000;

function getWhisperModelLabel() {
  if (!WHISPER_MODEL_PATH) {
    return null;
  }

  return path.basename(WHISPER_MODEL_PATH);
}

function cleanupWhisperOutputs(outputBase) {
  for (const extension of [".txt", ".vtt", ".srt", ".csv", ".json", ".wts"]) {
    const outputPath = `${outputBase}${extension}`;
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
  }
}

const NOISE_FILTER_BLACKLIST = [
  "and the other.",
  "and the other",
  "thank you for watching.",
  "thank you for watching",
  "subtitles by",
  "transcribed by",
  "english subtitles",
  "please subscribe",
  "subscribe",
  "watching",
  "the end",
  "end of session",
  "end of transcript",
  "end of the song",
  "end of song",
  "end of story",
  "end of audio",
  "end of video",
  "end of recording",
  "end session",
  "session end",
  "transcript end",
  "gajarati",
  "gujarati",
  "amara",
  "प्रधान दृश्य",
  "pradhan drishya",
  "देखने के लिए धन्यवाद",
  "सब्सक्राइब करें",
  "लाइक करें",
  "शेयर करें",
  "thanks for watching",
];

function isBlacklistedNoiseTranscript(text) {
  if (!text || typeof text !== "string") return true;
  const trimmed = text.trim();
  if (trimmed.startsWith("*") && trimmed.endsWith("*")) return true;
  if (trimmed.startsWith("(") && trimmed.endsWith(")")) return true;
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) return true;

  const clean = text.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
  if (clean.length === 0 || clean.length <= 1) return true;

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  // 1. Whitelist genuine conversational greetings FIRST so "hello hello" is NEVER blocked!
  const GREETING_TOKENS = ["hello", "hi", "hey", "namaste", "kem cho", "kemcho", "halo", "morning", "evening"];
  const isGreeting = GREETING_TOKENS.some((g) => clean === g || clean.startsWith(g + " ") || clean.endsWith(" " + g) || clean.includes(" " + g + " ") || words.includes(g));
  if (isGreeting) {
    return false; // Genuine human greeting, 100% valid!
  }

  // 2. Reject Whisper hallucinations on silence / endings ("end", "end of session", etc.)
  if (
    clean === "end" ||
    clean === "the end" ||
    clean.startsWith("end of ") ||
    clean.startsWith("end ") ||
    clean.includes("end of session") ||
    clean.includes("end of transcript") ||
    clean.includes("end of the song") ||
    clean.includes("end of video") ||
    clean.includes("end of audio") ||
    clean.includes("end of story") ||
    clean.includes("end of recording") ||
    clean === "end session" ||
    clean === "transcript end" ||
    clean === "audio end"
  ) {
    return true; // Whisper artifact on silence!
  }

  // Single word noise tokens
  if (words.length === 1 && ["you", "yeah", "video", "subtitles", "bye", "okay", "so", "oh", "yes", "no"].includes(words[0])) {
    return true;
  }

  // 3. Detect Whisper looping hallucinations on faint noise/silence (only for 4+ words)
  if (words.length >= 4) {
    if (words.length % 2 === 0) {
      const half = words.length / 2;
      const firstHalf = words.slice(0, half).join(" ");
      const secondHalf = words.slice(half).join(" ");
      if (firstHalf === secondHalf) return true;
    }
    const allSame = words.every((w) => w === words[0]);
    if (allSame) return true;
    if (words.length % 2 === 0) {
      const p1 = words[0] + " " + words[1];
      let isRepeatingPair = true;
      for (let i = 2; i < words.length; i += 2) {
        if (words[i] + " " + words[i + 1] !== p1) {
          isRepeatingPair = false;
          break;
        }
      }
      if (isRepeatingPair) return true;
    }
  }

  return NOISE_FILTER_BLACKLIST.some((phrase) => {
    const cleanPhrase = phrase.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    return clean === cleanPhrase || clean.includes(cleanPhrase);
  });
}

function normalizeWhisperTranscript(transcriptText) {
  return transcriptText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^\[[^\]]+\]\s*/g, "").trim())
    .filter((line) => line.length > 0)
    .join(" ")
    .trim();
}

function prepareCompletionsFormData(audioBuffer, fileName, model, defaultLanguage, defaultPrompt) {
  const form = new FormData();
  const fileBlob = new Blob([audioBuffer], { type: "audio/wav" });
  form.append("file", fileBlob, fileName);
  form.append("model", model);
  form.append("response_format", "json");
  form.append("temperature", "0.0");

  // Read config language and prompt fallbacks
  const configLanguage = process.env.STT_LANGUAGE || process.env.WHISPER_LANGUAGE || defaultLanguage;
  const configPrompt = (process.env.STT_PROMPT || process.env.WHISPER_PROMPT || defaultPrompt || "").trim();

  if (configLanguage && configLanguage.trim().toLowerCase() !== "auto") {
    form.append("language", configLanguage.trim());
  }

  if (configPrompt) {
    form.append("prompt", configPrompt);
  }

  return { form, language: configLanguage, prompt: configPrompt };
}

async function transcribeWithOpenAi(filePath) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      provider: "openai",
      text: null,
      confidence: null,
      error: "OPENAI_API_KEY not configured",
    };
  }

  const audioBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const model = process.env.OPENAI_TRANSCRIPTION_MODEL || "whisper-1";

  const { form, language, prompt } = prepareCompletionsFormData(
    audioBuffer,
    fileName,
    model,
    "en",
    ""
  );

  console.log(`[STT openai] Sending request to OpenAI STT API. Model: ${model}, Language: ${language}, Prompt hint: "${prompt}"`);

  try {
    const response = await fetch(OPENAI_TRANSCRIPTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[STT openai] API returned error status: ${response.status}. Response: ${errorText}`);
      return {
        success: false,
        provider: "openai",
        text: null,
        confidence: null,
        error: `OpenAI transcription failed: ${response.status} ${errorText}`,
      };
    }

    const data = await response.json();
    console.log(`[STT openai] Raw response received:`, JSON.stringify(data));

    let confidence = null;
    if (Array.isArray(data.logprobs) && data.logprobs.length > 0) {
      const averageLogprob =
        data.logprobs.reduce((total, item) => total + (typeof item.logprob === "number" ? item.logprob : 0), 0) /
        data.logprobs.length;
      confidence = Number(Math.exp(averageLogprob).toFixed(4));
    }

    return {
      success: true,
      provider: "openai",
      text: typeof data.text === "string" ? data.text : "",
      confidence,
      error: null,
    };
  } catch (error) {
    console.error(`[STT openai] Fetch error:`, error.message);
    return {
      success: false,
      provider: "openai",
      text: null,
      confidence: null,
      error: error.message,
    };
  }
}

const GROQ_STT_TIMEOUT_MS = Number.parseInt(process.env.GROQ_STT_TIMEOUT_MS || "", 10) || 8000;

async function transcribeWithGroq(filePath) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      provider: "groq",
      text: null,
      confidence: null,
      error: "GROQ_API_KEY not configured",
    };
  }

  const audioBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  const candidateModels = [
    process.env.GROQ_TRANSCRIPTION_MODEL,
    "whisper-large-v3-turbo",
    "whisper-large-v3"
  ].filter(Boolean);
  const uniqueModels = [...new Set(candidateModels)];

  let lastError = null;

  for (const model of uniqueModels) {
    const { form, language, prompt } = prepareCompletionsFormData(
      audioBuffer,
      fileName,
      model,
      "en",
      ""
    );

    console.log(`[STT groq] Sending request to Groq STT API. Model: ${model}, Language: ${language}, Prompt: "${prompt}"`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GROQ_STT_TIMEOUT_MS);

    try {
      const response = await fetch(GROQ_TRANSCRIPTION_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: form,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[STT groq] Model ${model} returned status ${response.status}: ${errorText.slice(0, 120)}. Trying next candidate...`);
        lastError = `Groq transcription failed (${model}): ${response.status} ${errorText}`;
        continue;
      }

      const data = await response.json();
      console.log(`[STT groq] Raw response received from ${model}:`, JSON.stringify(data));

      try {
        const durationMs = Math.max(0, Math.round((audioBuffer.length - 44) / 32));
        recordSttUsage({
          provider: "groq",
          model,
          audioDurationMs: durationMs,
          headers: response.headers,
        });
      } catch (_) {}

      const rawTranscript = typeof data.text === "string" ? data.text.trim() : "";
      const cleanTranscript = isBlacklistedNoiseTranscript(rawTranscript) ? "" : rawTranscript;

      if (rawTranscript && !cleanTranscript) {
        console.log(`[STT groq] Filtered blacklisted noise/hallucination: "${rawTranscript}"`);
      }

      return {
        success: true,
        provider: "groq",
        model,
        text: cleanTranscript,
        confidence: typeof data.x_groq?.error === "undefined" ? 1.0 : null,
        error: null,
      };
    } catch (error) {
      clearTimeout(timer);
      const isTimeout = error.name === "AbortError" || String(error.message || "").toLowerCase().includes("aborted");
      console.warn(`[STT groq] Model ${model} ${isTimeout ? `timed out after ${GROQ_STT_TIMEOUT_MS}ms` : `fetch error: ${error.message}`}. ${isTimeout ? "Aborting candidate loop due to timeout." : "Trying next candidate..."}`);
      lastError = isTimeout ? `Groq STT timed out after ${GROQ_STT_TIMEOUT_MS}ms` : error.message;
      if (isTimeout) {
        break;
      }
    }
  }

  return {
    success: false,
    provider: "groq",
    text: null,
    confidence: null,
    error: lastError || "All Groq STT models failed",
  };
}

async function transcribeWithWhisperCpp(filePath) {
  const modelLabel = getWhisperModelLabel();

  if (!filePath || !fs.existsSync(filePath)) {
    return {
      success: false,
      provider: "whisper_cpp",
      text: null,
      confidence: null,
      model: modelLabel,
      error: `audio file not found: ${filePath}`,
    };
  }

  if (path.extname(filePath).toLowerCase() !== ".wav") {
    return {
      success: false,
      provider: "whisper_cpp",
      text: null,
      confidence: null,
      model: modelLabel,
      error: `unsupported audio file type: ${filePath}`,
    };
  }

  if (!WHISPER_BIN) {
    return {
      success: false,
      provider: "whisper_cpp",
      text: null,
      confidence: null,
      model: modelLabel,
      error: "WHISPER_BIN not configured",
    };
  }

  if (!fs.existsSync(WHISPER_BIN)) {
    return {
      success: false,
      provider: "whisper_cpp",
      text: null,
      confidence: null,
      model: modelLabel,
      error: `Whisper binary not found: ${WHISPER_BIN}`,
    };
  }

  if (!WHISPER_MODEL_PATH) {
    return {
      success: false,
      provider: "whisper_cpp",
      text: null,
      confidence: null,
      model: modelLabel,
      error: "WHISPER_MODEL_PATH not configured",
    };
  }

  if (!fs.existsSync(WHISPER_MODEL_PATH)) {
    return {
      success: false,
      provider: "whisper_cpp",
      text: null,
      confidence: null,
      model: modelLabel,
      error: `Whisper model not found: ${WHISPER_MODEL_PATH}`,
    };
  }

  const outputBase = path.join(os.tmpdir(), `kotl-whisper-${Date.now()}`);
  const transcriptPath = `${outputBase}.txt`;

  try {
    console.log(
      "[STT whisper_cpp] start",
      JSON.stringify({
        file: path.basename(filePath),
        model: modelLabel,
        language: WHISPER_LANGUAGE,
        timeout_ms: WHISPER_TIMEOUT_MS,
      })
    );
    await execFileAsync(
      WHISPER_BIN,
      [
        "-m",
        WHISPER_MODEL_PATH,
        "-f",
        filePath,
        "-l",
        WHISPER_LANGUAGE,
        "-otxt",
        "-of",
        outputBase,
      ],
      {
        windowsHide: true,
        timeout: WHISPER_TIMEOUT_MS,
      }
    );
  } catch (error) {
    const timedOut = error && (error.killed || error.signal === "SIGTERM" || String(error.message || "").toLowerCase().includes("timeout"));
    return {
      success: false,
      provider: "whisper_cpp",
      text: null,
      confidence: null,
      model: modelLabel,
      error: timedOut ? "Whisper transcription timeout" : `Whisper transcription failed: ${error.message}`,
    };
  }

  try {
    if (!fs.existsSync(transcriptPath)) {
      return {
        success: false,
        provider: "whisper_cpp",
        text: null,
        confidence: null,
        model: modelLabel,
        error: "Whisper transcription output not found",
      };
    }

    const transcriptText = fs.readFileSync(transcriptPath, "utf8");
    const normalizedText = normalizeWhisperTranscript(transcriptText);

    if (!normalizedText) {
      return {
        success: false,
        provider: "whisper_cpp",
        text: null,
        confidence: null,
        model: modelLabel,
        error: "Whisper transcript empty",
      };
    }

    console.log(
      "[STT whisper_cpp] complete",
      JSON.stringify({
        file: path.basename(filePath),
        model: modelLabel,
        transcript_length: normalizedText.length,
      })
    );
    return {
      success: true,
      provider: "whisper_cpp",
      text: normalizedText,
      confidence: null,
      model: modelLabel,
      error: null,
    };
  } finally {
    cleanupWhisperOutputs(outputBase);
  }
}

async function transcribeAudio(filePath) {
  const provider = (process.env.STT_PROVIDER || "groq").trim().toLowerCase();
  
  if (provider === "whisper_cpp") {
    return transcribeWithWhisperCpp(filePath);
  }
  
  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    return transcribeWithOpenAi(filePath);
  }

  // Default to Groq Whisper STT (Free Tier)
  return transcribeWithGroq(filePath);
}

module.exports = {
  transcribeAudio,
  normalizeWhisperTranscript,
  NOISE_FILTER_BLACKLIST,
  isBlacklistedNoiseTranscript,
};
