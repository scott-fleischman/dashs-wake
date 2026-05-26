import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const OUTPUT_DIR = join("public", "audio", "official");
const SAMPLE_RATE = 22_050;
const TAU = Math.PI * 2;

const TRACKS = [
  { file: "level-1-dawn-circuit.ogg", bpm: 100, duration: 21, root: 48, wave: "sine" },
  { file: "level-2-launch-relay.ogg", bpm: 120, duration: 21, root: 43, wave: "square" },
  { file: "level-3-orbit-glass.ogg", bpm: 108, duration: 28, root: 52, wave: "triangle" },
  { file: "level-4-switchyard.ogg", bpm: 132, duration: 28, root: 45, wave: "saw" },
  { file: "level-5-false-signal.ogg", bpm: 145, duration: 28, root: 41, wave: "square" },
  { file: "level-6-block-pulse.ogg", bpm: 112, duration: 22, root: 46, wave: "triangle" },
  { file: "level-7-steel-skyline.ogg", bpm: 128, duration: 24, root: 38, wave: "saw" },
  { file: "level-8-foundry-overdrive.ogg", bpm: 150, duration: 27, root: 34, wave: "square" },
];

function frequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function oscillator(wave, phase) {
  if (wave === "square") return Math.sin(phase) >= 0 ? 1 : -1;
  if (wave === "triangle") return (2 / Math.PI) * Math.asin(Math.sin(phase));
  if (wave === "saw") return 2 * ((phase / TAU) % 1) - 1;
  return Math.sin(phase);
}

function seededNoise(seed) {
  let value = seed | 0;
  return () => {
    value = Math.imul(1664525, value) + 1013904223;
    return ((value >>> 1) / 0x40000000) * 2 - 1;
  };
}

function renderSamples(track, index) {
  const frames = Math.round(track.duration * SAMPLE_RATE);
  const samples = new Int16Array(frames);
  const noise = seededNoise(index + 731);
  const secondsPerBeat = 60 / track.bpm;
  const bassPattern = [0, 0, 7, 5, 0, 10, 7, 5];
  const leadPattern = [12, 19, 15, 22, 12, 17, 19, 15];

  for (let frame = 0; frame < frames; frame += 1) {
    const t = frame / SAMPLE_RATE;
    const beat = t / secondsPerBeat;
    const beatStep = Math.floor(beat);
    const beatPhase = beat - beatStep;
    const halfPhase = (beat * 2) % 1;
    const bassNote = track.root + bassPattern[beatStep % bassPattern.length];
    const leadNote =
      track.root + leadPattern[Math.floor(beat / 2) % leadPattern.length];
    const bassEnvelope = 0.32 * (0.55 + 0.45 * Math.exp(-beatPhase * 5));
    const leadEnvelope = beatStep % 2 === 0 ? 0.16 * Math.exp(-beatPhase * 2.1) : 0.07;
    const bass = oscillator(track.wave, TAU * frequency(bassNote) * t) * bassEnvelope;
    const sub = Math.sin(TAU * frequency(track.root - 12) * t) * 0.14;
    const lead = Math.sin(TAU * frequency(leadNote) * t) * leadEnvelope;
    const kickPhase = beatPhase * secondsPerBeat;
    const kick =
      kickPhase < 0.15
        ? Math.sin(TAU * (78 - kickPhase * 260) * kickPhase) *
          Math.exp(-kickPhase * 27) *
          0.72
        : 0;
    const hat =
      halfPhase < 0.06
        ? noise() * Math.exp(-halfPhase * 62) * (beatStep % 4 === 2 ? 0.11 : 0.065)
        : 0;
    const fade = Math.min(1, t / 0.04, (track.duration - t) / 0.16);
    const mixed = Math.max(-1, Math.min(1, (bass + sub + lead + kick + hat) * fade));
    samples[frame] = Math.round(mixed * 24_000);
  }
  return samples;
}

function wavBytes(samples) {
  const bytes = Buffer.alloc(44 + samples.length * 2);
  bytes.write("RIFF", 0);
  bytes.writeUInt32LE(36 + samples.length * 2, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(SAMPLE_RATE, 24);
  bytes.writeUInt32LE(SAMPLE_RATE * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i += 1) {
    bytes.writeInt16LE(samples[i], 44 + i * 2);
  }
  return bytes;
}

mkdirSync(OUTPUT_DIR, { recursive: true });
for (const [index, track] of TRACKS.entries()) {
  const oggPath = join(OUTPUT_DIR, track.file);
  const wavPath = `${oggPath}.wav`;
  writeFileSync(wavPath, wavBytes(renderSamples(track, index)));
  const encode = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", "-i", wavPath, "-codec:a", "libvorbis", "-q:a", "4", oggPath],
    { stdio: "inherit" },
  );
  rmSync(wavPath);
  if (encode.status !== 0) {
    throw new Error(`ffmpeg failed while encoding ${track.file}.`);
  }
}

console.log(`Composed ${TRACKS.length} original tracks in ${dirname(join(OUTPUT_DIR, TRACKS[0].file))}.`);
