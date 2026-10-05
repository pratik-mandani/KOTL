const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const fs = require("fs");
const { generateAssistantReply } = require("../services/assistant");
const { generateSpeech } = require("../services/tts");

async function testGujaratiTurn() {
  console.log("=== Testing Gujarati Voice Turn ===");
  const query = "ok good taru name su che?";
  console.log(`User Input: "${query}"`);

  const res = await generateAssistantReply({ transcript: query, sessionId: "guj-test" });
  console.log(`Chanakya Reply: "${res.reply}"`);

  const tts = await generateSpeech({ text: res.reply, sessionId: "guj-test" });
  console.log(`TTS Result: Voice: ${tts.voice}, URL: ${tts.url}`);
}

testGujaratiTurn();
