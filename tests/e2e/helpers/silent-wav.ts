export interface WavOptions {
  durationSec?: number;
  impulseTimesMs?: readonly number[];
}

export function generateSilentWav(options: WavOptions = {}): Buffer {
  const durationSec = options.durationSec ?? 1;
  const sampleRate = 8000;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * 2;
  const fileSize = 44 + dataSize;

  const buf = Buffer.alloc(fileSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(fileSize - 8, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);

  const PEAK_AMPLITUDE = 30000;
  for (const ms of options.impulseTimesMs ?? []) {
    const sampleIndex = Math.floor((ms / 1000) * sampleRate);
    if (sampleIndex >= 0 && sampleIndex < numSamples) {
      buf.writeInt16LE(PEAK_AMPLITUDE, 44 + sampleIndex * 2);
    }
  }

  return buf;
}
