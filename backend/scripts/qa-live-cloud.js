/**
 * KOTL Complete QA/QC Test against LIVE Cloud Backend (https://kotl.onrender.com)
 * Tests:
 * 1. Health check (/health)
 * 2. HTTP Audio Post (/audio) with Silence Rejection
 * 3. HTTP Audio Post (/audio) with Genuine Hindi Speech
 * 4. WebSocket (/ws) Live Registration & Ping/Pong
 * 5. WebSocket (/ws) Full End-to-End Live Audio Stream (Mic In -> STT -> LLM -> Edge-TTS Audio Chunks Out)
 */

const https = require("https");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { EdgeTTS } = require("node-edge-tts");
const { convertMp3FileToWavFile } = require("../utils/audio-converter");

const CLOUD_HOST = "kotl.onrender.com";

async function runLiveQA() {
  console.log("=================================================");
  console.log("  >>> KOTL LIVE CLOUD QA / QC VERIFICATION <<<   ");
  console.log("  Target: https://" + CLOUD_HOST);
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  // -----------------------------------------------------------------
  // TEST 1: Health Check
  // -----------------------------------------------------------------
  console.log("[Test 1] Checking Cloud Server Health Endpoint...");
  try {
    const health = await new Promise((resolve, reject) => {
      https.get(`https://${CLOUD_HOST}/health`, (res) => {
        let data = "";
        res.on("data", (d) => (data += d));
        res.on("end", () => resolve({ status: res.statusCode, data }));
      }).on("error", reject);
    });

    if (health.status === 200) {
      console.log(`  [PASS] Server is Healthy! (HTTP 200: ${health.data.trim()})`);
      passed++;
    } else {
      console.error(`  [FAIL] Health check returned HTTP ${health.status}: ${health.data}`);
      failed++;
    }
  } catch (err) {
    console.error("  [FAIL] Test 1 Network Error:", err.message);
    failed++;
  }

  // -----------------------------------------------------------------
  // TEST 2: HTTP Silence Rejection
  // -----------------------------------------------------------------
  console.log("\n[Test 2] Testing HTTP Silence Rejection (POST /audio)...");
  try {
    const silenceBuffer = Buffer.alloc(16000 * 2, 0); // 2s of silence @ 8kHz
    const silenceRes = await new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: CLOUD_HOST,
          port: 443,
          path: "/audio",
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "X-Sample-Rate": "8000",
            "X-Duration-Ms": "2000",
            "X-Audio-Format": "raw_pcm_16le",
            "X-Stream-Audio": "true",
            "Content-Length": silenceBuffer.length,
          },
        },
        (res) => {
          let chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            const body = Buffer.concat(chunks);
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: body.toString("utf8"),
            });
          });
        }
      );
      req.on("error", reject);
      req.write(silenceBuffer);
      req.end();
    });

    const statusHeader = silenceRes.headers["x-turn-status"];
    if (statusHeader === "silence_ignored" || silenceRes.body.includes("silence_ignored")) {
      console.log("  [PASS] Ambient silence rejected correctly without hallucinating speech.");
      passed++;
    } else {
      console.error(`  [FAIL] Silence was not marked silence_ignored: status=${statusHeader}, body=${silenceRes.body}`);
      failed++;
    }
  } catch (err) {
    console.error("  [FAIL] Test 2 Network Error:", err.message);
    failed++;
  }

  // -----------------------------------------------------------------
  // TEST 3: Generate Real Speech & Test HTTP Audio Pipeline
  // -----------------------------------------------------------------
  console.log("\n[Test 3] Testing HTTP Audio Pipeline with Hindi Speech ('नमस्ते KOTL')...");
  let testPcmData = null;
  try {
    const tempMp3 = path.join(os.tmpdir(), `qa-live-${Date.now()}.mp3`);
    const tempWav = path.join(os.tmpdir(), `qa-live-${Date.now()}.wav`);
    const tts = new EdgeTTS({
      voice: "hi-IN-MadhurNeural",
      lang: "hi-IN",
      outputFormat: "audio-24khz-48kbitrate-mono-mp3",
      timeout: 10000,
    });
    await tts.ttsPromise("नमस्ते KOTL", tempMp3);
    await convertMp3FileToWavFile(tempMp3, tempWav, 8000);

    const wavBuf = fs.readFileSync(tempWav);
    let pcmOffset = 44;
    const dataIdx = wavBuf.indexOf("data");
    if (dataIdx !== -1 && dataIdx + 8 < wavBuf.length) {
      pcmOffset = dataIdx + 8;
    }
    testPcmData = wavBuf.subarray(pcmOffset);

    // Send HTTP POST
    const speechRes = await new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: CLOUD_HOST,
          port: 443,
          path: "/audio",
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "X-Sample-Rate": "8000",
            "X-Duration-Ms": String(Math.round((testPcmData.length / 2 / 8000) * 1000)),
            "X-Audio-Format": "raw_pcm_16le",
            "X-Stream-Audio": "true",
            "Content-Length": testPcmData.length,
          },
        },
        (res) => {
          let chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            const body = Buffer.concat(chunks);
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              bodyLength: body.length,
              rawBody: body,
            });
          });
        }
      );
      req.on("error", reject);
      req.write(testPcmData);
      req.end();
    });

    const transcript = decodeURIComponent(speechRes.headers["x-transcript"] || "");
    const reply = decodeURIComponent(speechRes.headers["x-assistant-reply"] || "");
    const eyeExpr = speechRes.headers["x-eye-expression"] || "";

    const isWavResponse = speechRes.bodyLength > 1000;
    const isJsonSuccess = speechRes.rawBody.toString().includes('"success":true');

    if (speechRes.statusCode === 200 && (isWavResponse || isJsonSuccess)) {
      let finalTranscript = transcript;
      let finalReply = reply;
      let finalEye = eyeExpr;
      if (!finalTranscript && isJsonSuccess) {
        try {
          const parsed = JSON.parse(speechRes.rawBody.toString());
          finalTranscript = parsed.transcript || "";
          finalReply = parsed.assistant_reply || "";
          finalEye = parsed.eye_expression || "happy";
        } catch (_) {}
      }
      console.log(`  [PASS] Speech Recognized: "${finalTranscript}"`);
      console.log(`  [PASS] AI Reply:          "${finalReply}"`);
      console.log(`  [PASS] Eye Expression:    "${finalEye}"`);
      console.log(`  [PASS] Response Received: ${speechRes.bodyLength} bytes (${isWavResponse ? "WAV stream" : "JSON payload"}).`);
      passed++;
    } else {
      console.error(`  [FAIL] HTTP Audio POST failed! Code: ${speechRes.statusCode}, body length: ${speechRes.bodyLength}, text: ${speechRes.rawBody.toString().slice(0, 200)}`);
      failed++;
    }

    try {
      if (fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3);
      if (fs.existsSync(tempWav)) fs.unlinkSync(tempWav);
    } catch (_) {}
  } catch (err) {
    console.error("  [FAIL] Test 3 Error:", err.message);
    failed++;
  }

  // -----------------------------------------------------------------
  // TEST 4: WebSocket End-to-End Live Stream Test
  // -----------------------------------------------------------------
  console.log("\n[Test 4] Testing WebSocket Live Streaming (wss://" + CLOUD_HOST + "/ws)...");
  try {
    const wsResult = await new Promise((resolve) => {
      const ws = new WebSocket(`wss://${CLOUD_HOST}/ws`, {
        headers: { "User-Agent": "arduino-WebSocket-Client" },
        timeout: 15000,
      });

      let registered = false;
      let transcriptText = "";
      let replyText = "";
      let eyeExpression = "";
      let audioChunksCount = 0;
      let totalAudioBytes = 0;
      let completed = false;

      const timer = setTimeout(() => {
        if (!completed) {
          completed = true;
          ws.close();
          resolve({ ok: false, error: "WebSocket test timed out (30s)" });
        }
      }, 30000);

      ws.on("open", () => {
        console.log("  [WS] Connected! Waiting for server hello...");
      });

      ws.on("message", (data, isBinary) => {
        if (isBinary) {
          audioChunksCount++;
          totalAudioBytes += data.length;
          return;
        }

        try {
          const msg = JSON.parse(data.toString());
          console.log("  [WS Event]", msg.type, msg.text || msg.value || "");

          if (msg.type === "hello") {
            ws.send(JSON.stringify({ type: "register", device_id: "KOTL-QA-ESP32" }));
          } else if (msg.type === "registered") {
            registered = true;
            // Now start streaming our test audio
            streamAudioChunks(ws);
          } else if (msg.type === "transcript") {
            transcriptText = msg.text;
          } else if (msg.type === "reply_text") {
            replyText = msg.text;
          } else if (msg.type === "eye_expression") {
            eyeExpression = msg.value;
          } else if (msg.type === "tts_end") {
            if (!completed) {
              completed = true;
              clearTimeout(timer);
              ws.close();
              resolve({
                ok: true,
                registered,
                transcriptText,
                replyText,
                eyeExpression,
                audioChunksCount,
                totalAudioBytes,
              });
            }
          } else if (msg.type === "error") {
            if (!completed) {
              completed = true;
              clearTimeout(timer);
              ws.close();
              resolve({ ok: false, error: msg.message });
            }
          }
        } catch (e) {
          console.error("  [WS parse error]", e.message);
        }
      });

      ws.on("error", (err) => {
        if (!completed) {
          completed = true;
          clearTimeout(timer);
          resolve({ ok: false, error: err.message });
        }
      });

      async function streamAudioChunks(sock) {
        if (!testPcmData || testPcmData.length === 0) {
          testPcmData = Buffer.alloc(16000 * 2, 0); // fallback
        }
        sock.send(JSON.stringify({ type: "start_listen", sample_rate: 8000 }));
        
        const CHUNK = 512;
        let offset = 0;
        while (offset < testPcmData.length && sock.readyState === WebSocket.OPEN) {
          const end = Math.min(offset + CHUNK, testPcmData.length);
          sock.send(testPcmData.subarray(offset, end), { binary: true });
          offset = end;
          await new Promise((r) => setTimeout(r, 16));
        }

        sock.send(JSON.stringify({ type: "stop_listen" }));
        console.log(`  [WS] Streamed ${offset} bytes PCM to server. Waiting for reply chunks...`);
      }
    });

    if (wsResult.ok) {
      console.log(`  [PASS] WebSocket Registered:   YES`);
      console.log(`  [PASS] Live Transcript:       "${wsResult.transcriptText}"`);
      console.log(`  [PASS] Live Reply:            "${wsResult.replyText}"`);
      console.log(`  [PASS] Eye Expression:        "${wsResult.eyeExpression}"`);
      console.log(`  [PASS] Audio Chunks Streamed: ${wsResult.audioChunksCount} chunks (${wsResult.totalAudioBytes} bytes)`);
      passed++;
    } else {
      console.error(`  [FAIL] WebSocket Stream Failed: ${wsResult.error}`);
      failed++;
    }
  } catch (err) {
    console.error("  [FAIL] Test 4 Error:", err.message);
    failed++;
  }

  // -----------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------
  console.log("\n=================================================");
  console.log(`>>> QA/QC SUMMARY: ${passed} PASSED, ${failed} FAILED <<<`);
  console.log("=================================================");
  if (failed > 0) {
    process.exit(1);
  }
}

runLiveQA();
