import { describe, expect, it } from "vitest";
import {
  formatLevelClearList,
  getOfficialLevelContent,
  getOfficialLevelProfile,
  officialLevelCatalog,
} from "../../src/content/official-levels";
import {
  firstWakeLevel,
  validateLevelReachability,
} from "../../src/content/first-wake";
import { OFFICIAL_LEVEL_COMPLETION_RULES } from "../../src/core/profile";
import type { OrbEntity } from "../../src/core/run-simulation";

describe("Official level catalog", () => {
  it("chains unlocks across five curated levels", () => {
    const byId = new Map(
      officialLevelCatalog.map((level) => [level.id, level]),
    );

    expect(
      byId.get("level_1")?.unlockRequirement.requiredCompletedLevels,
    ).toEqual([]);
    expect(
      byId.get("level_5")?.unlockRequirement.requiredCompletedLevels,
    ).toEqual(["level_4"]);
  });

  it("times each course inside its bundled track", () => {
    for (const metadata of officialLevelCatalog) {
      const content = getOfficialLevelContent(metadata.id);
      const traversalMs =
        (content.finishX / content.rules.horizontalSpeed) * 1000;

      expect(content.beatMap.durationMs).toBe(metadata.track.durationMs);
      expect(content.beatMap.durationMs).toBeGreaterThanOrEqual(traversalMs);
    }
  });

  it("includes pit ascents with visible vertical variety in Hollow Steps", () => {
    const content = getOfficialLevelContent("level_2");
    const profile = getOfficialLevelProfile("level_2");

    expect(
      content.entities.some(
        (entity) => entity.type === "block" && entity.shape === "ramp-up",
      ),
    ).toBe(true);
    expect(profile.vectors.verticalExcursion).toBeGreaterThan(90);
    expect(
      content.entities.filter((entity) => entity.type === "decoration").length,
    ).toBeGreaterThan(2);
  });

  it("authors Prism Ascent with required airborne orbs", () => {
    const level4 = getOfficialLevelContent("level_4");
    const orbs = level4.entities.filter(
      (entity): entity is OrbEntity => entity.type === "orb",
    );
    const requiredIds = level4.expectedRoute?.requiredTriggerIds ?? [];

    expect(orbs.length).toBeGreaterThanOrEqual(4);
    expect(requiredIds.length).toBe(4);
    expect(validateLevelReachability(level4).ok).toBe(true);
  });

  it("authors Final Rift with ship flight and optional trap orbs", () => {
    const level5 = getOfficialLevelContent("level_5");
    const trapOrbs = level5.entities.filter(
      (entity): entity is OrbEntity =>
        entity.type === "orb" && entity.id.includes("trap"),
    );

    expect(
      level5.entities.some(
        (entity) => entity.type === "portal" && entity.mode === "ship",
      ),
    ).toBe(true);
    expect(trapOrbs.length).toBeGreaterThan(0);
  });

  it("preserves completion rewards through level 5", () => {
    const ids = officialLevelCatalog.map((level) => level.id);

    for (let i = 0; i < ids.length - 1; i += 1) {
      const current = ids[i]!;
      const next = ids[i + 1]!;
      expect(OFFICIAL_LEVEL_COMPLETION_RULES[current]?.unlocks).toContain(next);
    }

    expect(OFFICIAL_LEVEL_COMPLETION_RULES.level_5?.keyAwarded).toBeDefined();
  });

  it("formats unlock requirements using display names", () => {
    expect(formatLevelClearList(["level_1", "level_2"])).toBe(
      "Clear First Wake, Hollow Steps",
    );
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
});
