import { describe, expect, it } from "vitest";
import {
  applyReward,
  createProfile,
  type Reward,
} from "../../src/core/profile";

describe("applyReward", () => {
  it("returns a structurally equal profile when the reward is empty", () => {
    const profile = createProfile();
    const reward: Reward = {};

    const next = applyReward(profile, reward);

    expect(next).toEqual(profile);
  });

  it("adds coins on top of the profile's existing balance", () => {
    const profile = { ...createProfile(), coins: 10 };

    const next = applyReward(profile, { coinsAwarded: 25 });

    expect(next.coins).toBe(35);
  });

  it("merges key counts cumulatively across types", () => {
    const profile = {
      ...createProfile(),
      keys: { easy: 1, normal: 1 },
    };

    const next = applyReward(profile, {
      keysAwarded: { easy: 2, hard: 1 },
    });

    expect(next.keys).toEqual({ easy: 3, normal: 1, hard: 1 });
  });

  it("deduplicates cosmetic awards against already owned items", () => {
    const profile = {
      ...createProfile(),
      ownedCosmetics: ["icon-spark"],
    };

    const next = applyReward(profile, {
      cosmeticsAwarded: ["icon-spark", "icon-pulse"],
    });

    expect(next.ownedCosmetics).toEqual(["icon-spark", "icon-pulse"]);
  });

  it("deduplicates unlock awards against already unlocked levels", () => {
    const profile = {
      ...createProfile(),
      unlockedLevels: ["level_2"],
    };

    const next = applyReward(profile, {
      unlocks: ["level_2", "level_3"],
    });

    expect(next.unlockedLevels).toEqual(["level_2", "level_3"]);
  });

  it("applies coins, keys, cosmetics, and unlocks together in one pass", () => {
    const profile = createProfile();

    const next = applyReward(profile, {
      coinsAwarded: 100,
      cosmeticsAwarded: ["icon-spark"],
      keysAwarded: { easy: 1 },
      unlocks: ["level_2"],
    });

    expect(next.coins).toBe(100);
    expect(next.keys).toEqual({ easy: 1 });
    expect(next.ownedCosmetics).toContain("icon-spark");
    expect(next.unlockedLevels).toEqual(["level_2"]);
  });
});
