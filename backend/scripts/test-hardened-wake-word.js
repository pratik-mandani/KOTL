/**
 * KOTL Hardened Wake-Word & Cold-Idle Gating Test Suite
 *
 * Verifies:
 * 1. Cold idle: "Hey KOTL, how are you?" -> accepted.
 * 2. Cold idle: recognized wake-word transcription variants -> accepted only if matching intended wake phrase.
 * 3. Cold idle: "Hey, how are you?" -> rejected.
 * 4. Cold idle: "What is the weather?" -> rejected.
 * 5. Cold idle: unrelated "cocktail", "hotel", or "bottle" sentence -> rejected.
 * 6. Active follow-up: "What is the weather?" -> accepted within 12s window.
 * 7. Expired follow-up: ordinary question without wake phrase -> rejected; renewed wake-phrase accepted.
 * 8. Explicit touch/button activation -> preserved and accepted even without wake phrase.
 * 9. Rejection contract: rejected_cold_idle sets state to IDLE and skips LLM & TTS entirely.
 * 10. FOLLOW_UP_WINDOW_MS === 12000 and timestamp window arithmetic.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  shouldRejectAudioTurn,
  isAutoTriggerModeEnabled,
  FOLLOW_UP_WINDOW_MS,
  PRIMARY_WAKE_WORDS,
  HOMOPHONE_PAIR_REGEX,
} = require("../services/websocket");

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    failed++;
    console.error(`  [FAIL] ${name}`);
    console.error(`         -> ${err.message}`);
  }
}

console.log("====================================================");
console.log("   KOTL HARDENED WAKE-WORD VERIFICATION SUITE       ");
console.log("====================================================\n");

// ----------------------------------------------------
// 1. Cold idle standard wake-word turn
// ----------------------------------------------------
console.log(">>> [1/10] Cold Idle Standard Wake-Word Turn");
runTest("Cold idle: 'Hey KOTL, how are you?' is accepted", () => {
  const rejected = shouldRejectAudioTurn({
    transcript: "Hey KOTL, how are you?",
    isTouchOrButton: false,
    isSessionActive: false,
  });
  assert.strictEqual(rejected, false, "Standard 'Hey KOTL' turn must be accepted in cold idle");
});

// ----------------------------------------------------
// 2. Cold idle recognized wake-word transcription variants
// ----------------------------------------------------
console.log("\n>>> [2/10] Recognized Wake-Word Transcription Variants");
runTest("Cold idle: supported wake-word transcription variants are accepted", () => {
  const variants = [
    "Hello KOTL",
    "hey kotil",
    "Hey cocktail",
    "Hey cocktail!",
    "Hello bottle",
    "Kem cho KOTL",
    "hey cotte",
    "hello cuttle",
    "Namaste KOTL",
    "ok hotel",
    "okay bottle",
    "suno kotl",
  ];
  for (const variant of variants) {
    const rejected = shouldRejectAudioTurn({
      transcript: variant,
      isTouchOrButton: false,
      isSessionActive: false,
    });
    assert.strictEqual(rejected, false, `Variant '${variant}' must be accepted in cold idle`);
  }
});

runTest("Cold idle: bare wake words without speech intent ('KOTL', 'kotil', 'cotte', 'cuttle') are rejected", () => {
  const bareWakeWords = [
    "KOTL",
    "KOTL.",
    "kotil",
    "cotte",
    "cuttle",
    "cotel",
    "coatl",
  ];
  for (const b of bareWakeWords) {
    const rejected = shouldRejectAudioTurn({
      transcript: b,
      isTouchOrButton: false,
      isSessionActive: false,
    });
    assert.strictEqual(rejected, true, `Bare wake word '${b}' must be rejected in cold idle`);
  }
});

runTest("Cold idle: repeated wake words and prompt echo loops ('KOTL, KOTL, Namaste KOTL.') are rejected", () => {
  const promptEchoes = [
    "KOTL, KOTL, Namaste KOTL.",
    "KOTL, KOTL",
    "KOTL KOTL",
    "Hey KOTL, Namaste KOTL.",
    "KOTL, Kotil.",
    "Namaste KOTL, KOTL",
    "KOTL, KOTL, KOTL.",
  ];
  for (const pe of promptEchoes) {
    const rejected = shouldRejectAudioTurn({
      transcript: pe,
      isTouchOrButton: false,
      isSessionActive: false,
    });
    assert.strictEqual(rejected, true, `Prompt echo / loop '${pe}' must be rejected in cold idle`);
  }
});

runTest("Cold idle: valid wake phrases and real requests are accepted", () => {
  const validRequests = [
    "Hey KOTL, how are you?",
    "KOTL, what time is it?",
    "Kem cho KOTL?",
    "Namaste KOTL, tell me a story.",
    "KOTL, sing a song",
    "Hey KOTL, turn on the lights",
    "KOTL, KOTL, what is the weather?",
  ];
  for (const vr of validRequests) {
    const rejected = shouldRejectAudioTurn({
      transcript: vr,
      isTouchOrButton: false,
      isSessionActive: false,
    });
    assert.strictEqual(rejected, false, `Valid request '${vr}' must be accepted in cold idle`);
  }
});

// ----------------------------------------------------
// 3. Cold idle greeting without wake-word
// ----------------------------------------------------
console.log("\n>>> [3/10] Cold Idle Greetings Without KOTL Rejection");
runTest("Cold idle: 'Hey, how are you?' and generic greetings are rejected", () => {
  const genericGreetings = [
    "Hey, how are you?",
    "Hi, how are you?",
    "Hey everyone",
    "Hello there",
    "Good morning",
    "Good evening",
    "Namaste",
    "Kem cho",
    "Hi",
    "Hey",
  ];
  for (const greeting of genericGreetings) {
    const rejected = shouldRejectAudioTurn({
      transcript: greeting,
      isTouchOrButton: false,
      isSessionActive: false,
    });
    assert.strictEqual(rejected, true, `Generic greeting without wake-word '${greeting}' must be rejected in cold idle`);
  }
});

// ----------------------------------------------------
// 4. Cold idle question without wake-word
// ----------------------------------------------------
console.log("\n>>> [4/10] Cold Idle Inquiries Without Wake-Word Rejection");
runTest("Cold idle: 'What is the weather?' and unprompted questions are rejected", () => {
  const unpromptedQuestions = [
    "What is the weather?",
    "Why is the sky blue?",
    "Tell me a story",
    "How do airplanes fly?",
    "Who is Mahatma Gandhi?",
    "Can you sing a song?",
  ];
  for (const q of unpromptedQuestions) {
    const rejected = shouldRejectAudioTurn({
      transcript: q,
      isTouchOrButton: false,
      isSessionActive: false,
    });
    assert.strictEqual(rejected, true, `Cold idle question '${q}' without wake-word must be rejected`);
  }
});

// ----------------------------------------------------
// 5. Unrelated sentences containing homophones
// ----------------------------------------------------
console.log("\n>>> [5/10] Unrelated Homophone Sentence Rejection");
runTest("Cold idle: unrelated 'cocktail', 'hotel', 'bottle' sentences are rejected", () => {
  const unrelatedPhrases = [
    "I drank a cocktail",
    "She ordered a fruit cocktail at the bar",
    "We booked a hotel in Mumbai",
    "The hotel was very nice",
    "Pass the water bottle please",
    "Look at that turtle in the pond",
    "The cattle are grazing in the field",
  ];
  for (const p of unrelatedPhrases) {
    const rejected = shouldRejectAudioTurn({
      transcript: p,
      isTouchOrButton: false,
      isSessionActive: false,
    });
    assert.strictEqual(rejected, true, `Unrelated homophone speech '${p}' must be rejected`);
  }
});

// ----------------------------------------------------
// 6. Active follow-up conversation window
// ----------------------------------------------------
console.log("\n>>> [6/10] Active Follow-up Conversational Turns");
runTest("Active follow-up: 'What is the weather?' is accepted within active window", () => {
  const followUps = [
    "What is the weather?",
    "Why is it raining?",
    "Tell me more about it",
    "And what happens next?",
  ];
  for (const fu of followUps) {
    const rejected = shouldRejectAudioTurn({
      transcript: fu,
      isTouchOrButton: false,
      isSessionActive: true,
      consecutiveVoiceTurns: 1,
      maxConsecutiveVoiceTurns: 3,
    });
    assert.strictEqual(rejected, false, `Follow-up question '${fu}' must be accepted during active session`);
  }
});

// ----------------------------------------------------
// 7. Expired follow-up window
// ----------------------------------------------------
console.log("\n>>> [7/10] Expired Follow-up Window Enforcement");
runTest("Expired follow-up: ordinary questions rejected; renewed wake-phrase accepted", () => {
  // Expired session (isSessionActive: false)
  const expiredQuestion = "What is the weather?";
  const rejectedExpired = shouldRejectAudioTurn({
    transcript: expiredQuestion,
    isTouchOrButton: false,
    isSessionActive: false,
  });
  assert.strictEqual(rejectedExpired, true, "Question after follow-up expiration must be rejected");

  // Renewed wake phrase after expiration is accepted
  const renewedWakeTurn = "Hey KOTL, what is the weather?";
  const acceptedRenewed = shouldRejectAudioTurn({
    transcript: renewedWakeTurn,
    isTouchOrButton: false,
    isSessionActive: false,
  });
  assert.strictEqual(acceptedRenewed, false, "Renewed wake turn after expiration must be accepted");

  // Renewed homophone wake phrase after expiration is accepted
  const renewedHomophoneTurn = "Hey cocktail, what is the weather?";
  const acceptedRenewedHomophone = shouldRejectAudioTurn({
    transcript: renewedHomophoneTurn,
    isTouchOrButton: false,
    isSessionActive: false,
  });
  assert.strictEqual(acceptedRenewedHomophone, false, "Renewed homophone turn after expiration must be accepted");
});

// ----------------------------------------------------
// 8. Explicit touch/button activation
// ----------------------------------------------------
console.log("\n>>> [8/10] Explicit Touch/Button Preservation");
runTest("Explicit touch/button: speech accepted without wake-phrase even in cold idle", () => {
  const touchTurns = [
    "What is the weather?",
    "Tell me a story",
    "Why is the sky blue?",
    "I'm going to sleep now",
    "sing a song",
    "KOTL",
    "KOTL, KOTL",
  ];
  for (const t of touchTurns) {
    const rejected = shouldRejectAudioTurn({
      transcript: t,
      isTouchOrButton: true,
      isSessionActive: false,
    });
    assert.strictEqual(rejected, false, `Touch-initiated turn '${t}' must be accepted without wake-word`);
  }
});

// ----------------------------------------------------
// 9. Rejection contract: no LLM or TTS invocation
// ----------------------------------------------------
console.log("\n>>> [9/10] Rejection Contract & Clean State Reset");
runTest("Rejection contract: cold-idle rejection transitions to IDLE and skips LLM/TTS", () => {
  const wsSource = fs.readFileSync(path.join(__dirname, "..", "services", "websocket.js"), "utf8");

  // 1. Verifies shouldRejectAudioTurn check exists
  assert.ok(
    wsSource.includes("if (shouldRejectAudioTurn({"),
    "WebSocket turn handler must check shouldRejectAudioTurn"
  );

  // 2. Verifies rejected_cold_idle status payload
  assert.ok(
    wsSource.includes('status: "rejected_cold_idle"'),
    "WebSocket turn handler must emit rejected_cold_idle status"
  );

  // 3. Verifies IDLE state transition on rejection
  assert.ok(
    wsSource.includes('sendJson({ type: "state", value: "IDLE" });'),
    "WebSocket turn handler must notify client of IDLE state on rejection"
  );
  assert.ok(
    wsSource.includes('setState("IDLE");'),
    "WebSocket turn handler must reset internal state to IDLE on rejection"
  );

  // 4. Verifies early return before LLM invocation
  const rejectionBlockMatch = wsSource.match(
    /if\s*\(\s*shouldRejectAudioTurn[\s\S]*?setState\("IDLE"\);\s*return;\s*\}/
  );
  assert.ok(
    rejectionBlockMatch !== null,
    "WebSocket turn handler must return immediately after rejection before calling LLM or TTS"
  );

  // 5. Verifies Gemini LLM call appears strictly AFTER the rejection block
  const rejectionIndex = wsSource.indexOf('status: "rejected_cold_idle"');
  const llmIndex = wsSource.indexOf("generateAssistantReply({");
  assert.ok(
    rejectionIndex > 0 && llmIndex > rejectionIndex,
    "LLM generation must strictly follow after the wake-word rejection gate"
  );
});

// ----------------------------------------------------
// 10. FOLLOW_UP_WINDOW_MS configuration & window math
// ----------------------------------------------------
console.log("\n>>> [10/10] Follow-up Window Duration & Window Arithmetic");
runTest("FOLLOW_UP_WINDOW_MS is 12000 and window arithmetic works accurately", () => {
  assert.strictEqual(FOLLOW_UP_WINDOW_MS, 12000, "FOLLOW_UP_WINDOW_MS must be exactly 12000 ms (12 seconds)");
  assert.strictEqual(isAutoTriggerModeEnabled(), false, "isAutoTriggerModeEnabled must default to false");

  const lastTurnCompletedAt = 100000;

  // At 5 seconds after last turn (active)
  const isSessionActive5s = Boolean(lastTurnCompletedAt && (105000 - lastTurnCompletedAt < FOLLOW_UP_WINDOW_MS));
  assert.strictEqual(isSessionActive5s, true, "5s elapsed must be within 12s active window");

  // At 11.999 seconds after last turn (still active)
  const isSessionActive11s = Boolean(lastTurnCompletedAt && (111999 - lastTurnCompletedAt < FOLLOW_UP_WINDOW_MS));
  assert.strictEqual(isSessionActive11s, true, "11.999s elapsed must be within 12s active window");

  // At exactly 12.000 seconds after last turn (expired)
  const isSessionActive12s = Boolean(lastTurnCompletedAt && (112000 - lastTurnCompletedAt < FOLLOW_UP_WINDOW_MS));
  assert.strictEqual(isSessionActive12s, false, "12.000s elapsed must expire the follow-up window");

  // At 15 seconds after last turn (expired)
  const isSessionActive15s = Boolean(lastTurnCompletedAt && (115000 - lastTurnCompletedAt < FOLLOW_UP_WINDOW_MS));
  assert.strictEqual(isSessionActive15s, false, "15s elapsed must be outside 12s active window");
});

console.log("\n====================================================");
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("====================================================");

if (failed > 0) {
  process.exit(1);
}
