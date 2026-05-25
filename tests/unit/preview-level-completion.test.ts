import { describe, expect, it } from "vitest";
import {
  createProfile,
  previewLevelCompletionReward,
} from "../../src/core/profile";

describe("previewLevelCompletionReward", () => {
  it("includes the rule's awarded key on the first completion", () => {
    const profile = createProfile();
    expect(previewLevelCompletionReward(profile, "level_1")).toEqual({
      coinsAwarded: 100,
      keysAwarded: { easy: 1 },
    });
  });

  it("returns just the coin delta from the previous best when the level is already complete", () => {
    const profile = {
      ...createProfile(),
      bestPercents: { level_1: 100 },
      completedLevels: ["level_1"],
    };
    expect(previewLevelCompletionReward(profile, "level_1")).toEqual({});
  });

  it("counts only the unclaimed percent gap when a partial best already exists", () => {
    const profile = {
      ...createProfile(),
      bestPercents: { level_1: 60 },
    };
    expect(previewLevelCompletionReward(profile, "level_1")).toEqual({
      coinsAwarded: 40,
      keysAwarded: { easy: 1 },
    });
  });

  it("returns no reward when the level id has no completion rule", () => {
    const profile = createProfile();
    expect(previewLevelCompletionReward(profile, "unknown-level")).toEqual({
      coinsAwarded: 100,
    });
  });
});
