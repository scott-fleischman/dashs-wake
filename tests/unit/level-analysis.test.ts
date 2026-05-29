import { describe, expect, it } from "vitest";
import { firstWakeLevel } from "../../src/content/first-wake";
import { getOfficialLevelContent, officialLevelCatalog } from "../../src/content/official-levels";
import {
  analyzeLevelProfile,
  formatLevelProfileSummary,
} from "../../src/core/level-analysis";
import { recordConservativeDemo } from "../../src/core/level-solver";

describe("level profile analysis", () => {
  it("reports mechanic counts and profile vectors for authored content", () => {
    const demo = recordConservativeDemo(firstWakeLevel);
    const profile = analyzeLevelProfile(firstWakeLevel, demo);

    expect(profile.mechanics.spike).toBeGreaterThan(0);
    expect(profile.mechanics.portalShip).toBeGreaterThan(0);
    expect(profile.vectors.spikeDensityPer1000).toBeGreaterThan(0);
    expect(profile.vectors.verticalExcursion).toBeGreaterThan(0);
    expect(profile.vectors.obstacleVarietyScore).toBeGreaterThan(0);
    expect(profile.vectors.timingTightnessFrames).toBeGreaterThan(0);
    expect(profile.hasWorkingDemo).toBe(demo.success);
    expect(formatLevelProfileSummary(profile).length).toBeGreaterThan(0);
  });

  it("differentiates official levels on ship and spike emphasis", () => {
    const shipHeavy = analyzeLevelProfile(
      getOfficialLevelContent("level_10"),
      recordConservativeDemo(getOfficialLevelContent("level_10")),
    );
    const spikeIntro = analyzeLevelProfile(
      getOfficialLevelContent("level_1"),
      recordConservativeDemo(getOfficialLevelContent("level_1")),
    );

    expect(shipHeavy.vectors.shipFlightRatio).toBeGreaterThan(
      spikeIntro.vectors.shipFlightRatio,
    );
    expect(spikeIntro.mechanics.pad).toBe(0);
  });

  it("exposes analysis for every official level", () => {
    for (const level of officialLevelCatalog) {
      const profile = analyzeLevelProfile(
        getOfficialLevelContent(level.id),
        null,
      );
      expect(profile.difficulty.estimatedDifficulty).toBeGreaterThanOrEqual(0);
      expect(profile.difficulty.estimatedDifficulty).toBeLessThanOrEqual(100);
    }
  });
});
