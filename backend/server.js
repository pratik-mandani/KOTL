const express = require("express");
require("./utils/env");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { generateAssistantReply, resetSessionHistory, getSessionHistory, attachTtsUrlToLastAssistantReply } = require("./services/assistant");
const { getGroqQuotaStats } = require("./services/groq");
const { transcribeAudio, normalizeWhisperTranscript, isBlacklistedNoiseTranscript } = require("./services/stt");
const { generateSpeech, NORMALIZED_SAMPLE_RATE } = require("./services/tts");
const { writePcm16MonoWav } = require("./utils/wav");
const { getLocalIPv4Address } = require("./utils/network");

const app = express();
const PORT = process.env.PORT || 3000;
const uploadsDir = path.join(__dirname, "uploads");
const ttsUploadsDir = path.join(uploadsDir, "tts");

const activeSessions = new Map();
const SESSION_TIMEOUT_MS = 30000; // 30 seconds

let totalTurnsCount = 0;

app.use(express.json());
app.use((req, _res, next) => {
  console.log(
    "[REQ]",
    JSON.stringify({
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      remoteAddress: req.socket.remoteAddress,
      contentLength: req.get("content-length") || null,
    })
  );
  next();
});

fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(ttsUploadsDir, { recursive: true });

function logAudioTurn(turnId, message, details = null) {
  if (details) {
    console.log(`[AUDIO ${turnId}] ${message}`, JSON.stringify(details));
    return;
  }

  console.log(`[AUDIO ${turnId}] ${message}`);
}

function buildAudioResponse(metadata, turnStatus) {
  return {
    success: true,
    filename: metadata.filename,
    wav_filename: metadata.wav_filename,
    bytes_received: metadata.bytes_received,
    sample_rate: metadata.sample_rate,
    duration_ms: metadata.duration_ms,
    transcript: metadata.transcript,
    transcript_provider: metadata.transcript_provider,
    assistant_reply: metadata.assistant_reply,
    assistant_provider: metadata.assistant_provider,
    assistant_model: metadata.assistant_model,
    tts_ready: metadata.tts_generated,
    tts_url: metadata.tts_url,
    tts_provider: metadata.tts_provider,
    tts_voice: metadata.tts_voice,
    stt_error: metadata.stt_error,
    assistant_error: metadata.assistant_error,
    tts_error: metadata.tts_error,
    turn_status: turnStatus,
  };
}

function analyzePcm16Mono(buffer) {
  let pcmMin = 32767;
  let pcmMax = -32768;
  let absSum = 0;
  let clippedSampleCount = 0;
  const sampleCount = Math.floor(buffer.length / 2);

  for (let offset = 0; offset + 1 < buffer.length; offset += 2) {
    const sample = buffer.readInt16LE(offset);
    if (sample < pcmMin) pcmMin = sample;
    if (sample > pcmMax) pcmMax = sample;
    absSum += Math.abs(sample);
    if (sample <= -32760 || sample >= 32760) clippedSampleCount += 1;
  }

  return {
    sample_count: sampleCount,
    pcm_min: sampleCount ? pcmMin : null,
    pcm_max: sampleCount ? pcmMax : null,
    peak_to_peak: sampleCount ? pcmMax - pcmMin : null,
    avg_abs_amplitude: sampleCount ? Math.round(absSum / sampleCount) : null,
    clipped_sample_count: clippedSampleCount,
  };
}

function createHardwareTestToneWav() {
  const sampleRate = NORMALIZED_SAMPLE_RATE || 16000;
  const durationSeconds = 2.4;
  const sampleCount = Math.floor(sampleRate * durationSeconds);
  const pcm = Buffer.alloc(sampleCount * 2);
  const tones = [440, 660, 880, 660];

  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / sampleRate;
    const toneIndex = Math.min(tones.length - 1, Math.floor(t / (durationSeconds / tones.length)));
    const envelope = Math.min(1, i / 1200, (sampleCount - i) / 1200);
    const sample = Math.round(Math.sin(2 * Math.PI * tones[toneIndex] * t) * 14000 * envelope);
    pcm.writeInt16LE(sample, i * 2);
  }

  const header = Buffer.alloc(44);
  const bitsPerSample = 16;
  const numChannels = 1;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
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
  header.writeUInt32LE(pcm.length, 40);

  const filename = `hardware-test-tone-${Date.now()}.wav`;
  const filePath = path.join(ttsUploadsDir, filename);
  fs.writeFileSync(filePath, Buffer.concat([header, pcm]));

  return {
    filename,
    url: `/tts/${filename}`,
    provider: "local-tone",
    voice: "hardware-test-tone",
  };
}

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/status", (_req, res) => {
  const groqQuota = getGroqQuotaStats();
  res.json({
    status: "online",
    port: PORT,
    ip: getLocalIPv4Address(),
    stt_provider: process.env.STT_PROVIDER || "groq",
    llm_provider: process.env.LLM_PROVIDER || process.env.AI_PROVIDER || "groq",
    tts_provider: process.env.TTS_PROVIDER || "edge",
    normalized_sample_rate: NORMALIZED_SAMPLE_RATE,
    quota: {
      groq: {
        tier: "100% Free Tier",
        remaining_requests: groqQuota.remainingRequests || "14,380",
        limit_requests: groqQuota.limitRequests || "14,400",
        remaining_tokens: groqQuota.remainingTokens || "498,000",
        limit_tokens: groqQuota.limitTokens || "500,000",
        rpm_limit: "30 RPM",
        rpd_limit: "14,400 RPD",
        status: "Active & Free",
      },
      gemini: {
        tier: "100% Free Tier",
        rpm_limit: "15 RPM",
        rpd_limit: "1,500 RPD",
        status: "Active & Free (Backup)",
      },
      edge_tts: {
        tier: "100% Free & Unlimited",
        status: "Unlimited (Zero API Costs)",
      },
      whisper_stt: {
        tier: "100% Free Tier",
        limit: "7,200 sec/day (20 RPM)",
        status: "Active & Free",
      }
    }
  });
});

app.post("/api/speak", async (req, res) => {
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  const sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId.trim() : null;

  if (!text) {
    return res.status(400).json({ success: false, error: "text required" });
  }

  try {
    const ttsResult = await generateSpeech({ text, sessionId });
    if (ttsResult.success && ttsResult.url) {
      latestWebTtsBroadcast = {
        id: "web-tts-" + Date.now(),
        url: ttsResult.url,
        created_at: Date.now()
      };
      console.log(`[Broadcast] Queued web audio for ESP32 speaker: ${ttsResult.url}`);
    }
    res.json(ttsResult);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/history", (req, res) => {
  const sessionId = typeof req.query?.sessionId === "string" && req.query.sessionId.trim() 
    ? req.query.sessionId.trim() 
    : "default-session";
  const history = getSessionHistory(sessionId);
  res.json({ success: true, sessionId, history });
});

app.post("/api/reset-session", (req, res) => {
  const sessionId = typeof req.body?.sessionId === "string" && req.body.sessionId.trim() 
    ? req.body.sessionId.trim() 
    : "default-session";
  resetSessionHistory(sessionId);
  res.json({ success: true, message: `Session ${sessionId} reset successfully` });
});

// Device Configuration Store (uploads/device_config.json)
const DEVICE_CONFIG_FILE = path.join(uploadsDir, "device_config.json");

function getDeviceConfig() {
  const defaultBackend = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || "https://kotl.onrender.com";
  let cfg = {
    wifi_ssid: "Altius",
    wifi_pass: "",
    backend_url: defaultBackend,
    version: 1,
    last_updated: new Date().toISOString(),
    device_status: {
      ip: null,
      rssi: null,
      online: false,
      last_seen: null,
      last_seen_seconds_ago: null
    }
  };

  try {
    if (fs.existsSync(DEVICE_CONFIG_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DEVICE_CONFIG_FILE, "utf-8"));
      if (parsed.backend_url && (parsed.backend_url.includes("10.") || parsed.backend_url.includes("localhost") || parsed.backend_url.includes("127.0.0.1")) && process.env.RENDER_EXTERNAL_URL) {
        parsed.backend_url = process.env.RENDER_EXTERNAL_URL;
      }
      cfg = { ...cfg, ...parsed };
    }
  } catch (e) {
    console.warn("[Device Config] Error reading config file:", e.message);
  }

  // Dynamic live check: If last_seen is within last 45 seconds, mark online, else offline
  if (cfg.device_status?.last_seen) {
    const elapsedSec = (Date.now() - new Date(cfg.device_status.last_seen).getTime()) / 1000;
    cfg.device_status.online = elapsedSec < 45;
    cfg.device_status.last_seen_seconds_ago = Math.floor(elapsedSec);
  } else {
    if (!cfg.device_status) cfg.device_status = {};
    cfg.device_status.online = false;
  }

  return cfg;
}

function saveDeviceConfig(config) {
  try {
    fs.writeFileSync(DEVICE_CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (e) {
    console.warn("[Device Config] Error saving config file:", e.message);
  }
}

function touchDeviceHeartbeat(ip = null, rssi = null) {
  try {
    const current = getDeviceConfig();
    current.device_status = {
      ip: ip || current.device_status?.ip,
      rssi: rssi !== null ? rssi : current.device_status?.rssi,
      online: true,
      last_seen: new Date().toISOString(),
      last_seen_seconds_ago: 0
    };
    saveDeviceConfig(current);
  } catch (e) {}
}

app.get("/api/device/config", (_req, res) => {
  const config = getDeviceConfig();
  res.json({ success: true, ...config });
});

app.post("/api/device/config", (req, res) => {
  const current = getDeviceConfig();
  const wifi_ssid = typeof req.body?.wifi_ssid === "string" ? req.body.wifi_ssid.trim() : current.wifi_ssid;
  const wifi_pass = typeof req.body?.wifi_pass === "string" ? req.body.wifi_pass : current.wifi_pass;
  const backend_url = typeof req.body?.backend_url === "string" ? req.body.backend_url.trim() : current.backend_url;

  const updated = {
    ...current,
    wifi_ssid,
    wifi_pass,
    backend_url,
    version: (current.version || 1) + 1,
    last_updated: new Date().toISOString()
  };

  saveDeviceConfig(updated);
  console.log(`[Device Config] Updated to version ${updated.version}: SSID="${wifi_ssid}", Backend="${backend_url}"`);
  res.json({ success: true, message: "Device config updated successfully", config: updated });
});

let latestWebTtsBroadcast = null;

function getLatestAudioMetadata() {
  try {
    const entries = fs.readdirSync(uploadsDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /^audio-.*\.json$/i.test(entry.name))
      .map((entry) => {
        const filePath = path.join(uploadsDir, entry.name);
        const stat = fs.statSync(filePath);
        return { filePath, mtimeMs: stat.mtimeMs };
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs);

    if (entries.length === 0) {
      return null;
    }

    const metadata = JSON.parse(fs.readFileSync(entries[0].filePath, "utf-8"));
    return {
      received_at: metadata.received_at || null,
      bytes_received: metadata.bytes_received || null,
      sample_rate: metadata.sample_rate || null,
      duration_ms: metadata.duration_ms || null,
      sample_count: metadata.sample_count ?? null,
      pcm_min: metadata.pcm_min ?? null,
      pcm_max: metadata.pcm_max ?? null,
      peak_to_peak: metadata.peak_to_peak ?? null,
      avg_abs_amplitude: metadata.avg_abs_amplitude ?? null,
      clipped_sample_count: metadata.clipped_sample_count ?? null,
      transcript: metadata.transcript || null,
      transcript_provider: metadata.transcript_provider || null,
      stt_error: metadata.stt_error || null,
      turn_status: metadata.turn_status || null,
      tts_ready: !!metadata.tts_generated,
      tts_url: metadata.tts_url || null,
    };
  } catch (error) {
    return { error: error.message };
  }
}

let pendingDeviceCommand = null;

function getLatestAudioWavPath() {
  try {
    const entries = fs.readdirSync(uploadsDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /^audio-.*\.wav$/i.test(entry.name))
      .map((entry) => {
        const filePath = path.join(uploadsDir, entry.name);
        const stat = fs.statSync(filePath);
        return { filePath, mtimeMs: stat.mtimeMs };
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs);

    return entries.length > 0 ? entries[0].filePath : null;
  } catch (e) {
    return null;
  }
}

app.get("/api/hardware-test/status", (_req, res) => {
  const config = getDeviceConfig();
  const latestMic = getLatestAudioMetadata();
  const wavPath = getLatestAudioWavPath();
  const hasWav = !!(wavPath && fs.existsSync(wavPath));

  res.json({
    success: true,
    device_status: config.device_status || null,
    pending_command: pendingDeviceCommand && (Date.now() - pendingDeviceCommand.created_at < 60000)
      ? {
          command: pendingDeviceCommand.command,
          id: pendingDeviceCommand.id,
          age_ms: Date.now() - pendingDeviceCommand.created_at,
        }
      : null,
    pending_audio: latestWebTtsBroadcast
      ? {
          id: latestWebTtsBroadcast.id,
          url: latestWebTtsBroadcast.url,
          age_ms: Date.now() - latestWebTtsBroadcast.created_at,
        }
      : null,
    latest_mic_upload: latestMic,
    has_mic_audio: hasWav,
    mic_audio_url: hasWav ? "/api/hardware-test/latest-mic-audio?t=" + Date.now() : null,
  });
});

app.get("/api/hardware-test/latest-mic-audio", (_req, res) => {
  const wavPath = getLatestAudioWavPath();
  if (!wavPath || !fs.existsSync(wavPath)) {
    return res.status(404).json({ success: false, error: "No recorded audio found yet" });
  }
  const stat = fs.statSync(wavPath);
  res.writeHead(200, {
    "Content-Type": "audio/wav",
    "Content-Length": stat.size,
    "Cache-Control": "no-cache",
  });
  fs.createReadStream(wavPath).pipe(res);
});

app.post("/api/hardware-test/speaker-local", (_req, res) => {
  pendingDeviceCommand = {
    command: "play_speaker_local",
    id: "cmd-spk-local-" + Date.now(),
    created_at: Date.now(),
  };
  console.log("[Hardware Test] Queued built-in 'Hello' voice sample test for ESP32 speaker");
  res.json({
    success: true,
    message: "Built-in voice test command queued for ESP32",
    command_id: pendingDeviceCommand.id,
  });
});

app.post("/api/hardware-test/trigger-mic", (_req, res) => {
  pendingDeviceCommand = {
    command: "record_mic",
    id: "cmd-mic-" + Date.now(),
    created_at: Date.now(),
  };
  console.log("[Hardware Test] Queued 4s onboard microphone recording command for ESP32");
  res.json({
    success: true,
    message: "Mic recording command queued. Speak near the ESP32 mic on next heartbeat!",
    command_id: pendingDeviceCommand.id,
  });
});

app.post("/api/hardware-test/speaker", async (req, res) => {
  const sessionId = typeof req.body?.sessionId === "string" && req.body.sessionId.trim()
    ? req.body.sessionId.trim()
    : "hardware-test";
  const text = typeof req.body?.text === "string" && req.body.text.trim()
    ? req.body.text.trim()
    : "KOTL speaker test. If you can hear this voice, your ESP32 audio output is working.";

  try {
    const ttsResult = await generateSpeech({ text, sessionId });
    if (!ttsResult.success || !ttsResult.url) {
      return res.status(500).json({
        success: false,
        error: ttsResult.error || "speaker test voice generation failed",
        provider: ttsResult.provider || null,
      });
    }

    latestWebTtsBroadcast = {
      id: "hardware-speaker-" + Date.now(),
      url: ttsResult.url,
      created_at: Date.now(),
    };

    pendingDeviceCommand = {
      command: "play_speaker_tts",
      id: "cmd-spk-tts-" + Date.now(),
      created_at: Date.now(),
      data: { url: ttsResult.url },
    };

    console.log(`[Hardware Test] Queued ESP32 speaker sample: ${ttsResult.url}`);
    res.json({
      success: true,
      message: "Speaker test queued for ESP32 heartbeat",
      pending_audio_id: latestWebTtsBroadcast.id,
      pending_audio_url: latestWebTtsBroadcast.url,
      provider: ttsResult.provider,
      voice: ttsResult.voice,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/device/heartbeat", (req, res) => {
  const current = getDeviceConfig();
  const clientVersion = Number.parseInt(req.body?.version || "0", 10);
  const ip = req.body?.ip || req.ip;
  const rssi = req.body?.rssi || null;
  const lastPlayedId = typeof req.body?.last_played_audio_id === "string" ? req.body.last_played_audio_id : "";
  const lastHandledCmd = typeof req.body?.last_handled_cmd_id === "string" ? req.body.last_handled_cmd_id : "";

  touchDeviceHeartbeat(ip, rssi);

  const hasNewConfig = clientVersion < (current.version || 1);
  const hasNewAudio = latestWebTtsBroadcast && (Date.now() - latestWebTtsBroadcast.created_at < 60000) && (lastPlayedId !== latestWebTtsBroadcast.id);
  const hasCommand = pendingDeviceCommand && (Date.now() - pendingDeviceCommand.created_at < 60000) && (lastHandledCmd !== pendingDeviceCommand.id);

  res.json({
    success: true,
    has_update: hasNewConfig,
    config: hasNewConfig ? current : null,
    has_pending_audio: !!hasNewAudio,
    pending_audio_id: hasNewAudio ? latestWebTtsBroadcast.id : null,
    pending_audio_url: hasNewAudio ? latestWebTtsBroadcast.url : null,
    has_command: hasCommand,
    command: hasCommand ? pendingDeviceCommand.command : null,
    command_id: hasCommand ? pendingDeviceCommand.id : null,
    command_data: hasCommand ? (pendingDeviceCommand.data || null) : null
  });
});

app.post(
  "/api/test-mic",
  express.raw({ type: ["audio/webm", "audio/wav", "application/octet-stream"], limit: "10mb" }),
  async (req, res) => {
    const turnId = crypto.randomUUID().slice(0, 8);
    const os = require("os");
    const { execFile } = require("child_process");
    const { promisify } = require("util");
    const execFileAsync = promisify(execFile);
    let ffmpegStaticPath = null;
    try {
      ffmpegStaticPath = require("ffmpeg-static");
    } catch (e) {}
    const FFMPEG_BIN = process.env.FFMPEG_BIN || ffmpegStaticPath || (os.platform() === "win32" ? "D:/KOTL/tools/ffmpeg/bin/ffmpeg.exe" : "ffmpeg");

    const tempIn = path.join(os.tmpdir(), `browser-mic-${turnId}.webm`);
    const tempWav = path.join(uploadsDir, `browser-mic-${turnId}.wav`);
    const sessionId = req.headers["x-session-id"] || "web-session";

    try {
      if (!req.body || req.body.length === 0) {
        return res.status(400).json({ success: false, error: "audio buffer empty" });
      }

      fs.writeFileSync(tempIn, req.body);
      await execFileAsync(FFMPEG_BIN, ["-y", "-i", tempIn, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", tempWav]);

      const sttResult = await transcribeAudio(tempWav);
      const transcript = sttResult.text || "";

      const assistantResult = await generateAssistantReply({ transcript, sessionId });
      const reply = assistantResult.reply || "Greetings, seeker.";

      const ttsResult = await generateSpeech({ text: reply, sessionId });

      res.json({
        success: true,
        transcript,
        reply,
        tts_url: ttsResult.url,
      });
    } catch (err) {
      console.error("[Test-Mic Error]", err);
      res.status(500).json({ success: false, error: err.message });
    } finally {
      if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
    }
  }
);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "KOTL backend healthy",
  });
});

app.get("/ping", (req, res) => {
  res.json({
    status: "ok",
    message: "pong",
    ip: req.ip,
    remote_address: req.socket.remoteAddress,
    remote_port: req.socket.remotePort,
    local_address: req.socket.localAddress,
    local_port: req.socket.localPort,
  });
});

app.get("/debug-ip", (req, res) => {
  res.json({
    ip: req.ip,
    remote_address: req.socket.remoteAddress,
    remote_port: req.socket.remotePort,
    local_address: req.socket.localAddress,
    local_port: req.socket.localPort,
    headers: req.headers,
  });
});

app.get("/tts/:filename", (req, res) => {
  const filename = path.basename(req.params.filename || "");
  if (!filename || filename !== req.params.filename || path.extname(filename).toLowerCase() !== ".wav") {
    return res.status(400).json({
      success: false,
      error: "invalid tts filename",
    });
  }

  const filePath = path.join(ttsUploadsDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: "tts file not found",
    });
  }

  try {
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      "Content-Type": "audio/wav",
      "Content-Length": stat.size,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
      "Connection": "close",
    });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    console.error("[TTS Serve Error]", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/chat", async (req, res) => {
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  const sessionId = typeof req.body?.sessionId === "string" && req.body.sessionId.trim() ? req.body.sessionId.trim() : "default-session";

  if (!text) {
    return res.json({
      reply: "Greetings. Speak your inquiry, and let us strategize.",
    });
  }

  try {
    const assistantResult = await generateAssistantReply({ transcript: text, sessionId, source: "web" });
    if (assistantResult.success && assistantResult.reply) {
      try {
        const ttsResult = await generateSpeech({ text: assistantResult.reply, sessionId });
        if (ttsResult.success && ttsResult.url) {
          latestWebTtsBroadcast = {
            id: "web-chat-" + Date.now(),
            url: ttsResult.url,
            created_at: Date.now()
          };
          console.log(`[Broadcast] Queued web chat audio for ESP32 speaker: ${ttsResult.url}`);
        }
      } catch (e) {
        console.warn("[Broadcast] TTS audio queue warning:", e.message);
      }

      return res.json({
        reply: assistantResult.reply,
      });
    }

    console.error(`Assistant generation failed: ${assistantResult.error}`);
    // Contextual fallback response if cloud APIs are completely offline
    let fallback = "Wisdom requires clear thought. Ask your strategic question again.";
    const lower = text.toLowerCase();
    if (lower.includes("who are you") || lower.includes("introduction") || lower.includes("intro")) {
      fallback = "I am KOTL, an AI assistant forged in the wisdom of Chanakya. I strategize, advise, and illuminate your path to victory.";
    }
    return res.json({
      reply: fallback,
    });
  } catch (error) {
    console.error(`Assistant generation exception: ${error.message}`);
    return res.json({
      reply: "A temporary obstacle in thought. Let us rethink this strategy.",
    });
  }
});

function isNoiseTranscript(text) {
  if (!text || typeof text !== "string") return true;
  if (isBlacklistedNoiseTranscript(text)) return true;
  const cleanText = text.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ""); // Strip punctuation
  
  if (cleanText.length === 0) return true;
  
  // Ignore short noise, single-character or two-character transcripts (e.g. "LX", "x", "a")
  if (cleanText.length <= 2) return true;
  
  const noisePhrases = [
    "thank you",
    "thank you for watching",
    "and the other",
    "subtitles by",
    "transcribed by",
    "english subtitles",
    "please subscribe",
    "watching",
  ];
  
  // Check if it exactly matches or contains any noise phrases
  if (noisePhrases.some(phrase => cleanText === phrase || cleanText.includes(phrase))) {
    return true;
  }
  
  // Ignore single-character noise or very short filler words (like "you", "yeah", "okay", "oh") if they are alone
  const words = cleanText.split(/\s+/);
  if (words.length === 1 && ["you", "yeah", "okay", "oh", "yes", "no", "uh", "um"].includes(words[0])) {
    return true;
  }
  
  return false;
}

app.post(
  "/audio",
  express.raw({ type: "application/octet-stream", limit: "128kb" }),
  async (req, res) => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({
        success: false,
        error: "audio body required",
      });
    }

    const sampleRate = Number.parseInt(req.get("x-sample-rate") || "", 10);
    const durationMs = Number.parseInt(req.get("x-duration-ms") || "", 10);
    const audioFormat = req.get("x-audio-format") || "unknown";
    const sessionIdHeader = req.get("x-session-id");
    const sessionId = typeof sessionIdHeader === "string" && sessionIdHeader.trim()
      ? sessionIdHeader.trim()
      : "default-session";
    const turnId = sessionId;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `audio-${timestamp}.raw`;
    const wavFilename = `audio-${timestamp}.wav`;
    const metadataFilename = `audio-${timestamp}.json`;
    const audioPath = path.join(uploadsDir, filename);
    const wavPath = path.join(uploadsDir, wavFilename);
    const metadataPath = path.join(uploadsDir, metadataFilename);
    const metadata = {
      filename,
      wav_filename: wavFilename,
      metadata_filename: metadataFilename,
      bytes_received: req.body.length,
      sample_rate: Number.isFinite(sampleRate) ? sampleRate : null,
      duration_ms: Number.isFinite(durationMs) ? durationMs : null,
      format: audioFormat,
      session_id: sessionId,
      content_type: req.get("content-type") || null,
      received_at: new Date().toISOString(),
      transcript: null,
      transcript_provider: null,
      confidence: null,
      transcribed_at: null,
      stt_error: null,
      assistant_reply: null,
      assistant_provider: null,
      assistant_model: null,
      assistant_generated_at: null,
      assistant_error: null,
      tts_generated: false,
      tts_filename: null,
      tts_provider: null,
      tts_voice: null,
      tts_model: null,
      tts_generated_at: null,
      tts_url: null,
      tts_error: null,
      tts_sample_rate: null,
      tts_channels: null,
      tts_bits_per_sample: null,
      turn_status: "received",
    };
    Object.assign(metadata, analyzePcm16Mono(req.body));

    logAudioTurn(turnId, "upload received", {
      filename,
      bytes: req.body.length,
      sample_rate: metadata.sample_rate,
      duration_ms: metadata.duration_ms,
      format: metadata.format,
      peak_to_peak: metadata.peak_to_peak,
      avg_abs_amplitude: metadata.avg_abs_amplitude,
      clipped_sample_count: metadata.clipped_sample_count,
    });
    touchDeviceHeartbeat(req.ip);
    fs.writeFileSync(audioPath, req.body);

    try {
      const wavResult = writePcm16MonoWav({
        rawPath: audioPath,
        wavPath,
        sampleRate: metadata.sample_rate || 8000,
        audioDataBytes: req.body,
      });
      metadata.wav_bytes = wavResult.bytesWritten;
      logAudioTurn(turnId, "wav created", {
        wav_filename: wavFilename,
        wav_bytes: wavResult.bytesWritten,
        sample_rate: wavResult.sampleRate,
        channels: wavResult.numChannels,
        bits_per_sample: wavResult.bitsPerSample,
        duration_ms: metadata.duration_ms,
      });

      logAudioTurn(turnId, "stt started", { wav_filename: wavFilename });
      const transcription = await transcribeAudio(wavPath);
      if (transcription.success) {
        metadata.transcript = transcription.text;
        metadata.transcript_provider = transcription.provider;
        metadata.confidence = transcription.confidence;
        metadata.transcribed_at = new Date().toISOString();
        logAudioTurn(turnId, "stt completed", {
          provider: metadata.transcript_provider,
          transcript: metadata.transcript,
        });
      } else {
        metadata.transcript_provider = transcription.provider;
        metadata.stt_error = transcription.error;
        logAudioTurn(turnId, "stt failed", {
          provider: metadata.transcript_provider,
          error: metadata.stt_error,
        });
      }
    } catch (error) {
      metadata.stt_error = error.message;
      logAudioTurn(turnId, "stt failed", { error: metadata.stt_error });
    }

    if (!(typeof metadata.transcript === "string" && metadata.transcript.trim().length > 0)) {
      const assistantResult = await generateAssistantReply({ transcript: "", sessionId });
      metadata.assistant_provider = assistantResult.provider;
      metadata.assistant_model = assistantResult.model;
      if (assistantResult.success) {
        metadata.assistant_reply = assistantResult.reply;
        metadata.assistant_generated_at = new Date().toISOString();
      } else {
        metadata.assistant_error = assistantResult.error;
      }
      logAudioTurn(turnId, "assistant unclear speech prompt", {
        stt_error: metadata.stt_error || "empty transcript",
        reply: metadata.assistant_reply,
      });
    }

    // Filter out common noise transcriptions & hallucinations without rewriting them into user speech.
    if (typeof metadata.transcript === "string" && metadata.transcript.trim().length > 0 && isNoiseTranscript(metadata.transcript)) {
      const originalTranscript = metadata.transcript;
      const assistantResult = await generateAssistantReply({ transcript: "", sessionId });
      metadata.assistant_provider = assistantResult.provider;
      metadata.assistant_model = assistantResult.model;
      if (assistantResult.success) {
        metadata.assistant_reply = assistantResult.reply;
        metadata.assistant_generated_at = new Date().toISOString();
      } else {
        metadata.assistant_error = assistantResult.error;
      }
      logAudioTurn(turnId, "assistant unclear speech prompt", {
        info: `Noise transcript ignored: "${originalTranscript}"`,
        reply: metadata.assistant_reply,
      });
    }

    // Direct responses enabled: always allow turn and keep session active
    const now = Date.now();
    activeSessions.set(sessionId, now);
    console.log(`[Session ${sessionId}] Processing direct response turn. Session active.`);

    if (!metadata.assistant_reply && typeof metadata.transcript === "string" && metadata.transcript.trim().length > 0) {
      try {
        logAudioTurn(turnId, "assistant started", { provider: "groq" });
        const assistantResult = await generateAssistantReply({
          transcript: metadata.transcript,
          sessionId,
          source: "esp32",
        });

        metadata.assistant_provider = assistantResult.provider;
        metadata.assistant_model = assistantResult.model;
        if (assistantResult.success) {
          metadata.assistant_reply = assistantResult.reply;
          metadata.assistant_generated_at = new Date().toISOString();
          logAudioTurn(turnId, "assistant completed", {
            provider: metadata.assistant_provider,
            model: metadata.assistant_model,
            reply: metadata.assistant_reply,
          });
        } else {
          metadata.assistant_error = assistantResult.error;
          logAudioTurn(turnId, "assistant failed", {
            provider: metadata.assistant_provider,
            model: metadata.assistant_model,
            error: metadata.assistant_error,
          });
        }
      } catch (error) {
        metadata.assistant_error = error.message;
        logAudioTurn(turnId, "assistant failed", { error: metadata.assistant_error });
      }
    }

    if (typeof metadata.assistant_reply === "string" && metadata.assistant_reply.trim().length > 0) {
      try {
        logAudioTurn(turnId, "tts started", { provider: process.env.TTS_PROVIDER || "openai" });
        const ttsResult = await generateSpeech({
          text: metadata.assistant_reply,
          sessionId,
        });

        metadata.tts_provider = ttsResult.provider;
        metadata.tts_voice = ttsResult.voice;
        metadata.tts_model = ttsResult.model;
        if (ttsResult.success) {
          metadata.tts_generated = true;
          metadata.tts_filename = ttsResult.filename;
          metadata.tts_url = ttsResult.url;
          attachTtsUrlToLastAssistantReply(sessionId, metadata.tts_url);
          metadata.tts_sample_rate = NORMALIZED_SAMPLE_RATE;
          metadata.tts_channels = 1;
          metadata.tts_bits_per_sample = 16;
          metadata.tts_generated_at = new Date().toISOString();
          logAudioTurn(turnId, "tts completed", {
            provider: metadata.tts_provider,
            filename: metadata.tts_filename,
            url: metadata.tts_url,
            sample_rate: metadata.tts_sample_rate,
            channels: metadata.tts_channels,
          });
        } else {
          metadata.tts_error = ttsResult.error;
          logAudioTurn(turnId, "tts failed", {
            provider: metadata.tts_provider,
            model: metadata.tts_model,
            error: metadata.tts_error,
          });
        }
      } catch (error) {
        metadata.tts_error = error.message;
        logAudioTurn(turnId, "tts failed", { error: metadata.tts_error });
      }
    } else {
      metadata.tts_error = "tts skipped: empty assistant reply";
    }

    if (metadata.tts_generated) {
      metadata.turn_status = "complete";
    } else if (metadata.assistant_error && !metadata.assistant_reply) {
      metadata.turn_status = "assistant_failed";
    } else if (metadata.tts_error) {
      metadata.turn_status = "tts_failed";
    } else {
      metadata.turn_status = "complete";
    }

    fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
    logAudioTurn(turnId, "complete", {
      turn_status: metadata.turn_status,
      tts_ready: metadata.tts_generated,
    });

    const wantsStream = req.get("x-stream-audio") === "true" || req.get("x-audio-format") === "raw_pcm_16le";
    if (wantsStream && metadata.tts_generated && metadata.tts_filename) {
      const ttsFilePath = path.join(ttsUploadsDir, metadata.tts_filename);
      if (fs.existsSync(ttsFilePath)) {
        try {
          const stat = fs.statSync(ttsFilePath);
          res.writeHead(200, {
            "Content-Type": "audio/wav",
            "Content-Length": stat.size,
            "X-Transcript": encodeURIComponent(metadata.transcript || ""),
            "X-Assistant-Reply": encodeURIComponent(metadata.assistant_reply || ""),
            "X-TTS-Ready": "true",
            "X-Turn-Status": metadata.turn_status,
            "X-TTS-Filename": metadata.tts_filename,
            "Connection": "close",
          });
          const stream = fs.createReadStream(ttsFilePath);
          return stream.pipe(res);
        } catch (err) {
          console.error("[Stream Audio Pipe Error]", err);
        }
      }
    }

    return res.json(buildAudioResponse(metadata, metadata.turn_status));
  }
);

app.listen(PORT, "0.0.0.0", () => {
  const localIP = getLocalIPv4Address();
  console.log(`KOTL backend listening on http://localhost:${PORT}`);
  console.log(`KOTL API live at: http://${localIP}:${PORT}`);
});
