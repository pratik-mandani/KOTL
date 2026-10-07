/**
 * KOTL V2 Real-Time WebSocket Audio Stream Benchmark
 * Simulates an ESP32 streaming mic audio to the backend and receiving live audio chunks.
 * Measures Time to First Audio Byte (TTFAB) and total conversation latency.
 */

const { spawn } = require("child_process");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { EdgeTTS } = require("node-edge-tts");
const { writePcm16MonoWav } = require("../utils/wav");

const SERVER_PATH = path.join(__dirname, "..", "server.js");
const SCRATCH_DIR = path.join(__dirname, "..", "scratch");
const TEST_PORT = 3124;
const CHUNK_SIZE = 512; // 512 bytes = 256 samples @ 16kHz (16ms)
const STREAM_INTERVAL_MS = 16; // Real-time transmission pace

fs.mkdirSync(SCRATCH_DIR, { recursive: true });

async function prepareMockQuestionWav() {
  const wavPath = path.join(SCRATCH_DIR, "mock_question.wav");
  if (fs.existsSync(wavPath) && fs.statSync(wavPath).size > 1000) {
    return wavPath;
  }

  console.log("[Benchmark] Generating clean speech sample: 'નમસ્તે, તું કોણ છે?'...");
  const tempMp3 = path.join(os.tmpdir(), "mock_temp.mp3");
  const tts = new EdgeTTS({
    voice: "gu-IN-NiranjanNeural",
    lang: "gu-IN",
    outputFormat: "audio-24khz-48kbitrate-mono-mp3",
    timeout: 10000,
  });

  await tts.ttsPromise("નમસ્તે, તું કોણ છે?", tempMp3);

  // Convert to 16kHz 16-bit PCM WAV using ffmpeg
  const ffmpeg = require("ffmpeg-static");
  const { execFileSync } = require("child_process");
  execFileSync(
    ffmpeg,
    [
      "-y",
      "-i",
      tempMp3,
      "-acodec",
      "pcm_s16le",
      "-ac",
      "1",
      "-ar",
      "16000",
      wavPath,
    ],
    { stdio: "ignore" }
  );

  try {
    fs.unlinkSync(tempMp3);
  } catch (_) {}

  return wavPath;
}

function extractPcmData(wavPath) {
  const buf = fs.readFileSync(wavPath);
  let pcmStart = 44;
  const dataIdx = buf.indexOf("data");
  if (dataIdx !== -1 && dataIdx + 8 < buf.length) {
    pcmStart = dataIdx + 8;
  }
  return buf.subarray(pcmStart);
}

async function runBenchmark() {
  const sampleWav = await prepareMockQuestionWav();
  const pcmData = extractPcmData(sampleWav);
  console.log(`[Benchmark] Audio sample ready: ${pcmData.length} bytes (${(pcmData.length / 32000).toFixed(2)}s)`);

  console.log(`[Benchmark] Starting backend server on port ${TEST_PORT}...`);
  const serverProcess = spawn("node", [SERVER_PATH], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, PORT: String(TEST_PORT) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  serverProcess.stdout.on("data", (data) => {
    const str = data.toString();
    if (str.includes("WebSocket live")) {
      startClientStreaming(serverProcess, pcmData);
    }
  });

  serverProcess.stderr.on("data", (data) => {
    console.error("[Server Error]", data.toString());
  });

  serverProcess.on("exit", (code) => {
    console.log(`[Benchmark] Server exited with code ${code}`);
  });
}

function startClientStreaming(serverProcess, pcmData) {
  console.log(`[Benchmark] Connecting to ws://localhost:${TEST_PORT}/ws ...`);
  const ws = new WebSocket(`ws://localhost:${TEST_PORT}/ws`);

  const receivedAudioChunks = [];
  let tStartListen = 0;
  let tStopListen = 0;
  let tTranscript = 0;
  let tReply = 0;
  let tFirstAudioByte = 0;
  let tDone = 0;

  ws.on("open", () => {
    console.log("[Client] WebSocket connected!");
  });

  ws.on("message", (data, isBinary) => {
    if (isBinary) {
      if (!tFirstAudioByte) {
        tFirstAudioByte = Date.now();
        console.log(`⚡ [TTFAB] First audio packet received in ${(tFirstAudioByte - tStopListen)}ms after speaking stopped!`);
      }
      receivedAudioChunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
      return;
    }

    try {
      const msg = JSON.parse(data.toString());
      console.log(`[Server Event] ${msg.type}:`, msg.text || msg.value || msg.message || "");

      if (msg.type === "hello") {
        ws.send(JSON.stringify({ type: "register", device_id: "ESP32-MOCK-V2" }));
        setTimeout(streamAudioIn, 300);
      } else if (msg.type === "transcript") {
        tTranscript = Date.now();
      } else if (msg.type === "reply_text") {
        tReply = Date.now();
      } else if (msg.type === "tts_end") {
        tDone = Date.now();
        finishBenchmark();
      }
    } catch (e) {
      console.error("[Client parse error]", e);
    }
  });

  async function streamAudioIn() {
    console.log("\n🎙️ [Stream In] Child starts speaking! Streaming PCM audio chunks to server...");
    tStartListen = Date.now();
    ws.send(JSON.stringify({ type: "start_listen" }));

    let offset = 0;
    while (offset < pcmData.length && ws.readyState === WebSocket.OPEN) {
      const nextOffset = Math.min(offset + CHUNK_SIZE, pcmData.length);
      const chunk = pcmData.subarray(offset, nextOffset);
      ws.send(chunk, { binary: true });
      offset = nextOffset;
      await new Promise((r) => setTimeout(r, STREAM_INTERVAL_MS));
    }

    tStopListen = Date.now();
    console.log(`🛑 [Stream In] Child stopped speaking. Sent ${offset} bytes in ${(tStopListen - tStartListen)}ms.`);
    ws.send(JSON.stringify({ type: "stop_listen" }));
    console.log("⏳ [Waiting for AI response] Measuring pipeline latency...\n");
  }

  function finishBenchmark() {
    ws.close();
    serverProcess.kill();

    const totalReceivedBytes = receivedAudioChunks.reduce((acc, c) => acc + c.length, 0);
    const receivedWavPath = path.join(SCRATCH_DIR, "received_response.wav");
    const combinedPcm = Buffer.concat(receivedAudioChunks);
    writePcm16MonoWav({
      wavPath: receivedWavPath,
      sampleRate: 16000,
      audioDataBytes: combinedPcm,
    });

    const sttLatency = tTranscript - tStopListen;
    const llmLatency = tReply - tTranscript;
    const ttsFirstByteLatency = tFirstAudioByte - tReply;
    const conversationLatency = tFirstAudioByte - tStopListen;
    const totalTurnDuration = tDone - tStopListen;

    console.log("\n=======================================================");
    console.log("       🎯 KOTL V2.0 WEBSOCKET LATENCY BENCHMARK        ");
    console.log("=======================================================");
    console.log(`⏱️  1. Groq Whisper STT Latency:         ${sttLatency} ms`);
    console.log(`⏱️  2. Gemini 2.5 Flash LLM Latency:     ${llmLatency} ms`);
    console.log(`⏱️  3. Edge-TTS Audio Synth Latency:     ${ttsFirstByteLatency} ms`);
    console.log("-------------------------------------------------------");
    console.log(`⚡  TIME TO FIRST AUDIO BYTE (TTFAB):    ${conversationLatency} ms (${(conversationLatency / 1000).toFixed(2)}s)`);
    console.log(`📦  Total Received Audio Bytes:          ${totalReceivedBytes} bytes (${(totalReceivedBytes / 32000).toFixed(2)}s playback)`);
    console.log(`🏁  Full Turn Completion Time:           ${totalTurnDuration} ms (${(totalTurnDuration / 1000).toFixed(2)}s)`);
    console.log(`💾  Saved Output Audio to:               ${receivedWavPath}`);
    console.log("=======================================================\n");

    if (conversationLatency > 0 && conversationLatency < 3500) {
      console.log("🎉 SUCCESS: WebSocket streaming benchmark achieved product-level response time!\n");
      process.exit(0);
    } else {
      console.log("⚠️ Finished, check latency breakdown above.\n");
      process.exit(0);
    }
  }

  // Safety timeout
  setTimeout(() => {
    if (!tDone) {
      console.error("[Benchmark] Timed out waiting for turn to finish.");
      ws.close();
      serverProcess.kill();
      process.exit(1);
    }
  }, 35000);
}

runBenchmark().catch((err) => {
  console.error("[Benchmark Fatal Error]", err);
  process.exit(1);
});
