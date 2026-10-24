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

  const { mp3BufferToWavBuffer } = require("../utils/audio-converter");
  const spokenText = toPhoneticSpokenText(text.trim(), lang);
  const speechRate = process.env.EDGE_TTS_RATE || "-20%";

  // 1. Try Python edge-tts CLI (Official Sec-MS-GEC v2 algorithm - Works on Render & Local)
  try {
    const pyPcm = await synthesizeEdgePython(spokenText, voice, speechRate);
    if (pyPcm && pyPcm.length > 0) {
      console.log(`[WebSocket TTS] Edge-TTS (Python v2) successfully generated ${pyPcm.length} bytes audio!`);
      return pyPcm;
    }
  } catch (pyErr) {
    console.warn(`[WebSocket TTS] Edge Python attempt failed: ${pyErr.message}`);
  }

  // 2. Try Node Edge-TTS
  try {
    const tts = new EdgeTTS();
    await tts.synthesize(spokenText, voice, { rate: speechRate });
    const mp3Buffer = await tts.toBuffer();
    if (mp3Buffer && mp3Buffer.length > 0) {
      const wavBytes = await mp3BufferToWavBuffer(mp3Buffer, 16000);
      return wavBytes.subarray(44);
    }
  } catch (edgeErr) {
    console.warn(`[WebSocket TTS] Node Edge-TTS failed (${edgeErr.message})...`);
  }

  // 3. Fallback to Gemini Neural Male Voice ("Puck")
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
            ws.sampleRate = (msg.sample_rate && Number(msg.sample_rate)) || 16000;
            ws.turnSource = (msg.source && String(msg.source)) || "voice";
            console.log(`[WebSocket ${ws.deviceId}] Listening started (sample rate: ${ws.sampleRate} Hz)...`);
            ws.audioChunks = [];
            ws.totalAudioBytes = 0;
            setState("LISTENING");
            break;

          case "stop_listen":
            const audioRate = ws.sampleRate || 16000;
            console.log(
              `[WebSocket ${ws.deviceId}] Listening stopped. Received ${ws.totalAudioBytes} bytes (${(
                ws.totalAudioBytes / (audioRate * 2)
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

      // Small delay between chunks for network pacing (16ms per 1KB = 2x real-time burst)
      await new Promise((resolve) => setTimeout(resolve, 16));
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
