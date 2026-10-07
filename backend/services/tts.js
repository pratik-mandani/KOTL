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
const { EdgeTTS } = require("node-edge-tts");

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

const FFMPEG_BIN = process.env.FFMPEG_BIN || ffmpegStaticPath || (os.platform() === "win32" ? "D:/KOTL/tools/ffmpeg/bin/ffmpeg.exe" : "ffmpeg");
const TTS_UPLOADS_DIR = path.join(__dirname, "..", "uploads", "tts");
const PIPER_BIN = process.env.PIPER_BIN || "";
const PIPER_MODEL_PATH = process.env.PIPER_MODEL_PATH || "";
const PIPER_CONFIG_PATH = process.env.PIPER_CONFIG_PATH || "";
const PIPER_VOICE = "local";

const EDGE_VOICE = process.env.EDGE_TTS_VOICE || "gu-IN-NiranjanNeural";
const EDGE_LANG = process.env.EDGE_TTS_LANG || "gu-IN";

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
      `aresample=resampler=swr:osr=${NORMALIZED_SAMPLE_RATE}:dither_method=triangular,volume=0.85`,
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

  const isGujarati = /[\u0A80-\u0AFF]/.test(text);
  const selectedVoice = voice || (isGujarati ? "gu-IN-NiranjanNeural" : EDGE_VOICE);
  const selectedLang = isGujarati ? "gu-IN" : EDGE_LANG;
  const normalizedFilename = buildTtsFilename();
  const normalizedPath = path.join(TTS_UPLOADS_DIR, normalizedFilename);
  const tempMp3Path = path.join(os.tmpdir(), `${path.parse(normalizedFilename).name}-edge.mp3`);

  ensureTtsUploadsDir();

  try {
    const tts = new EdgeTTS({
      voice: selectedVoice,
      lang: selectedLang,
      outputFormat: "audio-24khz-48kbitrate-mono-mp3",
      timeout: 10000,
    });

    console.log(`[TTS Edge] Synthesizing speech with voice "${selectedVoice}"...`);
    await tts.ttsPromise(text.trim(), tempMp3Path);

    if (!fs.existsSync(tempMp3Path)) {
      throw new Error("Edge-TTS failed to produce audio output");
    }

    await normalizeWavFile(tempMp3Path, normalizedPath, 15000);

    const stats = fs.statSync(normalizedPath);
    console.log(`[TTS Edge] Success! Generated ${normalizedFilename} (${stats.size} bytes)`);

    return {
      success: true,
      filename: normalizedFilename,
      url: `/tts/${normalizedFilename}`,
      provider: "edge",
      voice: selectedVoice,
      model: "neural",
      error: null,
    };
  } catch (error) {
    console.error(`[TTS Edge] Failed: ${error.message}`);
    return {
      success: false,
      filename: null,
      url: null,
      provider: "edge",
      voice: selectedVoice,
      model: "neural",
      error: error.message,
    };
  } finally {
    cleanupFile(tempMp3Path);
  }
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

async function generateSpeech({ text, sessionId = null, voice = null }) {
  const provider = (process.env.TTS_PROVIDER || "edge").trim().toLowerCase();

  if (provider === "edge" || !process.env.OPENAI_API_KEY) {
    const edgeResult = await generateEdgeSpeech({ text, sessionId, voice });
    if (edgeResult.success) {
      return edgeResult;
    }
    console.warn(`[TTS] Edge TTS fallback triggered due to: ${edgeResult.error}`);
  }

  if (provider === "piper") {
    const piperResult = await generatePiperSpeech({ text, sessionId });
    if (piperResult.success) {
      return piperResult;
    }
    console.warn(`[TTS] Piper fallback triggered due to: ${piperResult.error}`);
  }

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
    error: "Edge TTS failed and no alternative TTS provider configured",
  };
}

module.exports = {
  generateSpeech,
  generateEdgeSpeech,
  generatePiperSpeech,
  NORMALIZED_SAMPLE_RATE,
};
