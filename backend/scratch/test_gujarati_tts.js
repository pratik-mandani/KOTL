const { EdgeTTS } = require("node-edge-tts");
const fs = require("fs");
const path = require("path");

async function testGujaratiTts() {
  console.log("=== Testing Native Gujarati Edge Neural TTS ===");
  const text = "મારું નામ KOTL છે. હું તમારો સ્માર્ટ વોઇસ એસિસ્ટન્ટ છું.";
  
  const isGujarati = /[\u0A80-\u0AFF]/.test(text);
  const voice = isGujarati ? "gu-IN-NiranjanNeural" : "en-US-ChristopherNeural";
  const lang = isGujarati ? "gu-IN" : "en-US";

  console.log(`Detected script: ${isGujarati ? "Gujarati" : "English"}, using voice: ${voice}`);

  const tts = new EdgeTTS({
    voice,
    lang,
    outputFormat: "audio-24khz-48kbitrate-mono-mp3"
  });

  const out = path.join(__dirname, "gujarati_test.mp3");
  await tts.ttsPromise(text, out);

  if (fs.existsSync(out)) {
    console.log(`SUCCESS! Gujarati speech generated (${fs.statSync(out).size} bytes) with voice ${voice}!`);
  }
}

testGujaratiTts();
