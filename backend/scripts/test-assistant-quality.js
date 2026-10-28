/**
 * Automated Regression Test Suite: KOTL Answer Quality & Conversational Integrity
 *
 * Verifies:
 * 1. Direct factual questions (e.g. "Who is the Prime Minister of India?") produce direct factual answers
 *    with age-appropriate explanations rather than generic cheerleading.
 * 2. Arithmetic questions (e.g. "What is 2 + 2?") accurately return 4.
 * 3. Emotion-sharing turns (e.g. "I feel sad") receive gentle empathy, validation, and comfort instead of celebratory praise.
 * 4. Genuine open-ended prompts receive warm, age-appropriate conversational follow-up.
 * 5. Offline / Rate-limited pediatric fallback engine produces context-appropriate responses and NEVER
 *    deflects factual or emotional turns with nonsensical cheerleading ("You always have the most exciting ideas").
 * 6. Codebase integrity: Confirms the Prime Minister or factual answers are NOT hardcoded as canned production strings.
 */

try {
  require("../utils/env");
} catch (_) {
  try {
    require("dotenv").config();
  } catch (__) {}
}

const fs = require("fs");
const path = require("path");
const assert = require("assert");

const {
  generateAssistantReply,
  generateContextualFallbackReply
} = require("../services/assistant");

let passed = 0;
let failed = 0;

function runSyncTest(name, fn) {
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

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         -> ${err.message}`);
    failed++;
  }
}

async function main() {
  console.log("====================================================");
  console.log("   KOTL ASSISTANT ANSWER-QUALITY & INTEGRITY TEST   ");
  console.log("====================================================\n");

  // -----------------------------------------------------------------
  // 1. Codebase & Guardrail Integrity: No hardcoded factual answers
  // -----------------------------------------------------------------
  console.log(">>> [1/4] Codebase & Guardrail Integrity");
  runSyncTest("No hardcoded Prime Minister in assistant.js fallback engine", () => {
    const source = fs.readFileSync(path.join(__dirname, "..", "services", "assistant.js"), "utf8");
    assert.ok(!source.includes("Narendra Modi"), "assistant.js must not hardcode 'Narendra Modi'");
    assert.ok(!source.includes("Modi"), "assistant.js must not hardcode 'Modi'");
  });

  runSyncTest("Legacy deflection string removed from assistant.js fallback", () => {
    const source = fs.readFileSync(path.join(__dirname, "..", "services", "assistant.js"), "utf8");
    assert.ok(
      !source.includes("You always have the most exciting ideas!"),
      "Found obsolete deflection string 'You always have the most exciting ideas!' in assistant.js"
    );
  });

  runSyncTest("Model candidate list in groq.js prioritizes primaryModel first", () => {
    const source = fs.readFileSync(path.join(__dirname, "..", "services", "groq.js"), "utf8");
    assert.ok(!source.includes("isKnownInvalidGroq"), "groq.js should not filter out active project models");
    assert.ok(source.includes("primaryModel,"), "groq.js must prioritize primaryModel at index 0");
  });

  runSyncTest("Model candidate list in gemini.js prioritizes primaryModel first", () => {
    const source = fs.readFileSync(path.join(__dirname, "..", "services", "gemini.js"), "utf8");
    assert.ok(!source.includes("isKnownInvalidGemini"), "gemini.js should not filter out active project models");
    assert.ok(source.includes("primaryModel,"), "gemini.js must prioritize primaryModel at index 0");
  });

  // -----------------------------------------------------------------
  // 2. Offline Pediatric Safety Fallback Behavior
  // -----------------------------------------------------------------
  console.log("\n>>> [2/4] Offline Pediatric Safety Fallback Behavior");
  runSyncTest("Fallback handles 'Who is Prime Minister of India?' without nonsensical praise", () => {
    const reply = generateContextualFallbackReply("Who is Prime Minister of India?");
    assert.ok(typeof reply === "string" && reply.length > 10, "Reply must be non-empty string");
    assert.ok(
      !reply.includes("exciting ideas"),
      "Fallback must not claim a factual question is an 'exciting idea'"
    );
    assert.ok(
      reply.toLowerCase().includes("question") || reply.toLowerCase().includes("thinking"),
      "Fallback should acknowledge the question thoughtfully"
    );
  });

  runSyncTest("Fallback handles arithmetic 'What is 2 + 2?' with correct answer 4", () => {
    const reply = generateContextualFallbackReply("What is 2 + 2?");
    assert.ok(
      reply.includes("4") || reply.toLowerCase().includes("four"),
      `Expected fallback to provide answer 4, got: "${reply}"`
    );
    assert.ok(!reply.includes("exciting ideas"), "Fallback must not claim 2+2 is an 'exciting idea'");
  });

  runSyncTest("Fallback handles emotional distress 'I feel sad' with gentle empathy", () => {
    const reply = generateContextualFallbackReply("I feel sad");
    assert.ok(
      reply.toLowerCase().includes("here with you") || reply.toLowerCase().includes("sad") || reply.toLowerCase().includes("hug"),
      `Expected empathetic reassurance, got: "${reply}"`
    );
    assert.ok(!reply.includes("wonderful"), "Fallback must never tell a sad child 'That is so wonderful'");
    assert.ok(!reply.includes("exciting ideas"), "Fallback must never tell a sad child 'exciting ideas'");
  });

  runSyncTest("Fallback handles open-ended creative thoughts warmly", () => {
    const reply = generateContextualFallbackReply("I built a big lego castle");
    assert.ok(typeof reply === "string" && reply.length > 10);
    assert.ok(reply.toLowerCase().includes("parth") || reply.toLowerCase().includes("champ"));
  });

  // -----------------------------------------------------------------
  // 3. Live LLM Answering Quality: Direct Factual & Arithmetic Queries
  // -----------------------------------------------------------------
  console.log("\n>>> [3/4] Live LLM Response Quality (Factual, Arithmetic & Emotional)");

  await runAsyncTest("Direct factual query: 'Who is the Prime Minister of India?'", async () => {
    const sessionId = "test-eval-pm-" + Date.now();
    const result = await generateAssistantReply({
      transcript: "Who is the Prime Minister of India?",
      sessionId
    });

    assert.ok(result.success, `Expected success but got error: ${result.error}`);
    const reply = (result.reply || "").trim();
    console.log(`      Assistant Output: "${reply}"`);

    // Must answer factually: mentions Narendra Modi or Modi
    const mentionsModi = reply.toLowerCase().includes("modi") || reply.toLowerCase().includes("narendra");
    assert.ok(
      mentionsModi,
      `Expected factual response mentioning Prime Minister Narendra Modi, got: "${reply}"`
    );

    // Must NOT be generic deflection
    assert.ok(
      !reply.includes("exciting ideas"),
      `Response deflected with generic praise: "${reply}"`
    );
  });

  await runAsyncTest("Arithmetic query: 'What is 2 + 2?'", async () => {
    const sessionId = "test-eval-math-" + Date.now();
    const result = await generateAssistantReply({
      transcript: "What is 2 + 2?",
      sessionId
    });

    assert.ok(result.success, `Expected success but got error: ${result.error}`);
    const reply = (result.reply || "").trim();
    console.log(`      Assistant Output: "${reply}"`);

    // Must accurately contain 4 or four
    const hasFour = /\b(4|four)\b/i.test(reply);
    assert.ok(
      hasFour,
      `Expected arithmetic answer 4, got: "${reply}"`
    );
  });

  await runAsyncTest("Emotional expression: 'I feel sad'", async () => {
    const sessionId = "test-eval-emotion-" + Date.now();
    const result = await generateAssistantReply({
      transcript: "I feel sad",
      sessionId
    });

    assert.ok(result.success, `Expected success but got error: ${result.error}`);
    const reply = (result.reply || "").trim();
    console.log(`      Assistant Output: "${reply}"`);

    // Must be empathetic, validating, or supportive
    const lower = reply.toLowerCase();
    const isEmpathetic =
      lower.includes("here") ||
      lower.includes("sad") ||
      lower.includes("okay") ||
      lower.includes("hug") ||
      lower.includes("talk") ||
      lower.includes("listening") ||
      lower.includes("story") ||
      lower.includes("cheer");

    assert.ok(
      isEmpathetic,
      `Expected empathetic supportive response to sadness, got: "${reply}"`
    );

    // Must NEVER celebrate sadness
    assert.ok(
      !lower.includes("that is wonderful") && !lower.includes("exciting ideas"),
      `Response inappropriately celebrated sadness: "${reply}"`
    );
  });

  await runAsyncTest("Open-ended prompt: 'Tell me about your favorite animal'", async () => {
    const sessionId = "test-eval-open-" + Date.now();
    const result = await generateAssistantReply({
      transcript: "Tell me about your favorite animal",
      sessionId
    });

    assert.ok(result.success, `Expected success but got error: ${result.error}`);
    const reply = (result.reply || "").trim();
    console.log(`      Assistant Output: "${reply}"`);

    assert.ok(reply.length >= 15, "Reply should be a thoughtful companion response");
    assert.ok(
      !reply.includes("exciting ideas!"),
      "Reply should speak naturally rather than outputting generic praise"
    );
  });

  // -----------------------------------------------------------------
  // 4. Session Context Continuity
  // -----------------------------------------------------------------
  console.log("\n>>> [4/4] Multi-Turn Session Context Continuity");
  await runAsyncTest("Follow-up turn retains topic awareness without losing identity", async () => {
    const sessionId = "test-eval-session-" + Date.now();
    const r1 = await generateAssistantReply({
      transcript: "My pet dog's name is Bruno",
      sessionId
    });
    assert.ok(r1.success);

    const r2 = await generateAssistantReply({
      transcript: "What is my dog's name?",
      sessionId
    });
    assert.ok(r2.success);
    const reply = (r2.reply || "").trim();
    console.log(`      Follow-up Assistant Output: "${reply}"`);
    assert.ok(
      reply.toLowerCase().includes("bruno"),
      `Expected context memory of dog's name 'Bruno', got: "${reply}"`
    );
  });

  console.log("\n====================================================");
  console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  if (failed === 0) {
    console.log("STATUS: [GREEN / PASSED] - All answer-quality regression checks verified!");
    console.log("====================================================");
    process.exit(0);
  } else {
    console.log("STATUS: [RED / FAILED] - Some answer-quality tests failed.");
    console.log("====================================================");
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
