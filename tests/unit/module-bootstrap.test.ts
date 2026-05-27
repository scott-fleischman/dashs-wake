import { describe, expect, it } from "vitest";
import {
  getOfficialLevelContent,
  officialLevelCatalog,
} from "../../src/content/official-levels";
import { firstWakeLevel } from "../../src/content/first-wake";
import { OFFICIAL_LEVEL_RULES } from "../../src/content/level-rules";

describe("module bootstrap", () => {
  it("loads shared level rules before any authored level content", () => {
    expect(OFFICIAL_LEVEL_RULES.horizontalSpeed).toBeGreaterThan(0);
    expect(OFFICIAL_LEVEL_RULES.spawnY).toBeGreaterThan(0);
  });

  it("loads firstWakeLevel without circular-import initialization errors", () => {
    expect(firstWakeLevel.rules).toBe(OFFICIAL_LEVEL_RULES);
    expect(firstWakeLevel.finishX).toBeGreaterThan(0);
    expect(firstWakeLevel.entities.length).toBeGreaterThan(0);
  });

  it("loads every official level module at import time", () => {
    expect(officialLevelCatalog).toHaveLength(12);

    for (const level of officialLevelCatalog) {
      const content = getOfficialLevelContent(level.id);

      expect(content.rules.horizontalSpeed).toBeGreaterThan(0);
      expect(content.finishX).toBeGreaterThan(0);
      expect(content.entities.length).toBeGreaterThan(0);
      expect(content.beatMap.beats.length).toBeGreaterThan(0);
    }
  });

  it("loads the generator after content modules initialize", async () => {
    const { generateLevel, analyzeLevelDifficulty } = await import(
      "../../src/core/generator"
    );

    expect(typeof generateLevel).toBe("function");
    expect(typeof analyzeLevelDifficulty).toBe("function");
  });
});
