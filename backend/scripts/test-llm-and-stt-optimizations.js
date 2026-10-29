/**
 * Focused Unit Tests:
 * 1. Gemini LLM Candidate Ordering & Fallback Preservation
 * 2. STT Whisper Vocabulary Guidance & Environment Overrides
 * 3. Timeout Handling & Protection Bounds
 */

const assert = require("assert");
const { getGeminiCandidateModels } = require("../services/gemini");
const { DEFAULT_STT_PROMPT, prepareCompletionsFormData } = require("../services/stt");

async function runTestSuite() {
  console.log("====================================================");
  console.log(" KOTL LLM CANDIDATE ORDER & STT PROMPT UNIT TESTS   ");
  console.log("====================================================");

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // Preserve original environment
  const originalGeminiModel = process.env.GEMINI_CHAT_MODEL;
  const originalSttPrompt = process.env.STT_PROMPT;
  const originalWhisperPrompt = process.env.WHISPER_PROMPT;
  const originalSttLanguage = process.env.STT_LANGUAGE;

  try {
    // ----------------------------------------------------
    // GROUP 1: Gemini Candidate Ordering
    // ----------------------------------------------------
    console.log("\n>>> [1/3] Gemini Candidate Ordering & Fallback Preservation");

    test("Default candidate order places gemini-3.5-flash-lite first", () => {
      delete process.env.GEMINI_CHAT_MODEL;
      const candidates = getGeminiCandidateModels();
      assert.strictEqual(candidates[0], "gemini-3.5-flash-lite", "Candidate 0 must be gemini-3.5-flash-lite");
      assert.strictEqual(candidates[1], "gemini-flash-latest", "Candidate 1 must be gemini-flash-latest fallback");
    });

    test("Fallback list preserves subsequent models without duplicates", () => {
      delete process.env.GEMINI_CHAT_MODEL;
      const candidates = getGeminiCandidateModels();
      assert.ok(candidates.length >= 4, "Must contain multiple fallback models");
      assert.ok(candidates.includes("gemini-flash-latest"), "Must preserve gemini-flash-latest");
      assert.ok(candidates.includes("gemini-2.5-flash-lite"), "Must preserve gemini-2.5-flash-lite");
      assert.ok(candidates.includes("gemini-2.0-flash"), "Must preserve gemini-2.0-flash");

      // Verify no duplicates
      const unique = [...new Set(candidates)];
      assert.strictEqual(candidates.length, unique.length, "Candidate list must not have duplicates");
    });

    test("Configured GEMINI_CHAT_MODEL override is prioritized first", () => {
      process.env.GEMINI_CHAT_MODEL = "gemini-2.5-flash";
      const candidates = getGeminiCandidateModels();
      assert.strictEqual(candidates[0], "gemini-2.5-flash", "Candidate 0 must match configured model");
      assert.strictEqual(candidates[1], "gemini-3.5-flash-lite", "Candidate 1 must be gemini-3.5-flash-lite");
      assert.ok(candidates.includes("gemini-flash-latest"), "Must still preserve fallbacks");
    });

    test("Explicitly setting GEMINI_CHAT_MODEL=gemini-flash-latest deduplicates cleanly", () => {
      process.env.GEMINI_CHAT_MODEL = "gemini-flash-latest";
      const candidates = getGeminiCandidateModels();
      assert.strictEqual(candidates[0], "gemini-flash-latest");
      const occurrences = candidates.filter(m => m === "gemini-flash-latest").length;
      assert.strictEqual(occurrences, 1, "gemini-flash-latest must appear only once");
    });

    // ----------------------------------------------------
    // GROUP 2: STT Vocabulary Guidance & Prompt Propagation
    // ----------------------------------------------------
    console.log("\n>>> [2/3] STT Whisper Vocabulary Guidance & Propagation");

    test("DEFAULT_STT_PROMPT contains KOTL wake-name variants", () => {
      assert.strictEqual(DEFAULT_STT_PROMPT, "KOTL, Kotil, Hey KOTL, Namaste KOTL.");
    });

    test("prepareCompletionsFormData uses DEFAULT_STT_PROMPT when env is unset", () => {
      delete process.env.STT_PROMPT;
      delete process.env.WHISPER_PROMPT;
      const dummyBuffer = Buffer.from("RIFF....WAVEfmt ");
      const { form, prompt } = prepareCompletionsFormData(dummyBuffer, "test.wav", "whisper-large-v3-turbo", "en", null);

      assert.strictEqual(prompt, "KOTL, Kotil, Hey KOTL, Namaste KOTL.");
      // In Node.js FormData, get retrieves the value appended
      assert.strictEqual(form.get("prompt"), "KOTL, Kotil, Hey KOTL, Namaste KOTL.");
      assert.strictEqual(form.get("model"), "whisper-large-v3-turbo");
      assert.strictEqual(form.get("language"), "en");
    });

    test("STT_PROMPT environment variable overrides default vocabulary guidance", () => {
      process.env.STT_PROMPT = "Custom Vocabulary, Specific Name, Project X";
      delete process.env.WHISPER_PROMPT;
      const dummyBuffer = Buffer.from("RIFF....WAVEfmt ");
      const { form, prompt } = prepareCompletionsFormData(dummyBuffer, "test.wav", "whisper-large-v3-turbo", "en", null);

      assert.strictEqual(prompt, "Custom Vocabulary, Specific Name, Project X");
      assert.strictEqual(form.get("prompt"), "Custom Vocabulary, Specific Name, Project X");
    });

    test("WHISPER_PROMPT acts as fallback if STT_PROMPT is not set", () => {
      delete process.env.STT_PROMPT;
      process.env.WHISPER_PROMPT = "Legacy Whisper Hint";
      const dummyBuffer = Buffer.from("RIFF....WAVEfmt ");
      const { form, prompt } = prepareCompletionsFormData(dummyBuffer, "test.wav", "whisper-large-v3-turbo", "en", null);

      assert.strictEqual(prompt, "Legacy Whisper Hint");
      assert.strictEqual(form.get("prompt"), "Legacy Whisper Hint");
    });

    test("Setting STT_PROMPT='' explicitly disables prompt without appending empty string", () => {
      process.env.STT_PROMPT = "";
      delete process.env.WHISPER_PROMPT;
      const dummyBuffer = Buffer.from("RIFF....WAVEfmt ");
      const { form, prompt } = prepareCompletionsFormData(dummyBuffer, "test.wav", "whisper-large-v3-turbo", "en", null);

      assert.strictEqual(prompt, "");
      assert.strictEqual(form.get("prompt"), null, "Empty prompt should not be appended to FormData");
    });

    test("Language override via STT_LANGUAGE is respected", () => {
      delete process.env.STT_PROMPT;
      process.env.STT_LANGUAGE = "hi";
      const dummyBuffer = Buffer.from("RIFF....WAVEfmt ");
      const { form, language } = prepareCompletionsFormData(dummyBuffer, "test.wav", "whisper-large-v3-turbo", "en", null);

      assert.strictEqual(language, "hi");
      assert.strictEqual(form.get("language"), "hi");
    });

    // ----------------------------------------------------
    // GROUP 3: Regression & Safety Guards
    // ----------------------------------------------------
    console.log("\n>>> [3/3] Safety & Constraint Guards");

    test("No global regex replacement for 'cocktail' exists in stt.js or websocket.js", () => {
      const sttCode = require("fs").readFileSync(require("path").join(__dirname, "..", "services", "stt.js"), "utf8");
      const wsCode = require("fs").readFileSync(require("path").join(__dirname, "..", "services", "websocket.js"), "utf8");

      assert.strictEqual(sttCode.includes("cocktail"), false, "stt.js must not contain hardcoded cocktail replacement");
      assert.strictEqual(wsCode.includes("replace(/cocktail/"), false, "websocket.js must not have global cocktail replacement");
    });

  } finally {
    // Restore environment
    if (originalGeminiModel !== undefined) process.env.GEMINI_CHAT_MODEL = originalGeminiModel; else delete process.env.GEMINI_CHAT_MODEL;
    if (originalSttPrompt !== undefined) process.env.STT_PROMPT = originalSttPrompt; else delete process.env.STT_PROMPT;
    if (originalWhisperPrompt !== undefined) process.env.WHISPER_PROMPT = originalWhisperPrompt; else delete process.env.WHISPER_PROMPT;
    if (originalSttLanguage !== undefined) process.env.STT_LANGUAGE = originalSttLanguage; else delete process.env.STT_LANGUAGE;
  }

  console.log("\n====================================================");
  console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test suite threw uncaught exception:", err);
  process.exit(1);
});
