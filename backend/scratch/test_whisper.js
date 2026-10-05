const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { transcribeAudio } = require("../services/stt");

async function runTest() {
  console.log("===== TESTING WHISPER STT =====");
  console.log(`STT_PROVIDER: ${process.env.STT_PROVIDER}`);
  console.log(`GROQ_API_KEY configured: ${process.env.GROQ_API_KEY ? "YES" : "NO"}`);
  console.log(`OPENAI_API_KEY configured: ${process.env.OPENAI_API_KEY ? "YES" : "NO"}`);
  console.log(`STT_LANGUAGE: ${process.env.STT_LANGUAGE || "not set"}`);
  console.log(`STT_PROMPT: ${process.env.STT_PROMPT || "not set"}`);

  const uploadsDir = path.join(__dirname, "..", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    console.error(`Uploads directory does not exist: ${uploadsDir}`);
    return;
  }

  const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith(".wav"));
  
  if (files.length === 0) {
    console.error("No test WAV files found in backend/uploads/ directory! Please upload one or run check scripts first.");
    return;
  }

  // Pick whisper-test.wav if present, otherwise any wav file
  let testFile = files.find(f => f.includes("whisper-test")) || files[0];
  const testFilePath = path.join(uploadsDir, testFile);
  console.log(`\nUsing test file: ${testFilePath} (${(fs.statSync(testFilePath).size / 1024).toFixed(1)} KB)`);

  try {
    const result = await transcribeAudio(testFilePath);
    console.log("\nSTT Result received:");
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log(`\nSUCCESS! Transcribed text: "${result.text}"`);
    } else {
      console.log(`\nSTT Failed: ${result.error}`);
    }
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

runTest();
