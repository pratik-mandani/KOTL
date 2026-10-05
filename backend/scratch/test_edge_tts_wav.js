const { EdgeTTS } = require("node-edge-tts");
const fs = require("fs");
const path = require("path");

async function testEdgeTtsWav() {
  console.log("=== Testing Node Edge TTS with Native 16kHz PCM WAV ===");
  const tts = new EdgeTTS({
    voice: "en-US-ChristopherNeural",
    lang: "en-US",
    outputFormat: "riff-16khz-16bit-mono-pcm"
  });

  const outputPath = path.join(__dirname, "test_output_16k.wav");
  console.log("Synthesizing audio directly to 16kHz 16-bit Mono WAV...");
  await tts.ttsPromise("Greetings. A wise mind acts with strategy and patience.", outputPath);
  
  if (fs.existsSync(outputPath)) {
    const buffer = fs.readFileSync(outputPath);
    console.log(`SUCCESS! WAV generated at: ${outputPath} (${buffer.length} bytes)`);
    console.log("Header check:", {
      riff: buffer.toString("ascii", 0, 4),
      wave: buffer.toString("ascii", 8, 12),
      fmt: buffer.toString("ascii", 12, 16),
      audioFormat: buffer.readUInt16LE(20), // 1 = PCM
      channels: buffer.readUInt16LE(22),    // 1 = Mono
      sampleRate: buffer.readUInt32LE(24),  // 16000
      bitsPerSample: buffer.readUInt16LE(34) // 16
    });
  } else {
    console.error("FAILED to generate WAV.");
  }
}

testEdgeTtsWav().catch(console.error);
