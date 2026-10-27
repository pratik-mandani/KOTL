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
const { NORMALIZED_SAMPLE_RATE } = require("./tts");
const { writePcm16MonoWav } = require("../utils/wav");
const { detectEyeExpression } = require("./eye-animation");
const { toPhoneticSpokenText } = require("../utils/phonetic");
const { synthesizeEdgeV2Pcm } = require("./edge-v2-tts");
const { synthesizeGeminiPcm } = require("./gemini-tts");
const { extractMemoryFromDialogue } = require("./child-memory");
const { recordTtsUsage } = require("./api-usage");

const HEARTBEAT_INTERVAL_MS = 15000;
const CLIENT_TIMEOUT_MS = 35000;
const AUDIO_CHUNK_STREAM_SIZE = 1024; // 1024 bytes (512 samples @ 16kHz = 32ms per frame)

function categorizeAndSanitizeError(err) {
  if (!err) return { category: "unknown_error", safeReason: "Unknown internal error" };
  const str = String(err).toLowerCase();

  const sanitized = String(err)
    .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, "Bearer [REDACTED]")
    .replace(/gsk_[a-zA-Z0-9]+/gi, "[REDACTED_GROQ_KEY]")
    .replace(/AIza[a-zA-Z0-9_\-]+/gi, "[REDACTED_GEMINI_KEY]")
    .replace(/sk-[a-zA-Z0-9_\-]+/gi, "[REDACTED_OPENAI_KEY]");

  if (str.includes("429") || str.includes("rate limit") || str.includes("quota") || str.includes("resource exhausted") || str.includes("too many requests")) {
    return { category: "quota_or_rate_limit", safeReason: "API quota or rate limit exceeded" };
  }
  if (str.includes("401") || str.includes("403") || str.includes("unauthorized") || str.includes("invalid api key") || str.includes("forbidden") || str.includes("not configured")) {
    return { category: "authentication_error", safeReason: "Provider authentication or configuration error" };
  }
  if (str.includes("timeout") || str.includes("abort") || str.includes("etimedout")) {
    return { category: "timeout_error", safeReason: "Provider request timed out" };
  }
  if (str.includes("econnrefused") || str.includes("enotfound") || str.includes("fetch failed") || str.includes("network")) {
    return { category: "network_error", safeReason: "Network or connection error" };
  }
  return { category: "provider_error", safeReason: sanitized.slice(0, 100) };
}

function splitIntoSentences(text) {
  if (!text || typeof text !== "string") return [];
  const parts = text.match(/[^.!?।\n]+[.!?।\n]*/g);
  if (!parts) return [text.trim()];
  return parts.map((s) => s.trim()).filter((s) => s.length > 0);
}

function isAutoTriggerModeEnabled() {
  const envVal = process.env.AUTO_TRIGGER_MODE;
  if (envVal === undefined || envVal === null) {
    return true; // Default: true (auto-trigger enabled on startup for natural conversational speech)
  }
  const cleanVal = String(envVal).trim().toLowerCase();
  if (cleanVal === "") {
    return true;
  }
  return cleanVal !== "false" && cleanVal !== "0" && cleanVal !== "off";
}

function isValidConversationalSpeech(transcript, clean, words) {
  if (!transcript || typeof transcript !== "string") return false;
  if (words.length < 2) return false;

  // Direct question mark with at least 2 words
  if (transcript.includes("?")) {
    if (/^when (did it|he did it|they did it)\b/i.test(clean)) return false;
    return true;
  }

  // Inquiry and request starters across English, Hindi, and Gujarati
  const INQUIRY_STARTERS = [
    "what ", "why ", "how ", "who ", "where ", "which ",
    "can you ", "could you ", "will you ", "would you ",
    "do you ", "are you ", "is it ", "is there ",
    "tell me ", "help me ", "explain ", "teach me ",
    "sing ", "sing a ", "i want to ", "i have a question",
    "kya ", "kyu ", "kyun ", "kaise ", "kahan ", "kidhar ",
    "kaun ", "kab ", "batao ", "mujhe ", "mujhe batao ", "sunao ",
    "kahani sunao", "kaho ", "madad karo ",
    "shu ", "kem ", "kyare ", "kya ", "koni ", "kone ",
    "vaarta kaho", "mane vaarta", "samjhao "
  ];

  const matchesStarter = INQUIRY_STARTERS.some((s) => clean.startsWith(s));
  if (!matchesStarter) return false;

  // Reject truncated past fragments like "when did it." or "when he did it."
  if (/^when (did it|he did it|they did it)\b/i.test(clean)) return false;

  return true;
}

function shouldRejectAudioTurn({
  transcript,
  isTouchOrButton = false,
  isSessionActive = false,
  consecutiveVoiceTurns = 0,
  maxConsecutiveVoiceTurns = 3,
  autoTrigger = undefined,
}) {
  if (!transcript || typeof transcript !== "string") return true;

  const clean = transcript.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  // 1. Music symbol or bracketed music tokens
  const isMusicSymbol = /[♪♫♬♩🎵🎶]/.test(transcript) || /\[music\]|\(music\)/i.test(transcript);
  if (isMusicSymbol) return true;

  // 2. Reject vocal filler and repetitive noise-like transcripts (e.g., "yeah yeah yeah", "la la la")
  if (words.length >= 2) {
    const FILLER_TOKENS = ["yeah", "uh", "um", "oh", "ah", "la", "na", "da", "mm", "hmm", "ha", "huh"];
    const allFillers = words.every((w) => FILLER_TOKENS.includes(w));
    if (allFillers) return true;

    // Repetitive identical word loops of 3+ words (e.g. "side side side")
    if (words.length >= 3 && words.every((w) => w === words[0])) return true;
  }

  // 3. Touch or button always accepted (explicit physical intent by child/parent)
  if (isTouchOrButton) return false;

  // 4. Primary Wake-Words for KOTL (discrete word boundary)
  const PRIMARY_WAKE_WORDS = ["kotl", "kotil", "cotte", "cuttle", "cotel", "coatl"];
  const hasPrimaryWakeWord = words.some((w) => PRIMARY_WAKE_WORDS.includes(w));
  if (hasPrimaryWakeWord) return false;

  // 5. Homophone Wake-Words ('hotel', 'bottle', 'turtle') - ONLY when paired with greetings
  const HOMOPHONE_PAIR_REGEX = /\b(hey|hi|hello|namaste|kem\s*cho|suno|ok|okay)\s+(hotel|bottle|turtle|cattle)\b/i;
  if (HOMOPHONE_PAIR_REGEX.test(transcript)) return false;

  // 6. Conversational Greetings (discrete tokens)
  const GREETING_TOKENS = ["hello", "namaste", "kem cho", "kemcho", "morning", "evening"];
  const hasGreeting = GREETING_TOKENS.some((g) => clean === g || clean.startsWith(g + " ") || clean.endsWith(" " + g) || clean.includes(" " + g + " ") || words.includes(g));
  if (hasGreeting) return false;
  if (words[0] === "hi" || words[0] === "hey") return false;

  // 7. Active Follow-up Conversation Window (within 10s of last assistant reply):
  // Allows natural follow-up questions and conversational responses without repeating wake-word,
  // limited to maxConsecutiveVoiceTurns (3 turns) before requiring a fresh wake-word or touch.
  if (isSessionActive && consecutiveVoiceTurns < maxConsecutiveVoiceTurns) {
    return false;
  }

  // 8. Cold Idle Auto-Trigger Policy:
  // When auto-trigger mode is enabled (default), accept valid conversational inquiries
  // and directives without demanding an explicit "Hey KOTL" wake-word, while strictly
  // rejecting ambient chatter, filler tokens, pop music lyrics, and background noise.
  const autoTriggerActive = autoTrigger !== undefined ? Boolean(autoTrigger) : isAutoTriggerModeEnabled();
  if (autoTriggerActive && !isSessionActive) {
    if (isValidConversationalSpeech(transcript, clean, words)) {
      return false; // ACCEPTED as valid conversational speech in cold idle
    }
  }

  // 9. Cold Idle Rejection:
  // In cold idle when auto-trigger is disabled or speech is not a valid inquiry,
  // reject turn to prevent false activations from office chatter, TV, or ambient noise.
  return true;
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
    ws.consecutiveVoiceFollowUps = 0;

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
            const tStopListen = process.hrtime.bigint();
            const turnId = `turn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
            touchRobotHeartbeat(false);
            const audioRate = ws.sampleRate || 16000;
            console.log(
              `[WebSocket ${ws.deviceId || "client"}][${turnId}] Listening stopped. Received ${ws.totalAudioBytes} bytes (${(
                ws.totalAudioBytes / (audioRate * 2)
              ).toFixed(2)}s)`
            );
            setState("THINKING");

            if (ws.audioChunks.length === 0 || ws.totalAudioBytes < 1600) {
              console.log(`[WebSocket ${ws.deviceId || "client"}][${turnId}] Audio too short, ignoring.`);
              setState("IDLE");
              sendJson({
                type: "warning",
                status: "insufficient_audio",
                message: "Audio too short or empty",
                turn_id: turnId,
              });
              return;
            }

            // Combine all received PCM chunks into a complete buffer
            const rawPcmBuffer = Buffer.concat(ws.audioChunks);
            ws.audioChunks = [];
            ws.totalAudioBytes = 0;

            // Process turn asynchronously with monotonic timing context
            await handleVoiceTurn(ws, rawPcmBuffer, sendJson, sendBinary, setState, { tStopListen, turnId });
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
async function handleVoiceTurn(ws, rawPcmBuffer, sendJson, sendBinary, setState, timingContext = {}) {
  const turnStartTime = Date.now();
  const tStopListen = timingContext.tStopListen || process.hrtime.bigint();
  const turnId = timingContext.turnId || `turn-${Date.now().toString(36)}`;
  const nsToMs = (ns) => Number(ns) / 1e6;
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
      console.log(`[WebSocket ${ws.deviceId}][${turnId}] Sub-threshold silence/noise (Peak: ${peakSample} < 80, Avg: ${avgAmp}), dismissing silently.`);
      sendJson({
        type: "diagnostic",
        status: "insufficient_audio",
        reason: `Sub-threshold audio energy (Peak: ${peakSample} < 80)`,
        turn_id: turnId,
      });
      sendJson({ type: "state", value: "IDLE" });
      setState("IDLE");
      return;
    }

    // 1. Write PCM buffer to temporary 16kHz WAV file for STT
    const tWavStart = process.hrtime.bigint();
    writePcm16MonoWav({
      wavPath: tempWavPath,
      sampleRate: ws.sampleRate || 16000,
      audioDataBytes: rawPcmBuffer,
    });
    const tWavEnd = process.hrtime.bigint();
    const wavPrepMs = nsToMs(tWavEnd - tWavStart);

    // 2. Transcribe Audio (Groq Whisper)
    console.log(`[WebSocket ${ws.deviceId}][${turnId}] Transcribing audio...`);
    const tSttStart = process.hrtime.bigint();
    const sttResult = await transcribeAudio(tempWavPath);
    const tSttEnd = process.hrtime.bigint();
    const sttMs = nsToMs(tSttEnd - tSttStart);

    if (!sttResult.success) {
      const { category, safeReason } = categorizeAndSanitizeError(sttResult.error);
      console.warn(`[WebSocket ${ws.deviceId}][${turnId}] STT error [${category}] after ${sttMs.toFixed(1)}ms: ${safeReason}`);
      sendJson({
        type: "transcript",
        text: "",
        status: "stt_error",
        error_category: category,
        reason: safeReason,
        turn_id: turnId,
      });
      sendJson({ type: "state", value: "IDLE" });
      setState("IDLE");
      return;
    }
    const transcript = (sttResult.text || "").trim();

    if (!transcript || isBlacklistedNoiseTranscript(transcript)) {
      const reasonLabel = !transcript ? "Empty transcript from STT" : "Filtered blacklisted noise token";
      console.log(`[WebSocket ${ws.deviceId}][${turnId}] Empty or noise transcript after ${sttMs.toFixed(1)}ms, dismissing silently without TTS. [Reason: ${reasonLabel}]`);
      sendJson({
        type: "transcript",
        text: "",
        status: "empty_or_noise",
        reason: reasonLabel,
        raw_transcript: transcript,
        turn_id: turnId,
      });
      sendJson({ type: "state", value: "IDLE" });
      setState("IDLE");
      return;
    }

    // 2b. Intelligent Wake-Word & Background Music Filter:
    const isTouchOrButton = ws.turnSource === "touch" || ws.turnSource === "button";
    const FOLLOW_UP_WINDOW_MS = 10000; // 10s natural follow-up window
    const isSessionActive = Boolean(ws.lastTurnCompletedAt && (Date.now() - ws.lastTurnCompletedAt < FOLLOW_UP_WINDOW_MS));
    const currentFollowUpCount = ws.consecutiveVoiceFollowUps || 0;

    if (shouldRejectAudioTurn({
      transcript,
      isTouchOrButton,
      isSessionActive,
      consecutiveVoiceTurns: currentFollowUpCount,
      maxConsecutiveVoiceTurns: 3,
    })) {
      console.log(`[WebSocket ${ws.deviceId}][${turnId}] Background speech rejected without wake-word after ${sttMs.toFixed(1)}ms. [Reason: Cold-idle classifier rejection]`);
      sendJson({
        type: "transcript",
        text: "",
        status: "rejected_cold_idle",
        reason: "Cold-idle speech without wake-word or inquiry starter",
        raw_transcript: transcript,
        turn_id: turnId,
      });
      sendJson({ type: "state", value: "IDLE" });
      setState("IDLE");
      return;
    }

    // Determine whether this turn contained an explicit wake-word, greeting, or touch:
    const cleanLower = transcript.trim().toLowerCase();
    const hasWakeOrTouch = isTouchOrButton ||
      ["kotl", "kotil", "cotte", "cuttle", "cotel", "coatl"].some((w) => cleanLower.includes(w)) ||
      ["hello", "namaste", "kem cho", "kemcho"].some((g) => cleanLower.includes(g)) ||
      cleanLower.startsWith("hi ") || cleanLower.startsWith("hey ");

    if (hasWakeOrTouch) {
      ws.consecutiveVoiceFollowUps = 0; // Fresh wake-word or touch resets follow-up count
    } else if (isSessionActive) {
      ws.consecutiveVoiceFollowUps = currentFollowUpCount + 1; // Increment consecutive voice follow-ups
    } else {
      ws.consecutiveVoiceFollowUps = 0; // Fresh auto-triggered conversation start resets follow-up count
    }

    sendJson({
      type: "transcript",
      text: transcript,
      status: "accepted",
      duration_ms: Math.round(sttMs),
      turn_id: turnId,
    });
    console.log(`[WebSocket ${ws.deviceId}][${turnId}] Transcript accepted (STT took ${sttMs.toFixed(1)}ms)`);

    // 3. Generate Assistant Reply (Gemini 2.5 Flash)
    console.log(`[WebSocket ${ws.deviceId}][${turnId}] Asking Gemini...`);
    const tLlmStart = process.hrtime.bigint();
    const assistantResult = await generateAssistantReply({
      transcript: transcript,
      prompt: transcript,
      sessionId: ws.sessionId,
    });
    const tLlmEnd = process.hrtime.bigint();
    const llmMs = nsToMs(tLlmEnd - tLlmStart);
    const replyText = (assistantResult.reply || "").trim();

    if (!replyText) {
      const { category, safeReason } = categorizeAndSanitizeError(assistantResult.error);
      console.log(`[WebSocket ${ws.deviceId}][${turnId}] Assistant reply empty [${category}] after ${llmMs.toFixed(1)}ms: ${safeReason}, returning to idle.`);
      sendJson({
        type: "diagnostic",
        status: "llm_error",
        error_category: category,
        reason: safeReason,
        turn_id: turnId,
      });
      sendJson({ type: "state", value: "IDLE" });
      setState("IDLE");
      return;
    }

    const eyeExpr = detectEyeExpression(transcript, replyText);
    sendJson({
      type: "eye_expression",
      value: eyeExpr,
      turn_id: turnId,
    });

    sendJson({
      type: "reply_text",
      text: replyText,
      eye_expression: eyeExpr,
      provider: assistantResult.provider,
      model: assistantResult.model,
      turn_id: turnId,
    });
    console.log(`[WebSocket ${ws.deviceId}][${turnId}] Reply ready (LLM took ${llmMs.toFixed(1)}ms, Eye: ${eyeExpr})`);

    try {
      extractMemoryFromDialogue(transcript, replyText);
    } catch (memErr) {
      console.warn(`[WebSocket Memory][${turnId}] Error extracting profile memory:`, memErr.message);
    }

    // 4. Synthesize and Stream Speech (robust single-connection per turn)
    console.log(`[WebSocket ${ws.deviceId}][${turnId}] Synthesizing speech for reply...`);
    const tTtsStart = process.hrtime.bigint();
    const pcmAudio = await synthesizeSpeechPcm(replyText);
    const tTtsEnd = process.hrtime.bigint();
    const ttsMs = nsToMs(tTtsEnd - tTtsStart);
    const totalPrepMs = nsToMs(tTtsEnd - tStopListen);

    if (!pcmAudio || pcmAudio.length === 0) {
      console.warn(`[WebSocket ${ws.deviceId}][${turnId}] TTS produced empty audio after ${ttsMs.toFixed(1)}ms, returning to idle.`);
      sendJson({
        type: "diagnostic",
        status: "tts_error",
        reason: "TTS synthesis produced empty audio",
        turn_id: turnId,
      });
      sendJson({ type: "state", value: "IDLE" });
      setState("IDLE");
      return;
    }

    try {
      recordTtsUsage({
        provider: "edge",
        characterCount: replyText.length,
        audioBytes: pcmAudio.length,
      });
    } catch (_) {}

    setState("SPEAKING");
    sendJson({
      type: "tts_start",
      sample_rate: NORMALIZED_SAMPLE_RATE,
      turn_id: turnId,
      server_prep_ms: Math.round(totalPrepMs),
      stt_ms: Math.round(sttMs),
      llm_ms: Math.round(llmMs),
      tts_ms: Math.round(ttsMs),
    });
    console.log(
      `⚡ [WebSocket ${ws.deviceId}][${turnId}] Speech ready in ${totalPrepMs.toFixed(1)}ms (WAV: ${wavPrepMs.toFixed(1)}ms, STT: ${sttMs.toFixed(1)}ms, LLM: ${llmMs.toFixed(1)}ms, TTS: ${ttsMs.toFixed(1)}ms). Streaming ${pcmAudio.length} bytes audio...`
    );

    let offset = 0;
    let totalStreamedBytes = 0;
    let tFirstChunkSent = null;
    let firstChunkTxMs = null;

    while (offset < pcmAudio.length && ws.readyState === WebSocket.OPEN) {
      const nextOffset = Math.min(offset + AUDIO_CHUNK_STREAM_SIZE, pcmAudio.length);
      const chunk = pcmAudio.subarray(offset, nextOffset);
      sendBinary(chunk);

      if (tFirstChunkSent === null) {
        tFirstChunkSent = process.hrtime.bigint();
        firstChunkTxMs = nsToMs(tFirstChunkSent - tStopListen);
        console.log(
          `[Latency][${turnId}] First audio chunk sent to WebSocket: ${firstChunkTxMs.toFixed(1)}ms after stop_listen`
        );
      }

      offset = nextOffset;
      totalStreamedBytes += chunk.length;

      // Pacing: 1024 bytes @ 16kHz 16-bit mono = 32ms audio duration.
      // Fast-burst first 4 chunks (4KB = 128ms) with 4ms delay to pre-fill ESP32 jitter buffer,
      // then pace subsequent chunks at 28ms to match real-time consumption and prevent buffer overflow.
      const delayMs = totalStreamedBytes <= 4 * AUDIO_CHUNK_STREAM_SIZE ? 4 : 28;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    console.log(
      `[Latency][${turnId}] Backend breakdown: wav=${wavPrepMs.toFixed(1)}ms | stt=${sttMs.toFixed(1)}ms | llm=${llmMs.toFixed(1)}ms | tts=${ttsMs.toFixed(1)}ms | total_prep=${totalPrepMs.toFixed(1)}ms | first_chunk_tx=${(firstChunkTxMs ?? totalPrepMs).toFixed(1)}ms`
    );

    // Finish streaming
    sendJson({
      type: "tts_end",
      total_bytes: totalStreamedBytes,
      total_turn_time_ms: Date.now() - turnStartTime,
      turn_id: turnId,
    });
    ws.lastTurnCompletedAt = Date.now();
    console.log(
      `[WebSocket ${ws.deviceId}] Turn complete (${totalStreamedBytes} bytes) in ${((Date.now() - turnStartTime) / 1000).toFixed(2)}s!`
    );

    setState("IDLE");
  } catch (turnError) {
    console.error(`[WebSocket Turn Error]:`, turnError.stack || turnError.message);
    const { category, safeReason } = categorizeAndSanitizeError(turnError);
    sendJson({
      type: "error",
      error_category: category,
      message: safeReason,
    });
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
  shouldRejectAudioTurn,
  isAutoTriggerModeEnabled,
  isValidConversationalSpeech,
  categorizeAndSanitizeError,
};
