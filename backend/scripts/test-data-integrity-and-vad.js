/**
 * Automated Regression Tests: KOTL Data Integrity & Backend Audio / VAD Validation
 *
 * Verifies:
 * 1. Whisper prompt de-biasing (no hardcoded "Hello KOTL." prompt hint in Groq/OpenAI STT)
 * 2. Invalid/empty audio and noise transcript rejection (bracketed noise, repetitions, silence)
 * 3. No assistant/TTS response on rejected audio turns (clean state: IDLE)
 * 4. Production seed-data isolation (SEED_HISTORICAL_DAYS hidden unless ?demo=1)
 * 5. Truthful zero/empty-state metrics (0 min, 0 questions, [] vocabulary, null score when unobserved)
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");

const { isBlacklistedNoiseTranscript } = require("../services/stt");
const { shouldRejectAudioTurn } = require("../services/websocket");
const { getDayWiseHistory, getGrowthMetrics, generateChildDevelopmentReport } = require("../services/child-memory");

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         -> ${err.message}`);
    failed++;
  }
}

console.log("====================================================");
console.log("   KOTL DATA INTEGRITY & AUDIO VAD REGRESSION TEST   ");
console.log("====================================================\n");

// -----------------------------------------------------------------
// 1. Whisper Prompt De-biasing
// -----------------------------------------------------------------
console.log(">>> [1/5] Whisper Prompt De-biasing & STT Configuration");
runTest("STT source code has no hardcoded 'Hello KOTL.' prompt hints", () => {
  const sttSource = fs.readFileSync(path.join(__dirname, "..", "services", "stt.js"), "utf8");
  assert.ok(!sttSource.includes('"Hello KOTL."'), "Found hardcoded 'Hello KOTL.' in stt.js");
  assert.ok(!sttSource.includes("'Hello KOTL.'"), "Found single-quoted 'Hello KOTL.' in stt.js");
});

runTest("Default prompt argument in STT completions form data defaults to empty string", () => {
  const sttSource = fs.readFileSync(path.join(__dirname, "..", "services", "stt.js"), "utf8");
  assert.ok(sttSource.includes('prepareCompletionsFormData('), "prepareCompletionsFormData helper missing");
  // Check that transcribeWithGroq calls prepareCompletionsFormData with "" prompt
  assert.ok(
    sttSource.includes('model,\n      "en",\n      ""') ||
    sttSource.includes('model,\r\n      "en",\r\n      ""'),
    "transcribeWithGroq must pass empty default prompt"
  );
});

// -----------------------------------------------------------------
// 2. Invalid / Empty Audio & Noise Transcript Rejection
// -----------------------------------------------------------------
console.log("\n>>> [2/5] Invalid / Empty Audio & Noise Transcript Rejection");
runTest("isBlacklistedNoiseTranscript rejects empty, whitespace, and bracketed ambient tokens", () => {
  assert.strictEqual(isBlacklistedNoiseTranscript(""), true, "Empty string should be blacklisted");
  assert.strictEqual(isBlacklistedNoiseTranscript("   "), true, "Whitespace should be blacklisted");
  assert.strictEqual(isBlacklistedNoiseTranscript("[music]"), true, "[music] should be blacklisted");
  assert.strictEqual(isBlacklistedNoiseTranscript("(music)"), true, "(music) should be blacklisted");
  assert.strictEqual(isBlacklistedNoiseTranscript("*applause*"), true, "*applause* should be blacklisted");
  assert.strictEqual(isBlacklistedNoiseTranscript("♪"), true, "Musical note symbol should be blacklisted");
});

runTest("isBlacklistedNoiseTranscript rejects hallucinated silence artifacts ('the end', 'thank you for watching')", () => {
  assert.strictEqual(isBlacklistedNoiseTranscript("the end"), true, "'the end' should be rejected");
  assert.strictEqual(isBlacklistedNoiseTranscript("thank you for watching"), true, "'thank you for watching' should be rejected");
  assert.strictEqual(isBlacklistedNoiseTranscript("end of recording"), true, "'end of recording' should be rejected");
  assert.strictEqual(isBlacklistedNoiseTranscript("subtitles by"), true, "'subtitles by' should be rejected");
});

runTest("isBlacklistedNoiseTranscript preserves genuine conversational child speech (including Thank you, Hi, Hello, Why)", () => {
  assert.strictEqual(isBlacklistedNoiseTranscript("Hello KOTL, what are the stars?"), false);
  assert.strictEqual(isBlacklistedNoiseTranscript("Good morning"), false);
  assert.strictEqual(isBlacklistedNoiseTranscript("Can you tell me a story about space?"), false);
  assert.strictEqual(isBlacklistedNoiseTranscript("I love drawing rockets!"), false);
  assert.strictEqual(isBlacklistedNoiseTranscript("Hi"), false, "'Hi' must not be blacklisted");
  assert.strictEqual(isBlacklistedNoiseTranscript("Hello"), false, "'Hello' must not be blacklisted");
  assert.strictEqual(isBlacklistedNoiseTranscript("Why?"), false, "'Why?' must not be blacklisted");
  assert.strictEqual(isBlacklistedNoiseTranscript("Thank you"), false, "'Thank you' must not be blacklisted");
  assert.strictEqual(isBlacklistedNoiseTranscript("thank you"), false, "'thank you' must not be blacklisted");
});

// -----------------------------------------------------------------
// 3. No Response on Rejected Turns (WebSocket Logic Verification)
// -----------------------------------------------------------------
console.log("\n>>> [3/5] No Assistant / TTS Response on Rejected Turns");
runTest("WebSocket handler aborts turn early on empty or noise transcript without LLM or TTS", () => {
  const wsSource = fs.readFileSync(path.join(__dirname, "..", "services", "websocket.js"), "utf8");
  assert.ok(
    wsSource.includes('if (!transcript || isBlacklistedNoiseTranscript(transcript))'),
    "WebSocket turn handler must check isBlacklistedNoiseTranscript"
  );
  assert.ok(
    wsSource.includes('sendJson({ type: "state", value: "IDLE" });') &&
    wsSource.includes('return;'),
    "WebSocket handler must transition cleanly to IDLE on rejected transcript"
  );
});

runTest("shouldRejectAudioTurn rejects ordinary two-word background music lyrics on cold start", () => {
  const lyrics = ["baby girl", "dancing tonight", "love me", "hold on", "never know", "all night"];
  for (const l of lyrics) {
    const rejected = shouldRejectAudioTurn({ transcript: l, isTouchOrButton: false, isSessionActive: false });
    assert.strictEqual(rejected, true, `Two-word lyric '${l}' must be rejected on cold start`);
  }
});

runTest("shouldRejectAudioTurn evaluates song lyrics containing questions (text limitation documented)", () => {
  // A sung lyric that is syntactically a question passes text filtering because pure text has no acoustic pitch signals.
  // Hardware acoustic VAD (spike threshold & debounce) and Whisper [music] tags provide physical protection.
  const questionLyrics = ["Where are you now?", "Do you love me?"];
  for (const q of questionLyrics) {
    const rejected = shouldRejectAudioTurn({ transcript: q, isTouchOrButton: false, isSessionActive: false });
    assert.strictEqual(rejected, false, `Question lyric '${q}' passes text-layer question filter as expected`);
  }
  // But if Whisper outputs musical notation, it is rejected immediately
  const musicQuestion = shouldRejectAudioTurn({ transcript: "♪ Where are you now? ♪", isTouchOrButton: false, isSessionActive: false });
  assert.strictEqual(musicQuestion, true, "Musical notation question must be rejected");
});

runTest("shouldRejectAudioTurn rejects the words 'hotel' or 'bottle' in unrelated speech", () => {
  const unrelatedPhrases = [
    "We booked a hotel in Mumbai",
    "The hotel was very nice",
    "Pass the water bottle please",
    "Look at that turtle in the pond",
    "The bottle is on the table"
  ];
  for (const p of unrelatedPhrases) {
    const rejected = shouldRejectAudioTurn({ transcript: p, isTouchOrButton: false, isSessionActive: false });
    assert.strictEqual(rejected, true, `Unrelated speech with homophone '${p}' must be rejected`);
  }
});

runTest("shouldRejectAudioTurn accepts 'Hey KOTL' and common Whisper misspellings", () => {
  const wakeVariations = [
    "Hey KOTL",
    "Hello KOTL",
    "hey kotl",
    "hey cotte",
    "hello kotil",
    "hey hotel",
    "hello bottle"
  ];
  for (const w of wakeVariations) {
    const rejected = shouldRejectAudioTurn({ transcript: w, isTouchOrButton: false, isSessionActive: false });
    assert.strictEqual(rejected, false, `Wake-word variation '${w}' must be accepted`);
  }
});

runTest("shouldRejectAudioTurn accepts valid short conversational phrases during an active session", () => {
  const activeAnswers = ["Yes", "No", "Blue", "Why", "Thank you", "Ten", "Star", "Red", "Sure"];
  for (const a of activeAnswers) {
    const rejected = shouldRejectAudioTurn({ transcript: a, isTouchOrButton: false, isSessionActive: true });
    assert.strictEqual(rejected, false, `Active dialogue answer '${a}' must be accepted`);
  }
});

runTest("shouldRejectAudioTurn accepts Gujarati and mixed Gujarati/English speech", () => {
  const gujaratiTurns = [
    "Kem cho KOTL, mane vaarta kaho",
    "KOTL, tame kem cho?",
    "Mara drawing joyu?",
    "મને વાર્તા કહો",
    "તમે કેમ છો?",
    "Mane vaarta kaho"
  ];
  for (const g of gujaratiTurns) {
    const rejected = shouldRejectAudioTurn({ transcript: g, isTouchOrButton: false, isSessionActive: false });
    assert.strictEqual(rejected, false, `Gujarati turn '${g}' must be accepted`);
  }
});

runTest("shouldRejectAudioTurn enforces timeout & drops cold unprompted 1-word noises unless touch activated", () => {
  // Cold single word without wake-word/question is rejected as room noise
  const coldNoise = shouldRejectAudioTurn({ transcript: "couch", isTouchOrButton: false, isSessionActive: false });
  assert.strictEqual(coldNoise, true, "Cold isolated grunt 'couch' should be rejected as ambient noise");

  // Same word initiated with touch/button is accepted
  const touchWord = shouldRejectAudioTurn({ transcript: "couch", isTouchOrButton: true, isSessionActive: false });
  assert.strictEqual(touchWord, false, "Touch-initiated word must be accepted");

  // Music symbols rejected even if session was active
  const musicSymbol = shouldRejectAudioTurn({ transcript: "♪ music ♪", isTouchOrButton: false, isSessionActive: true });
  assert.strictEqual(musicSymbol, true, "Music symbols must always be rejected");
});

// -----------------------------------------------------------------
// 4. Production Seed-Data Isolation
// -----------------------------------------------------------------
console.log("\n>>> [4/5] Production Seed-Data Isolation");
runTest("getDayWiseHistory returns only authentic days in production mode (demo: false)", () => {
  const testSessionId = `test-empty-session-${Date.now()}`;
  const prodDays = getDayWiseHistory(testSessionId, { demo: false });
  assert.ok(Array.isArray(prodDays), "prodDays must be an array");

  // None of the historical seed fixture days should be present
  const hasOct23 = prodDays.some(d => d.date === "2026-10-23" || d.id === "day-2026-10-23");
  const hasOct22 = prodDays.some(d => d.date === "2026-10-22" || d.id === "day-2026-10-22");
  const hasOct20 = prodDays.some(d => d.date === "2026-10-20" || d.id === "day-2026-10-20");
  assert.strictEqual(hasOct23, false, "SEED_HISTORICAL_DAYS (Oct 23) leaked into production!");
  assert.strictEqual(hasOct22, false, "SEED_HISTORICAL_DAYS (Oct 22) leaked into production!");
  assert.strictEqual(hasOct20, false, "SEED_HISTORICAL_DAYS (Oct 20) leaked into production!");
});

runTest("getDayWiseHistory includes labeled sample fixtures when demo mode is explicitly enabled (demo: true)", () => {
  const testSessionId = `test-demo-session-${Date.now()}`;
  const demoDays = getDayWiseHistory(testSessionId, { demo: true });
  assert.ok(demoDays.length >= 2, "Demo mode must return at least 2 historical days");
  const hasDemoFlag = demoDays.some(d => d.is_demo === true);
  assert.strictEqual(hasDemoFlag, true, "Historical days in demo mode must carry is_demo: true");
});

// -----------------------------------------------------------------
// 5. Truthful Zero/Empty-State Metrics & Clamping Removal
// -----------------------------------------------------------------
console.log("\n>>> [5/5] Truthful Zero/Empty-State Metrics");
runTest("getGrowthMetrics reports 0 talk minutes and 0 inquiries when turns are 0 (no clamps)", () => {
  const testSessionId = `test-zero-session-${Date.now()}`;
  const metrics = getGrowthMetrics(testSessionId, { demo: false });
  assert.strictEqual(metrics.success, true);
  assert.strictEqual(metrics.total_turns, 0, "total_turns must be 0 for empty session");
  assert.strictEqual(metrics.talk_time_minutes, 0, "talk_time_minutes must be 0, not clamped to 18!");
  assert.strictEqual(metrics.curiosity_count, 0, "curiosity_count must be 0, not clamped to 26!");
  assert.deepStrictEqual(metrics.new_words_learned, [], "new_words_learned must be empty, no hardcoded astronomy words!");
});

runTest("generateChildDevelopmentReport reports insufficient data and null score when no turns exist", () => {
  // Pass a dummy function or verify report structure for insufficient data
  const report = generateChildDevelopmentReport({ refresh: true });
  assert.ok(report && report.success, "Report must generate successfully");
  assert.ok(report.dimensions && Object.keys(report.dimensions).length === 8, "Must contain all 8 dimensions");
  const activeMin = report.dimensions.physical_motor.calculated_indicator
    ? report.dimensions.physical_motor.calculated_indicator.active_minutes
    : report.dimensions.physical_motor.active_minutes;
  assert.strictEqual(typeof activeMin === "number" && activeMin >= 0, true, "Physical motor active minutes must be >= 0");
  if (report.total_conversations_analyzed === 0) {
    assert.strictEqual(report.overall_development_score, null, "Score must be null when turns are 0");
    assert.strictEqual(report.data_sufficiency, "insufficient", "Sufficiency must be insufficient");
  }
});

console.log("\n====================================================");
console.log(`DATA INTEGRITY & AUDIO VAD RESULTS: ${passed}/${passed + failed} TESTS PASSED`);
if (failed === 0) {
  console.log("STATUS: [GREEN / PASSED] - All regression checks verified!");
} else {
  console.log(`STATUS: [RED / FAILED] - ${failed} test(s) failed!`);
  process.exit(1);
}
console.log("====================================================");
