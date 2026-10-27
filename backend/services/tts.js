try {
  require("../utils/env");
} catch (_) {
  try {
    require("dotenv").config();
  } catch (__) {}
}
const { execFile, spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { promisify } = require("util");
const { toPhoneticSpokenText } = require("../utils/phonetic");
const { synthesizeEdgeV2Pcm } = require("./edge-v2-tts");
const { pcmToWavBuffer } = require("./gemini-tts");
const { generateGeminiSpeech } = require("./gemini-tts");
const { recordTtsUsage } = require("./api-usage");

const execFileAsync = promisify(execFile);

const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";
const DEFAULT_PROVIDER = (process.env.TTS_PROVIDER || "edge").trim().toLowerCase();
const DEFAULT_MODEL = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
const DEFAULT_VOICE = process.env.OPENAI_TTS_VOICE || "alloy";
const DEFAULT_TIMEOUT_MS = Number.parseInt(process.env.OPENAI_TIMEOUT_MS || "", 10) || 15000;
const PIPER_TIMEOUT_MS = Number.parseInt(process.env.PIPER_TIMEOUT_MS || process.env.OPENAI_TIMEOUT_MS || "", 10) || 45000;
const NORMALIZED_SAMPLE_RATE = Number.parseInt(process.env.TTS_PLAYBACK_SAMPLE_RATE || "", 10) || 16000;
let ffmpegStaticPath = null;
try {
  ffmpegStaticPath = require("ffmpeg-static");
} catch (e) {}

function getFfmpegPath() {
  if (process.env.FFMPEG_BIN && fs.existsSync(process.env.FFMPEG_BIN)) {
    return process.env.FFMPEG_BIN;
  }
  if (ffmpegStaticPath && fs.existsSync(ffmpegStaticPath)) {
    return ffmpegStaticPath;
  }
  return os.platform() === "win32" ? "D:/KOTL/tools/ffmpeg/bin/ffmpeg.exe" : "ffmpeg";
}

const FFMPEG_BIN = getFfmpegPath();
const TTS_UPLOADS_DIR = path.join(__dirname, "..", "uploads", "tts");
const PIPER_BIN = process.env.PIPER_BIN || "";
const PIPER_MODEL_PATH = process.env.PIPER_MODEL_PATH || "";
const PIPER_CONFIG_PATH = process.env.PIPER_CONFIG_PATH || "";
const PIPER_VOICE = "local";

const EDGE_VOICE = process.env.EDGE_TTS_VOICE || "en-IN-PrabhatNeural";
const EDGE_LANG = process.env.EDGE_TTS_LANG || "en-IN";
const EDGE_VOLUME = process.env.EDGE_TTS_VOLUME || "default";

function buildTtsFilename() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `tts-${timestamp}.wav`;
}

function ensureTtsUploadsDir() {
  fs.mkdirSync(TTS_UPLOADS_DIR, { recursive: true });
}

function cleanupFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {}
  }
}

function getPiperModelLabel() {
  if (!PIPER_MODEL_PATH) {
    return null;
  }
  return path.basename(PIPER_MODEL_PATH);
}

function validatePiperConfig() {
  if (!PIPER_BIN) return "PIPER_BIN not configured";
  if (!fs.existsSync(PIPER_BIN)) return `Piper binary not found: ${PIPER_BIN}`;
  if (!PIPER_MODEL_PATH) return "PIPER_MODEL_PATH not configured";
  if (!fs.existsSync(PIPER_MODEL_PATH)) return `Piper model not found: ${PIPER_MODEL_PATH}`;
  if (!PIPER_CONFIG_PATH) return "PIPER_CONFIG_PATH not configured";
  if (!fs.existsSync(PIPER_CONFIG_PATH)) return `Piper config not found: ${PIPER_CONFIG_PATH}`;
  return null;
}

async function normalizeWavFile(sourcePath, targetPath, timeoutMs = DEFAULT_TIMEOUT_MS) {
  await execFileAsync(
    FFMPEG_BIN,
    [
      "-y",
      "-i",
      sourcePath,
      "-acodec",
      "pcm_s16le",
      "-ac",
      "1",
      "-ar",
      String(NORMALIZED_SAMPLE_RATE),
      "-af",
      `aresample=resampler=swr:osr=${NORMALIZED_SAMPLE_RATE}:dither_method=triangular,highpass=f=160,volume=1.0`,
      "-map_metadata",
      "-1",
      "-fflags",
      "+bitexact",
      targetPath,
    ],
    {
      windowsHide: true,
      timeout: timeoutMs,
    }
  );
}

async function generateEdgeSpeech({ text, sessionId = null, voice = null }) {
  if (typeof text !== "string" || text.trim().length === 0) {
    return {
      success: false,
      filename: null,
      url: null,
      provider: "edge",
      voice: voice || EDGE_VOICE,
      model: "neural",
      error: "empty text",
    };
  }

  let selectedVoice = voice || EDGE_VOICE;
  let selectedLang = EDGE_LANG;
  if (!voice) {
    const isGujarati = /[\u0A80-\u0AFF]/.test(text);
    const isHindi = /[\u0900-\u097F]/.test(text);
    if (isHindi) {
      selectedVoice = "hi-IN-MadhurNeural";
      selectedLang = "hi-IN";
    } else if (isGujarati) {
      selectedVoice = "gu-IN-NiranjanNeural";
      selectedLang = "gu-IN";
    } else {
      selectedVoice = "en-IN-PrabhatNeural";
      selectedLang = "en-IN";
    }
  } else {
    if (selectedVoice.startsWith("hi-")) {
      selectedLang = "hi-IN";
    } else if (selectedVoice.startsWith("gu-")) {
      selectedLang = "gu-IN";
    } else {
      selectedLang = "en-IN";
    }
  }
  const normalizedFilename = buildTtsFilename();
  const normalizedPath = path.join(TTS_UPLOADS_DIR, normalizedFilename);
  ensureTtsUploadsDir();

  const speechRate = process.env.EDGE_TTS_RATE || "-20%";
  const spokenText = toPhoneticSpokenText(text.trim(), selectedLang);

  // 1. Primary: Pure Node.js Edge-TTS v2 (Sec-MS-GEC v2 on speech.platform.bing.com)
  try {
    const pcm = await synthesizeEdgeV2Pcm(spokenText, selectedVoice, speechRate);
    if (pcm && pcm.length > 0) {
      const wavBytes = pcmToWavBuffer(pcm, NORMALIZED_SAMPLE_RATE);
      fs.writeFileSync(normalizedPath, wavBytes);
      return {
        success: true,
        filename: normalizedFilename,
        url: `/tts/${normalizedFilename}`,
        provider: "edge",
        voice: selectedVoice,
        model: "neural-v2",
        error: null,
      };
    }
  } catch (v2Err) {
    console.warn(`[TTS Edge v2] Failed: ${v2Err.message}`);
  }

  return {
    success: false,
    filename: null,
    url: null,
    provider: "edge",
    voice: selectedVoice,
    model: "neural",
    error: "Edge-TTS v2 failed",
  };
}

async function runPiperSynthesis({ text, outputPath }) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      PIPER_BIN,
      [
        "--model",
        PIPER_MODEL_PATH,
        "--config",
        PIPER_CONFIG_PATH,
        "--output_file",
        outputPath,
      ],
      {
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    const stdoutChunks = [];
    const stderrChunks = [];
    let finished = false;

    const timeout = setTimeout(() => {
      if (finished) return;
      finished = true;
      child.kill();
      reject(new Error("piper synthesis timeout"));
    }, PIPER_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk) => stderrChunks.push(chunk));

    child.on("error", (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      reject(error);
    });

    child.on("close", (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);

      if (code === 0) {
        resolve({
          stdout: Buffer.concat(stdoutChunks).toString("utf8"),
          stderr: Buffer.concat(stderrChunks).toString("utf8"),
        });
        return;
      }

      const stderr = Buffer.concat(stderrChunks).toString("utf8").trim();
      const stdout = Buffer.concat(stdoutChunks).toString("utf8").trim();
      reject(new Error(`piper exited with code ${code}${stderr ? `: ${stderr}` : stdout ? `: ${stdout}` : ""}`));
    });

    child.stdin.write(text.trim());
    child.stdin.end();
  });
}

async function generatePiperSpeech({ text, sessionId = null }) {
  if (typeof text !== "string" || text.trim().length === 0) {
    return {
      success: false,
      filename: null,
      url: null,
      provider: "piper",
      voice: PIPER_VOICE,
      model: getPiperModelLabel(),
      error: "empty text",
    };
  }

  const configError = validatePiperConfig();
  if (configError) {
    return {
      success: false,
      filename: null,
      url: null,
      provider: "piper",
      voice: PIPER_VOICE,
      model: getPiperModelLabel(),
      error: configError,
    };
  }

  const normalizedFilename = buildTtsFilename();
  const normalizedPath = path.join(TTS_UPLOADS_DIR, normalizedFilename);
  const tempBaseName = `${path.parse(normalizedFilename).name}-${sessionId || "local"}`;
  const tempSourcePath = path.join(os.tmpdir(), `${tempBaseName}-piper.wav`);

  ensureTtsUploadsDir();

  try {
    await runPiperSynthesis({ text, outputPath: tempSourcePath });

    if (!fs.existsSync(tempSourcePath)) {
      return {
        success: false,
        filename: null,
        url: null,
        provider: "piper",
        voice: PIPER_VOICE,
        model: getPiperModelLabel(),
        error: "piper did not produce an output wav",
      };
    }

    await normalizeWavFile(tempSourcePath, normalizedPath, PIPER_TIMEOUT_MS);

    return {
      success: true,
      filename: normalizedFilename,
      url: `/tts/${normalizedFilename}`,
      provider: "piper",
      voice: PIPER_VOICE,
      model: getPiperModelLabel(),
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      filename: null,
      url: null,
      provider: "piper",
      voice: PIPER_VOICE,
      model: getPiperModelLabel(),
      error: error.message,
    };
  } finally {
    cleanupFile(tempSourcePath);
  }
}

async function generateOpenAiSpeech({ text, sessionId = null }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      filename: null,
      url: null,
      provider: "openai",
      voice: DEFAULT_VOICE,
      model: DEFAULT_MODEL,
      error: "OPENAI_API_KEY not configured",
    };
  }

  if (typeof text !== "string" || text.trim().length === 0) {
    return {
      success: false,
      filename: null,
      url: null,
      provider: "openai",
      voice: DEFAULT_VOICE,
      model: DEFAULT_MODEL,
      error: "empty text",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const normalizedFilename = buildTtsFilename();
  const normalizedPath = path.join(TTS_UPLOADS_DIR, normalizedFilename);
  const tempSourcePath = path.join(os.tmpdir(), `${path.parse(normalizedFilename).name}-source.wav`);

  ensureTtsUploadsDir();

  try {
    const response = await fetch(OPENAI_TTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        voice: DEFAULT_VOICE,
        input: text,
        response_format: "wav",
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        filename: null,
        url: null,
        provider: "openai",
        voice: DEFAULT_VOICE,
        model: DEFAULT_MODEL,
        error: `OpenAI TTS failed: ${response.status} ${errorText}`,
      };
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(tempSourcePath, audioBuffer);
    await normalizeWavFile(tempSourcePath, normalizedPath, DEFAULT_TIMEOUT_MS);

    return {
      success: true,
      filename: normalizedFilename,
      url: `/tts/${normalizedFilename}`,
      provider: "openai",
      voice: DEFAULT_VOICE,
      model: DEFAULT_MODEL,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      filename: null,
      url: null,
      provider: "openai",
      voice: DEFAULT_VOICE,
      model: DEFAULT_MODEL,
      error: error.message,
    };
  } finally {
    clearTimeout(timeout);
    cleanupFile(tempSourcePath);
  }
}

async function generateGoogleSpeech({ text, sessionId = null }) {
  if (typeof text !== "string" || text.trim().length === 0) {
    return { success: false, error: "empty text" };
  }

  const isHindi = /[\u0900-\u097F]/.test(text);
  const lang = isHindi ? "hi" : "en";
  const normalizedFilename = buildTtsFilename();
  const normalizedPath = path.join(TTS_UPLOADS_DIR, normalizedFilename);

  ensureTtsUploadsDir();

  // Free Google TTS endpoint (Supports all languages, never blocked by cloud datacenters)
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.trim().slice(0, 200))}&tl=${lang}&client=tw-ob`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });

    if (!response.ok) {
      throw new Error(`Google TTS request failed: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const mp3Buffer = Buffer.from(arrayBuffer);

    const { mp3BufferToWavBuffer } = require("../utils/audio-converter");
    const wavBuffer = await mp3BufferToWavBuffer(mp3Buffer, NORMALIZED_SAMPLE_RATE);
    fs.writeFileSync(normalizedPath, wavBuffer);

    console.log(`[TTS Google] Success! Generated ${normalizedFilename} (${wavBuffer.length} bytes)`);

    return {
      success: true,
      filename: normalizedFilename,
      url: `/tts/${normalizedFilename}`,
      provider: "google",
      voice: lang,
      model: "neural",
      error: null,
    };
  } catch (err) {
    console.error(`[TTS Google] Failed: ${err.message}`);
    return {
      success: false,
      filename: null,
      url: null,
      provider: "google",
      voice: lang,
      model: "neural",
      error: err.message,
    };
  }
}

async function generateSpeech({ text, sessionId = null, voice = null }) {
  const provider = (process.env.TTS_PROVIDER || "edge").trim().toLowerCase();

  // 1. Try Edge TTS (Primary - Indian Male Voices: en-IN-PrabhatNeural, gu-IN-NiranjanNeural, hi-IN-MadhurNeural)
  const edgeResult = await generateEdgeSpeech({ text, sessionId, voice });
  if (edgeResult.success) {
    try { recordTtsUsage({ provider: "edge", characterCount: text.length }); } catch (_) {}
    return edgeResult;
  }
  console.warn(`[TTS] Edge TTS failed (${edgeResult.error}). Switching to Gemini Neural Male Voice ("Puck")...`);

  // 2. Guaranteed Datacenter-Unblocked Neural Male Voice Fallback (Gemini "Puck" - Never blocked on Render)
  const geminiResult = await generateGeminiSpeech({ text, sessionId });
  if (geminiResult.success) {
    try { recordTtsUsage({ provider: "gemini", characterCount: text.length }); } catch (_) {}
    return geminiResult;
  }
  console.warn(`[TTS] Gemini TTS failed (${geminiResult.error}). Checking backup providers...`);

  // 3. Fallback to Piper if configured
  if (provider === "piper") {
    const piperResult = await generatePiperSpeech({ text, sessionId });
    if (piperResult.success) {
      try { recordTtsUsage({ provider: "piper", characterCount: text.length }); } catch (_) {}
      return piperResult;
    }
  }

  // 4. Fallback to OpenAI if configured
  if (process.env.OPENAI_API_KEY) {
    return generateOpenAiSpeech({ text, sessionId });
  }

  return {
    success: false,
    filename: null,
    url: null,
    provider: "edge",
    voice: voice || EDGE_VOICE,
    model: "neural",
    error: `TTS failed: Edge (${edgeResult.error}), Gemini (${geminiResult.error})`,
  };
}

module.exports = {
  generateSpeech,
  generateEdgeSpeech,
  generateGoogleSpeech,
  generatePiperSpeech,
  NORMALIZED_SAMPLE_RATE,
};
