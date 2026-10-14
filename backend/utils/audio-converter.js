/**
 * Pure in-memory Audio Converter (Zero FFmpeg Dependency)
 * Decodes MP3 to 16-bit Mono 16kHz WAV using WebAssembly mpg123-decoder.
 * Works natively on Windows, Linux, Render.com without any external binaries.
 */

const fs = require("fs");

/**
 * Converts an MP3 Buffer into a 16-bit mono 16kHz WAV Buffer.
 * @param {Buffer} mp3Buffer 
 * @param {number} targetSampleRate - Defaults to 16000
 * @returns {Promise<Buffer>} Complete WAV file buffer (header + PCM)
 */
async function mp3BufferToWavBuffer(mp3Buffer, targetSampleRate = 16000) {
  const { MPEGDecoder } = await import("mpg123-decoder");
  const decoder = new MPEGDecoder();
  await decoder.ready;
  let channelData, sampleRate;
  try {
    const res = decoder.decode(mp3Buffer);
    channelData = res.channelData;
    sampleRate = res.sampleRate;
  } finally {
    try {
      decoder.free();
    } catch (_) {}
  }

  if (!channelData || channelData.length === 0 || channelData[0].length === 0) {
    throw new Error("MPEGDecoder produced empty channel data");
  }

  const leftChannel = channelData[0];
  const rightChannel = channelData.length > 1 ? channelData[1] : leftChannel;
  const isStereo = channelData.length > 1;

  // Resample to targetSampleRate (e.g., from 24000Hz to 16000Hz) with linear interpolation
  const ratio = sampleRate / targetSampleRate;
  const targetSampleCount = Math.floor(leftChannel.length / ratio);
  const pcmBytes = Buffer.alloc(targetSampleCount * 2);

  // 160Hz high-pass filter to remove sub-bass rumble that causes small speakers to distort/sound ghogharo
  const rc = 1.0 / (2.0 * Math.PI * 160);
  const dt = 1.0 / targetSampleRate;
  const alpha = rc / (rc + dt);

  let prevInput = 0;
  let prevOutput = 0;

  for (let i = 0; i < targetSampleCount; i++) {
    const srcPos = i * ratio;
    const index0 = Math.floor(srcPos);
    const index1 = Math.min(index0 + 1, leftChannel.length - 1);
    const frac = srcPos - index0;

    const s0 = isStereo ? (leftChannel[index0] + rightChannel[index0]) * 0.5 : leftChannel[index0];
    const s1 = isStereo ? (leftChannel[index1] + rightChannel[index1]) * 0.5 : leftChannel[index1];
    const rawSample = s0 + frac * (s1 - s0);

    // High-pass filter
    const hpSample = alpha * (prevOutput + rawSample - prevInput);
    prevInput = rawSample;
    prevOutput = hpSample;

    // Gentle soft-limit clamp to prevent digital clipping
    let sample = hpSample;
    if (sample > 0.95) sample = 0.95;
    else if (sample < -0.95) sample = -0.95;

    const pcm16 = Math.round(sample * 32767);
    pcmBytes.writeInt16LE(pcm16, i * 2);
  }

  // Create standard 44-byte RIFF WAV Header
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = targetSampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  const wavHeader = Buffer.alloc(44);
  wavHeader.write("RIFF", 0);
  wavHeader.writeUInt32LE(36 + pcmBytes.length, 4);
  wavHeader.write("WAVE", 8);
  wavHeader.write("fmt ", 12);
  wavHeader.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  wavHeader.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(targetSampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(bitsPerSample, 34);
  wavHeader.write("data", 36);
  wavHeader.writeUInt32LE(pcmBytes.length, 40);

  return Buffer.concat([wavHeader, pcmBytes]);
}

/**
 * Converts an MP3 file on disk into a WAV file on disk without FFmpeg.
 */
async function convertMp3FileToWavFile(sourceMp3Path, targetWavPath, targetSampleRate = 16000) {
  const mp3Buffer = fs.readFileSync(sourceMp3Path);
  const wavBuffer = await mp3BufferToWavBuffer(mp3Buffer, targetSampleRate);
  fs.writeFileSync(targetWavPath, wavBuffer);
  return wavBuffer.length;
}

module.exports = {
  mp3BufferToWavBuffer,
  convertMp3FileToWavFile,
};
