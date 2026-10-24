/**
 * Gemini Neural Text-to-Speech Service
 * Provides high-fidelity, uncompressed 16-bit PCM Male speech synthesis ("Puck").
 * Never blocked on cloud datacenters (AWS / Render) or residential IPs.
 * Full support for English, Gujarati, and Hindi.
 */

try {
  require("../utils/env");
} catch (_) {
  try {
    require("dotenv").config();
  } catch (__) {}
}

const fs = require("fs");
const path = require("path");

function resample24kTo16k(pcm24kBuffer) {
  const sampleCount24k = Math.floor(pcm24kBuffer.length / 2);
  const ratio = 24000 / 16000;
  const sampleCount16k = Math.floor(sampleCount24k / ratio);
  const outBuf = Buffer.alloc(sampleCount16k * 2);

  for (let i = 0; i < sampleCount16k; i++) {
    const srcPos = i * ratio;
    const idx0 = Math.floor(srcPos);
    const idx1 = Math.min(idx0 + 1, sampleCount24k - 1);
    const frac = srcPos - idx0;

    const s0 = pcm24kBuffer.readInt16LE(idx0 * 2);
    const s1 = pcm24kBuffer.readInt16LE(idx1 * 2);
    const interp = Math.round(s0 + frac * (s1 - s0));
    outBuf.writeInt16LE(Math.max(-32768, Math.min(32767, interp)), i * 2);
  }
  return outBuf;
}

function pcmToWavBuffer(pcmBuffer, sampleRate = 16000) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([header, pcmBuffer]);
}

/**
 * Synthesizes text directly into 16kHz 16-bit Mono PCM audio Buffer.
 * Perfect for low-latency WebSocket audio streaming to ESP32.
 */
async function synthesizeGeminiPcm(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !text || !text.trim()) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Please read the following text verbatim:\n" + text.trim() }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Puck" // Energetic, friendly young male companion voice
            }
          }
        }
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini TTS API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const b64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!b64) {
    throw new Error("Gemini TTS returned no audio data");
  }

  const pcm24k = Buffer.from(b64, "base64");
  return resample24kTo16k(pcm24k);
}

/**
 * Generates speech WAV file for HTTP / REST clients.
 */
async function generateGeminiSpeech({ text, sessionId = null, uploadsDir = null }) {
  if (typeof text !== "string" || text.trim().length === 0) {
    return {
      success: false,
      filename: null,
      url: null,
      provider: "gemini",
      voice: "Puck (Male)",
      model: "gemini-2.5-flash-tts",
      error: "empty text",
    };
  }

  const pcmBuffer = await synthesizeGeminiPcm(text);
  if (!pcmBuffer || pcmBuffer.length === 0) {
    return {
      success: false,
      filename: null,
      url: null,
      provider: "gemini",
      voice: "Puck (Male)",
      model: "gemini-2.5-flash-tts",
      error: "Gemini TTS produced empty audio",
    };
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `tts-${timestamp}.wav`;
  const targetDir = uploadsDir || path.join(__dirname, "..", "uploads", "tts");
  fs.mkdirSync(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, filename);

  const wavBytes = pcmToWavBuffer(pcmBuffer, 16000);
  fs.writeFileSync(targetPath, wavBytes);

  return {
    success: true,
    filename,
    url: `/tts/${filename}`,
    provider: "gemini",
    voice: "Puck (Male)",
    model: "gemini-2.5-flash-tts",
    error: null,
  };
}

module.exports = {
  resample24kTo16k,
  pcmToWavBuffer,
  synthesizeGeminiPcm,
  generateGeminiSpeech,
};
