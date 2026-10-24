/**
 * Microsoft Edge TTS v2 Service (Pure Node.js)
 * Uses official Sec-MS-GEC v2 cryptographic tokens (CS64 + SHA256)
 * Connects to speech.platform.bing.com ReadAloud WebSocket.
 * 100% Free, Unlimited, Never blocked on cloud datacenters (AWS / Render).
 * Guaranteed Indian MALE voices at natural rate (-20%).
 */

const WebSocket = require("ws");
const crypto = require("crypto");
const { generateSecMsGecV2, TRUSTED_CLIENT_TOKEN } = require("../utils/sec-ms-gec-v2");
const { mp3BufferToWavBuffer } = require("../utils/audio-converter");

function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatNaturalPunctuation(text) {
  if (!text) return "";
  // Insert a natural acoustic breath pause between sentences without invalid XML tags
  return text.replace(/([.!?।])\s+/g, "$1 ... ");
}

function synthesizeEdgeV2Mp3(text, voice = "en-IN-PrabhatNeural", rate = "-20%", timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const token = generateSecMsGecV2();
    const connectionId = crypto.randomUUID().replace(/-/g, "");
    const version = "2-155.0.4283.45";
    const wssUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${token}&Sec-MS-GEC-Version=${version}&ConnectionId=${connectionId}`;

    const ws = new WebSocket(wssUrl, {
      headers: {
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
        Origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0",
      },
    });

    const audioChunks = [];
    let isFinished = false;

    const timer = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        try {
          ws.terminate();
        } catch (_) {}
        reject(new Error(`Edge TTS v2 timeout after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    ws.on("open", () => {
      const timestamp = new Date().toUTCString();
      const configMsg =
        `X-Timestamp:${timestamp}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: {
                  sentenceBoundaryEnabled: false,
                  wordBoundaryEnabled: false,
                },
                outputFormat: "audio-24khz-48kbitrate-mono-mp3",
              },
            },
          },
        });
      ws.send(configMsg);

      const requestId = crypto.randomUUID().replace(/-/g, "");
      const lang = voice.startsWith("gu-") ? "gu-IN" : voice.startsWith("hi-") ? "hi-IN" : "en-US";
      const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${lang}"><voice name="${voice}"><prosody pitch="+0Hz" rate="${rate}" volume="+0%">${escapeXml(formatNaturalPunctuation(text))}</prosody></voice></speak>`;

      const ssmlMsg = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${timestamp}\r\nPath:ssml\r\n\r\n${ssml}`;
      ws.send(ssmlMsg);
    });

    ws.on("message", (data, isBinary) => {
      if (isBinary) {
        if (data.length > 2) {
          const headerLen = data.readUInt16BE(0);
          if (data.length > 2 + headerLen) {
            const audioData = data.subarray(2 + headerLen);
            audioChunks.push(audioData);
          }
        }
      } else {
        const textMsg = data.toString();
        if (textMsg.includes("Path:turn.end")) {
          if (!isFinished) {
            isFinished = true;
            clearTimeout(timer);
            try {
              ws.close();
            } catch (_) {}
            const fullMp3 = Buffer.concat(audioChunks);
            resolve(fullMp3);
          }
        }
      }
    });

    ws.on("error", (err) => {
      if (!isFinished) {
        isFinished = true;
        clearTimeout(timer);
        reject(err);
      }
    });

    ws.on("close", () => {
      if (!isFinished) {
        isFinished = true;
        clearTimeout(timer);
        const fullMp3 = Buffer.concat(audioChunks);
        if (fullMp3.length > 0) {
          resolve(fullMp3);
        } else {
          reject(new Error("Edge TTS v2 WebSocket closed before audio received"));
        }
      }
    });
  });
}

/**
 * Synthesizes text directly into 16kHz 16-bit Mono PCM audio Buffer.
 */
async function synthesizeEdgeV2Pcm(text, voice = "en-IN-PrabhatNeural", rate = "-20%") {
  if (!text || !text.trim()) return Buffer.alloc(0);

  const mp3Bytes = await synthesizeEdgeV2Mp3(text.trim(), voice, rate);
  if (!mp3Bytes || mp3Bytes.length === 0) {
    throw new Error("Edge TTS v2 produced empty MP3 output");
  }

  const wavBytes = await mp3BufferToWavBuffer(mp3Bytes, 16000);
  return wavBytes.subarray(44);
}

module.exports = {
  synthesizeEdgeV2Mp3,
  synthesizeEdgeV2Pcm,
};
