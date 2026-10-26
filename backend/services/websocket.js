/**
 * KOTL WebSocket Streaming Audio Service
 * Real-time bidirectional audio & control protocol for ESP32 and clients.
 */

const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { transcribeAudio, isBlacklistedNoiseTranscript } = require("./stt");
const { generateAssistantReply } = require("./assistant");
const { generateSpeech, NORMALIZED_SAMPLE_RATE } = require("./tts");
const { writePcm16MonoWav } = require("../utils/wav");
const { execFileSync } = require("child_process");
const ffmpegBin = require("ffmpeg-static");
const { EdgeTTS } = require("@andresaya/edge-tts");
const { detectEyeExpression } = require("./eye-animation");
const { toPhoneticSpokenText } = require("../utils/phonetic");
const { synthesizeEdgeV2Pcm } = require("./edge-v2-tts");
const { synthesizeGeminiPcm } = require("./gemini-tts");
const { synthesizeEdgePython } = require("./edge-python-tts");
const { extractMemoryFromDialogue } = require("./child-memory");

const HEARTBEAT_INTERVAL_MS = 15000;
const CLIENT_TIMEOUT_MS = 35000;
const AUDIO_CHUNK_STREAM_SIZE = 1024; // 1024 bytes (512 samples @ 16kHz = 32ms per frame)

function splitIntoSentences(text) {
  if (!text || typeof text !== "string") return [];
  const parts = text.match(/[^.!?।\n]+[.!?।\n]*/g);
  if (!parts) return [text.trim()];
  return parts.map((s) => s.trim()).filter((s) => s.length > 0);
}

async function synthesizeSpeechPcm(text) {
  if (!text || !text.trim()) return Buffer.alloc(0);

  const isGujarati = /[\u0A80-\u0AFF]/.test(text);
  const isHindi = /[\u0900-\u097F]/.test(text);
  let voice = process.env.EDGE_TTS_VOICE || "en-IN-PrabhatNeural";
  let lang = process.env.EDGE_TTS_LANG || "en-IN";
  if (isGujarati) {
    voice = "gu-IN-NiranjanNeural";
    lang = "gu-IN";
  } else if (isHindi) {
    voice = "hi-IN-MadhurNeural";
    lang = "hi-IN";
  } else {
    voice = "en-IN-PrabhatNeural";
    lang = "en-IN";
  }

  const spokenText = toPhoneticSpokenText(text.trim(), lang);
  const speechRate = process.env.EDGE_TTS_RATE || "-20%";

  // 1. Primary: Edge TTS v2 with Sec-MS-GEC v2 (Native Node.js - Fast, Unlimited, Never blocked)
  try {
    const v2Pcm = await synthesizeEdgeV2Pcm(spokenText, voice, speechRate);
    if (v2Pcm && v2Pcm.length > 0) {
      console.log(`[WebSocket TTS] Edge TTS v2 successfully generated ${v2Pcm.length} bytes male voice audio!`);
      return v2Pcm;
    }
  } catch (v2Err) {
    console.warn(`[WebSocket TTS] Edge TTS v2 primary failed (${v2Err.message})...`);
  }

  // 2. Secondary: Gemini Neural Male Voice ("Puck")
  try {
    const geminiPcm = await synthesizeGeminiPcm(spokenText);
    if (geminiPcm && geminiPcm.length > 0) {
      console.log(`[WebSocket TTS] Gemini Neural Male Voice successfully generated ${geminiPcm.length} bytes!`);
      return geminiPcm;
    }
  } catch (geminiErr) {
    console.error(`[WebSocket TTS] Gemini TTS failed: ${geminiErr.message}`);
  }

  console.error("[WebSocket TTS] All TTS providers exhausted.");
  return Buffer.alloc(0);
}

// Backward compatibility alias
const synthesizeSentencePcm = synthesizeSpeechPcm;

function initWebSocketServer(httpServer, options = {}) {
  const {
    touchDeviceHeartbeat = () => {},
    markDeviceOffline = () => {},
    getDeviceConfig = null,
  } = options;

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
    ws.isPhysicalRobot = false;
    ws.deviceId = null;
    ws.sessionId = "default-session";
    ws.state = "IDLE"; // IDLE, LISTENING, THINKING, SPEAKING
    ws.audioChunks = [];
    ws.totalAudioBytes = 0;
    ws.clientIp = clientIp;
    ws.lastHeartbeatTouch = 0;

    // Helper: Safely touch heartbeat for verified physical robot with rate-limiting (min 10s interval unless forced)
    const touchRobotHeartbeat = (force = false, rssi = null) => {
      if (!ws.isPhysicalRobot) return;
      const now = Date.now();
      if (force || now - ws.lastHeartbeatTouch >= 10000) {
        ws.lastHeartbeatTouch = now;
        try {
          touchDeviceHeartbeat(ws.clientIp, rssi);
        } catch (err) {
          console.warn(`[WebSocket ${ws.deviceId}] Heartbeat touch failed:`, err.message);
        }
      }
    };

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
      touchRobotHeartbeat(false);
    });

    // Main message handler
    ws.on("message", async (data, isBinary) => {
      try {
        if (isBinary) {
          touchRobotHeartbeat(false);
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
            touchRobotHeartbeat(false);
            break;

          case "register":
          case "hello":
            if (msg.device_id) ws.deviceId = String(msg.device_id);
            // Strict physical hardware identity check: device_id === "KOTL-ESP32" or starts with "KOTL-ESP32"
            const isEsp32 = typeof ws.deviceId === "string" && (ws.deviceId === "KOTL-ESP32" || ws.deviceId.startsWith("KOTL-ESP32"));
            if (isEsp32) {
              ws.isPhysicalRobot = true;
              console.log(`[WebSocket] Physical robot registered: ${ws.deviceId} (IP: ${ws.clientIp})`);
              const rssi = typeof msg.rssi === "number" ? msg.rssi : null;
              touchRobotHeartbeat(true, rssi);
            } else {
              ws.isPhysicalRobot = false;
              console.log(`[WebSocket] Generic client registered: ${ws.deviceId || "anonymous"}`);
            }
            sendJson({ type: "registered", device_id: ws.deviceId, status: "ok" });
            break;

          case "start_listen":
            touchRobotHeartbeat(false);
            ws.sampleRate = (msg.sample_rate && Number(msg.sample_rate)) || 16000;
            ws.turnSource = (msg.source && String(msg.source)) || "voice";
            console.log(`[WebSocket ${ws.deviceId || "client"}] Listening started (sample rate: ${ws.sampleRate} Hz)...`);
            ws.audioChunks = [];
            ws.totalAudioBytes = 0;
            setState("LISTENING");
            break;

          case "stop_listen":
            touchRobotHeartbeat(false);
            const audioRate = ws.sampleRate || 16000;
            console.log(
              `[WebSocket ${ws.deviceId || "client"}] Listening stopped. Received ${ws.totalAudioBytes} bytes (${(
                ws.totalAudioBytes / (audioRate * 2)
              ).toFixed(2)}s)`
            );
            setState("THINKING");

            if (ws.audioChunks.length === 0 || ws.totalAudioBytes < 1600) {
              console.log(`[WebSocket ${ws.deviceId || "client"}] Audio too short, ignoring.`);
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
            console.log(`[WebSocket ${ws.deviceId || "client"}] Turn canceled by client`);
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
      console.log(`[WebSocket] Client disconnected (${ws.deviceId || "anonymous"}): code ${code}, reason ${reason}`);
      ws.audioChunks = [];

      if (ws.isPhysicalRobot) {
        // Count remaining active physical robot clients
        let remainingRobots = 0;
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN && client.isPhysicalRobot) {
            remainingRobots++;
          }
        });

        if (remainingRobots === 0) {
          console.log(`[WebSocket] No active physical robot connections remaining. Marking offline.`);
          try {
            markDeviceOffline();
          } catch (err) {
            console.warn("[WebSocket] Error marking device offline on close:", err.message);
          }
        } else {
          console.log(`[WebSocket] Physical robot disconnected, but ${remainingRobots} robot connection(s) still active.`);
        }
      }
    });

    ws.on("error", (err) => {
      console.error(`[WebSocket Error ${ws.deviceId || "anonymous"}]:`, err.message);
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
    // 0. Energy check: Ignore sub-threshold silence/noise before calling Whisper
    let peakSample = 0;
    let sumAbs = 0;
    const numSamples = Math.floor(rawPcmBuffer.length / 2);
    for (let i = 0; i < numSamples; i++) {
      const s = Math.abs(rawPcmBuffer.readInt16LE(i * 2));
      if (s > peakSample) peakSample = s;
      sumAbs += s;
    }
    const avgAmp = numSamples > 0 ? Math.floor(sumAbs / numSamples) : 0;
    if (peakSample < 80 || avgAmp < 10) {
      console.log(`[WebSocket ${ws.deviceId}] Sub-threshold silence/noise (Peak: ${peakSample} < 80, Avg: ${avgAmp}), dismissing silently.`);
      sendJson({ type: "state", value: "IDLE" });
      setState("IDLE");
      return;
    }

    // 1. Write PCM buffer to temporary 16kHz WAV file for STT
    writePcm16MonoWav({
      wavPath: tempWavPath,
      sampleRate: ws.sampleRate || 16000,
      audioDataBytes: rawPcmBuffer,
    });

    // 2. Transcribe Audio (Groq Whisper)
    console.log(`[WebSocket ${ws.deviceId}] Transcribing audio...`);
    const sttResult = await transcribeAudio(tempWavPath);
    if (!sttResult.success) {
      console.warn(`[WebSocket ${ws.deviceId}] STT error: ${sttResult.error}`);
    }
    const transcript = (sttResult.text || "").trim();

    if (!transcript || isBlacklistedNoiseTranscript(transcript)) {
      console.log(`[WebSocket ${ws.deviceId}] Empty or noise transcript ("${transcript}"), dismissing silently without TTS.`);
      sendJson({ type: "transcript", text: "" });
      sendJson({ type: "state", value: "IDLE" });
      setState("IDLE");
      return;
    }

        // 2b. Intelligent Wake-Word & Background Music Filter:
    // If turn was triggered purely by room mic without touch, and session is not active:
    // Require a wake word (e.g. "KOTL", "hello", "hey", "hi", etc.) so background music/songs are strictly ignored.
    const WAKE_WORDS = [
      "kotl", "kotil", "cotte", "cuttle", "bottle", "cattle", "cotel", "coatl", "hotel", "turtle",
      "hello", "hey", "hi", "namaste", "kem cho", "suno", "sun", "aarav", "arav"
    ];
    const isTouchOrButton = ws.turnSource === "touch" || ws.turnSource === "button";
    const isSessionActive = ws.lastTurnCompletedAt && (Date.now() - ws.lastTurnCompletedAt < 30000);
    const transcriptLower = transcript.toLowerCase();
    const hasWakeWord = WAKE_WORDS.some((w) => transcriptLower.includes(w));

    const QUESTION_TRIGGERS = [
      "what", "who", "where", "when", "why", "how", "tell", "can you", "could you", "please",
      "sing", "say", "joke", "story", "time", "weather", "today", "tomorrow", "name",
      "કેમ", "શું", "કોણ", "ક્યાં", "ક્યારે", "કેવી", "મને", "બોલો", "કહો", "વાર્તા", "જોક", "ગીત", "સમય", "તમે",
      "क्या", "कौन", "कहाँ", "कब", "कैसे", "बताओ", "बोलो", "कहानी", "सुनाओ", "समय", "गाना", "तुम", "आप"
    ];
    const hasQuestionIntent = QUESTION_TRIGGERS.some((q) => transcriptLower.includes(q)) || transcript.includes("?") || transcript.split(/\s+/).length >= 2;
    const isMusicSymbol = transcript.includes("♪") || transcript.includes("🎵") || /\[music\]|\(music\)/i.test(transcript);

    if (isMusicSymbol || (!isTouchOrButton && !isSessionActive && !hasWakeWord && !hasQuestionIntent)) {
      console.log(`[WebSocket ${ws.deviceId}] Background noise/music rejected without wake word: "${transcript}". Staying silent.`);
      sendJson({ type: "transcript", text: "" });
      sendJson({ type: "state", value: "IDLE" });
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
      transcript: transcript,
      prompt: transcript,
      sessionId: ws.sessionId,
    });
    const replyText = (assistantResult.reply || "").trim();

    if (!replyText) {
      console.log(`[WebSocket ${ws.deviceId}] Assistant reply empty, returning to idle without speaking.`);
      sendJson({ type: "state", value: "IDLE" });
      setState("IDLE");
      return;
    }

    const eyeExpr = detectEyeExpression(transcript, replyText);
    sendJson({
      type: "eye_expression",
      value: eyeExpr,
    });

    sendJson({
      type: "reply_text",
      text: replyText,
      eye_expression: eyeExpr,
      provider: assistantResult.provider,
      model: assistantResult.model,
    });
    console.log(`[WebSocket ${ws.deviceId}] Reply: "${replyText}" (Eye: ${eyeExpr})`);

    try {
      extractMemoryFromDialogue(transcript, replyText);
    } catch (memErr) {
      console.warn(`[WebSocket Memory] Error extracting profile memory:`, memErr.message);
    }

    // 4. Synthesize and Stream Speech (robust single-connection per turn)
    console.log(`[WebSocket ${ws.deviceId}] Synthesizing speech for reply: "${replyText}"...`);
    const pcmAudio = await synthesizeSpeechPcm(replyText);

    if (!pcmAudio || pcmAudio.length === 0) {
      console.warn(`[WebSocket ${ws.deviceId}] TTS produced empty audio, returning to idle.`);
      sendJson({ type: "state", value: "IDLE" });
      setState("IDLE");
      return;
    }

    setState("SPEAKING");
    sendJson({
      type: "tts_start",
      sample_rate: NORMALIZED_SAMPLE_RATE,
    });
    console.log(
      `⚡ [WebSocket ${ws.deviceId}] Speech ready in ${Date.now() - turnStartTime}ms! Streaming ${pcmAudio.length} bytes audio...`
    );

    let offset = 0;
    let totalStreamedBytes = 0;
    while (offset < pcmAudio.length && ws.readyState === WebSocket.OPEN) {
      const nextOffset = Math.min(offset + AUDIO_CHUNK_STREAM_SIZE, pcmAudio.length);
      const chunk = pcmAudio.subarray(offset, nextOffset);
      sendBinary(chunk);
      offset = nextOffset;
      totalStreamedBytes += chunk.length;

      // Pacing: 1024 bytes @ 16kHz 16-bit mono = 32ms audio duration.
      // Fast-burst first 4 chunks (4KB = 128ms) with 4ms delay to pre-fill ESP32 jitter buffer,
      // then pace subsequent chunks at 28ms to match real-time consumption and prevent buffer overflow.
      const delayMs = totalStreamedBytes <= 4 * AUDIO_CHUNK_STREAM_SIZE ? 4 : 28;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    // Finish streaming
    sendJson({
      type: "tts_end",
      total_bytes: totalStreamedBytes,
      total_turn_time_ms: Date.now() - turnStartTime,
    });
    ws.lastTurnCompletedAt = Date.now();
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
  synthesizeSpeechPcm,
};
