import { describe, expect, it } from "vitest";
import {
  analyzeAudio,
  type AnalyzerInput,
} from "../../src/core/audio-analyzer";
import { analysisToGeneratorInput } from "../../src/core/audio-bridge";

const SAMPLE_RATE_HZ = 44100;

interface FixtureImpulse {
  amplitude: number;
  ms: number;
}

function makeFixture(opts: {
  durationMs: number;
  impulses: readonly FixtureImpulse[];
  sampleRateHz?: number;
}): AnalyzerInput {
  const sampleRateHz = opts.sampleRateHz ?? SAMPLE_RATE_HZ;
  const samples = new Float32Array(
    Math.floor((sampleRateHz * opts.durationMs) / 1000),
  );

  for (const impulse of opts.impulses) {
    const index = Math.floor((impulse.ms / 1000) * sampleRateHz);
    if (index >= 0 && index < samples.length) {
      samples[index] = impulse.amplitude;
    }
  }

  return { sampleRateHz, samples };
}

describe("audio analyzer", () => {
  it("reports the duration of the analyzed buffer within tolerance", () => {
    const input = makeFixture({ durationMs: 5000, impulses: [] });

    const analysis = analyzeAudio(input);

    expect(analysis.durationMs).toBeGreaterThan(4990);
    expect(analysis.durationMs).toBeLessThan(5010);
  });

  it("detects beats at impulse positions within a 50ms tolerance", () => {
    const input = makeFixture({
      durationMs: 3000,
      impulses: [
        { amplitude: 0.9, ms: 500 },
        { amplitude: 0.9, ms: 1000 },
        { amplitude: 0.9, ms: 1500 },
      ],
    });

    const analysis = analyzeAudio(input);

    expect(analysis.beats.length).toBeGreaterThanOrEqual(3);
    for (const expectedMs of [500, 1000, 1500]) {
      const match = analysis.beats.find(
        (beat) => Math.abs(beat.ms - expectedMs) < 50,
      );
      expect(match).toBeDefined();
    }
  });

  it("marks high-amplitude impulses as strong beats", () => {
    const input = makeFixture({
      durationMs: 2000,
      impulses: [
        { amplitude: 0.95, ms: 500 },
        { amplitude: 0.55, ms: 1000 },
      ],
    });

    const analysis = analyzeAudio(input);

    const strong = analysis.beats.find((beat) => beat.strong);
    const weak = analysis.beats.find((beat) => !beat.strong);

    expect(strong).toBeDefined();
    expect(weak).toBeDefined();
  });

  it("bridges its analysis into a generator input that preserves beats and durations", () => {
    const input = makeFixture({
      durationMs: 2000,
      impulses: [
        { amplitude: 0.9, ms: 500 },
        { amplitude: 0.5, ms: 1000 },
      ],
    });

    const analysis = analyzeAudio(input);
    const generatorInput = analysisToGeneratorInput(analysis, {
      difficulty: "normal",
      seed: 42,
    });

    expect(generatorInput.beatMap.durationMs).toBe(analysis.durationMs);
    expect(generatorInput.beatMap.beats.length).toBe(analysis.beats.length);
    expect(generatorInput.beatIntensities?.length).toBe(analysis.beats.length);
    expect(generatorInput.difficulty).toBe("normal");
    expect(generatorInput.seed).toBe(42);
  });

  it("classifies sections as quiet or intense from impulse density", () => {
    const input = makeFixture({
      durationMs: 4000,
      impulses: [
        { amplitude: 0.9, ms: 100 },
        { amplitude: 0.9, ms: 300 },
        { amplitude: 0.9, ms: 500 },
        { amplitude: 0.9, ms: 700 },
        { amplitude: 0.9, ms: 900 },
        { amplitude: 0.9, ms: 1100 },
        { amplitude: 0.9, ms: 1300 },
        { amplitude: 0.9, ms: 1500 },
      ],
    });

    const analysis = analyzeAudio(input);

    expect(analysis.sections.length).toBeGreaterThan(0);
    expect(
      analysis.sections.some((section) => section.intensity === "intense"),
    ).toBe(true);
    expect(
      analysis.sections.some((section) => section.intensity === "quiet"),
    ).toBe(true);
  });
});
