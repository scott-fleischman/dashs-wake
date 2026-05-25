export type Intensity = "intense" | "quiet";

export interface AnalyzedBeat {
  intensity: Intensity;
  ms: number;
  strong: boolean;
}

export interface AnalyzedSection {
  endMs: number;
  intensity: Intensity;
  startMs: number;
}

export interface AudioAnalysis {
  beats: readonly AnalyzedBeat[];
  durationMs: number;
  sections: readonly AnalyzedSection[];
}

export interface AnalyzerInput {
  sampleRateHz: number;
  samples: Float32Array;
}

const BEAT_AMPLITUDE_THRESHOLD = 0.4;
const STRONG_BEAT_AMPLITUDE_THRESHOLD = 0.8;
const BEAT_DEBOUNCE_MS = 50;
const SECTION_WINDOW_MS = 1000;
const INTENSE_BEATS_PER_SECTION = 3;

function detectBeats(input: AnalyzerInput): AnalyzedBeat[] {
  const beats: AnalyzedBeat[] = [];
  const debounceSamples = Math.max(
    1,
    Math.round((BEAT_DEBOUNCE_MS / 1000) * input.sampleRateHz),
  );

  let lastBeatIndex = -debounceSamples;

  for (let i = 0; i < input.samples.length; i += 1) {
    const amplitude = Math.abs(input.samples[i] ?? 0);
    if (
      amplitude >= BEAT_AMPLITUDE_THRESHOLD &&
      i - lastBeatIndex >= debounceSamples
    ) {
      const strong = amplitude >= STRONG_BEAT_AMPLITUDE_THRESHOLD;
      beats.push({
        intensity: strong ? "intense" : "quiet",
        ms: (i / input.sampleRateHz) * 1000,
        strong,
      });
      lastBeatIndex = i;
    }
  }

  return beats;
}

function classifySections(
  durationMs: number,
  beats: readonly AnalyzedBeat[],
): AnalyzedSection[] {
  const sections: AnalyzedSection[] = [];

  for (let startMs = 0; startMs < durationMs; startMs += SECTION_WINDOW_MS) {
    const endMs = Math.min(startMs + SECTION_WINDOW_MS, durationMs);
    const count = beats.filter(
      (beat) => beat.ms >= startMs && beat.ms < endMs,
    ).length;
    sections.push({
      endMs,
      intensity: count >= INTENSE_BEATS_PER_SECTION ? "intense" : "quiet",
      startMs,
    });
  }

  return sections;
}

export function analyzeAudio(input: AnalyzerInput): AudioAnalysis {
  const durationMs = (input.samples.length / input.sampleRateHz) * 1000;
  const beats = detectBeats(input);
  const sections = classifySections(durationMs, beats);

  return { beats, durationMs, sections };
}
