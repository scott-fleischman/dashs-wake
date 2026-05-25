import { describe, expect, it } from "vitest";
import {
  getOfficialLevelContent,
  officialLevelCatalog,
} from "../../src/content/official-levels";
import {
  firstWakeLevel,
  validateLevelReachability,
} from "../../src/content/first-wake";
import { OFFICIAL_LEVEL_COMPLETION_RULES } from "../../src/core/profile";
import type { OrbEntity } from "../../src/core/run-simulation";

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

    expect(
      byId.get("level_1")?.unlockRequirement.requiredCompletedLevels,
    ).toEqual([]);
    expect(
      byId.get("level_2")?.unlockRequirement.requiredCompletedLevels,
    ).toEqual(["level_1"]);
    expect(
      byId.get("level_3")?.unlockRequirement.requiredCompletedLevels,
    ).toEqual(["level_2"]);
    expect(
      byId.get("level_4")?.unlockRequirement.requiredCompletedLevels,
    ).toEqual(["level_3"]);
    expect(
      byId.get("level_5")?.unlockRequirement.requiredCompletedLevels,
    ).toEqual(["level_4"]);
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

  it("authors Level 3 with safe orbs and a declared required-trigger route", () => {
    const level3 = getOfficialLevelContent("level_3");

    const orbs = level3.entities.filter(
      (entity): entity is OrbEntity => entity.type === "orb",
    );
    const requiredIds = level3.expectedRoute?.requiredTriggerIds ?? [];

    expect(orbs.length).toBeGreaterThan(0);
    expect(requiredIds.length).toBeGreaterThan(0);

    for (const id of requiredIds) {
      const orb = orbs.find((entity) => entity.id === id);
      expect(orb).toBeDefined();
    }
  });

  it("validates Level 3 content as reachable", () => {
    const level3 = getOfficialLevelContent("level_3");

    expect(validateLevelReachability(level3).ok).toBe(true);
  });

  it("flags a level whose declared required trigger id is missing from entities", () => {
    const broken = {
      ...firstWakeLevel,
      expectedRoute: { requiredTriggerIds: ["nonexistent-orb"] },
    };

    const result = validateLevelReachability(broken);

    expect(result.ok).toBe(false);
    expect(result.issues.join(" ")).toMatch(/required trigger/i);
  });

  it("authors Level 4 by combining cube, ship portal, and launch pad mechanics", () => {
    const level4 = getOfficialLevelContent("level_4");

    const hasSpike = level4.entities.some((entity) => entity.type === "spike");
    const hasPortal = level4.entities.some(
      (entity) => entity.type === "portal",
    );
    const hasPad = level4.entities.some((entity) => entity.type === "pad");

    expect(hasSpike).toBe(true);
    expect(hasPortal).toBe(true);
    expect(hasPad).toBe(true);
  });

  it("authors Level 5 with trap orbs alongside earlier mechanics", () => {
    const level5 = getOfficialLevelContent("level_5");

    const hasPad = level5.entities.some((entity) => entity.type === "pad");
    const hasTrapOrb = level5.entities.some(
      (entity): entity is OrbEntity =>
        entity.type === "orb" && entity.effect.kind === "kill",
    );

    expect(hasPad).toBe(true);
    expect(hasTrapOrb).toBe(true);
  });

  it("validates Level 4 and Level 5 content as reachable", () => {
    expect(
      validateLevelReachability(getOfficialLevelContent("level_4")).ok,
    ).toBe(true);
    expect(
      validateLevelReachability(getOfficialLevelContent("level_5")).ok,
    ).toBe(true);
  });

  it("preserves the unlock chain so each level unlocks its successor", () => {
    const ids = officialLevelCatalog.map((level) => level.id);

    for (let i = 0; i < ids.length - 1; i += 1) {
      const current = ids[i]!;
      const next = ids[i + 1]!;
      const rule = OFFICIAL_LEVEL_COMPLETION_RULES[current];

      expect(rule?.unlocks).toContain(next);
    }
  });

  it("awards a key on first completion of every official level", () => {
    for (const meta of officialLevelCatalog) {
      const rule = OFFICIAL_LEVEL_COMPLETION_RULES[meta.id];

      expect(rule?.keyAwarded).toBeDefined();
      expect(rule?.keyAwarded?.amount ?? 0).toBeGreaterThan(0);
    }
  });
});
