const { EdgeTTS } = require("node-edge-tts");
const fs = require("fs");
const path = require("path");

async function testEdgeTts() {
  console.log("=== Testing Node Edge TTS ===");
  const tts = new EdgeTTS({
    voice: "en-US-ChristopherNeural", // Deep, strategic, wise voice for Chanakya persona!
    lang: "en-US",
    outputFormat: "audio-24khz-48kbitrate-mono-mp3"
  });

  const outputPath = path.join(__dirname, "test_output.mp3");
  console.log("Generating audio for: 'Greetings. A wise mind acts with strategy and patience.'");
  await tts.ttsPromise("Greetings. A wise mind acts with strategy and patience.", outputPath);
  
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    console.log(`SUCCESS! Audio generated at: ${outputPath} (${stats.size} bytes)`);
  } else {
    console.error("FAILED to generate audio.");
  }
}

testEdgeTts().catch(console.error);
