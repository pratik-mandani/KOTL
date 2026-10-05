const { execFile } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { promisify } = require("util");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const execFileAsync = promisify(execFile);

const WHISPER_BIN = process.env.WHISPER_BIN || "";
const WHISPER_MODEL_PATH = process.env.WHISPER_MODEL_PATH || "";
const WHISPER_LANGUAGE = process.env.WHISPER_LANGUAGE || "auto";
const WHISPER_TIMEOUT_MS = Number.parseInt(process.env.WHISPER_TIMEOUT_MS || process.env.OPENAI_TIMEOUT_MS || "", 10) || 45000;

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

async function main() {
  const wavArg = process.argv[2];
  if (!wavArg) {
    fail("usage: npm run transcribe:wav -- path/to/file.wav");
  }

  const wavPath = path.resolve(process.cwd(), wavArg);
  if (!fs.existsSync(wavPath)) {
    fail(`WAV file not found: ${wavPath}`);
  }

  if (path.extname(wavPath).toLowerCase() !== ".wav") {
    fail(`input must be a .wav file: ${wavPath}`);
  }

  if (!WHISPER_BIN) {
    fail("WHISPER_BIN not configured");
  }

  if (!fs.existsSync(WHISPER_BIN)) {
    fail(`Whisper binary not found: ${WHISPER_BIN}`);
  }

  if (!WHISPER_MODEL_PATH) {
    fail("WHISPER_MODEL_PATH not configured");
  }

  if (!fs.existsSync(WHISPER_MODEL_PATH)) {
    fail(`Whisper model not found: ${WHISPER_MODEL_PATH}`);
  }

  const outputBase = path.join(os.tmpdir(), `kotl-transcribe-wav-${Date.now()}`);
  const transcriptPath = `${outputBase}.txt`;
  const args = [
    "-m",
    WHISPER_MODEL_PATH,
    "-f",
    wavPath,
    "-l",
    WHISPER_LANGUAGE,
    "-otxt",
    "-of",
    outputBase,
  ];
  const startedAt = Date.now();

  try {
    console.log(`whisper_bin: ${WHISPER_BIN}`);
    console.log(`whisper_model: ${WHISPER_MODEL_PATH}`);
    console.log(`whisper_language: ${WHISPER_LANGUAGE}`);
    console.log(`wav_path: ${wavPath}`);
    console.log(`timeout_ms: ${WHISPER_TIMEOUT_MS}`);
    console.log(`command_args: ${JSON.stringify(args)}`);

    let stdout = "";
    let stderr = "";
    try {
      const result = await execFileAsync(WHISPER_BIN, args, {
        windowsHide: true,
        timeout: WHISPER_TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024,
      });
      stdout = result.stdout || "";
      stderr = result.stderr || "";
    } catch (error) {
      stdout = error.stdout || "";
      stderr = error.stderr || "";
      const elapsedMs = Date.now() - startedAt;
      console.log("===== WHISPER STDOUT =====");
      process.stdout.write(stdout);
      if (!stdout.endsWith("\n")) {
        console.log();
      }
      console.log("===== WHISPER STDERR =====");
      process.stdout.write(stderr);
      if (!stderr.endsWith("\n")) {
        console.log();
      }
      console.log(`execution_time_ms: ${elapsedMs}`);
      fail(`whisper.cpp failed: ${error.message}`);
    }

    const elapsedMs = Date.now() - startedAt;
    const transcriptText = fs.existsSync(transcriptPath) ? fs.readFileSync(transcriptPath, "utf8") : "";

    console.log("===== WHISPER STDOUT =====");
    process.stdout.write(stdout);
    if (!stdout.endsWith("\n")) {
      console.log();
    }
    console.log("===== WHISPER STDERR =====");
    process.stdout.write(stderr);
    if (!stderr.endsWith("\n")) {
      console.log();
    }
    console.log("===== TRANSCRIPT TEXT EXACT =====");
    process.stdout.write(transcriptText);
    if (!transcriptText.endsWith("\n")) {
      console.log();
    }
    console.log("===== TRANSCRIPT SUMMARY =====");
    console.log(`transcript_length: ${transcriptText.length}`);
    console.log(`execution_time_ms: ${elapsedMs}`);
  } finally {
    cleanupWhisperOutputs(outputBase);
  }
}

main();
