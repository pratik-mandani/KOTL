const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { generateAssistantReply } = require("../services/assistant");

// Mocking server session tracking for testing
const activeSessions = new Map();
const SESSION_TIMEOUT_MS = 30000;

async function simulateRequest(sessionId, text) {
  console.log(`\n--- Simulating Request [Session: ${sessionId}]: "${text}" ---`);
  
  // 1. Wake word & session validation
  const transcriptLower = text.toLowerCase();
  const hasWakeWord = transcriptLower.includes("kotl");
  const now = Date.now();
  const lastActive = activeSessions.get(sessionId);
  const isSessionActive = lastActive && (now - lastActive < SESSION_TIMEOUT_MS);

  if (hasWakeWord) {
    activeSessions.set(sessionId, now);
    console.log(`[Validation] Wake word detected. Session active.`);
  } else if (isSessionActive) {
    activeSessions.set(sessionId, now);
    console.log(`[Validation] Continuing active session.`);
  } else {
    console.log(`[Validation] BLOCKED: Wake word not detected and session inactive.`);
    return { success: false, turn_status: "no_wake_word", error: "Wake word not detected" };
  }

  // 2. Call assistant (which manages message history memory)
  const result = await generateAssistantReply({ transcript: text, sessionId });
  console.log(`[Assistant Response]:`, JSON.stringify(result, null, 2));
  return result;
}

async function runTest() {
  console.log("===== TESTING WAKE WORD & SESSION CONTEXT MEMORY =====");
  console.log(`GROQ_API_KEY configured: ${process.env.GROQ_API_KEY ? "YES" : "NO"}`);
  console.log(`GEMINI_API_KEY configured: ${process.env.GEMINI_API_KEY ? "YES" : "NO"}`);
  
  const testSessionId = "session-test-99";

  // Step 1: Request with Wake Word (Should work if keys configured, or fail with API config error but pass validation)
  await simulateRequest(testSessionId, "Hello KOTL, my name is Alice.");

  // Step 2: Request without Wake Word (Should continue since session is active)
  await simulateRequest(testSessionId, "What is my name?");

  // Step 3: Simulate Session Timeout (manually delete session)
  console.log("\n--- Simulating Session Timeout (30 seconds elapsed) ---");
  activeSessions.delete(testSessionId);

  // Step 4: Request without Wake Word after timeout (Should be blocked)
  await simulateRequest(testSessionId, "Are you still there?");
}

runTest();
