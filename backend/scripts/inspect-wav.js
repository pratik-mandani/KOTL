const fs = require("fs");
const path = require("path");

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function readChunkHeader(buffer, offset) {
  if (offset + 8 > buffer.length) {
    return null;
  }

  return {
    id: buffer.toString("ascii", offset, offset + 4),
    size: buffer.readUInt32LE(offset + 4),
    dataOffset: offset + 8,
    nextOffset: offset + 8 + buffer.readUInt32LE(offset + 4) + (buffer.readUInt32LE(offset + 4) % 2),
  };
}

function inspectWav(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 44 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    fail("not a RIFF/WAVE file");
  }

  let fmt = null;
  let data = null;
  let offset = 12;
  while (offset < buffer.length) {
    const chunk = readChunkHeader(buffer, offset);
    if (!chunk || chunk.dataOffset + chunk.size > buffer.length) {
      break;
    }

    if (chunk.id === "fmt ") {
      fmt = chunk;
    } else if (chunk.id === "data") {
      data = chunk;
    }

    offset = chunk.nextOffset;
  }

  if (!fmt || fmt.size < 16) {
    fail("missing fmt chunk");
  }

  if (!data) {
    fail("missing data chunk");
  }

  const audioFormat = buffer.readUInt16LE(fmt.dataOffset);
  const channels = buffer.readUInt16LE(fmt.dataOffset + 2);
  const sampleRate = buffer.readUInt32LE(fmt.dataOffset + 4);
  const byteRate = buffer.readUInt32LE(fmt.dataOffset + 8);
  const blockAlign = buffer.readUInt16LE(fmt.dataOffset + 12);
  const bitsPerSample = buffer.readUInt16LE(fmt.dataOffset + 14);
  const sampleCount = Math.floor(data.size / (bitsPerSample / 8));
  const frameCount = blockAlign > 0 ? Math.floor(data.size / blockAlign) : 0;
  const durationSeconds = sampleRate > 0 ? frameCount / sampleRate : 0;

  if (audioFormat !== 1 || bitsPerSample !== 16) {
    return {
      filePath,
      sizeBytes: buffer.length,
      audioFormat,
      pcmFormat: audioFormat === 1 ? "pcm" : `format_${audioFormat}`,
      sampleRate,
      channels,
      bitsPerSample,
      durationSeconds,
      dataBytes: data.size,
      supportedStats: false,
      note: "signal stats require PCM16 WAV",
    };
  }

  let min = 32767;
  let max = -32768;
  let absPeak = 0;
  let sum = 0;
  let squareSum = 0;
  let clippedSamples = 0;
  let zeroSamples = 0;

  for (let i = 0; i < sampleCount; i += 1) {
    const sample = buffer.readInt16LE(data.dataOffset + i * 2);
    if (sample < min) min = sample;
    if (sample > max) max = sample;
    const absSample = Math.abs(sample);
    if (absSample > absPeak) absPeak = absSample;
    if (sample === 32767 || sample === -32768) clippedSamples += 1;
    if (sample === 0) zeroSamples += 1;
    sum += sample;
    squareSum += sample * sample;
  }

  const mean = sampleCount > 0 ? sum / sampleCount : 0;
  const rms = sampleCount > 0 ? Math.sqrt(squareSum / sampleCount) : 0;
  const dcOffset = mean / 32768;
  const clippedPercent = sampleCount > 0 ? (clippedSamples / sampleCount) * 100 : 0;
  const zeroPercent = sampleCount > 0 ? (zeroSamples / sampleCount) * 100 : 0;
  const peakDb = absPeak > 0 ? 20 * Math.log10(absPeak / 32768) : null;
  const rmsDb = rms > 0 ? 20 * Math.log10(rms / 32768) : null;

  const flags = [];
  if (Math.abs(dcOffset) > 0.1) flags.push("mostly DC offset");
  if (clippedPercent > 1) flags.push("clipped");
  if (rms < 200 && absPeak < 1000) flags.push("mostly silence");
  if (rms >= 200 && Math.abs(dcOffset) <= 0.1 && clippedPercent <= 1) flags.push("signal present");
  if (rms >= 200 && flags.length === 0) flags.push("mostly noise or speech-like signal");

  return {
    filePath,
    sizeBytes: buffer.length,
    audioFormat,
    pcmFormat: "pcm_s16le",
    sampleRate,
    channels,
    bitsPerSample,
    byteRate,
    blockAlign,
    durationSeconds,
    dataBytes: data.size,
    sampleCount,
    min,
    max,
    absPeak,
    peakDb,
    rms,
    rmsDb,
    dcOffset,
    clippedSamples,
    clippedPercent,
    zeroPercent,
    assessment: flags.join(", "),
    supportedStats: true,
  };
}

function printResult(result) {
  console.log(`file: ${result.filePath}`);
  console.log(`size_bytes: ${result.sizeBytes}`);
  console.log(`duration_seconds: ${result.durationSeconds.toFixed(3)}`);
  console.log(`sample_rate: ${result.sampleRate}`);
  console.log(`channels: ${result.channels}`);
  console.log(`pcm_format: ${result.pcmFormat}`);
  console.log(`bits_per_sample: ${result.bitsPerSample}`);

  if (!result.supportedStats) {
    console.log(`note: ${result.note}`);
    return;
  }

  console.log(`min_level: ${result.min}`);
  console.log(`max_level: ${result.max}`);
  console.log(`abs_peak: ${result.absPeak}`);
  console.log(`peak_dbfs: ${result.peakDb === null ? "-inf" : result.peakDb.toFixed(2)}`);
  console.log(`rms: ${result.rms.toFixed(2)}`);
  console.log(`rms_dbfs: ${result.rmsDb === null ? "-inf" : result.rmsDb.toFixed(2)}`);
  console.log(`dc_offset: ${result.dcOffset.toFixed(6)}`);
  console.log(`clipped_samples: ${result.clippedSamples}`);
  console.log(`clipped_percent: ${result.clippedPercent.toFixed(3)}`);
  console.log(`zero_percent: ${result.zeroPercent.toFixed(3)}`);
  console.log(`assessment: ${result.assessment}`);
}

function main() {
  const wavPath = process.argv[2];
  if (!wavPath) {
    fail("usage: npm run inspect:wav -- path/to/file.wav");
  }

  const resolvedPath = path.resolve(process.cwd(), wavPath);
  if (!fs.existsSync(resolvedPath)) {
    fail(`file not found: ${resolvedPath}`);
  }

  printResult(inspectWav(resolvedPath));
}

main();
