/**
 * Pure in-memory Audio Converter (Zero FFmpeg Dependency)
 * Decodes MP3 to 16-bit Mono 16kHz WAV using WebAssembly mpg123-decoder.
 * Works natively on Windows, Linux, Render.com without any external binaries.
 */

const fs = require("fs");

let _decoder = null;

async function getDecoder() {
  if (!_decoder) {
    const { MPEGDecoder } = await import("mpg123-decoder");
    _decoder = new MPEGDecoder();
    await _decoder.ready;
  }
  return _decoder;
}

/**
 * Converts an MP3 Buffer into a 16-bit mono 16kHz WAV Buffer.
 * @param {Buffer} mp3Buffer 
 * @param {number} targetSampleRate - Defaults to 16000
 * @returns {Promise<Buffer>} Complete WAV file buffer (header + PCM)
 */
async function mp3BufferToWavBuffer(mp3Buffer, targetSampleRate = 16000) {
  const decoder = await getDecoder();
  const { channelData, sampleRate } = decoder.decode(mp3Buffer);

  if (!channelData || channelData.length === 0 || channelData[0].length === 0) {
    throw new Error("MPEGDecoder produced empty channel data");
  }

  const leftChannel = channelData[0];
  const rightChannel = channelData.length > 1 ? channelData[1] : leftChannel;
  const isStereo = channelData.length > 1;

  // Resample to targetSampleRate (e.g., from 24000Hz to 16000Hz) and mix to Mono
  const ratio = sampleRate / targetSampleRate;
  const targetSampleCount = Math.floor(leftChannel.length / ratio);
  const pcmBytes = Buffer.alloc(targetSampleCount * 2);

  for (let i = 0; i < targetSampleCount; i++) {
    const srcIndex = Math.min(Math.floor(i * ratio), leftChannel.length - 1);
    let sample = isStereo ? (leftChannel[srcIndex] + rightChannel[srcIndex]) * 0.5 : leftChannel[srcIndex];

    // Clamp to [-1.0, 1.0]
    if (sample > 1.0) sample = 1.0;
    else if (sample < -1.0) sample = -1.0;

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
