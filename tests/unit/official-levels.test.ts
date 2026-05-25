import { describe, expect, it } from "vitest";
import {
  getOfficialLevelContent,
  officialLevelCatalog,
} from "../../src/content/official-levels";
import { validateLevelReachability } from "../../src/content/first-wake";

describe("Official level catalog", () => {
  it("publishes metadata for the five official launch levels in order", () => {
    expect(officialLevelCatalog).toHaveLength(5);
    expect(officialLevelCatalog.map((level) => level.id)).toEqual([
      "level_1",
      "level_2",
      "level_3",
      "level_4",
      "level_5",
    ]);
  });

  it("chains official unlocks so each later level requires the previous", () => {
    const byId = new Map(
      officialLevelCatalog.map((level) => [level.id, level]),
    );

    expect(byId.get("level_1")?.unlockedBy).toBeNull();
    expect(byId.get("level_2")?.unlockedBy).toBe("level_1");
    expect(byId.get("level_3")?.unlockedBy).toBe("level_2");
    expect(byId.get("level_4")?.unlockedBy).toBe("level_3");
    expect(byId.get("level_5")?.unlockedBy).toBe("level_4");
  });

  it("names every level with a non-empty display string and difficulty", () => {
    for (const level of officialLevelCatalog) {
      expect(level.name.length).toBeGreaterThan(0);
      expect(level.difficulty.length).toBeGreaterThan(0);
    }
  });

  it("introduces launch pads in Level 2 with no required orb timing", () => {
    const level2 = getOfficialLevelContent("level_2");
    const pads = level2.entities.filter((entity) => entity.type === "pad");
    const orbs = level2.entities.filter(
      (entity) => (entity as { type: string }).type === "orb",
    );

    expect(pads.length).toBeGreaterThan(0);
    expect(orbs).toEqual([]);
  });

  it("validates Level 2 content as reachable", () => {
    const level2 = getOfficialLevelContent("level_2");

    expect(validateLevelReachability(level2).ok).toBe(true);
  });
});
