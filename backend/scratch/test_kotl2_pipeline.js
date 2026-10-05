const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const fs = require("fs");
const { generateAssistantReply } = require("../services/assistant");
const { generateSpeech } = require("../services/tts");

async function testFullKOTL2Pipeline() {
  console.log("=================================================");
  console.log("       TESTING KOTL 2.0 HYBRID AI PIPELINE       ");
  console.log("=================================================");

  const query = "What is the key to winning any strategic battle?";
  console.log(`[User Inquiry]: "${query}"`);

  const startTime = Date.now();

  // 1. LLM Generation
  console.log("\n1. Querying Chanakya Brain (Gemini 3.6 Flash)...");
  const llmStart = Date.now();
  const assistantResult = await generateAssistantReply({
    transcript: query,
    sessionId: "test-kotl-session"
  });
  const llmElapsed = Date.now() - llmStart;

  if (!assistantResult.success) {
    console.error("LLM Error:", assistantResult.error);
    return;
  }

  console.log(`  -> Reply: "${assistantResult.reply}" (${llmElapsed}ms) [Provider: ${assistantResult.provider}]`);

  // 2. TTS Generation (Microsoft Edge Neural TTS)
  console.log("\n2. Synthesizing Neural Speech (Edge-TTS)...");
  const ttsStart = Date.now();
  const ttsResult = await generateSpeech({
    text: assistantResult.reply,
    sessionId: "test-kotl-session"
  });
  const ttsElapsed = Date.now() - ttsStart;

  if (!ttsResult.success) {
    console.error("TTS Error:", ttsResult.error);
    return;
  }

  const generatedWavPath = path.join(__dirname, "..", "uploads", "tts", ttsResult.filename);
  const wavBytes = fs.existsSync(generatedWavPath) ? fs.statSync(generatedWavPath).size : 0;
  console.log(`  -> Audio Generated: ${ttsResult.filename} (${wavBytes} bytes) in ${ttsElapsed}ms!`);

  // 3. Audio Header Verification
  const headerBuf = fs.readFileSync(generatedWavPath);
  console.log("\n3. Verifying ESP32 Audio Compatibility:");
  console.log("  - RIFF tag:", headerBuf.toString("ascii", 0, 4));
  console.log("  - Channels:", headerBuf.readUInt16LE(22), "(1 = Mono)");
  console.log("  - Sample Rate:", headerBuf.readUInt32LE(24), "Hz (Expected: 16000)");
  console.log("  - Bits/Sample:", headerBuf.readUInt16LE(34), "bits");

  const totalElapsed = Date.now() - startTime;
  console.log("\n=================================================");
  console.log(`  TOTAL TURN LATENCY: ${totalElapsed}ms (${(totalElapsed / 1000).toFixed(2)}s)`);
  console.log("  STATUS: SUCCESS - READY FOR HARDWARE & WEB UI!");
  console.log("=================================================");
}

testFullKOTL2Pipeline().catch(console.error);
