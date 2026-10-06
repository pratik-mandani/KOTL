const fs = require("fs");

function writePcm16MonoWav({ rawPath, wavPath, sampleRate, audioDataBytes }) {
  const numSamples = Math.floor(audioDataBytes.length / 2);
  const samples = new Int16Array(numSamples);
  
  // Convert byte buffer to 16-bit signed integers
  let sum = 0;
  let maxAbs = 0;
  for (let i = 0; i < numSamples; i++) {
    const val = audioDataBytes.readInt16LE(i * 2);
    samples[i] = val;
    sum += val;
    const absVal = Math.abs(val);
    if (absVal > maxAbs) maxAbs = absVal;
  }

  // 1. Remove DC Offset (Microphone signal bias)
  const dcOffset = Math.round(sum / numSamples);
  for (let i = 0; i < numSamples; i++) {
    samples[i] = samples[i] - dcOffset;
  }

  // 2. Apply gentle high-pass DC blocker filter (alpha = 0.98)
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

  // 3. Peak Normalization: If signal is quiet, scale gracefully without clipping
  let peak = 0;
  for (let i = 0; i < numSamples; i++) {
    const a = Math.abs(samples[i]);
    if (a > peak) peak = a;
  }

  if (peak > 50) {
    const targetPeak = 22000;
    let gain = targetPeak / peak;
    if (gain > 6.0) gain = 6.0;
    if (gain < 0.8) gain = 0.8;

    for (let i = 0; i < numSamples; i++) {
      let val = Math.round(samples[i] * gain);
      if (val > 32767) val = 32767;
      else if (val < -32768) val = -32768;
      samples[i] = val;
    }
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
