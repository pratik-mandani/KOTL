/**
 * KOTL QA/QS Automated Audio Acoustic & Noise Test Suite
 * Verifies backend silence handling, noise rejection, and clean speech responses.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { EdgeTTS } = require("node-edge-tts");
const { convertMp3FileToWavFile } = require("../utils/audio-converter");
const os = require("os");

const PORT = process.env.TEST_PORT || 3000;
const HOST = "127.0.0.1";

function postAudio(buffer, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: HOST,
        port: PORT,
        path: "/audio",
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Sample-Rate": "8000",
          "X-Duration-Ms": String(Math.round((buffer.length / 2 / 8000) * 1000)),
          "X-Audio-Format": "raw_pcm_16le",
          "X-Stream-Audio": "true",
          "Content-Length": buffer.length,
          ...headers,
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const bodyBuffer = Buffer.concat(chunks);
          const contentType = res.headers["content-type"] || "";
          const ttsReady = res.headers["x-tts-ready"] === "true";
          const transcript = decodeURIComponent(res.headers["x-transcript"] || "");
          const assistantReply = decodeURIComponent(res.headers["x-assistant-reply"] || "");
          const turnStatus = res.headers["x-turn-status"] || "";

          let jsonBody = null;
          if (contentType.includes("application/json")) {
            try {
              jsonBody = JSON.parse(bodyBuffer.toString("utf8"));
            } catch (_) {}
          }

          resolve({
            statusCode: res.statusCode,
            contentType,
            ttsReady: ttsReady || (jsonBody && jsonBody.tts_ready),
            transcript: transcript || (jsonBody && jsonBody.transcript),
            assistantReply: assistantReply || (jsonBody && jsonBody.assistant_reply),
            turnStatus: turnStatus || (jsonBody && jsonBody.turn_status),
            bodyLength: bodyBuffer.length,
            jsonBody,
          });
        });
      }
    );

    req.on("error", reject);
    req.write(buffer);
    req.end();
  });
}

async function runQaTests() {
  console.log("=================================================");
  console.log(">>> KOTL AUDIO QA/QS ACOUSTIC VERIFICATION SUITE <<<");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  // TEST 1: Pure Silence Buffer (2 seconds @ 8kHz = 32000 bytes of zeros)
  console.log("[Test 1] Testing Ambient Room Silence (Zero amplitude)...");
  const silenceBuffer = Buffer.alloc(16000 * 2, 0); // 16,000 samples = 2s
  try {
    const res1 = await postAudio(silenceBuffer);
    if (!res1.ttsReady && res1.turnStatus === "silence_ignored") {
      console.log("  [PASS] Silence safely ignored! No spoken reply generated.");
      passed++;
    } else {
      console.error(`  [FAIL] Silence was NOT safely ignored! ttsReady: ${res1.ttsReady}, status: ${res1.turnStatus}`);
      failed++;
    }
  } catch (err) {
    console.error("  [FAIL] Test 1 network error:", err.message);
    failed++;
  }

  // TEST 2: Office Noise / Music Simulation (Synthetic random noise @ 1,500 amplitude)
  console.log("\n[Test 2] Testing Office Music / Chatter Simulation (Amplitude: 1,500, no words)...");
  const noiseBuffer = Buffer.alloc(16000 * 2);
  for (let i = 0; i < 16000; i++) {
    // Generate simulated background music (chords + slight noise)
    const sample = Math.round(Math.sin((i / 8000) * 440 * 2 * Math.PI) * 1200 + (Math.random() - 0.5) * 600);
    noiseBuffer.writeInt16LE(sample, i * 2);
  }

  try {
    const res2 = await postAudio(noiseBuffer);
    if (!res2.ttsReady) {
      console.log("  [PASS] Office music/noise safely dismissed without speech! No feedback loop.");
      passed++;
    } else {
      console.error(`  [FAIL] Office music triggered spoken reply! Transcript: "${res2.transcript}", assistantReply: "${res2.assistantReply}"`);
      failed++;
    }
  } catch (err) {
    console.error("  [FAIL] Test 2 network error:", err.message);
    failed++;
  }

  // TEST 3: Genuine User Speech Question ("કેમ છો KOTL?")
  console.log("\n[Test 3] Testing Genuine User Speech ('કેમ છો KOTL?')...");
  try {
    const tempMp3 = path.join(os.tmpdir(), `qa-speech-${Date.now()}.mp3`);
    const tempWav = path.join(os.tmpdir(), `qa-speech-${Date.now()}.wav`);
    const tts = new EdgeTTS({
      voice: "gu-IN-NiranjanNeural",
      lang: "gu-IN",
      outputFormat: "audio-24khz-48kbitrate-mono-mp3",
      timeout: 10000,
    });
    await tts.ttsPromise("કેમ છો KOTL?", tempMp3);
    await convertMp3FileToWavFile(tempMp3, tempWav, 8000);

    const wavBuf = fs.readFileSync(tempWav);
    let pcmOffset = 44;
    const dataIdx = wavBuf.indexOf("data");
    if (dataIdx !== -1 && dataIdx + 8 < wavBuf.length) {
      pcmOffset = dataIdx + 8;
    }
    const realSpeechPcm = wavBuf.subarray(pcmOffset);

    const res3 = await postAudio(realSpeechPcm);
    if (res3.ttsReady && res3.bodyLength > 1000) {
      console.log(`  [PASS] Genuine speech answered! Transcript: "${res3.transcript}", Reply: "${res3.assistantReply}"`);
      console.log(`  [PASS] Kid-friendly male TTS audio received: ${res3.bodyLength} bytes.`);
      passed++;
    } else {
      console.error(`  [FAIL] Genuine speech did not generate expected reply: ttsReady=${res3.ttsReady}`);
      failed++;
    }

    try {
      if (fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3);
      if (fs.existsSync(tempWav)) fs.unlinkSync(tempWav);
    } catch (_) {}
  } catch (err) {
    console.error("  [FAIL] Test 3 error:", err.message);
    failed++;
  }

  console.log("\n=================================================");
  console.log(`QA/QS Results: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runQaTests();
}

module.exports = { runQaTests };
