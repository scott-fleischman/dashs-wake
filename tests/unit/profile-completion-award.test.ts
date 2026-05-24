import { describe, expect, it } from "vitest";
import {
  applyCompletionAward,
  createProfile,
  OFFICIAL_LEVEL_COMPLETION_RULES,
} from "../../src/core/profile";

describe("level completion award reducer", () => {
  it("awards one Easy key and unlocks Level 2 the first time Level 1 is completed", () => {
    const result = applyCompletionAward(createProfile(), {
      levelId: "level_1",
    });

    expect(result.keysAwarded).toEqual({ easy: 1 });
    expect(result.unlockedLevels).toEqual(["level_2"]);
    expect(result.profile.keys.easy).toBe(1);
    expect(result.profile.unlockedLevels).toContain("level_2");
    expect(result.profile.completedLevels).toContain("level_1");
  });

  it("does not award additional keys when Level 1 is completed again", () => {
    const first = applyCompletionAward(createProfile(), {
      levelId: "level_1",
    });

    const second = applyCompletionAward(first.profile, {
      levelId: "level_1",
    });

    expect(second.keysAwarded).toEqual({});
    expect(second.unlockedLevels).toEqual([]);
    expect(second.profile.keys.easy).toBe(1);
    expect(second.profile.unlockedLevels).toEqual(first.profile.unlockedLevels);
    expect(second.profile.completedLevels).toEqual(first.profile.completedLevels);
  });

  it("does not unlock Level 2 when an unrelated level is completed", () => {
    const result = applyCompletionAward(createProfile(), {
      levelId: "level_unrelated",
    });

    expect(result.unlockedLevels).toEqual([]);
    expect(result.profile.unlockedLevels).not.toContain("level_2");
    expect(result.profile.keys).toEqual({});
    expect(result.profile.completedLevels).toContain("level_unrelated");
  });

  it("treats the unlock state as idempotent when a level is already unlocked", () => {
    const seeded = applyCompletionAward(createProfile(), {
      levelId: "level_1",
    });

    const replayed = applyCompletionAward(seeded.profile, {
      levelId: "level_1",
    });

    const unlockedCount = replayed.profile.unlockedLevels.filter(
      (id) => id === "level_2",
    ).length;
    expect(unlockedCount).toBe(1);
  });

  it("uses an externally provided rule table so unlock requirements are data-driven", () => {
    const customRules = {
      bonus_stage: {
        keyAwarded: { type: "gold", amount: 2 },
        unlocks: ["secret_room"],
      },
    };

    const result = applyCompletionAward(
      createProfile(),
      { levelId: "bonus_stage" },
      customRules,
    );

    expect(result.keysAwarded).toEqual({ gold: 2 });
    expect(result.unlockedLevels).toEqual(["secret_room"]);
    expect(result.profile.keys.gold).toBe(2);
    expect(result.profile.unlockedLevels).toContain("secret_room");
  });

  it("declares Level 1 completion as the source of Level 2 unlock in the default rules", () => {
    expect(OFFICIAL_LEVEL_COMPLETION_RULES.level_1).toEqual({
      keyAwarded: { type: "easy", amount: 1 },
      unlocks: ["level_2"],
    });
  });
});
