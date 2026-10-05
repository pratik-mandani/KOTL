const { execFile, spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { promisify } = require("util");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const execFileAsync = promisify(execFile);

const PIPER_BIN = process.env.PIPER_BIN || "";
const PIPER_MODEL_PATH = process.env.PIPER_MODEL_PATH || "";
const PIPER_CONFIG_PATH = process.env.PIPER_CONFIG_PATH || "";
const NORMALIZED_SAMPLE_RATE = Number.parseInt(process.env.TTS_PLAYBACK_SAMPLE_RATE || "", 10) || 16000;
const DEFAULT_TIMEOUT_MS = Number.parseInt(process.env.OPENAI_TIMEOUT_MS || "", 10) || 15000;
const FFMPEG_BIN = process.env.FFMPEG_BIN || "ffmpeg";

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function cleanupFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

async function normalizeWavFile(sourcePath, targetPath) {
  await execFileAsync(
    FFMPEG_BIN,
    [
      "-y",
      "-i",
      sourcePath,
      "-ac",
      "1",
      "-ar",
      String(NORMALIZED_SAMPLE_RATE),
      "-sample_fmt",
      "s16",
      targetPath,
    ],
    {
      windowsHide: true,
      timeout: DEFAULT_TIMEOUT_MS,
    }
  );
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
      if (finished) {
        return;
      }

      finished = true;
      child.kill();
      reject(new Error("piper synthesis timeout"));
    }, DEFAULT_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk) => stderrChunks.push(chunk));

    child.on("error", (error) => {
      if (finished) {
        return;
      }

      finished = true;
      clearTimeout(timeout);
      reject(error);
    });

    child.on("close", (code) => {
      if (finished) {
        return;
      }

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

    child.stdin.write(text);
    child.stdin.end();
  });
}

async function main() {
  const tempSourcePath = path.join(os.tmpdir(), `kotl-piper-check-${Date.now()}-source.wav`);
  const tempNormalizedPath = path.join(os.tmpdir(), `kotl-piper-check-${Date.now()}-normalized.wav`);

  try {
    if (!PIPER_BIN) {
      fail("PIPER_BIN not configured");
    }

    if (!fs.existsSync(PIPER_BIN)) {
      fail(`Piper binary not found: ${PIPER_BIN}`);
    }

    console.log(`OK: Piper binary found at ${PIPER_BIN}`);

    try {
      await execFileAsync(PIPER_BIN, ["--help"], {
        windowsHide: true,
        timeout: DEFAULT_TIMEOUT_MS,
      });
      console.log("OK: Piper binary runs");
    } catch (error) {
      fail(`Piper binary failed to run: ${error.message}`);
    }

    if (!PIPER_MODEL_PATH) {
      fail("PIPER_MODEL_PATH not configured");
    }

    if (!fs.existsSync(PIPER_MODEL_PATH)) {
      fail(`Piper model not found: ${PIPER_MODEL_PATH}`);
    }

    console.log(`OK: Piper model found at ${PIPER_MODEL_PATH}`);

    if (!PIPER_CONFIG_PATH) {
      fail("PIPER_CONFIG_PATH not configured");
    }

    if (!fs.existsSync(PIPER_CONFIG_PATH)) {
      fail(`Piper config not found: ${PIPER_CONFIG_PATH}`);
    }

    console.log(`OK: Piper config found at ${PIPER_CONFIG_PATH}`);

    try {
      await execFileAsync(FFMPEG_BIN, ["-version"], {
        windowsHide: true,
        timeout: DEFAULT_TIMEOUT_MS,
      });
      console.log("OK: ffmpeg available");
    } catch (error) {
      fail(`ffmpeg not available: ${error.message}`);
    }

    await runPiperSynthesis({
      text: "Hello from KOTL",
      outputPath: tempSourcePath,
    });

    if (!fs.existsSync(tempSourcePath)) {
      fail("Piper synthesis completed without producing a WAV file");
    }

    console.log(`OK: Piper generated test WAV at ${tempSourcePath}`);

    await normalizeWavFile(tempSourcePath, tempNormalizedPath);

    if (!fs.existsSync(tempNormalizedPath)) {
      fail("ffmpeg normalization completed without producing a WAV file");
    }

    console.log(`OK: Normalized WAV generated at ${tempNormalizedPath}`);
    console.log(`OK: Piper check passed at ${NORMALIZED_SAMPLE_RATE} Hz`);
  } catch (error) {
    fail(error.message);
  } finally {
    cleanupFile(tempSourcePath);
    cleanupFile(tempNormalizedPath);
  }
}

main();
