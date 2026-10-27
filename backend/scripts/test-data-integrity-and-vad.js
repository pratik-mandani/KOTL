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
const {
  shouldRejectAudioTurn,
  isAutoTriggerModeEnabled,
  isValidConversationalSpeech,
} = require("../services/websocket");
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

runTest("shouldRejectAudioTurn rejects cold-idle false triggers ('When did it.', 'I\'m going to go to the side.', 'Yeah, yeah, yeah.')", () => {
  const coldFalseTriggers = [
    "When did it.",
    "When he did it.",
    "I'm going to go to the side.",
    "Yeah, yeah, yeah.",
    "yeah yeah yeah",
    "baby girl dancing tonight",
    "all night long"
  ];
  for (const t of coldFalseTriggers) {
    const rejected = shouldRejectAudioTurn({ transcript: t, isTouchOrButton: false, isSessionActive: false });
    assert.strictEqual(rejected, true, `Cold idle false-trigger '${t}' must be rejected`);
  }
});

runTest("shouldRejectAudioTurn accepts valid wake-word and inquiry ('Hey KOTL, what is the sun?')", () => {
  const validWakeWordTurns = [
    "Hey KOTL, what is the sun?",
    "Hello KOTL, tell me a story",
    "KOTL, why is the sky blue?",
    "Hey KOTL",
    "Hello KOTL",
    "hey kotil",
    "hello bottle"
  ];
  for (const w of validWakeWordTurns) {
    const rejected = shouldRejectAudioTurn({ transcript: w, isTouchOrButton: false, isSessionActive: false });
    assert.strictEqual(rejected, false, `Valid wake-word turn '${w}' must be accepted`);
  }
});

runTest("shouldRejectAudioTurn accepts explicit touch/button activation even without wake-word", () => {
  const touchTurns = [
    "What is the sun?",
    "Why is it hot?",
    "Tell me a story",
    "couch",
    "I'm going to go to the side."
  ];
  for (const t of touchTurns) {
    const rejected = shouldRejectAudioTurn({ transcript: t, isTouchOrButton: true, isSessionActive: false });
    assert.strictEqual(rejected, false, `Touch/button-initiated turn '${t}' must be accepted`);
  }
});

runTest("shouldRejectAudioTurn accepts valid follow-ups inside active window & enforces max 3 turns limit", () => {
  // Inside 10s active window (turns 1 and 2):
  assert.strictEqual(
    shouldRejectAudioTurn({ transcript: "Why is it hot?", isTouchOrButton: false, isSessionActive: true, consecutiveVoiceTurns: 1 }),
    false,
    "Follow-up turn 1 within active window must be accepted"
  );
  assert.strictEqual(
    shouldRejectAudioTurn({ transcript: "And how big is it?", isTouchOrButton: false, isSessionActive: true, consecutiveVoiceTurns: 2 }),
    false,
    "Follow-up turn 2 within active window must be accepted"
  );

  // Follow-up limit reached (consecutiveVoiceTurns >= 3):
  assert.strictEqual(
    shouldRejectAudioTurn({ transcript: "And why does it shine?", isTouchOrButton: false, isSessionActive: true, consecutiveVoiceTurns: 3, maxConsecutiveVoiceTurns: 3 }),
    true,
    "Follow-up turn 4 exceeding limit without renewed wake-word must be rejected to prevent infinite background loops"
  );

  // If child renews wake-word on turn 4, it is accepted:
  assert.strictEqual(
    shouldRejectAudioTurn({ transcript: "Hey KOTL, why does it shine?", isTouchOrButton: false, isSessionActive: true, consecutiveVoiceTurns: 3 }),
    false,
    "Renewed wake-word turn must be accepted even after follow-up limit"
  );
});

runTest("shouldRejectAudioTurn rejects background music lyrics and repetitive filler tokens", () => {
  const musicFillers = [
    "♪ Where are you now? ♪",
    "♫ dancing in the dark ♫",
    "[music] la la la",
    "yeah yeah yeah",
    "uh huh uh huh",
    "la la la",
    "side side side"
  ];
  for (const m of musicFillers) {
    const rejected = shouldRejectAudioTurn({ transcript: m, isTouchOrButton: false, isSessionActive: true });
    assert.strictEqual(rejected, true, `Music/filler token '${m}' must be rejected even during active session`);
  }
});

runTest("shouldRejectAudioTurn accepts Gujarati speech with greetings or wake-word", () => {
  const gujaratiTurns = [
    "Kem cho KOTL, mane vaarta kaho",
    "KOTL, tame kem cho?",
    "kem cho",
    "hello KOTL"
  ];
  for (const g of gujaratiTurns) {
    const rejected = shouldRejectAudioTurn({ transcript: g, isTouchOrButton: false, isSessionActive: false });
    assert.strictEqual(rejected, false, `Gujarati turn with wake-word/greeting '${g}' must be accepted`);
  }
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

runTest("shouldRejectAudioTurn accepts valid natural conversational speech in cold idle when auto-trigger mode is enabled", () => {
  const naturalSpeechTurns = [
    "What is the sun?",
    "Why is the sky blue?",
    "Tell me a story",
    "Can you tell me a story about space?",
    "How do birds fly?",
    "Who made the stars?",
    "Where do fish sleep?",
    "Do stars sleep at night?",
    "What are planets?",
    "Help me with my homework",
    "Sing a song for me",
    "Mane vaarta kaho",
    "Mujhe ek kahani sunao",
    "Kya tum sun sakte ho?"
  ];
  for (const s of naturalSpeechTurns) {
    const rejected = shouldRejectAudioTurn({
      transcript: s,
      isTouchOrButton: false,
      isSessionActive: false,
      autoTrigger: true,
    });
    assert.strictEqual(rejected, false, `Natural speech inquiry '${s}' must be accepted in auto-trigger mode`);
  }
});

runTest("shouldRejectAudioTurn preserves existing wake-word-required behavior when auto-trigger mode is disabled", () => {
  const naturalSpeechTurns = [
    "What is the sun?",
    "Why is the sky blue?",
    "Tell me a story",
    "Can you tell me a story about space?",
    "How do birds fly?",
    "Who made the stars?"
  ];
  for (const s of naturalSpeechTurns) {
    const rejected = shouldRejectAudioTurn({
      transcript: s,
      isTouchOrButton: false,
      isSessionActive: false,
      autoTrigger: false,
    });
    assert.strictEqual(rejected, true, `Speech without wake-word '${s}' must be rejected when auto-trigger mode is disabled`);
  }

  // Wake-word phrases must still be accepted when auto-trigger mode is disabled
  const wakeWordTurns = [
    "Hey KOTL, what is the sun?",
    "Hello KOTL, tell me a story",
    "KOTL, why is the sky blue?",
    "Hello KOTL",
    "Kem cho KOTL"
  ];
  for (const w of wakeWordTurns) {
    const rejected = shouldRejectAudioTurn({
      transcript: w,
      isTouchOrButton: false,
      isSessionActive: false,
      autoTrigger: false,
    });
    assert.strictEqual(rejected, false, `Wake-word turn '${w}' must remain accepted even when auto-trigger is disabled`);
  }
});

runTest("shouldRejectAudioTurn rejects empty, noise, and filler transcripts under both auto-trigger and strict modes", () => {
  const invalidTranscripts = [
    "",
    "   ",
    null,
    undefined,
    "[music] la la la",
    "♪ pop music playing ♪",
    "yeah yeah yeah",
    "uh huh uh huh",
    "la la la"
  ];
  for (const inv of invalidTranscripts) {
    assert.strictEqual(
      shouldRejectAudioTurn({ transcript: inv, isTouchOrButton: false, isSessionActive: false, autoTrigger: true }),
      true,
      `Invalid transcript '${inv}' must be rejected in auto-trigger mode`
    );
    assert.strictEqual(
      shouldRejectAudioTurn({ transcript: inv, isTouchOrButton: false, isSessionActive: false, autoTrigger: false }),
      true,
      `Invalid transcript '${inv}' must be rejected in strict wake-word mode`
    );
  }
});

runTest("isAutoTriggerModeEnabled respects AUTO_TRIGGER_MODE environment setting and defaults to true", () => {
  const originalEnv = process.env.AUTO_TRIGGER_MODE;
  try {
    delete process.env.AUTO_TRIGGER_MODE;
    assert.strictEqual(isAutoTriggerModeEnabled(), true, "Default configuration must enable auto-trigger on startup");

    process.env.AUTO_TRIGGER_MODE = "";
    assert.strictEqual(isAutoTriggerModeEnabled(), true, "Empty string must default to enabled");

    process.env.AUTO_TRIGGER_MODE = "   ";
    assert.strictEqual(isAutoTriggerModeEnabled(), true, "Whitespace-only string must default to enabled");

    process.env.AUTO_TRIGGER_MODE = "true";
    assert.strictEqual(isAutoTriggerModeEnabled(), true, "AUTO_TRIGGER_MODE=true must enable auto-trigger");

    process.env.AUTO_TRIGGER_MODE = "TRUE";
    assert.strictEqual(isAutoTriggerModeEnabled(), true, "AUTO_TRIGGER_MODE=TRUE must enable auto-trigger");

    process.env.AUTO_TRIGGER_MODE = "1";
    assert.strictEqual(isAutoTriggerModeEnabled(), true, "AUTO_TRIGGER_MODE=1 must enable auto-trigger");

    process.env.AUTO_TRIGGER_MODE = "false";
    assert.strictEqual(isAutoTriggerModeEnabled(), false, "AUTO_TRIGGER_MODE=false must disable auto-trigger");

    process.env.AUTO_TRIGGER_MODE = "FALSE";
    assert.strictEqual(isAutoTriggerModeEnabled(), false, "AUTO_TRIGGER_MODE=FALSE (uppercase) must disable auto-trigger");

    process.env.AUTO_TRIGGER_MODE = "False";
    assert.strictEqual(isAutoTriggerModeEnabled(), false, "AUTO_TRIGGER_MODE=False (mixed case) must disable auto-trigger");

    process.env.AUTO_TRIGGER_MODE = "0";
    assert.strictEqual(isAutoTriggerModeEnabled(), false, "AUTO_TRIGGER_MODE=0 must disable auto-trigger");

    process.env.AUTO_TRIGGER_MODE = "off";
    assert.strictEqual(isAutoTriggerModeEnabled(), false, "AUTO_TRIGGER_MODE=off must disable auto-trigger");

    process.env.AUTO_TRIGGER_MODE = "OFF";
    assert.strictEqual(isAutoTriggerModeEnabled(), false, "AUTO_TRIGGER_MODE=OFF (uppercase) must disable auto-trigger");

    process.env.AUTO_TRIGGER_MODE = "Off";
    assert.strictEqual(isAutoTriggerModeEnabled(), false, "AUTO_TRIGGER_MODE=Off (mixed case) must disable auto-trigger");
  } finally {
    if (originalEnv !== undefined) {
      process.env.AUTO_TRIGGER_MODE = originalEnv;
    } else {
      delete process.env.AUTO_TRIGGER_MODE;
    }
  }
});

runTest("shouldRejectAudioTurn rejects ordinary statements containing embedded question words even in auto-trigger mode", () => {
  const embeddedQuestionStatements = [
    "This is how it works.",
    "He asked me who was there.",
    "I do not know where it went.",
    "We decided which one to take."
  ];
  for (const s of embeddedQuestionStatements) {
    const rejected = shouldRejectAudioTurn({
      transcript: s,
      isTouchOrButton: false,
      isSessionActive: false,
      autoTrigger: true,
    });
    assert.strictEqual(rejected, true, `Statement with embedded question word '${s}' must be rejected in auto-trigger mode`);
  }
});

runTest("isValidConversationalSpeech accurately identifies conversational inquiries and rejects ambient fragments", () => {
  const positive = [
    "What is the sun?",
    "Why is the sky blue?",
    "Tell me a story",
    "Can you tell me a story about space?",
    "How do birds fly?",
    "Who made the stars?",
    "Where do fish sleep?",
    "Mane vaarta kaho",
    "Mujhe ek kahani sunao"
  ];
  for (const p of positive) {
    const clean = p.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    const words = clean.split(/\s+/).filter(Boolean);
    assert.strictEqual(isValidConversationalSpeech(p, clean, words), true, `Inquiry '${p}' must be recognized as valid conversational speech`);
  }

  const negative = [
    "This is how it works.",
    "He asked me who was there.",
    "I do not know where it went.",
    "We decided which one to take.",
    "When did it.",
    "When he did it.",
    "I'm going to go to the side.",
    "baby girl dancing tonight",
    "all night long",
    "We booked a hotel in Mumbai",
    "The bottle is on the table",
    "couch"
  ];
  for (const n of negative) {
    const clean = n.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    const words = clean.split(/\s+/).filter(Boolean);
    assert.strictEqual(isValidConversationalSpeech(n, clean, words), false, `Noise/fragment '${n}' must not be recognized as valid conversational speech`);
  }
});

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
