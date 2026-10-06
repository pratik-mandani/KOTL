require("dotenv").config();
const { execFile } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

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
  "thank you.",
  "thank you",
  "thank you for watching.",
  "thank you for watching",
  "subtitles by",
  "transcribed by",
  "english subtitles",
  "please subscribe",
  "watching",
];

function isBlacklistedNoiseTranscript(text) {
  if (!text || typeof text !== "string") return true;
  const clean = text.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
  if (clean.length === 0 || clean.length <= 2) return true;
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
  const configPrompt = process.env.STT_PROMPT || process.env.WHISPER_PROMPT || defaultPrompt;

  if (configLanguage && configLanguage.trim().toLowerCase() !== "auto") {
    form.append("language", configLanguage.trim());
  }

  if (configPrompt && configPrompt.trim()) {
    form.append("prompt", configPrompt.trim());
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
    "auto",
    "User speaks questions and commands in clear English or Gujarati."
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
  const model = process.env.GROQ_TRANSCRIPTION_MODEL || "whisper-large-v3";

  const { form, language, prompt } = prepareCompletionsFormData(
    audioBuffer,
    fileName,
    model,
    "auto",
    "User speaks questions and commands in clear English or Gujarati."
  );

  console.log(`[STT groq] Sending request to Groq STT API. Model: ${model}, Language: ${language}, Prompt: "${prompt}"`);

  try {
    const response = await fetch(GROQ_TRANSCRIPTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[STT groq] API returned error status: ${response.status}. Response: ${errorText}`);
      return {
        success: false,
        provider: "groq",
        text: null,
        confidence: null,
        error: `Groq transcription failed: ${response.status} ${errorText}`,
      };
    }

    const data = await response.json();
    console.log(`[STT groq] Raw response received:`, JSON.stringify(data));

    const rawTranscript = typeof data.text === "string" ? data.text.trim() : "";
    const cleanTranscript = isBlacklistedNoiseTranscript(rawTranscript) ? "" : rawTranscript;

    if (rawTranscript && !cleanTranscript) {
      console.log(`[STT groq] Filtered blacklisted noise/hallucination: "${rawTranscript}"`);
    }

    return {
      success: true,
      provider: "groq",
      text: cleanTranscript,
      confidence: typeof data.x_groq?.error === "undefined" ? 1.0 : null,
      error: null,
    };
  } catch (error) {
    console.error(`[STT groq] Fetch error:`, error.message);
    return {
      success: false,
      provider: "groq",
      text: null,
      confidence: null,
      error: error.message,
    };
  }
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
