import { describe, expect, it } from "vitest";
import { analyzeAudioFile, analyzeSamples } from "../../src/core/audio-decoder";

const SAMPLE_RATE_HZ = 44100;

function makeSamplesWithImpulses(
  durationMs: number,
  impulses: readonly { amplitude: number; ms: number }[],
): Float32Array {
  const samples = new Float32Array(
    Math.floor((SAMPLE_RATE_HZ * durationMs) / 1000),
  );
  for (const impulse of impulses) {
    const index = Math.floor((impulse.ms / 1000) * SAMPLE_RATE_HZ);
    if (index >= 0 && index < samples.length) {
      samples[index] = impulse.amplitude;
    }
  }
  return samples;
}

describe("audio decoder bridge", () => {
  it("flattens analyzer output to beat times, intensities, and duration", () => {
    const samples = makeSamplesWithImpulses(2000, [
      { amplitude: 0.9, ms: 500 },
      { amplitude: 0.5, ms: 1000 },
    ]);

    const analyzed = analyzeSamples(samples, SAMPLE_RATE_HZ);

    expect(analyzed.durationMs).toBeGreaterThan(1990);
    expect(analyzed.durationMs).toBeLessThan(2010);
    expect(analyzed.beats.length).toBe(analyzed.beatIntensities.length);
    expect(analyzed.beats.length).toBeGreaterThanOrEqual(2);
  });

  it("returns no beats when the input audio is silent", () => {
    const samples = new Float32Array(SAMPLE_RATE_HZ);

    const analyzed = analyzeSamples(samples, SAMPLE_RATE_HZ);

    expect(analyzed.beats).toEqual([]);
    expect(analyzed.beatIntensities).toEqual([]);
  });

  it("returns null when Web Audio is unavailable in the environment", async () => {
    const blob = new Blob([new Uint8Array(64)]);

    const result = await analyzeAudioFile(blob);

    expect(result).toBeNull();
  });
});
