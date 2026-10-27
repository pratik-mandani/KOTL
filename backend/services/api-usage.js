try {
  require("../utils/env");
} catch (_) {
  try {
    require("dotenv").config();
  } catch (__) {}
}
const fs = require("fs");
const path = require("path");

const USAGE_FILE = path.join(__dirname, "..", "uploads", "api_usage.json");

// In-memory usage state
let usageState = {
  date: new Date().toISOString().slice(0, 10),
  lastUpdated: null,
  llm: {
    gemini: {
      provider: "gemini",
      name: "Google Gemini",
      model: process.env.GEMINI_CHAT_MODEL || "gemini-3.5-flash-lite",
      requestsToday: 0,
      requestsTotal: 0,
      promptTokensToday: 0,
      promptTokensTotal: 0,
      completionTokensToday: 0,
      completionTokensTotal: 0,
      totalTokensToday: 0,
      totalTokensTotal: 0,
      lastTokens: null,
      lastRequestTimestamp: null,
      quotaReportedByProvider: false,
      quotaStatus: "unavailable",
      quotaNotes: "Google AI Studio manages project-level quotas; live remaining quotas are not exposed via API key responses.",
      officialDashboardUrl: "https://aistudio.google.com/app/plan_information",
      referenceFreeLimits: {
        rpm: "15 RPM",
        rpd: "1,500 RPD",
        tpm: "1,000,000 TPM",
        note: "Default Free Tier limits for Gemini Flash models; verify your account tier in AI Studio.",
      },
    },
    groq: {
      provider: "groq",
      name: "Groq Cloud LLM",
      model: process.env.GROQ_CHAT_MODEL || "qwen/qwen3.8-27b",
      requestsToday: 0,
      requestsTotal: 0,
      promptTokensToday: 0,
      promptTokensTotal: 0,
      completionTokensToday: 0,
      completionTokensTotal: 0,
      totalTokensToday: 0,
      totalTokensTotal: 0,
      lastTokens: null,
      lastRequestTimestamp: null,
      quotaReportedByProvider: false,
      providerHeaders: null,
      limitRequests: null,
      remainingRequests: null,
      limitTokens: null,
      remainingTokens: null,
      resetRequests: null,
      resetTokens: null,
      quotaStatus: "awaiting_api_response",
      quotaNotes: "Captured live from official Groq API response headers (x-ratelimit-*).",
      officialDashboardUrl: "https://console.groq.com/settings/limits",
      referenceFreeLimits: {
        rpm: "30 RPM",
        rpd: "14,400 RPD",
        tpm: "6,000 TPM",
      },
    },
  },
  stt: {
    groq_whisper: {
      provider: "groq",
      name: "Groq Whisper STT",
      model: process.env.GROQ_TRANSCRIPTION_MODEL || "whisper-large-v3-turbo",
      requestsToday: 0,
      requestsTotal: 0,
      audioSecondsToday: 0,
      audioSecondsTotal: 0,
      lastAudioSeconds: 0,
      lastRequestTimestamp: null,
      quotaReportedByProvider: false,
      providerHeaders: null,
      limitRequests: null,
      remainingRequests: null,
      quotaStatus: "awaiting_api_response",
      quotaNotes: "Captured live from official Groq API headers (x-ratelimit-remaining-requests).",
      officialDashboardUrl: "https://console.groq.com/settings/limits",
      referenceFreeLimits: {
        rpm: "20 RPM",
        rpd: "2,000 RPD",
        audioDailyLimit: "7,200 audio sec/day (~2 hrs)",
      },
    },
  },
  tts: {
    edge_tts: {
      provider: "edge",
      name: "Microsoft Edge TTS",
      voice: process.env.EDGE_TTS_VOICE || "en-IN-PrabhatNeural",
      requestsToday: 0,
      requestsTotal: 0,
      charactersToday: 0,
      charactersTotal: 0,
      audioBytesToday: 0,
      audioBytesTotal: 0,
      lastRequestTimestamp: null,
      quotaReportedByProvider: false,
      quotaStatus: "unmetered_no_provider_quota_api",
      quotaNotes: "Edge Read Aloud service has no documented per-account quota API. Usage is tracked locally.",
      officialDashboardUrl: "https://learn.microsoft.com/azure/ai-services/speech-service/",
    },
  },
};

function ensureUploadsDir() {
  const dir = path.dirname(USAGE_FILE);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (_) {}
  }
}

function loadUsageFromDisk() {
  try {
    if (fs.existsSync(USAGE_FILE)) {
      const data = JSON.parse(fs.readFileSync(USAGE_FILE, "utf-8"));
      if (data && typeof data === "object") {
        const currentDate = new Date().toISOString().slice(0, 10);
        const fileDate = data.date || currentDate;

        // Merge saved totals
        if (data.llm) {
          for (const key of Object.keys(data.llm)) {
            if (usageState.llm[key]) {
              const src = data.llm[key];
              const tgt = usageState.llm[key];
              tgt.requestsTotal = src.requestsTotal || 0;
              tgt.promptTokensTotal = src.promptTokensTotal || 0;
              tgt.completionTokensTotal = src.completionTokensTotal || 0;
              tgt.totalTokensTotal = src.totalTokensTotal || 0;
              if (fileDate === currentDate) {
                tgt.requestsToday = src.requestsToday || 0;
                tgt.promptTokensToday = src.promptTokensToday || 0;
                tgt.completionTokensToday = src.completionTokensToday || 0;
                tgt.totalTokensToday = src.totalTokensToday || 0;
              }
              if (src.remainingRequests !== undefined) tgt.remainingRequests = src.remainingRequests;
              if (src.limitRequests !== undefined) tgt.limitRequests = src.limitRequests;
              if (src.remainingTokens !== undefined) tgt.remainingTokens = src.remainingTokens;
              if (src.limitTokens !== undefined) tgt.limitTokens = src.limitTokens;
              if (src.quotaReportedByProvider) {
                tgt.quotaReportedByProvider = true;
                tgt.quotaStatus = "provider_reported";
              }
              tgt.lastRequestTimestamp = src.lastRequestTimestamp || null;
            }
          }
        }

        if (data.stt) {
          for (const key of Object.keys(data.stt)) {
            if (usageState.stt[key]) {
              const src = data.stt[key];
              const tgt = usageState.stt[key];
              tgt.requestsTotal = src.requestsTotal || 0;
              tgt.audioSecondsTotal = src.audioSecondsTotal || 0;
              if (fileDate === currentDate) {
                tgt.requestsToday = src.requestsToday || 0;
                tgt.audioSecondsToday = src.audioSecondsToday || 0;
              }
              if (src.remainingRequests !== undefined) tgt.remainingRequests = src.remainingRequests;
              if (src.limitRequests !== undefined) tgt.limitRequests = src.limitRequests;
              if (src.quotaReportedByProvider) {
                tgt.quotaReportedByProvider = true;
                tgt.quotaStatus = "provider_reported";
              }
              tgt.lastRequestTimestamp = src.lastRequestTimestamp || null;
            }
          }
        }

        if (data.tts) {
          for (const key of Object.keys(data.tts)) {
            if (usageState.tts[key]) {
              const src = data.tts[key];
              const tgt = usageState.tts[key];
              tgt.requestsTotal = src.requestsTotal || 0;
              tgt.charactersTotal = src.charactersTotal || 0;
              tgt.audioBytesTotal = src.audioBytesTotal || 0;
              if (fileDate === currentDate) {
                tgt.requestsToday = src.requestsToday || 0;
                tgt.charactersToday = src.charactersToday || 0;
                tgt.audioBytesToday = src.audioBytesToday || 0;
              }
              tgt.lastRequestTimestamp = src.lastRequestTimestamp || null;
            }
          }
        }

        usageState.date = currentDate;
        usageState.lastUpdated = data.lastUpdated || new Date().toISOString();
      }
    }
  } catch (err) {
    console.warn("[Usage Tracker] Warning loading usage from disk:", err.message);
  }
}

function saveUsageToDisk() {
  try {
    ensureUploadsDir();
    fs.writeFileSync(USAGE_FILE, JSON.stringify(usageState, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Usage Tracker] Warning saving usage to disk:", err.message);
  }
}

function checkDailyRollover() {
  const currentDate = new Date().toISOString().slice(0, 10);
  if (usageState.date !== currentDate) {
    usageState.date = currentDate;
    for (const key of Object.keys(usageState.llm)) {
      usageState.llm[key].requestsToday = 0;
      usageState.llm[key].promptTokensToday = 0;
      usageState.llm[key].completionTokensToday = 0;
      usageState.llm[key].totalTokensToday = 0;
    }
    for (const key of Object.keys(usageState.stt)) {
      usageState.stt[key].requestsToday = 0;
      usageState.stt[key].audioSecondsToday = 0;
    }
    for (const key of Object.keys(usageState.tts)) {
      usageState.tts[key].requestsToday = 0;
      usageState.tts[key].charactersToday = 0;
      usageState.tts[key].audioBytesToday = 0;
    }
    saveUsageToDisk();
  }
}

// Initial load
loadUsageFromDisk();

/**
 * Record an LLM turn
 */
function recordLlmUsage({ provider, model, promptTokens = null, completionTokens = null, totalTokens = null, headers = null }) {
  checkDailyRollover();
  const now = new Date().toISOString();
  usageState.lastUpdated = now;

  const targetKey = provider === "groq" ? "groq" : "gemini";
  let item = usageState.llm[targetKey];
  if (!item) {
    item = {
      provider,
      name: provider.toUpperCase(),
      model: model || "unknown",
      requestsToday: 0,
      requestsTotal: 0,
      promptTokensToday: 0,
      promptTokensTotal: 0,
      completionTokensToday: 0,
      completionTokensTotal: 0,
      totalTokensToday: 0,
      totalTokensTotal: 0,
      lastTokens: null,
      lastRequestTimestamp: now,
      quotaReportedByProvider: false,
      quotaStatus: "unavailable",
      officialDashboardUrl: "",
    };
    usageState.llm[targetKey] = item;
  }

  if (model) item.model = model;
  item.requestsToday += 1;
  item.requestsTotal += 1;
  item.lastRequestTimestamp = now;

  if (typeof totalTokens === "number" && totalTokens > 0) {
    const pTokens = typeof promptTokens === "number" ? promptTokens : 0;
    const cTokens = typeof completionTokens === "number" ? completionTokens : totalTokens - pTokens;

    item.promptTokensToday += pTokens;
    item.promptTokensTotal += pTokens;
    item.completionTokensToday += cTokens;
    item.completionTokensTotal += cTokens;
    item.totalTokensToday += totalTokens;
    item.totalTokensTotal += totalTokens;

    item.lastTokens = {
      promptTokens: pTokens,
      completionTokens: cTokens,
      totalTokens,
    };
  }

  // Parse official provider rate-limit headers if returned (e.g. Groq)
  if (headers && typeof headers.get === "function") {
    const remReq = headers.get("x-ratelimit-remaining-requests");
    const limReq = headers.get("x-ratelimit-limit-requests");
    const remTok = headers.get("x-ratelimit-remaining-tokens");
    const limTok = headers.get("x-ratelimit-limit-tokens");
    const rstReq = headers.get("x-ratelimit-reset-requests");
    const rstTok = headers.get("x-ratelimit-reset-tokens");

    if (remReq !== null && remReq !== undefined) {
      item.remainingRequests = remReq;
      item.quotaReportedByProvider = true;
      item.quotaStatus = "provider_reported";
    }
    if (limReq !== null && limReq !== undefined) item.limitRequests = limReq;
    if (remTok !== null && remTok !== undefined) item.remainingTokens = remTok;
    if (limTok !== null && limTok !== undefined) item.limitTokens = limTok;
    if (rstReq !== null && rstReq !== undefined) item.resetRequests = rstReq;
    if (rstTok !== null && rstTok !== undefined) item.resetTokens = rstTok;
  }

  saveUsageToDisk();
}

/**
 * Record an STT turn
 */
function recordSttUsage({ provider, model, audioDurationMs = 0, headers = null }) {
  checkDailyRollover();
  const now = new Date().toISOString();
  usageState.lastUpdated = now;

  let item = usageState.stt.groq_whisper;
  if (!item) return;

  if (model) item.model = model;
  item.requestsToday += 1;
  item.requestsTotal += 1;
  item.lastRequestTimestamp = now;

  const audioSec = Math.max(0, Math.round(audioDurationMs / 1000));
  item.audioSecondsToday += audioSec;
  item.audioSecondsTotal += audioSec;
  item.lastAudioSeconds = audioSec;

  if (headers && typeof headers.get === "function") {
    const remReq = headers.get("x-ratelimit-remaining-requests");
    const limReq = headers.get("x-ratelimit-limit-requests");
    if (remReq !== null && remReq !== undefined) {
      item.remainingRequests = remReq;
      item.quotaReportedByProvider = true;
      item.quotaStatus = "provider_reported";
    }
    if (limReq !== null && limReq !== undefined) item.limitRequests = limReq;
  }

  saveUsageToDisk();
}

/**
 * Record a TTS synthesis
 */
function recordTtsUsage({ provider = "edge", characterCount = 0, audioBytes = 0 }) {
  checkDailyRollover();
  const now = new Date().toISOString();
  usageState.lastUpdated = now;

  let item = usageState.tts.edge_tts;
  if (!item) return;

  item.requestsToday += 1;
  item.requestsTotal += 1;
  item.charactersToday += Math.max(0, characterCount);
  item.charactersTotal += Math.max(0, characterCount);
  item.audioBytesToday += Math.max(0, audioBytes);
  item.audioBytesTotal += Math.max(0, audioBytes);
  item.lastRequestTimestamp = now;

  saveUsageToDisk();
}

/**
 * Get comprehensive, sanitized usage summary for the web UI and API
 */
function getUsageSummary() {
  checkDailyRollover();

  const sanitizeNumber = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === "number") return val;
    const clean = String(val).replace(/,/g, "").trim();
    const parsed = Number(clean);
    return isNaN(parsed) ? val : parsed;
  };

  const calculatePercent = (remaining, limit) => {
    const r = sanitizeNumber(remaining);
    const l = sanitizeNumber(limit);
    if (typeof r === "number" && typeof l === "number" && l > 0) {
      const used = Math.max(0, l - r);
      return Math.min(100, Math.round((used / l) * 100));
    }
    return null;
  };

  return {
    date: usageState.date,
    lastUpdated: usageState.lastUpdated || new Date().toISOString(),
    providers: {
      llm: {
        gemini: {
          name: usageState.llm.gemini.name,
          provider: "gemini",
          model: usageState.llm.gemini.model,
          isConfigured: Boolean(process.env.GEMINI_API_KEY),
          quotaStatus: usageState.llm.gemini.quotaStatus,
          quotaSource: "measured_by_kotl",
          quotaReportedByProvider: false,
          requestsToday: usageState.llm.gemini.requestsToday,
          requestsTotal: usageState.llm.gemini.requestsTotal,
          promptTokensToday: usageState.llm.gemini.promptTokensToday,
          completionTokensToday: usageState.llm.gemini.completionTokensToday,
          totalTokensToday: usageState.llm.gemini.totalTokensToday,
          totalTokensTotal: usageState.llm.gemini.totalTokensTotal,
          lastTokens: usageState.llm.gemini.lastTokens,
          lastRequestTimestamp: usageState.llm.gemini.lastRequestTimestamp,
          officialDashboardUrl: usageState.llm.gemini.officialDashboardUrl,
          quotaNotes: usageState.llm.gemini.quotaNotes,
          referenceLimits: usageState.llm.gemini.referenceFreeLimits,
        },
        groq: {
          name: usageState.llm.groq.name,
          provider: "groq",
          model: usageState.llm.groq.model,
          isConfigured: Boolean(process.env.GROQ_API_KEY),
          quotaStatus: usageState.llm.groq.quotaStatus,
          quotaSource: usageState.llm.groq.quotaReportedByProvider ? "provider_reported" : "measured_by_kotl",
          quotaReportedByProvider: usageState.llm.groq.quotaReportedByProvider,
          requestsToday: usageState.llm.groq.requestsToday,
          requestsTotal: usageState.llm.groq.requestsTotal,
          promptTokensToday: usageState.llm.groq.promptTokensToday,
          completionTokensToday: usageState.llm.groq.completionTokensToday,
          totalTokensToday: usageState.llm.groq.totalTokensToday,
          totalTokensTotal: usageState.llm.groq.totalTokensTotal,
          lastTokens: usageState.llm.groq.lastTokens,
          lastRequestTimestamp: usageState.llm.groq.lastRequestTimestamp,
          limitRequests: usageState.llm.groq.limitRequests,
          remainingRequests: usageState.llm.groq.remainingRequests,
          limitTokens: usageState.llm.groq.limitTokens,
          remainingTokens: usageState.llm.groq.remainingTokens,
          resetRequests: usageState.llm.groq.resetRequests,
          resetTokens: usageState.llm.groq.resetTokens,
          requestUsagePercent: calculatePercent(usageState.llm.groq.remainingRequests, usageState.llm.groq.limitRequests),
          tokenUsagePercent: calculatePercent(usageState.llm.groq.remainingTokens, usageState.llm.groq.limitTokens),
          officialDashboardUrl: usageState.llm.groq.officialDashboardUrl,
          quotaNotes: usageState.llm.groq.quotaNotes,
          referenceLimits: usageState.llm.groq.referenceFreeLimits,
        },
      },
      stt: {
        groq_whisper: {
          name: usageState.stt.groq_whisper.name,
          provider: "groq",
          model: usageState.stt.groq_whisper.model,
          isConfigured: Boolean(process.env.GROQ_API_KEY),
          quotaStatus: usageState.stt.groq_whisper.quotaStatus,
          quotaSource: usageState.stt.groq_whisper.quotaReportedByProvider ? "provider_reported" : "measured_by_kotl",
          quotaReportedByProvider: usageState.stt.groq_whisper.quotaReportedByProvider,
          requestsToday: usageState.stt.groq_whisper.requestsToday,
          requestsTotal: usageState.stt.groq_whisper.requestsTotal,
          audioSecondsToday: usageState.stt.groq_whisper.audioSecondsToday,
          audioSecondsTotal: usageState.stt.groq_whisper.audioSecondsTotal,
          lastAudioSeconds: usageState.stt.groq_whisper.lastAudioSeconds,
          lastRequestTimestamp: usageState.stt.groq_whisper.lastRequestTimestamp,
          limitRequests: usageState.stt.groq_whisper.limitRequests,
          remainingRequests: usageState.stt.groq_whisper.remainingRequests,
          requestUsagePercent: calculatePercent(usageState.stt.groq_whisper.remainingRequests, usageState.stt.groq_whisper.limitRequests),
          officialDashboardUrl: usageState.stt.groq_whisper.officialDashboardUrl,
          quotaNotes: usageState.stt.groq_whisper.quotaNotes,
          referenceLimits: usageState.stt.groq_whisper.referenceFreeLimits,
        },
      },
      tts: {
        edge_tts: {
          name: usageState.tts.edge_tts.name,
          provider: "edge",
          voice: usageState.tts.edge_tts.voice,
          isConfigured: true,
          quotaStatus: usageState.tts.edge_tts.quotaStatus,
          quotaSource: "measured_by_kotl",
          quotaReportedByProvider: false,
          requestsToday: usageState.tts.edge_tts.requestsToday,
          requestsTotal: usageState.tts.edge_tts.requestsTotal,
          charactersToday: usageState.tts.edge_tts.charactersToday,
          charactersTotal: usageState.tts.edge_tts.charactersTotal,
          audioBytesToday: usageState.tts.edge_tts.audioBytesToday,
          audioBytesTotal: usageState.tts.edge_tts.audioBytesTotal,
          lastRequestTimestamp: usageState.tts.edge_tts.lastRequestTimestamp,
          officialDashboardUrl: usageState.tts.edge_tts.officialDashboardUrl,
          quotaNotes: usageState.tts.edge_tts.quotaNotes,
        },
      },
    },
  };
}

module.exports = {
  recordLlmUsage,
  recordSttUsage,
  recordTtsUsage,
  getUsageSummary,
};
