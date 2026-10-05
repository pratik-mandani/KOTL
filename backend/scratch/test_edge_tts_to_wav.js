const { EdgeTTS } = require("node-edge-tts");
const { execFile } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");

const execFileAsync = promisify(execFile);
const FFMPEG_BIN = "D:/KOTL/tools/ffmpeg/bin/ffmpeg.exe";

async function generateSpeechEdge({ text, outputPath }) {
  const start = Date.now();
  const tts = new EdgeTTS({
    voice: "en-US-ChristopherNeural",
    lang: "en-US",
    outputFormat: "audio-24khz-48kbitrate-mono-mp3"
  });

  const tempMp3Path = path.join(__dirname, `temp_${Date.now()}.mp3`);
  await tts.ttsPromise(text, tempMp3Path);

  // Convert MP3 to 16kHz 16-bit Mono WAV for ESP32
  await execFileAsync(FFMPEG_BIN, [
    "-y",
    "-i", tempMp3Path,
    "-ar", "16000",
    "-ac", "1",
    "-c:a", "pcm_s16le",
    "-filter:a", "volume=0.9",
    outputPath
  ]);

  if (fs.existsSync(tempMp3Path)) {
    fs.unlinkSync(tempMp3Path);
  }

  const elapsed = Date.now() - start;
  const stat = fs.statSync(outputPath);
  console.log(`TTS Generation SUCCESS: ${outputPath} (${stat.size} bytes) in ${elapsed}ms!`);
  return { success: true, elapsed, size: stat.size };
}

generateSpeechEdge({
  text: "Greetings. A wise strategist evaluates every move before taking action.",
  outputPath: path.join(__dirname, "chanakya_speech_test.wav")
}).catch(console.error);
