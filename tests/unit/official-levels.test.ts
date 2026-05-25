import { describe, expect, it } from "vitest";
import {
  formatLevelClearList,
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
      expect(level.track.audioPath).toMatch(/\.ogg$/);
      expect(level.track.license).toBe("CC0");
    }
  });

  it("times each expanded course to its bundled CC0 electronic track", () => {
    for (const metadata of officialLevelCatalog) {
      const content = getOfficialLevelContent(metadata.id);
      const traversalMs =
        (content.finishX / content.rules.horizontalSpeed) * 1000;

      expect(content.beatMap.durationMs).toBe(metadata.track.durationMs);
      expect(content.beatMap.durationMs).toBeGreaterThanOrEqual(20_000);
      expect(content.beatMap.durationMs).toBeGreaterThanOrEqual(traversalMs);
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
    for (const pad of pads) {
      expect(pad.y).toBeGreaterThanOrEqual(level2.rules.groundY - pad.height);
    }
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
      expect(orb!.y).toBeLessThan(level3.rules.groundY - orb!.height);
      expect(orb!.y + orb!.height).toBeLessThanOrEqual(
        level3.rules.groundY - level3.rules.playerHeight,
      );
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

  it("authors Level 5 trap choices as normal airborne orbs aimed into spikes", () => {
    const level5 = getOfficialLevelContent("level_5");

    const hasPad = level5.entities.some((entity) => entity.type === "pad");
    const trapChoiceOrbs = level5.entities.filter(
      (entity): entity is OrbEntity =>
        entity.type === "orb" && entity.id.includes("trap"),
    );

    expect(hasPad).toBe(true);
    expect(trapChoiceOrbs.length).toBeGreaterThan(0);
    for (const orb of trapChoiceOrbs) {
      expect(orb.effect.kind).toBe("impulse");
      expect(orb.y).toBeLessThan(level5.rules.groundY - orb.height);
      expect(orb.y + orb.height).toBeLessThanOrEqual(
        level5.rules.groundY - level5.rules.playerHeight,
      );
      expect(
        level5.entities.some(
          (entity) =>
            entity.type === "spike" &&
            entity.y < level5.rules.groundY - entity.height &&
            entity.x > orb.x &&
            entity.x < orb.x + 100,
        ),
      ).toBe(true);
    }
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

  it("formats an empty unlock requirement list as the empty string", () => {
    expect(formatLevelClearList([])).toBe("");
  });

  it("formats a single required level using its display name", () => {
    expect(formatLevelClearList(["level_1"])).toBe("Clear First Wake");
  });

  it("formats multiple required levels joined by commas", () => {
    expect(formatLevelClearList(["level_1", "level_2"])).toBe(
      "Clear First Wake, Launch Sequence",
    );
  });

  it("falls back to the raw id when a level is not in the catalog", () => {
    expect(formatLevelClearList(["level_missing"])).toBe("Clear level_missing");
  });
});
