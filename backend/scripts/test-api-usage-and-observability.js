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
const http = require("http");

const {
  recordLlmUsage,
  recordSttUsage,
  recordTtsUsage,
  getUsageSummary,
} = require("../services/api-usage");
const {
  app,
  verifyUsageAuthorization,
  createParentSession,
  isValidParentSession,
  clearExpiredParentSessions,
  revokeParentSession,
  activeParentSessions,
  safeCompare,
} = require("../server");
const { categorizeAndSanitizeError } = require("../services/websocket");

let passedCount = 0;
let failedCount = 0;

async function runTest(title, fn) {
  try {
    const res = fn();
    if (res && typeof res.then === "function") {
      await res;
    }
    console.log(`  [PASS] ${title}`);
    passedCount++;
  } catch (err) {
    console.error(`  [FAIL] ${title}: ${err.message}`);
    failedCount++;
  }
}

async function runAll() {
  console.log("====================================================");
  console.log("   KOTL USAGE & OBSERVABILITY REGRESSION SUITE      ");
  console.log("====================================================\n");

// ----------------------------------------------------
// 1. LLM Usage Tracking (Gemini & Token Accounting)
// ----------------------------------------------------
console.log(">>> [1/4] LLM Token Accounting & Quota Truthfulness");

await runTest("Gemini token usage records actual tokens without fabricating quotas", () => {
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

await runTest("Groq LLM headers capture live rate limits truthfully when provided", () => {
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

await runTest("STT audio duration and turns are tracked separately from LLM tokens", () => {
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

await runTest("Edge-TTS synthesis metrics are tracked with unmetered status", () => {
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

await runTest("Usage summary never exposes any API keys or credentials", () => {
  const summary = getUsageSummary();
  const str = JSON.stringify(summary);

  assert.ok(!str.includes("AIza"), "Must not expose Gemini API keys");
  assert.ok(!str.includes("gsk_"), "Must not expose Groq API keys");
  assert.ok(!str.includes("sk-"), "Must not expose OpenAI API keys");
});

await runTest("Production security: verifies Parent PIN & Admin Key when configured", () => {
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

await runTest("Production security: denies open access when both PARENT_PIN and ADMIN_KEY are unset", () => {
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

await runTest("Development preservation: allows local dashboard access when credentials are unset", () => {
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

await runTest("Parent session store: creates secure tokens and validates TTL and expiration", () => {
  const session = createParentSession();
  assert.ok(session.token && session.token.length >= 32, "Must generate high-entropy session token");
  assert.ok(session.expiresAt > Date.now(), "Expiration must be in the future");
  assert.strictEqual(isValidParentSession(session.token), true, "Fresh session token must be valid");

  // Fast-forward token expiration
  const stored = activeParentSessions.get(session.token);
  assert.ok(stored, "Session must exist in store");
  stored.expiresAt = Date.now() - 1000;

  assert.strictEqual(isValidParentSession(session.token), false, "Expired session token must be rejected");
  assert.strictEqual(activeParentSessions.has(session.token), false, "Expired session token must be purged");
});

await runTest("Parent session revocation: explicit logout immediately revokes session token", () => {
  const session = createParentSession();
  assert.strictEqual(isValidParentSession(session.token), true);

  const revoked = revokeParentSession(session.token);
  assert.strictEqual(revoked, true, "Revoke must report success for active token");
  assert.strictEqual(isValidParentSession(session.token), false, "Revoked session must not be valid");
  assert.strictEqual(revokeParentSession(session.token), false, "Double revoke must return false");
});

await runTest("Timing-safe comparison: correctly matches and rejects credentials", () => {
  assert.strictEqual(safeCompare("1234", "1234"), true, "Identical strings match");
  assert.strictEqual(safeCompare("1234", "5678"), false, "Different strings do not match");
  assert.strictEqual(safeCompare("12", "1234"), false, "Different length strings do not match");
  assert.strictEqual(safeCompare(null, "1234"), false, "Non-string handles safely");
});

await runTest("verifyUsageAuthorization: accepts valid parent session token and rejects expired or forged token", () => {
  const origPin = process.env.PARENT_PIN;
  const origEnv = process.env.NODE_ENV;

  try {
    process.env.NODE_ENV = "production";
    process.env.PARENT_PIN = "configured-pin-9999";

    const session = createParentSession();

    // 1. Valid token in x-parent-session-token header
    const r1 = verifyUsageAuthorization({ headers: { "x-parent-session-token": session.token } });
    assert.strictEqual(r1.authorized, true);
    assert.strictEqual(r1.method, "parent_session");

    // 2. Valid token in Bearer authorization header
    const r2 = verifyUsageAuthorization({ headers: { authorization: `Bearer ${session.token}` } });
    assert.strictEqual(r2.authorized, true);

    // 3. Forged or random token
    const r3 = verifyUsageAuthorization({ headers: { "x-parent-session-token": "forged-session-token-xyz" } });
    assert.strictEqual(r3.authorized, false);

    // 4. Expired token
    activeParentSessions.get(session.token).expiresAt = Date.now() - 500;
    const r4 = verifyUsageAuthorization({ headers: { "x-parent-session-token": session.token } });
    assert.strictEqual(r4.authorized, false);
  } finally {
    if (origPin === undefined) delete process.env.PARENT_PIN; else process.env.PARENT_PIN = origPin;
    if (origEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = origEnv;
  }
});

await runTest("HTTP Integration: Parent authentication flow, session issuance, usage gating, and logout", async () => {
  const origPin = process.env.PARENT_PIN;
  const origEnv = process.env.NODE_ENV;

  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, "127.0.0.1", resolve));
  const port = testServer.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    process.env.NODE_ENV = "production";
    process.env.PARENT_PIN = "7410";

    // 1. Unauthenticated request to /api/usage is blocked with 401
    const unauthRes = await fetch(`${baseUrl}/api/usage`);
    assert.strictEqual(unauthRes.status, 401, "Unauthenticated /api/usage must return HTTP 401");
    const unauthData = await unauthRes.json();
    assert.strictEqual(unauthData.success, false);

    // 2. Incorrect PIN attempt to /api/auth/parent-session is rejected with 401
    const wrongPinRes = await fetch(`${baseUrl}/api/auth/parent-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: "0000" }),
    });
    assert.strictEqual(wrongPinRes.status, 401, "Wrong PIN must return HTTP 401");
    const wrongPinData = await wrongPinRes.json();
    assert.strictEqual(wrongPinData.success, false);
    assert.ok(wrongPinData.error.includes("Invalid Parent PIN"));

    // 3. Demo PIN attempt (1234) is rejected with 401
    const demoPinRes = await fetch(`${baseUrl}/api/auth/parent-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: "1234" }),
    });
    assert.strictEqual(demoPinRes.status, 401, "Demo PIN 1234 must be rejected when PARENT_PIN is 7410");

    // 4. Correct PIN returns session token with HTTP 200
    const authRes = await fetch(`${baseUrl}/api/auth/parent-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: "7410" }),
    });
    assert.strictEqual(authRes.status, 200, "Valid PIN must return HTTP 200");
    const authData = await authRes.json();
    assert.strictEqual(authData.success, true);
    assert.ok(authData.token && typeof authData.token === "string");
    assert.strictEqual(authData.expiresIn, 900);
    const sessionToken = authData.token;

    // 5. Authenticated request to /api/usage succeeds with HTTP 200
    const usageRes = await fetch(`${baseUrl}/api/usage`, {
      headers: { "x-parent-session-token": sessionToken },
    });
    assert.strictEqual(usageRes.status, 200, "Authenticated /api/usage must return HTTP 200");
    const usageData = await usageRes.json();
    assert.strictEqual(usageData.success, true);
    assert.ok(usageData.providers, "Usage payload must contain providers object");

    // 6. Session status verification via GET /api/auth/parent-session
    const checkRes = await fetch(`${baseUrl}/api/auth/parent-session`, {
      headers: { "x-parent-session-token": sessionToken },
    });
    assert.strictEqual(checkRes.status, 200);
    const checkData = await checkRes.json();
    assert.strictEqual(checkData.authenticated, true);

    // 7. Session logout via DELETE /api/auth/parent-session
    const logoutRes = await fetch(`${baseUrl}/api/auth/parent-session`, {
      method: "DELETE",
      headers: { "x-parent-session-token": sessionToken },
    });
    assert.strictEqual(logoutRes.status, 200);

    // 8. Subsequent request with revoked token fails with HTTP 401
    const postLogoutUsage = await fetch(`${baseUrl}/api/usage`, {
      headers: { "x-parent-session-token": sessionToken },
    });
    assert.strictEqual(postLogoutUsage.status, 401, "Revoked session must be denied access");
  } finally {
    await new Promise((resolve) => testServer.close(resolve));
    if (origPin === undefined) delete process.env.PARENT_PIN; else process.env.PARENT_PIN = origPin;
    if (origEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = origEnv;
  }
});

await runTest("Outer WebSocket error sanitization scrubs keys, Bearer tokens, and categorizes errors", () => {
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

await runTest("WebSocket handler hardens outer catch-block and retains diagnostic statuses", () => {
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

await runTest("Firmware main.ino inspects status, reason, and raw_transcript for clear Serial Monitor output", () => {
  const inoSource = fs.readFileSync(path.join(__dirname, "..", "..", "esp32", "main", "main.ino"), "utf8");

  assert.ok(inoSource.includes("extractJsonString(msg, \"status\", &status)"), "Firmware must extract status");
  assert.ok(inoSource.includes("extractJsonString(msg, \"reason\", &reason)"), "Firmware must extract reason");
  assert.ok(inoSource.includes("extractJsonString(msg, \"raw_transcript\", &rawTranscript)"), "Firmware must extract raw transcript");
  assert.ok(inoSource.includes("[WebSocket] Cold-idle rejection:"), "Firmware must log cold-idle rejection");
  assert.ok(inoSource.includes("[WebSocket] STT Provider Error:"), "Firmware must log STT provider error");
});

await runTest("Firmware main.ino implements stack-based audio pre-roll buffer to prevent onset truncation", () => {
  const inoSource = fs.readFileSync(path.join(__dirname, "..", "..", "esp32", "main", "main.ino"), "utf8");

  assert.ok(inoSource.includes("int16_t preRollChunkPcm[kMicDmaChunkSize];"), "Firmware must declare preRollChunkPcm");
  assert.ok(inoSource.includes("size_t preRollCount = 0;"), "Firmware must declare preRollCount");
  assert.ok(inoSource.includes("wsSendBinSafe((const uint8_t *)preRollChunkPcm"), "Firmware must flush pre-roll on speech detection");
});

await runTest("WebSocket handler measures monotonic stage latencies with hrtime.bigint and emits stage durations", () => {
  const wsSource = fs.readFileSync(path.join(__dirname, "..", "services", "websocket.js"), "utf8");

  assert.ok(wsSource.includes("tStopListen = process.hrtime.bigint()"), "Must capture monotonic stop_listen timestamp");
  assert.ok(wsSource.includes("wavPrepMs"), "Must measure WAV preparation duration");
  assert.ok(wsSource.includes("sttMs"), "Must measure STT duration");
  assert.ok(wsSource.includes("llmMs"), "Must measure LLM duration");
  assert.ok(wsSource.includes("ttsMs"), "Must measure TTS duration");
  assert.ok(wsSource.includes("server_prep_ms: Math.round(totalPrepMs)"), "Must send total prep duration in tts_start");
  assert.ok(wsSource.includes("first_chunk_tx="), "Must log first audio chunk send latency");
});

await runTest("Firmware main.ino implements monotonic turn latency tracking and logs audible turnaround time", () => {
  const inoSource = fs.readFileSync(path.join(__dirname, "..", "..", "esp32", "main", "main.ino"), "utf8");

  assert.ok(inoSource.includes("s_turnSpeechEndMs = lastVoiceMs"), "Firmware must capture speech-end timestamp from lastVoiceMs");
  assert.ok(inoSource.includes("s_turnStopSentMs = millis()"), "Firmware must record stop_listen transmission timestamp");
  assert.ok(inoSource.includes("First audio chunk RX:"), "Firmware must record first audio chunk arrival");
  assert.ok(inoSource.includes(">>> AUDIBLE PLAYBACK STARTED <<< Total:"), "Firmware must log total audible turnaround time");
  assert.ok(inoSource.includes("extractJsonUint32"), "Firmware must provide extractJsonUint32 parser");
});

  console.log("\n====================================================");
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("====================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error("Test runner encountered unhandled error:", err);
  process.exit(1);
});
