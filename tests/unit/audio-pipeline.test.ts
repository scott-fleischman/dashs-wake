import { describe, expect, it } from "vitest";
import { analyzeAudio } from "../../src/core/audio-analyzer";
import { analysisToGeneratorInput } from "../../src/core/audio-bridge";
import { generateLevel } from "../../src/core/generator";

const SAMPLE_RATE_HZ = 44100;

function buildSamplesWithImpulses(
  durationMs: number,
  impulseMs: readonly number[],
): Float32Array {
  const samples = new Float32Array(
    Math.floor((SAMPLE_RATE_HZ * durationMs) / 1000),
  );
  for (const ms of impulseMs) {
    const index = Math.floor((ms / 1000) * SAMPLE_RATE_HZ);
    if (index >= 0 && index < samples.length) {
      samples[index] = 0.9;
    }
  }
  return samples;
}

describe("audio pipeline integration", () => {
  it("flows samples through analyzer, bridge, and generator into a sensible level", () => {
    const samples = buildSamplesWithImpulses(3000, [500, 1000, 1500, 2000]);

    const analysis = analyzeAudio({ sampleRateHz: SAMPLE_RATE_HZ, samples });
    const generatorInput = analysisToGeneratorInput(analysis, {
      difficulty: "normal",
      seed: 7,
    });
    const level = generateLevel(generatorInput);

    expect(analysis.beats.length).toBeGreaterThanOrEqual(4);
    expect(generatorInput.beatMap.beats.length).toBe(analysis.beats.length);
    expect(generatorInput.beatIntensities?.length).toBe(analysis.beats.length);
    expect(level.beatMap.durationMs).toBeCloseTo(3000, 0);
    expect(level.finishX).toBeGreaterThan(0);
  });

  it("produces deterministic levels for the same audio fixture and seed", () => {
    const samples = buildSamplesWithImpulses(2000, [500, 1000, 1500]);
    const generatorInput = analysisToGeneratorInput(
      analyzeAudio({ sampleRateHz: SAMPLE_RATE_HZ, samples }),
      { difficulty: "normal", seed: 42 },
    );

    const a = generateLevel(generatorInput);
    const b = generateLevel(generatorInput);

    expect(a.entities).toEqual(b.entities);
    expect(a.finishX).toBe(b.finishX);
  });
});
