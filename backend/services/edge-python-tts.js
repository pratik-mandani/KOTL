/**
 * Edge-TTS Python Execution Service
 * Uses edge-tts v7.3.1 CLI with Microsoft Sec-MS-GEC v2 tokens.
 * Guaranteed 100% Indian Male voices at natural speaking rate (-20%).
 */

const { execFile } = require("child_process");
const { promisify } = require("util");
const path = require("path");
const os = require("os");
const fs = require("fs");
const { mp3BufferToWavBuffer } = require("../utils/audio-converter");

const execFileAsync = promisify(execFile);

async function synthesizeEdgePython(text, voice = "en-IN-PrabhatNeural", rate = "-20%") {
  if (!text || !text.trim()) return null;

  const tempMp3 = path.join(
    os.tmpdir(),
    `edge-py-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.mp3`
  );

  try {
    const pythonBin = process.platform === "win32" ? "python" : "python3";
    await execFileAsync(
      pythonBin,
      [
        "-m",
        "edge_tts",
        "--voice",
        voice,
        `--rate=${rate}`,
        "--text",
        text.trim(),
        "--write-media",
        tempMp3,
      ],
      { timeout: 15000 }
    );

    if (fs.existsSync(tempMp3)) {
      const mp3Bytes = fs.readFileSync(tempMp3);
      if (mp3Bytes && mp3Bytes.length > 0) {
        const wavBytes = await mp3BufferToWavBuffer(mp3Bytes, 16000);
        return wavBytes.subarray(44);
      }
    }
  } catch (err) {
    console.warn(`[Edge-TTS Python] Synthesis attempt failed: ${err.message}`);
  } finally {
    try {
      if (fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3);
    } catch (_) {}
  }
  return null;
}

module.exports = {
  synthesizeEdgePython,
};
