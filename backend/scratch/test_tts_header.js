const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { generateSpeech } = require("../services/tts");

async function runTest() {
  console.log("===== TESTING TTS WAV HEADER =====");
  try {
    const text = "Testing KOTL WAV header normalization.";
    console.log(`Synthesizing text: "${text}"`);
    
    const result = await generateSpeech({ text, sessionId: "test-header-session" });
    console.log("TTS Result:", result);

    if (result.success && result.filename) {
      const filePath = path.join(__dirname, "..", "uploads", "tts", result.filename);
      console.log(`Reading generated file: ${filePath}`);

      const header = Buffer.alloc(44);
      const fd = fs.openSync(filePath, "r");
      fs.readSync(fd, header, 0, 44, 0);
      fs.closeSync(fd);

      const riff = header.toString("utf8", 0, 4);
      const wave = header.toString("utf8", 8, 12);
      const fmt = header.toString("utf8", 12, 16);
      const dataTag = header.toString("utf8", 36, 40);
      
      console.log(`\nHeader details:`);
      console.log(`- Byte 0-4 (RIFF): "${riff}" ${riff === "RIFF" ? "(PASS)" : "(FAIL)"}`);
      console.log(`- Byte 8-12 (WAVE): "${wave}" ${wave === "WAVE" ? "(PASS)" : "(FAIL)"}`);
      console.log(`- Byte 12-16 (fmt ): "${fmt}" ${fmt === "fmt " ? "(PASS)" : "(FAIL)"}`);
      console.log(`- Byte 36-40 (data): "${dataTag}" ${dataTag === "data" ? "(PASS)" : "(FAIL)"}`);

      const fileSize = fs.statSync(filePath).size;
      console.log(`- Total File Size: ${fileSize} bytes`);

      if (riff === "RIFF" && wave === "WAVE" && fmt === "fmt " && dataTag === "data") {
        console.log("\nResult: SUCCESS (The WAV header is perfectly standard and compatible with ESP32!)");
      } else {
        console.log("\nResult: FAIL (Header does not match standard 44-byte structure expected by ESP32)");
      }
    } else {
      console.log("TTS generation failed:", result.error);
    }
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

runTest();
