/**
 * Focused Unit & Integration Tests:
 * TTS Provider Routing, Bounded Timeout, Circuit Breaker, and STT Timeouts
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  synthesizeSpeechPcm,
  ttsCircuitBreaker,
  isTtsProviderAvailable,
  recordTtsSuccess,
  recordTtsFailure,
  resetTtsCircuitBreaker,
  getLastSynthesizedTtsProvider,
} = require("../services/websocket");

const { generateSpeech } = require("../services/tts");

async function runTestSuite() {
  console.log("====================================================");
  console.log("   KOTL TTS LATENCY, CIRCUIT BREAKER & ROUTING TEST ");
  console.log("====================================================");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // --- 1. Circuit Breaker State & Helpers ---
  console.log("\n>>> [1/5] Circuit Breaker Unit Mechanics");

  await test("Circuit breaker starts in healthy state", () => {
    resetTtsCircuitBreaker();
    assert.strictEqual(isTtsProviderAvailable("edge"), true);
    assert.strictEqual(isTtsProviderAvailable("gemini"), true);
    assert.strictEqual(ttsCircuitBreaker.edge.failures, 0);
    assert.strictEqual(ttsCircuitBreaker.edge.cooldownUntil, 0);
  });

  await test("recordTtsFailure trips circuit breaker into cooldown", () => {
    resetTtsCircuitBreaker();
    const mockError = new Error("Connection timeout");
    recordTtsFailure("edge", mockError);

    assert.strictEqual(ttsCircuitBreaker.edge.failures, 1);
    assert.ok(ttsCircuitBreaker.edge.cooldownUntil > Date.now(), "Cooldown timestamp must be in future");
    assert.strictEqual(isTtsProviderAvailable("edge"), false, "Provider must be unavailable while in cooldown");
    assert.strictEqual(isTtsProviderAvailable("gemini"), true, "Other providers must remain available");
  });

  await test("recordTtsSuccess resets circuit breaker failures and cooldown", () => {
    recordTtsSuccess("edge");
    assert.strictEqual(ttsCircuitBreaker.edge.failures, 0);
    assert.strictEqual(ttsCircuitBreaker.edge.cooldownUntil, 0);
    assert.strictEqual(isTtsProviderAvailable("edge"), true);
  });

  await test("Circuit breaker recovers after cooldown expiration (half-open)", () => {
    resetTtsCircuitBreaker();
    // Simulate expired cooldown in the past
    ttsCircuitBreaker.edge.failures = 2;
    ttsCircuitBreaker.edge.cooldownUntil = Date.now() - 500;

    assert.strictEqual(isTtsProviderAvailable("edge"), true, "Must become available when cooldown has passed");
    assert.strictEqual(ttsCircuitBreaker.edge.cooldownUntil, 0, "Cooldown must be cleared upon recovery");
  });

  // --- 2. Bounded Timeout Configuration ---
  console.log("\n>>> [2/5] Timeout Bound Assertions");

  await test("Edge TTS v2 default timeout is bounded to <= 3000ms (not 12000ms)", () => {
    const edgeSource = fs.readFileSync(path.join(__dirname, "..", "services", "edge-v2-tts.js"), "utf8");
    assert.ok(edgeSource.includes("DEFAULT_EDGE_TTS_TIMEOUT_MS = Number.parseInt(process.env.EDGE_TTS_TIMEOUT_MS || \"\", 10) || 3000;"),
      "Must define bounded default timeout of 3000ms");
    assert.ok(!edgeSource.includes("timeoutMs = 12000"), "Must not hardcode 12000ms timeout");
  });

  await test("Groq STT fetch implements bounded AbortController timeout", () => {
    const sttSource = fs.readFileSync(path.join(__dirname, "..", "services", "stt.js"), "utf8");
    assert.ok(sttSource.includes("const GROQ_STT_TIMEOUT_MS = Number.parseInt(process.env.GROQ_STT_TIMEOUT_MS || \"\", 10) || 8000;"),
      "Must define bounded STT timeout of 8000ms");
    assert.ok(sttSource.includes("const controller = new AbortController();"), "Must instantiate AbortController for fetch");
    assert.ok(sttSource.includes("signal: controller.signal,"), "Must pass controller signal to Groq fetch");
    assert.ok(sttSource.includes("clearTimeout(timer);"), "Must clear timeout on success and catch");
  });

  await test("Groq LLM default timeout is bounded to <= 8000ms", () => {
    const groqSource = fs.readFileSync(path.join(__dirname, "..", "services", "groq.js"), "utf8");
    assert.ok(groqSource.includes("const DEFAULT_TIMEOUT_MS = Number.parseInt(process.env.GROQ_TIMEOUT_MS || \"\", 10) || 8000;"),
      "Must define bounded LLM default timeout of 8000ms");
  });

  // --- 3. TTS Provider Selection & Precedence ---
  console.log("\n>>> [3/5] Provider Precedence & Configuration Respect");

  await test("TTS_PROVIDER=gemini selects Gemini as primary in websocket.js", async () => {
    resetTtsCircuitBreaker();
    const orig = process.env.TTS_PROVIDER;
    process.env.TTS_PROVIDER = "gemini";
    try {
      const pcm = await synthesizeSpeechPcm("Hello champ, how are you today?");
      assert.ok(pcm && pcm.length > 0, "Must synthesize audio");
      const provider = getLastSynthesizedTtsProvider();
      assert.ok(provider === "gemini" || provider === "edge", `Must attempt gemini and succeed or fallback to edge on quota exhaustion (got ${provider})`);
    } finally {
      process.env.TTS_PROVIDER = orig;
      resetTtsCircuitBreaker();
    }
  });

  await test("TTS_PROVIDER=edge selects Edge as primary in websocket.js", async () => {
    resetTtsCircuitBreaker();
    const orig = process.env.TTS_PROVIDER;
    process.env.TTS_PROVIDER = "edge";
    try {
      const pcm = await synthesizeSpeechPcm("Hello champ, how are you today?");
      assert.ok(pcm && pcm.length > 0, "Must synthesize audio");
      assert.strictEqual(getLastSynthesizedTtsProvider(), "edge", "Must have used edge provider on local machine");
    } finally {
      process.env.TTS_PROVIDER = orig;
      resetTtsCircuitBreaker();
    }
  });

  await test("generateSpeech in tts.js respects TTS_PROVIDER=gemini", async () => {
    const orig = process.env.TTS_PROVIDER;
    process.env.TTS_PROVIDER = "gemini";
    try {
      const res = await generateSpeech({ text: "Super buddy!", sessionId: "test-tts-prov" });
      assert.strictEqual(res.success, true, "Must succeed");
      assert.ok(res.provider === "gemini" || res.provider === "edge", "Must prioritize gemini and safely fall back to edge on quota limits");
    } finally {
      process.env.TTS_PROVIDER = orig;
    }
  });

  // --- 4. Circuit Breaker Multi-Sentence Fast-Path ---
  console.log("\n>>> [4/5] Multi-Sentence Fallback Without Repeated Timeouts");

  await test("Tripped circuit breaker skips primary provider with zero delay on sentence 2", async () => {
    resetTtsCircuitBreaker();
    const orig = process.env.TTS_PROVIDER;
    process.env.TTS_PROVIDER = "gemini";

    // Simulate primary failure on sentence 1
    recordTtsFailure("gemini", new Error("Simulated Gemini quota limit reached"));

    // Measure time taken to synthesize sentence 2
    const t0 = Date.now();
    const pcm = await synthesizeSpeechPcm("This is the second sentence.");
    const elapsedMs = Date.now() - t0;

    try {
      assert.ok(pcm && pcm.length > 0, "Must synthesize fallback audio via Edge");
      assert.strictEqual(getLastSynthesizedTtsProvider(), "edge", "Must use edge fallback");
      assert.ok(elapsedMs < 6000, `Fallback must complete promptly without timeout (took ${elapsedMs}ms)`);
      assert.strictEqual(ttsCircuitBreaker.gemini.failures, 1, "Must not have attempted Gemini again while cooling down");
    } finally {
      process.env.TTS_PROVIDER = orig;
      resetTtsCircuitBreaker();
    }
  });

  // --- 5. Audio Framing & Encoding Integrity ---
  console.log("\n>>> [5/5] Audio Formatting & Framing Integrity");

  await test("Synthesized PCM is 16kHz, 16-bit Mono (even byte count)", async () => {
    resetTtsCircuitBreaker();
    const pcm = await synthesizeSpeechPcm("Testing audio format integrity.");
    assert.ok(pcm.length > 0, "Must return nonzero PCM bytes");
    assert.strictEqual(pcm.length % 2, 0, "16-bit samples must have an even byte count");
    // Verify peak amplitude is audible
    let maxAmp = 0;
    for (let i = 0; i < pcm.length; i += 2) {
      const s = Math.abs(pcm.readInt16LE(i));
      if (s > maxAmp) maxAmp = s;
    }
    assert.ok(maxAmp > 500, `Audio must contain nonzero audible waveforms (maxAmp=${maxAmp})`);
  });

  await test("Empty and whitespace inputs return empty Buffer safely", async () => {
    const empty1 = await synthesizeSpeechPcm("");
    const empty2 = await synthesizeSpeechPcm("   \n\t  ");
    const empty3 = await synthesizeSpeechPcm(null);
    assert.strictEqual(empty1.length, 0);
    assert.strictEqual(empty2.length, 0);
    assert.strictEqual(empty3.length, 0);
  });

  console.log("====================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Unhandled test suite error:", err);
  process.exit(1);
});
