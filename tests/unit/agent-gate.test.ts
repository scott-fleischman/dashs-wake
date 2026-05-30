import { describe, expect, it } from "vitest";
import {
  firstWakeLevel,
  validateLevelReachability,
} from "../../src/content/first-wake";
import {
  getOfficialLevelContent,
  officialLevelCatalog,
} from "../../src/content/official-levels";
import { OFFICIAL_LEVEL_RULES } from "../../src/content/level-rules";
import { generateLevel } from "../../src/core/generator";

describe("agent gate: module boot", () => {
  it("loads shared level rules before authored content initializes", () => {
    expect(OFFICIAL_LEVEL_RULES.horizontalSpeed).toBeGreaterThan(0);
    expect(OFFICIAL_LEVEL_RULES.spawnY).toBeGreaterThan(0);
  });

  it("loads firstWakeLevel without circular-import crashes", () => {
    expect(firstWakeLevel.rules).toBe(OFFICIAL_LEVEL_RULES);
    expect(firstWakeLevel.finishX).toBeGreaterThan(0);
    expect(firstWakeLevel.entities.length).toBeGreaterThan(0);
  });

  it("loads every official level at import time", () => {
    expect(officialLevelCatalog).toHaveLength(8);

    for (const level of officialLevelCatalog) {
      const content = getOfficialLevelContent(level.id);

      expect(content.rules.horizontalSpeed).toBeGreaterThan(0);
      expect(content.finishX).toBeGreaterThan(0);
      expect(content.entities.length).toBeGreaterThan(0);
      expect(content.beatMap.beats.length).toBeGreaterThan(0);
    }
  });

  it("loads the generator after content modules initialize", async () => {
    const { analyzeLevelDifficulty } = await import("../../src/core/generator");
    const { analyzeLevelProfile } = await import("../../src/core/level-analysis");
    const { getOfficialLevelDemo } = await import("../../src/content/official-levels");

    expect(typeof generateLevel).toBe("function");
    expect(typeof analyzeLevelDifficulty).toBe("function");
    expect(typeof analyzeLevelProfile).toBe("function");
    for (const level of officialLevelCatalog) {
      expect(getOfficialLevelDemo(level.id), level.id).not.toBeNull();
    }
  });
});

describe("agent gate: level sanity", () => {
  it("validates First Wake reachability constraints", () => {
    const result = validateLevelReachability(firstWakeLevel);

    expect(result.ok, result.issues.join("; ")).toBe(true);
  });

  it("gives every official level spawn support and a finish line", () => {
    for (const level of officialLevelCatalog) {
      const content = getOfficialLevelContent(level.id);
      const spawnSupported = content.entities.some(
        (entity) =>
          entity.type === "block" &&
          entity.y === content.rules.spawnY &&
          entity.x <= content.rules.playerWidth / 2 &&
          entity.x + entity.width > -content.rules.playerWidth / 2,
      );

      expect(spawnSupported, `${level.id} missing spawn support`).toBe(true);
      expect(content.finishX, `${level.id} missing finish`).toBeGreaterThan(
        content.rules.horizontalSpeed * 5,
      );
    }
  });
});

describe("agent gate: generator boot", () => {
  it("generates a playable layout without throwing", () => {
    const level = generateLevel({
      beatMap: { beats: [0, 500, 1000, 1500], durationMs: 1800 },
      beatIntensities: ["quiet", "intense", "quiet", "intense"],
      difficulty: "normal",
      seed: 42,
    });

    expect(level.finishX).toBeGreaterThan(0);
    expect(level.entities.length).toBeGreaterThan(0);
    expect(level.entities.some((entity) => entity.type === "block")).toBe(true);
  });
});
