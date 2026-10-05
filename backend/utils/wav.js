const fs = require("fs");

function writePcm16MonoWav({ rawPath, wavPath, sampleRate, audioDataBytes }) {
  const numSamples = Math.floor(audioDataBytes.length / 2);
  const samples = new Int16Array(numSamples);
  
  // Convert byte buffer to 16-bit signed integers
  for (let i = 0; i < numSamples; i++) {
    samples[i] = audioDataBytes.readInt16LE(i * 2);
  }

  // 1. Apply first-order high-pass filter (DC Blocker) to strip background humming and low-frequency noise
  // Formula: y[n] = alpha * (y[n-1] + x[n] - x[n-1])
  const alpha = 0.98;
  let prevX = 0;
  let prevY = 0;
  for (let i = 0; i < numSamples; i++) {
    const x = samples[i];
    const y = Math.round(alpha * (prevY + x - prevX));
    prevX = x;
    prevY = y;
    samples[i] = y;
  }

  // 2. Apply 20x input volume gain amplification to make quiet speech readable
  const INPUT_GAIN_FACTOR = 20.0;
  let sum = 0;
  for (let i = 0; i < numSamples; i++) {
    let amplified = Math.round(samples[i] * INPUT_GAIN_FACTOR);
    if (amplified > 32767) amplified = 32767;
    else if (amplified < -32768) amplified = -32768;
    
    samples[i] = amplified;
    sum += samples[i];
  }

  // 3. Remove DC Offset (Microphone signal bias)
  const dcOffset = Math.round(sum / numSamples);
  for (let i = 0; i < numSamples; i++) {
    let sample = samples[i] - dcOffset;
    
    // Clamp to 16-bit signed integer limits
    if (sample > 32767) sample = 32767;
    else if (sample < -32768) sample = -32768;
    
    samples[i] = sample;
  }

  // 4. Dynamic RMS Auto-Gain Normalization
  // Standard speech conversational RMS target is ~3500 (~ -19 dBFS)
  let sumSquares = 0;
  for (let i = 0; i < numSamples; i++) {
    sumSquares += samples[i] * samples[i];
  }
  const rms = Math.sqrt(sumSquares / numSamples);
  const targetRms = 3500;
  const minRmsThreshold = 60; // Ignore pure dead silence to prevent noise blowup

  if (rms > minRmsThreshold) {
    let rmsGain = targetRms / rms;
    if (rmsGain > 20.0) rmsGain = 20.0;
    if (rmsGain < 0.5) rmsGain = 0.5;

    console.log(`[WAV] RMS Auto-Gain: current RMS is ${rms.toFixed(1)}, applying scaling factor ${rmsGain.toFixed(2)}`);
    for (let i = 0; i < numSamples; i++) {
      let sample = Math.round(samples[i] * rmsGain);
      if (sample > 32767) sample = 32767;
      else if (sample < -32768) sample = -32768;
      samples[i] = sample;
    }
  } else {
    console.log(`[WAV] Audio RMS is low (${rms.toFixed(1)}), skipping RMS auto-gain.`);
  }

  // Convert processed samples back to byte buffer
  const processedData = Buffer.alloc(numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    processedData.writeInt16LE(samples[i], i * 2);
  }

  const bitsPerSample = 16;
  const numChannels = 1;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const header = Buffer.alloc(44);

  // WAV header metadata setup
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + processedData.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(processedData.length, 40);

  fs.writeFileSync(wavPath, Buffer.concat([header, processedData]));

  return {
    wavPath,
    sampleRate,
    numChannels,
    bitsPerSample,
    bytesWritten: 44 + processedData.length,
  };
}

module.exports = {
  writePcm16MonoWav,
};
