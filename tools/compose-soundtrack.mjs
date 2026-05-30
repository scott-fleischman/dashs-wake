import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const OUTPUT_DIR = join("public", "audio", "official");
const SAMPLE_RATE = 22_050;
const TAU = Math.PI * 2;

// Each track is its own composition: a distinct key, scale feel, chord
// progression, bassline, melodic hook, and drum pattern with its own timbres.
// They intentionally do NOT share melodic material so every level sounds like
// a different song rather than a transposed remix of the same loop.
//
// Pattern grids use 16 steps per bar (4 beats * 4 sixteenths). A note value is
// a scale-degree index (0-based) into the track's scale; chords are arrays of
// degree indices voiced above the key root. `null` means a rest.
const TRACKS = [
  {
    file: "level-1-dawn-circuit.ogg",
    title: "Dawn Circuit",
    bpm: 96,
    duration: 22,
    key: 50, // D
    scale: [0, 2, 4, 5, 7, 9, 11], // major — warm, welcoming
    progression: [
      [0, 2, 4], // I
      [5, 0, 2], // vi-ish
      [3, 5, 0], // IV
      [4, 6, 1], // V
    ],
    bass: { wave: "sine", degrees: [0, null, 0, null, 4, null, 2, null], gain: 0.34, octave: -2 },
    pad: { wave: "triangle", gain: 0.06, octave: 0 },
    arp: { wave: "sine", gain: 0.1, octave: 1, steps: [0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1] },
    lead: { wave: "triangle", gain: 0.15, octave: 1, notes: [4, null, 2, 0, null, 2, 4, null, 5, 4, 2, null, 0, null, null, null] },
    drums: {
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
      hatGain: 0.05,
    },
  },
  {
    file: "level-2-launch-relay.ogg",
    title: "Hollow Steps",
    bpm: 124,
    duration: 22,
    key: 45, // A
    scale: [0, 2, 3, 5, 7, 8, 10], // natural minor — marching, tense
    progression: [
      [0, 2, 4],
      [0, 2, 4],
      [5, 0, 2],
      [4, 6, 1],
    ],
    bass: { wave: "square", degrees: [0, 0, null, 0, 2, null, 3, 0], gain: 0.3, octave: -2 },
    pad: { wave: "saw", gain: 0.04, octave: 0 },
    arp: null,
    lead: { wave: "square", gain: 0.12, octave: 1, notes: [0, null, 0, 2, 3, null, 2, 0, 4, null, 3, 2, 0, null, null, null] },
    stab: { wave: "saw", gain: 0.1, octave: 0, steps: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0] },
    drums: {
      kick: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      hat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      hatGain: 0.045,
    },
  },
  {
    file: "level-3-orbit-glass.ogg",
    title: "Neon Drift",
    bpm: 110,
    duration: 28,
    key: 52, // E
    scale: [0, 2, 4, 6, 7, 9, 11], // lydian — dreamy, floating
    progression: [
      [0, 2, 4],
      [3, 5, 0],
      [1, 3, 5],
      [4, 6, 1],
    ],
    bass: { wave: "sine", degrees: [0, null, null, null, 4, null, null, null], gain: 0.3, octave: -2 },
    pad: { wave: "triangle", gain: 0.08, octave: 0 },
    arp: { wave: "sine", gain: 0.12, octave: 2, steps: [0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 1, 2] },
    lead: { wave: "sine", gain: 0.14, octave: 1, notes: [4, null, null, 5, 6, null, 5, 4, null, 2, null, 4, null, null, null, null] },
    drums: {
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      hatGain: 0.04,
    },
  },
  {
    file: "level-4-switchyard.ogg",
    title: "Prism Ascent",
    bpm: 134,
    duration: 28,
    key: 47, // B
    scale: [0, 3, 5, 7, 10], // minor pentatonic — driving, riffy
    progression: [
      [0, 1, 3],
      [3, 4, 0],
      [2, 3, 0],
      [0, 1, 3],
    ],
    bass: { wave: "saw", degrees: [0, 0, 2, 0, 3, 0, 2, 1], gain: 0.32, octave: -2 },
    pad: { wave: "square", gain: 0.03, octave: 0 },
    arp: { wave: "saw", gain: 0.09, octave: 1, steps: [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 3] },
    lead: { wave: "square", gain: 0.13, octave: 1, notes: [0, 2, 3, null, 4, 3, 2, null, 3, 2, 0, null, 2, null, 0, null] },
    drums: {
      kick: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      hatGain: 0.05,
    },
  },
  {
    file: "level-5-false-signal.ogg",
    title: "Final Rift",
    bpm: 150,
    duration: 28,
    key: 41, // F
    scale: [0, 1, 4, 5, 7, 8, 11], // phrygian-dominant — dark, exotic, intense
    progression: [
      [0, 2, 4],
      [0, 2, 4],
      [1, 3, 5],
      [0, 2, 4],
    ],
    bass: { wave: "saw", degrees: [0, 0, 0, 0, 0, 0, 1, 0], gain: 0.34, octave: -2 },
    pad: { wave: "saw", gain: 0.04, octave: 0 },
    arp: { wave: "square", gain: 0.08, octave: 1, steps: [0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 4] },
    lead: { wave: "saw", gain: 0.13, octave: 1, notes: [4, 3, 2, 1, 0, null, 1, 0, 4, 3, 2, null, 1, 0, null, null] },
    drums: {
      kick: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      hat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      hatGain: 0.05,
    },
  },
  {
    file: "level-6-block-pulse.ogg",
    title: "Block Pulse",
    bpm: 118,
    duration: 24,
    key: 48, // C
    scale: [0, 2, 3, 5, 7, 9, 10], // dorian — funky, groovy
    progression: [
      [0, 2, 4],
      [3, 5, 0],
      [0, 2, 4],
      [4, 6, 1],
    ],
    bass: { wave: "square", degrees: [0, null, 0, 2, null, 3, null, 0], gain: 0.32, octave: -2 },
    pad: { wave: "triangle", gain: 0.05, octave: 0 },
    arp: { wave: "triangle", gain: 0.1, octave: 1, steps: [0, null, 1, null, 2, null, 1, null, 0, null, 1, null, 2, null, 1, null] },
    lead: { wave: "triangle", gain: 0.13, octave: 1, notes: [2, null, 4, null, 3, 2, null, 0, 2, null, 4, 5, null, 4, null, null] },
    drums: {
      kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hat: [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0],
      hatGain: 0.05,
    },
  },
  {
    file: "level-7-steel-skyline.ogg",
    title: "Steel Skyline",
    bpm: 128,
    duration: 26,
    key: 43, // G
    scale: [0, 2, 4, 5, 7, 9, 11], // major — anthemic, soaring
    progression: [
      [0, 2, 4],
      [4, 6, 1],
      [5, 0, 2],
      [3, 5, 0],
    ],
    bass: { wave: "saw", degrees: [0, 0, null, 0, 0, null, 0, 4], gain: 0.32, octave: -2 },
    pad: { wave: "saw", gain: 0.06, octave: 0 },
    arp: { wave: "square", gain: 0.08, octave: 1, steps: [0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 1, 2] },
    lead: { wave: "saw", gain: 0.14, octave: 1, notes: [0, null, 2, 4, null, 4, 2, null, 5, null, 4, 2, null, 0, null, null] },
    drums: {
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
      hatGain: 0.05,
    },
  },
  {
    file: "level-8-foundry-overdrive.ogg",
    title: "Foundry Overdrive",
    bpm: 156,
    duration: 27,
    key: 38, // D (low)
    scale: [0, 2, 3, 5, 7, 8, 10], // minor — aggressive, industrial
    progression: [
      [0, 2, 4],
      [5, 0, 2],
      [3, 5, 0],
      [0, 2, 4],
    ],
    bass: { wave: "saw", degrees: [0, 0, 0, 2, 0, 0, 3, 0], gain: 0.36, octave: -1 },
    pad: { wave: "square", gain: 0.03, octave: 0 },
    arp: { wave: "saw", gain: 0.08, octave: 1, steps: [0, 1, 2, 1, 0, 1, 2, 4, 0, 1, 2, 1, 0, 1, 2, 4] },
    lead: { wave: "square", gain: 0.12, octave: 1, notes: [0, 2, 3, 2, 0, null, 3, 2, 4, null, 3, 2, 0, null, null, null] },
    drums: {
      kick: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
      snare: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
      hat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      hatGain: 0.05,
    },
  },
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

/** Adds a single enveloped tone into the float mix buffer. */
function addTone(mix, startSec, durSec, midi, wave, gain, attack = 0.005, release = 0.08) {
  const start = Math.max(0, Math.floor(startSec * SAMPLE_RATE));
  const end = Math.min(mix.length, Math.ceil((startSec + durSec) * SAMPLE_RATE));
  const freq = frequency(midi);
  const total = (end - start) / SAMPLE_RATE;
  for (let i = start; i < end; i += 1) {
    const localT = (i - start) / SAMPLE_RATE;
    const attackGain = Math.min(1, localT / attack);
    const releaseGain = Math.min(1, (total - localT) / release);
    const env = Math.max(0, Math.min(attackGain, releaseGain));
    mix[i] += oscillator(wave, TAU * freq * (i / SAMPLE_RATE)) * gain * env;
  }
}

/** Maps a scale-degree index (can exceed scale length) to a MIDI note. */
function degreeToMidi(key, scale, degree, octaveShift) {
  const len = scale.length;
  const wrapped = ((degree % len) + len) % len;
  const octave = Math.floor(degree / len) + octaveShift;
  return key + scale[wrapped] + octave * 12;
}

function renderTrack(track, index) {
  const frames = Math.round(track.duration * SAMPLE_RATE);
  const mix = new Float32Array(frames);
  const noise = seededNoise(index * 97 + 17);
  const secondsPerBeat = 60 / track.bpm;
  const stepSec = secondsPerBeat / 4; // sixteenth note
  const barSec = secondsPerBeat * 4;
  const barCount = Math.ceil(track.duration / barSec);

  for (let bar = 0; bar < barCount; bar += 1) {
    const barStart = bar * barSec;
    if (barStart >= track.duration) break;
    const chord = track.progression[bar % track.progression.length];
    const chordRoot = chord[0];

    // Sustained pad across the bar.
    if (track.pad) {
      for (const deg of chord) {
        addTone(
          mix,
          barStart,
          barSec * 0.98,
          degreeToMidi(track.key, track.scale, deg, track.pad.octave),
          track.pad.wave,
          track.pad.gain,
          0.06,
          0.3,
        );
      }
    }

    for (let step = 0; step < 16; step += 1) {
      const t = barStart + step * stepSec;
      if (t >= track.duration) break;

      // Bass.
      const bassDeg = track.bass.degrees[step % track.bass.degrees.length];
      if (bassDeg != null) {
        addTone(
          mix,
          t,
          stepSec * 1.6,
          degreeToMidi(track.key, track.scale, chordRoot + bassDeg, track.bass.octave),
          track.bass.wave,
          track.bass.gain,
          0.004,
          0.06,
        );
      }

      // Arpeggio walks the chord tones.
      if (track.arp && track.arp.steps[step] != null) {
        const tone = chord[track.arp.steps[step] % chord.length];
        addTone(
          mix,
          t,
          stepSec * 0.9,
          degreeToMidi(track.key, track.scale, tone, track.arp.octave),
          track.arp.wave,
          track.arp.gain,
          0.004,
          0.05,
        );
      }

      // Stab (rhythmic chord hits) for tracks that define it.
      if (track.stab && track.stab.steps[step]) {
        for (const deg of chord) {
          addTone(
            mix,
            t,
            stepSec * 0.7,
            degreeToMidi(track.key, track.scale, deg, track.stab.octave),
            track.stab.wave,
            track.stab.gain,
            0.004,
            0.05,
          );
        }
      }

      // Lead melody (degrees relative to the key, not the chord).
      const leadDeg = track.lead.notes[step];
      if (leadDeg != null) {
        addTone(
          mix,
          t,
          stepSec * 1.4,
          degreeToMidi(track.key, track.scale, leadDeg, track.lead.octave),
          track.lead.wave,
          track.lead.gain,
          0.006,
          0.07,
        );
      }

      // Drums.
      const drums = track.drums;
      if (drums.kick[step]) {
        const kickStart = Math.floor(t * SAMPLE_RATE);
        for (let i = 0; i < SAMPLE_RATE * 0.16 && kickStart + i < frames; i += 1) {
          const localT = i / SAMPLE_RATE;
          const pitch = 120 - localT * 420;
          mix[kickStart + i] +=
            Math.sin(TAU * Math.max(40, pitch) * localT) * Math.exp(-localT * 24) * 0.85;
        }
      }
      if (drums.snare[step]) {
        const snareStart = Math.floor(t * SAMPLE_RATE);
        for (let i = 0; i < SAMPLE_RATE * 0.13 && snareStart + i < frames; i += 1) {
          const localT = i / SAMPLE_RATE;
          const body = Math.sin(TAU * 190 * localT) * 0.3;
          mix[snareStart + i] += (noise() * 0.6 + body) * Math.exp(-localT * 26) * 0.5;
        }
      }
      if (drums.hat[step]) {
        const hatStart = Math.floor(t * SAMPLE_RATE);
        const hatLen = SAMPLE_RATE * 0.04;
        for (let i = 0; i < hatLen && hatStart + i < frames; i += 1) {
          const localT = i / SAMPLE_RATE;
          mix[hatStart + i] += noise() * Math.exp(-localT * 90) * drums.hatGain;
        }
      }
    }
  }

  // Normalize + soft clip + global fade, then quantize to 16-bit.
  const out = new Int16Array(frames);
  let peak = 0;
  for (let i = 0; i < frames; i += 1) peak = Math.max(peak, Math.abs(mix[i]));
  const normalize = peak > 0 ? 0.92 / peak : 1;
  for (let i = 0; i < frames; i += 1) {
    const t = i / SAMPLE_RATE;
    const fade = Math.min(1, t / 0.05, (track.duration - t) / 0.2);
    let sample = mix[i] * normalize * fade;
    sample = Math.tanh(sample * 1.15); // gentle saturation glue
    out[i] = Math.round(Math.max(-1, Math.min(1, sample)) * 30_000);
  }
  return out;
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
  writeFileSync(wavPath, wavBytes(renderTrack(track, index)));
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

console.log(`Composed ${TRACKS.length} distinct tracks in ${dirname(join(OUTPUT_DIR, TRACKS[0].file))}.`);
