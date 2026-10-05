const { EdgeTTS } = require("node-edge-tts");
const fs = require("fs");
const path = require("path");

const formatsToTest = [
  "audio-24khz-48kbitrate-mono-mp3",
  "audio-16khz-32kbitrate-mono-mp3",
  "riff-24khz-16bit-mono-pcm",
  "raw-16khz-16bit-mono-pcm"
];

async function benchmark() {
  for (const fmt of formatsToTest) {
    console.log(`Testing format: ${fmt}...`);
    const start = Date.now();
    try {
      const tts = new EdgeTTS({
        voice: "en-US-ChristopherNeural",
        lang: "en-US",
        outputFormat: fmt,
        timeout: 5000
      });
      const out = path.join(__dirname, `test_${fmt.replace(/[^a-z0-9]/gi, "_")}`);
      await tts.ttsPromise("A wise ruler acts with strategy.", out);
      const elapsed = Date.now() - start;
      const size = fs.existsSync(out) ? fs.statSync(out).size : 0;
      console.log(`  -> SUCCESS in ${elapsed}ms (${size} bytes)`);
    } catch (err) {
      console.log(`  -> FAILED: ${err.message}`);
    }
  }
}

benchmark();
