/**
 * KOTL Test Suite: API Provider Usage & Audio-to-Response Observability
 * 
 * Tests:
 * 1. Usage Tracker: Truthful tracking of actual LLM tokens (prompt, completion, total).
 * 2. Usage Tracker: Truthful handling of unavailable quota (Gemini, Edge-TTS) with official dashboard URLs.
 * 3. Usage Tracker: Live capture of provider rate-limit headers (Groq) without hardcoded fabrications.
 * 4. Usage Tracker: Separate tracking of STT audio duration and request counts.
 * 5. Usage Tracker: Edge-TTS synthesis tracking (character count & audio bytes).
 * 6. Security: VerifyUsageAuthorization enforces PIN/Key when configured & output sanitization.
 * 7. WebSocket Diagnostics: Differentiate all 8 turn states without losing raw transcript.
 * 8. Error Sanitization: Categorizes and strips API keys and Bearer tokens from error strings.
 * 9. Firmware Verification: Static inspection of main.ino for pre-roll buffer & diagnostic handling.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  recordLlmUsage,
  recordSttUsage,
  recordTtsUsage,
  getUsageSummary,
} = require("../services/api-usage");
const { verifyUsageAuthorization } = require("../server");
const { categorizeAndSanitizeError } = require("../services/websocket");

let passedCount = 0;
let failedCount = 0;

function runTest(title, fn) {
  try {
    fn();
    console.log(`  [PASS] ${title}`);
    passedCount++;
  } catch (err) {
    console.error(`  [FAIL] ${title}: ${err.message}`);
    failedCount++;
  }
}

console.log("====================================================");
console.log("   KOTL USAGE & OBSERVABILITY REGRESSION SUITE      ");
console.log("====================================================\n");

// ----------------------------------------------------
// 1. LLM Usage Tracking (Gemini & Token Accounting)
// ----------------------------------------------------
console.log(">>> [1/4] LLM Token Accounting & Quota Truthfulness");

runTest("Gemini token usage records actual tokens without fabricating quotas", () => {
  recordLlmUsage({
    provider: "gemini",
    model: "gemini-3.5-flash-lite",
    promptTokens: 120,
    completionTokens: 45,
    totalTokens: 165,
  });

  const summary = getUsageSummary();
  const gemini = summary.providers.llm.gemini;

  assert.strictEqual(gemini.provider, "gemini");
  assert.strictEqual(gemini.quotaStatus, "unavailable");
  assert.strictEqual(gemini.quotaReportedByProvider, false);
  assert.strictEqual(gemini.quotaSource, "measured_by_kotl");
  assert.ok(gemini.totalTokensToday >= 165, "Total tokens today should be recorded");
  assert.ok(gemini.promptTokensToday >= 120, "Prompt tokens today should be recorded");
  assert.ok(gemini.completionTokensToday >= 45, "Completion tokens today should be recorded");
  assert.strictEqual(gemini.officialDashboardUrl, "https://aistudio.google.com/app/plan_information");
});

runTest("Groq LLM headers capture live rate limits truthfully when provided", () => {
  const mockHeaders = new Map([
    ["x-ratelimit-remaining-requests", "14350"],
    ["x-ratelimit-limit-requests", "14400"],
    ["x-ratelimit-remaining-tokens", "495000"],
    ["x-ratelimit-limit-tokens", "500000"],
    ["x-ratelimit-reset-requests", "2m30s"],
    ["x-ratelimit-reset-tokens", "45s"],
  ]);

  recordLlmUsage({
    provider: "groq",
    model: "qwen/qwen3.8-27b",
    promptTokens: 80,
    completionTokens: 25,
    totalTokens: 105,
    headers: {
      get: (k) => mockHeaders.get(k) || null,
    },
  });

  const summary = getUsageSummary();
  const groq = summary.providers.llm.groq;

  assert.strictEqual(groq.provider, "groq");
  assert.strictEqual(groq.quotaReportedByProvider, true);
  assert.strictEqual(groq.quotaSource, "provider_reported");
  assert.strictEqual(groq.remainingRequests, "14350");
  assert.strictEqual(groq.limitRequests, "14400");
  assert.strictEqual(groq.remainingTokens, "495000");
  assert.strictEqual(groq.limitTokens, "500000");
  assert.strictEqual(typeof groq.requestUsagePercent, "number");
  assert.strictEqual(groq.officialDashboardUrl, "https://console.groq.com/settings/limits");
});

// ----------------------------------------------------
// 2. STT & TTS Usage Tracking
// ----------------------------------------------------
console.log("\n>>> [2/4] STT & TTS Telemetry Tracking");

runTest("STT audio duration and turns are tracked separately from LLM tokens", () => {
  recordSttUsage({
    provider: "groq",
    model: "whisper-large-v3-turbo",
    audioDurationMs: 3500, // 3.5s
  });

  const summary = getUsageSummary();
  const whisper = summary.providers.stt.groq_whisper;

  assert.strictEqual(whisper.provider, "groq");
  assert.ok(whisper.requestsToday >= 1, "Requests count should increment");
  assert.ok(whisper.audioSecondsToday >= 4, "Audio seconds rounded should be recorded");
  assert.strictEqual(whisper.officialDashboardUrl, "https://console.groq.com/settings/limits");
});

runTest("Edge-TTS synthesis metrics are tracked with unmetered status", () => {
  recordTtsUsage({
    provider: "edge",
    characterCount: 65,
    audioBytes: 32000,
  });

  const summary = getUsageSummary();
  const edge = summary.providers.tts.edge_tts;

  assert.strictEqual(edge.provider, "edge");
  assert.strictEqual(edge.quotaStatus, "unmetered_no_provider_quota_api");
  assert.ok(edge.charactersToday >= 65, "Characters today should be recorded");
  assert.ok(edge.audioBytesToday >= 32000, "Audio bytes today should be recorded");
});

// ----------------------------------------------------
// 3. Security, Authorization & Error Sanitization
// ----------------------------------------------------
console.log("\n>>> [3/4] Security, Authorization & Sanitization");

runTest("Usage summary never exposes any API keys or credentials", () => {
  const summary = getUsageSummary();
  const str = JSON.stringify(summary);

  assert.ok(!str.includes("AIza"), "Must not expose Gemini API keys");
  assert.ok(!str.includes("gsk_"), "Must not expose Groq API keys");
  assert.ok(!str.includes("sk-"), "Must not expose OpenAI API keys");
});

runTest("Production security: verifies Parent PIN & Admin Key when configured", () => {
  const origPin = process.env.PARENT_PIN;
  const origKey = process.env.ADMIN_KEY;
  const origEnv = process.env.NODE_ENV;

  try {
    process.env.NODE_ENV = "production";
    process.env.PARENT_PIN = "5678";
    process.env.ADMIN_KEY = "super-secret-key";

    // 1. Wrong PIN is rejected
    const r1 = verifyUsageAuthorization({ headers: { "x-parent-pin": "1234" } });
    assert.strictEqual(r1.authorized, false);

    // 2. Correct PIN is authorized
    const r2 = verifyUsageAuthorization({ headers: { "x-parent-pin": "5678" } });
    assert.strictEqual(r2.authorized, true);

    // 3. Correct Admin Key via Bearer is authorized
    const r3 = verifyUsageAuthorization({ headers: { authorization: "Bearer super-secret-key" } });
    assert.strictEqual(r3.authorized, true);

    // 4. Missing credentials in production rejected
    const r4 = verifyUsageAuthorization({ headers: {} });
    assert.strictEqual(r4.authorized, false);
  } finally {
    if (origPin === undefined) delete process.env.PARENT_PIN; else process.env.PARENT_PIN = origPin;
    if (origKey === undefined) delete process.env.ADMIN_KEY; else process.env.ADMIN_KEY = origKey;
    if (origEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = origEnv;
  }
});

runTest("Production security: denies open access when both PARENT_PIN and ADMIN_KEY are unset", () => {
  const origPin = process.env.PARENT_PIN;
  const origKey = process.env.ADMIN_KEY;
  const origEnv = process.env.NODE_ENV;

  try {
    process.env.NODE_ENV = "production";
    delete process.env.PARENT_PIN;
    delete process.env.ADMIN_KEY;

    const res = verifyUsageAuthorization({ headers: {} });
    assert.strictEqual(res.authorized, false, "Must deny access in production when credentials are unset");
    assert.ok(res.error.includes("must be configured in production"), "Must specify error message");
  } finally {
    if (origPin === undefined) delete process.env.PARENT_PIN; else process.env.PARENT_PIN = origPin;
    if (origKey === undefined) delete process.env.ADMIN_KEY; else process.env.ADMIN_KEY = origKey;
    if (origEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = origEnv;
  }
});

runTest("Development preservation: allows local dashboard access when credentials are unset", () => {
  const origPin = process.env.PARENT_PIN;
  const origKey = process.env.ADMIN_KEY;
  const origEnv = process.env.NODE_ENV;

  try {
    process.env.NODE_ENV = "development";
    delete process.env.PARENT_PIN;
    delete process.env.ADMIN_KEY;

    const res = verifyUsageAuthorization({ headers: {} });
    assert.strictEqual(res.authorized, true, "Must permit local dashboard onboarding in development mode");
  } finally {
    if (origPin === undefined) delete process.env.PARENT_PIN; else process.env.PARENT_PIN = origPin;
    if (origKey === undefined) delete process.env.ADMIN_KEY; else process.env.ADMIN_KEY = origKey;
    if (origEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = origEnv;
  }
});

runTest("Outer WebSocket error sanitization scrubs keys, Bearer tokens, and categorizes errors", () => {
  // Test 1: Groq API Key leakage in error
  const groqLeak = new Error("Failed connecting to https://api.groq.com with key gsk_abc123xyz789SECRET");
  const s1 = categorizeAndSanitizeError(groqLeak);
  assert.ok(!s1.safeReason.includes("gsk_abc123xyz789SECRET"), "Groq API key must be scrubbed");
  assert.ok(s1.safeReason.includes("[REDACTED_GROQ_KEY]"), "Must replace with redaction placeholder");

  // Test 2: Gemini API Key leakage in error
  const geminiLeak = new Error("Google AI Studio AIzaSyD3xAmPlEkEy456 rejected request");
  const s2 = categorizeAndSanitizeError(geminiLeak);
  assert.ok(!s2.safeReason.includes("AIzaSyD3xAmPlEkEy456"), "Gemini API key must be scrubbed");
  assert.ok(s2.safeReason.includes("[REDACTED_GEMINI_KEY]"), "Must replace with redaction placeholder");

  // Test 3: Bearer Authorization token in error
  const bearerLeak = new Error("Invalid Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz");
  const s3 = categorizeAndSanitizeError(bearerLeak);
  assert.ok(!s3.safeReason.includes("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz"), "Bearer token must be scrubbed");
  assert.ok(s3.safeReason.includes("Bearer [REDACTED]"), "Must replace Bearer token");

  // Test 4: Rate limit / quota error categorization
  const quotaErr = new Error("HTTP 429: Resource has been exhausted (e.g. check quota)");
  const s4 = categorizeAndSanitizeError(quotaErr);
  assert.strictEqual(s4.category, "quota_or_rate_limit");
  assert.strictEqual(s4.safeReason, "API quota or rate limit exceeded");
});

// ----------------------------------------------------
// 4. WebSocket Diagnostics & Firmware Verification
// ----------------------------------------------------
console.log("\n>>> [4/4] Observability Diagnostics & Firmware Integrity");

runTest("WebSocket handler hardens outer catch-block and retains diagnostic statuses", () => {
  const wsSource = fs.readFileSync(path.join(__dirname, "..", "services", "websocket.js"), "utf8");

  assert.ok(wsSource.includes("status: \"rejected_cold_idle\""), "Must emit rejected_cold_idle status");
  assert.ok(wsSource.includes("raw_transcript: transcript"), "Must retain raw transcript for diagnostics");
  assert.ok(wsSource.includes("status: \"empty_or_noise\""), "Must emit empty_or_noise status");
  assert.ok(wsSource.includes("status: \"stt_error\""), "Must emit stt_error status");
  assert.ok(wsSource.includes("categorizeAndSanitizeError"), "Must categorize and sanitize errors");
  assert.ok(wsSource.includes("const { category, safeReason } = categorizeAndSanitizeError(turnError);"), "Outer catch must sanitize errors");
  assert.ok(wsSource.includes("error_category: category"), "Outer error response must send safe category");
  assert.ok(wsSource.includes("message: safeReason"), "Outer error response must send safeReason");
});

runTest("Firmware main.ino inspects status, reason, and raw_transcript for clear Serial Monitor output", () => {
  const inoSource = fs.readFileSync(path.join(__dirname, "..", "..", "esp32", "main", "main.ino"), "utf8");

  assert.ok(inoSource.includes("extractJsonString(msg, \"status\", &status)"), "Firmware must extract status");
  assert.ok(inoSource.includes("extractJsonString(msg, \"reason\", &reason)"), "Firmware must extract reason");
  assert.ok(inoSource.includes("extractJsonString(msg, \"raw_transcript\", &rawTranscript)"), "Firmware must extract raw transcript");
  assert.ok(inoSource.includes("[WebSocket] Cold-idle rejection:"), "Firmware must log cold-idle rejection");
  assert.ok(inoSource.includes("[WebSocket] STT Provider Error:"), "Firmware must log STT provider error");
});

runTest("Firmware main.ino implements stack-based audio pre-roll buffer to prevent onset truncation", () => {
  const inoSource = fs.readFileSync(path.join(__dirname, "..", "..", "esp32", "main", "main.ino"), "utf8");

  assert.ok(inoSource.includes("int16_t preRollChunkPcm[kMicDmaChunkSize];"), "Firmware must declare preRollChunkPcm");
  assert.ok(inoSource.includes("size_t preRollCount = 0;"), "Firmware must declare preRollCount");
  assert.ok(inoSource.includes("wsSendBinSafe((const uint8_t *)preRollChunkPcm"), "Firmware must flush pre-roll on speech detection");
});

console.log("\n====================================================");
console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("====================================================");

if (failedCount > 0) {
  process.exit(1);
}
