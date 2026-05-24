import { describe, expect, it } from "vitest";
import {
  applyProgressAward,
  createProfile,
} from "../../src/core/profile";

describe("progress coin award reducer", () => {
  it("awards one coin for each newly reached whole percent on the first attempt", () => {
    const result = applyProgressAward(createProfile(), {
      levelId: "level_1",
      percentReached: 1,
    });

    expect(result.coinsAwarded).toBe(1);
    expect(result.profile.coins).toBe(1);
    expect(result.profile.bestPercents.level_1).toBe(1);
  });

  it("only awards the positive delta when a later attempt exceeds the stored best", () => {
    const first = applyProgressAward(createProfile(), {
      levelId: "level_1",
      percentReached: 50,
    });

    expect(first.coinsAwarded).toBe(50);

    const second = applyProgressAward(first.profile, {
      levelId: "level_1",
      percentReached: 100,
    });

    expect(second.coinsAwarded).toBe(50);
    expect(second.profile.coins).toBe(100);
    expect(second.profile.bestPercents.level_1).toBe(100);
  });

  it("awards nothing when the reached percent does not exceed the stored best", () => {
    const seeded = applyProgressAward(createProfile(), {
      levelId: "level_1",
      percentReached: 40,
    });

    const lower = applyProgressAward(seeded.profile, {
      levelId: "level_1",
      percentReached: 25,
    });

    expect(lower.coinsAwarded).toBe(0);
    expect(lower.profile).toEqual(seeded.profile);

    const equal = applyProgressAward(seeded.profile, {
      levelId: "level_1",
      percentReached: 40,
    });

    expect(equal.coinsAwarded).toBe(0);
    expect(equal.profile).toEqual(seeded.profile);
  });

  it("floors fractional percents so partial progress does not award coins", () => {
    const first = applyProgressAward(createProfile(), {
      levelId: "level_1",
      percentReached: 12.9,
    });

    expect(first.coinsAwarded).toBe(12);
    expect(first.profile.bestPercents.level_1).toBe(12);

    const second = applyProgressAward(first.profile, {
      levelId: "level_1",
      percentReached: 12.99,
    });

    expect(second.coinsAwarded).toBe(0);
    expect(second.profile.bestPercents.level_1).toBe(12);
  });

  it("caps total awarded coins at 100 per level even when percent reached exceeds 100", () => {
    const first = applyProgressAward(createProfile(), {
      levelId: "level_1",
      percentReached: 250,
    });

    expect(first.coinsAwarded).toBe(100);
    expect(first.profile.coins).toBe(100);
    expect(first.profile.bestPercents.level_1).toBe(100);

    const again = applyProgressAward(first.profile, {
      levelId: "level_1",
      percentReached: 100,
    });

    expect(again.coinsAwarded).toBe(0);
    expect(again.profile.coins).toBe(100);
  });

  it("tracks best percents per level so progress on one level does not affect another", () => {
    const afterLevel1 = applyProgressAward(createProfile(), {
      levelId: "level_1",
      percentReached: 30,
    });
    const afterLevel2 = applyProgressAward(afterLevel1.profile, {
      levelId: "level_2",
      percentReached: 10,
    });

    expect(afterLevel2.coinsAwarded).toBe(10);
    expect(afterLevel2.profile.coins).toBe(40);
    expect(afterLevel2.profile.bestPercents.level_1).toBe(30);
    expect(afterLevel2.profile.bestPercents.level_2).toBe(10);
  });

  it("treats negative percents as zero progress without mutating the profile", () => {
    const profile = createProfile();
    const result = applyProgressAward(profile, {
      levelId: "level_1",
      percentReached: -5,
    });

    expect(result.coinsAwarded).toBe(0);
    expect(result.profile).toEqual(profile);
  });
});
