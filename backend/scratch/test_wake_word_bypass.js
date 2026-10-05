const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { generateAssistantReply } = require("../services/assistant");

// Mocking server session tracking for testing
const activeSessions = new Map();
const SESSION_TIMEOUT_MS = 30000;

function isNoiseTranscript(text) {
  if (!text || typeof text !== "string") return true;
  const cleanText = text.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ""); // Strip punctuation
  
  if (cleanText.length === 0) return true;
  
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

async function simulateRequest(sessionId, text) {
  console.log(`\n--- Simulating Request [Session: ${sessionId}]: "${text}" ---`);
  
  let transcript = text;
  if (isNoiseTranscript(text)) {
    const clean = text.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    const knownHallucinations = [
      "and the other",
      "thank you",
      "thank you for watching",
      "subtitles by",
      "transcribed by",
      "lx",
      "x"
    ];
    const isKnownHallucination = knownHallucinations.some(phrase => clean.includes(phrase) || phrase.includes(clean));
    
    if (isKnownHallucination) {
      console.log(`[Noise Filter] Hallucination "${text}" detected. Falling back to gentle prompt "hello"`);
      transcript = "hello";
    } else {
      console.log(`[Validation] BLOCKED: Transcript identified as background noise or hallucination.`);
      return { success: false, turn_status: "no_transcript", error: "Noise filtered" };
    }
  }

  // 1. Wake word & session validation
  const transcriptLower = text.toLowerCase();
  const hasWakeWord = transcriptLower.includes("kotl");
  const now = Date.now();
  const lastActive = activeSessions.get(sessionId);
  const isSessionActive = lastActive && (now - lastActive < SESSION_TIMEOUT_MS);
  const bypassWakeWord = process.env.BYPASS_WAKE_WORD !== "false"; // Default to true

  if (bypassWakeWord || hasWakeWord) {
    activeSessions.set(sessionId, now);
    console.log(`[Validation] PASS: Processing turn (bypassWakeWord: ${bypassWakeWord}, hasWakeWord: ${hasWakeWord}).`);
  } else if (isSessionActive) {
    activeSessions.set(sessionId, now);
    console.log(`[Validation] PASS: Continuing active session.`);
  } else {
    console.log(`[Validation] BLOCKED: Wake word not detected and session inactive.`);
    return { success: false, turn_status: "no_wake_word", error: "Wake word not detected" };
  }

  // 2. Call assistant (which manages message history memory)
  const result = await generateAssistantReply({ transcript, sessionId });
  console.log(`[Assistant Response]:`, JSON.stringify(result, null, 2));
  return result;
}

async function runTest() {
  console.log("===== TESTING WAKE WORD BYPASS & NOISE FILTER =====");
  console.log(`GROQ_API_KEY configured: ${process.env.GROQ_API_KEY ? "YES" : "NO"}`);
  console.log(`BYPASS_WAKE_WORD: ${process.env.BYPASS_WAKE_WORD}`);
  
  const testSessionId = "session-bypass-99";

  // Step 1: Real Noise Transcript (Should be blocked instantly)
  await simulateRequest(testSessionId, "Thank you for watching.");

  // Step 1b: Hallucinated Noise Transcript (Should fallback to "hello" and succeed!)
  await simulateRequest(testSessionId, "and the other.");

  // Step 2: Normal Transcript without Wake Word (Should PASS due to bypass)
  await simulateRequest(testSessionId, "My favorite color is green.");

  // Step 3: Next Transcript without Wake Word (Should continue active session and remember)
  await simulateRequest(testSessionId, "What is my favorite color?");
}

runTest();
