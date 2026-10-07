/**
 * KOTL WebSocket Streaming Audio Service
 * Real-time bidirectional audio & control protocol for ESP32 and clients.
 */

const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { transcribeAudio } = require("./stt");
const { generateAssistantReply } = require("./assistant");
const { generateSpeech, NORMALIZED_SAMPLE_RATE } = require("./tts");
const { writePcm16MonoWav } = require("../utils/wav");
const { execFileSync } = require("child_process");
const ffmpegBin = require("ffmpeg-static");
const { EdgeTTS } = require("node-edge-tts");

const HEARTBEAT_INTERVAL_MS = 15000;
const CLIENT_TIMEOUT_MS = 35000;
const AUDIO_CHUNK_STREAM_SIZE = 1024; // 1024 bytes (512 samples @ 16kHz = 32ms per frame)

function splitIntoSentences(text) {
  if (!text || typeof text !== "string") return [];
  const parts = text.match(/[^.!?।\n]+[.!?।\n]*/g);
  if (!parts) return [text.trim()];
  return parts.map((s) => s.trim()).filter((s) => s.length > 0);
}

async function synthesizeSentencePcm(text) {
  if (!text || !text.trim()) return Buffer.alloc(0);

  const isGujarati = /[\u0A80-\u0AFF]/.test(text);
  const voice = isGujarati ? "gu-IN-NiranjanNeural" : "en-US-GuyNeural";
  const lang = isGujarati ? "gu-IN" : "en-US";
  const tempMp3 = path.join(
    os.tmpdir(),
    `sentence-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.mp3`
  );

  const tts = new EdgeTTS({
    voice,
    lang,
    outputFormat: "audio-24khz-48kbitrate-mono-mp3",
    timeout: 10000,
  });

  await tts.ttsPromise(text.trim(), tempMp3);

  let pcmBuffer = Buffer.alloc(0);
  try {
    pcmBuffer = execFileSync(
      ffmpegBin,
      [
        "-y",
        "-i",
        tempMp3,
        "-f",
        "s16le",
        "-acodec",
        "pcm_s16le",
        "-ac",
        "1",
        "-ar",
        "16000",
        "pipe:1",
      ],
      { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 10 * 1024 * 1024 }
    );
  } finally {
    try {
      if (fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3);
    } catch (_) {}
  }

  return pcmBuffer;
}

function initWebSocketServer(httpServer) {
  const wss = new WebSocket.Server({ noServer: true });

  // Handle upgrade on both '/ws' and root '/'
  httpServer.on("upgrade", (request, socket, head) => {
    const pathname = request.url.split("?")[0];
    if (pathname === "/ws" || pathname === "/" || pathname === "/stream") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  console.log("[WebSocket] KOTL WebSocket server initialized on paths: /ws, /stream, /");

  wss.on("connection", (ws, request) => {
    const clientIp = request.headers["x-forwarded-for"] || request.socket.remoteAddress;
    console.log(`[WebSocket] Client connected from ${clientIp}`);

    // Session state for this connection
    ws.isAlive = true;
    ws.deviceId = `ESP32-${Date.now().toString(36)}`;
    ws.sessionId = `ws-session-${Date.now()}`;
    ws.state = "IDLE"; // IDLE, LISTENING, THINKING, SPEAKING
    ws.audioChunks = [];
    ws.totalAudioBytes = 0;

    // Helper: Send JSON message
    const sendJson = (obj) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(obj));
      }
    };

    // Helper: Send binary audio frame
    const sendBinary = (buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(buffer, { binary: true });
      }
    };

    // Helper: Broadcast state change
    const setState = (newState) => {
      ws.state = newState;
      sendJson({ type: "state", value: newState });
    };

    // Welcome handshake
    sendJson({
      type: "hello",
      server: "KOTL-Backend-v2.0",
      sample_rate: NORMALIZED_SAMPLE_RATE,
      message: "Ready for live audio streaming",
    });

    // Pong handler for heartbeat
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    // Main message handler
    ws.on("message", async (data, isBinary) => {
      try {
        if (isBinary) {
          // --- BINARY AUDIO CHUNK RECEIVED ---
          if (ws.state === "LISTENING") {
            const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data);
            ws.audioChunks.push(chunk);
            ws.totalAudioBytes += chunk.length;
          }
          return;
        }

        // --- JSON CONTROL MESSAGE RECEIVED ---
        let msg;
        try {
          msg = JSON.parse(data.toString());
        } catch (e) {
          console.warn("[WebSocket] Received invalid JSON:", data.toString().slice(0, 100));
          return;
        }

        switch (msg.type) {
          case "ping":
            sendJson({ type: "pong", timestamp: Date.now() });
            break;

          case "register":
          case "hello":
            if (msg.device_id) ws.deviceId = msg.device_id;
            console.log(`[WebSocket] Client registered: ${ws.deviceId}`);
            sendJson({ type: "registered", device_id: ws.deviceId, status: "ok" });
            break;

          case "start_listen":
            console.log(`[WebSocket ${ws.deviceId}] Listening started...`);
            ws.audioChunks = [];
            ws.totalAudioBytes = 0;
            setState("LISTENING");
            break;

          case "stop_listen":
            console.log(
              `[WebSocket ${ws.deviceId}] Listening stopped. Received ${ws.totalAudioBytes} bytes (${(
                ws.totalAudioBytes / 32000
              ).toFixed(2)}s)`
            );
            setState("THINKING");

            if (ws.audioChunks.length === 0 || ws.totalAudioBytes < 1600) {
              console.log(`[WebSocket ${ws.deviceId}] Audio too short, ignoring.`);
              setState("IDLE");
              sendJson({ type: "warning", message: "Audio too short or empty" });
              return;
            }

            // Combine all received PCM chunks into a complete buffer
            const rawPcmBuffer = Buffer.concat(ws.audioChunks);
            ws.audioChunks = [];
            ws.totalAudioBytes = 0;

            // Process turn asynchronously
            await handleVoiceTurn(ws, rawPcmBuffer, sendJson, sendBinary, setState);
            break;

          case "cancel":
            console.log(`[WebSocket ${ws.deviceId}] Turn canceled by client`);
            ws.audioChunks = [];
            ws.totalAudioBytes = 0;
            setState("IDLE");
            break;

          default:
            console.log(`[WebSocket] Unknown command: ${msg.type}`);
        }
      } catch (err) {
        console.error(`[WebSocket Error]`, err);
        sendJson({ type: "error", message: err.message });
        setState("IDLE");
      }
    });

    ws.on("close", (code, reason) => {
      console.log(`[WebSocket] Client disconnected (${ws.deviceId}): code ${code}, reason ${reason}`);
      ws.audioChunks = [];
    });

    ws.on("error", (err) => {
      console.error(`[WebSocket Error ${ws.deviceId}]:`, err.message);
    });
  });

  // Heartbeat keep-alive timer
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log(`[WebSocket] Terminating inactive client: ${ws.deviceId}`);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, HEARTBEAT_INTERVAL_MS);

  wss.on("close", () => {
    clearInterval(interval);
  });

  return wss;
}

/**
 * Executes a full Voice Turn: STT -> LLM -> TTS -> Audio Stream out
 */
async function handleVoiceTurn(ws, rawPcmBuffer, sendJson, sendBinary, setState) {
  const turnStartTime = Date.now();
  const tempWavPath = path.join(os.tmpdir(), `ws-turn-${Date.now()}.wav`);

  try {
    // 1. Write PCM buffer to temporary 16kHz WAV file for STT
    writePcm16MonoWav({
      wavPath: tempWavPath,
      sampleRate: NORMALIZED_SAMPLE_RATE,
      audioDataBytes: rawPcmBuffer,
    });

    // 2. Transcribe Audio (Groq Whisper)
    console.log(`[WebSocket ${ws.deviceId}] Transcribing audio...`);
    const sttResult = await transcribeAudio(tempWavPath);
    const transcript = (sttResult.text || "").trim();

    if (!transcript) {
      console.log(`[WebSocket ${ws.deviceId}] Whisper returned empty transcript.`);
      sendJson({ type: "transcript", text: "" });
      setState("IDLE");
      return;
    }

    sendJson({
      type: "transcript",
      text: transcript,
      duration_ms: Date.now() - turnStartTime,
    });
    console.log(`[WebSocket ${ws.deviceId}] Transcript: "${transcript}"`);

    // 3. Generate Assistant Reply (Gemini 2.5 Flash)
    console.log(`[WebSocket ${ws.deviceId}] Asking Gemini...`);
    const assistantResult = await generateAssistantReply({
      prompt: transcript,
      sessionId: ws.sessionId,
    });
    const replyText = (assistantResult.reply || "").trim();

    sendJson({
      type: "reply_text",
      text: replyText,
      provider: assistantResult.provider,
      model: assistantResult.model,
    });
    console.log(`[WebSocket ${ws.deviceId}] Reply: "${replyText}"`);

    // 4. Synthesize and Stream Speech in sentence chunks
    const sentences = splitIntoSentences(replyText);
    console.log(`[WebSocket ${ws.deviceId}] Synthesizing speech across ${sentences.length} sentence(s)...`);

    if (sentences.length === 0) {
      setState("IDLE");
      return;
    }

    let isFirstSentence = true;
    let totalStreamedBytes = 0;

    // Pipeline synthesis: sentence 0 synthesizes immediately
    let nextSentencePromise = synthesizeSentencePcm(sentences[0]);

    for (let i = 0; i < sentences.length; i++) {
      if (ws.readyState !== WebSocket.OPEN) break;

      console.log(`[WebSocket ${ws.deviceId}] Awaiting sentence ${i + 1}/${sentences.length}: "${sentences[i]}"...`);
      const currentSentencePcm = await nextSentencePromise;

      // Start pre-synthesizing the next sentence immediately in background
      if (i + 1 < sentences.length) {
        nextSentencePromise = synthesizeSentencePcm(sentences[i + 1]);
      } else {
        nextSentencePromise = null;
      }

      if (!currentSentencePcm || currentSentencePcm.length === 0) continue;

      if (isFirstSentence) {
        isFirstSentence = false;
        setState("SPEAKING");
        sendJson({
          type: "tts_start",
          sample_rate: NORMALIZED_SAMPLE_RATE,
        });
        console.log(
          `⚡ [WebSocket ${ws.deviceId}] First sentence ready in ${Date.now() - turnStartTime}ms! Streaming audio...`
        );
      }

      // Stream current sentence PCM chunks with pacing
      let offset = 0;
      while (offset < currentSentencePcm.length && ws.readyState === WebSocket.OPEN) {
        const nextOffset = Math.min(offset + AUDIO_CHUNK_STREAM_SIZE, currentSentencePcm.length);
        const chunk = currentSentencePcm.subarray(offset, nextOffset);
        sendBinary(chunk);
        offset = nextOffset;
        totalStreamedBytes += chunk.length;

        // Small delay between chunks for network pacing (16ms per 1KB = 2x real-time burst)
        await new Promise((resolve) => setTimeout(resolve, 16));
      }
    }

    // Finish streaming
    sendJson({
      type: "tts_end",
      total_bytes: totalStreamedBytes,
      total_turn_time_ms: Date.now() - turnStartTime,
    });
    console.log(
      `[WebSocket ${ws.deviceId}] Turn complete (${totalStreamedBytes} bytes) in ${((Date.now() - turnStartTime) / 1000).toFixed(2)}s!`
    );

    setState("IDLE");
  } catch (turnError) {
    console.error(`[WebSocket Turn Error]:`, turnError.stack || turnError.message);
    sendJson({ type: "error", message: turnError.message });
    setState("IDLE");
  } finally {
    if (fs.existsSync(tempWavPath)) {
      try {
        fs.unlinkSync(tempWavPath);
      } catch (_) {}
    }
  }
}

module.exports = {
  initWebSocketServer,
};
