import { describe, expect, it } from "vitest";
import { chestRewardSummary } from "../../src/ui/chest-room";

describe("chest reward summary", () => {
  it("describes a coins-only reward", () => {
    expect(chestRewardSummary({ coinsAwarded: 50 })).toBe("50 coins");
  });

  it("describes a coins + cosmetic reward joined by a plus", () => {
    expect(
      chestRewardSummary({
        coinsAwarded: 120,
        cosmeticAwarded: "icon-spark",
      }),
    ).toBe("120 coins + Spark");
  });

  it("uses the cosmetic id when the catalog has no matching item", () => {
    expect(
      chestRewardSummary({
        coinsAwarded: 0,
        cosmeticAwarded: "icon-unknown",
      }),
    ).toBe("icon-unknown");
  });

  it("returns an empty string for an empty reward shape", () => {
    expect(chestRewardSummary({})).toBe("");
  });
});
