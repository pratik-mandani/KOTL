const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { generateSpeech } = require("../services/tts");
const { normalizeWhisperTranscript } = require("../services/stt");

const execFileAsync = promisify(execFile);

const WHISPER_BIN = process.env.WHISPER_BIN || "";
const WHISPER_MODEL_PATH = process.env.WHISPER_MODEL_PATH || "";
const WHISPER_LANGUAGE = process.env.WHISPER_LANGUAGE || "auto";
const FFMPEG_BIN = process.env.FFMPEG_BIN || "ffmpeg";
const BACKEND_UPLOADS_DIR = path.join(__dirname, "..", "uploads");

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function cleanupWhisperOutputs(outputBase) {
  for (const extension of [".txt", ".vtt", ".srt", ".csv", ".json", ".wts"]) {
    const outputPath = `${outputBase}${extension}`;
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
  }
}

async function resolveTestWav() {
  const explicitPath = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : "";
  if (explicitPath) {
    if (!fs.existsSync(explicitPath)) {
      fail(`explicit WAV path not found: ${explicitPath}`);
    }

    if (path.extname(explicitPath).toLowerCase() !== ".wav") {
      fail(`explicit test file must be a .wav: ${explicitPath}`);
    }

    return {
      wavPath: explicitPath,
      cleanup: null,
      source: "explicit WAV path",
    };
  }

  const ttsResult = await generateSpeech({
    text: "Hello from KOTL",
    sessionId: "check-whisper",
  });

  if (!ttsResult.success || !ttsResult.filename) {
    return null;
  }

  const generatedPath = path.join(BACKEND_UPLOADS_DIR, "tts", ttsResult.filename);
  if (!fs.existsSync(generatedPath)) {
    return null;
  }

  return {
    wavPath: generatedPath,
    cleanup: () => {
      if (fs.existsSync(generatedPath)) {
        fs.unlinkSync(generatedPath);
      }
    },
    source: "generated Piper speech fixture",
  };
}

async function main() {
  let cleanup = null;
  const outputBase = path.join(require("os").tmpdir(), `kotl-whisper-check-${Date.now()}`);
  const transcriptPath = `${outputBase}.txt`;

  try {
    if (!WHISPER_BIN) {
      fail("WHISPER_BIN not configured");
    }

    if (!fs.existsSync(WHISPER_BIN)) {
      fail(`Whisper binary not found: ${WHISPER_BIN}`);
    }

    console.log(`OK: Whisper binary found at ${WHISPER_BIN}`);

    try {
      await execFileAsync(WHISPER_BIN, ["--help"], { windowsHide: true });
      console.log("OK: Whisper binary runs");
    } catch (error) {
      fail(`Whisper binary failed to run: ${error.message}`);
    }

    if (!WHISPER_MODEL_PATH) {
      fail("WHISPER_MODEL_PATH not configured");
    }

    if (!fs.existsSync(WHISPER_MODEL_PATH)) {
      fail(`Whisper model not found: ${WHISPER_MODEL_PATH}`);
    }

    console.log(`OK: Whisper model found at ${WHISPER_MODEL_PATH}`);

    try {
      await execFileAsync(FFMPEG_BIN, ["-version"], { windowsHide: true });
      console.log("OK: ffmpeg available");
    } catch (error) {
      fail(`ffmpeg not available: ${error.message}`);
    }

    const testWav = await resolveTestWav();
    if (!testWav) {
      fail("No explicit WAV was provided and Piper speech fixture generation was unavailable");
    }

    cleanup = testWav.cleanup;
    console.log(`OK: Using test WAV from ${testWav.source}: ${testWav.wavPath}`);

    await execFileAsync(
      WHISPER_BIN,
      [
        "-m",
        WHISPER_MODEL_PATH,
        "-f",
        testWav.wavPath,
        "-l",
        WHISPER_LANGUAGE,
        "-otxt",
        "-of",
        outputBase,
      ],
      {
        windowsHide: true,
      }
    );

    if (!fs.existsSync(transcriptPath)) {
      fail("Whisper transcription output .txt file was not created");
    }

    const transcriptText = fs.readFileSync(transcriptPath, "utf8");
    const normalizedText = normalizeWhisperTranscript(transcriptText);
    if (!normalizedText) {
      fail("Whisper transcript was empty after normalization");
    }

    console.log(`OK: Whisper transcript generated: ${normalizedText}`);
    console.log("OK: Whisper check passed");
  } catch (error) {
    fail(error.message);
  } finally {
    cleanupWhisperOutputs(outputBase);
    if (typeof cleanup === "function") {
      cleanup();
    }
  }
}

main();
