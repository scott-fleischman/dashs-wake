import { describe, expect, it } from "vitest";
import { formatRewardSummary } from "../../src/core/reward-summary";

describe("formatRewardSummary", () => {
  it("formats a coins-only reward", () => {
    expect(formatRewardSummary({ coinsAwarded: 150 })).toBe("150 Coins");
  });

  it("renders 1 coin without pluralizing", () => {
    expect(formatRewardSummary({ coinsAwarded: 1 })).toBe("1 Coin");
  });

  it("joins coins with awarded keys using the key type label", () => {
    expect(
      formatRewardSummary({
        coinsAwarded: 150,
        keysAwarded: { hard: 1 },
      }),
    ).toBe("150 Coins + 1 Hard Key");
  });

  it("lists multiple key types in a stable order", () => {
    expect(
      formatRewardSummary({
        keysAwarded: { easy: 2, normal: 1, hard: 3 },
      }),
    ).toBe("2 Easy Keys + 1 Normal Key + 3 Hard Keys");
  });

  it("appends cosmetics by their catalog name", () => {
    expect(
      formatRewardSummary({
        coinsAwarded: 120,
        cosmeticsAwarded: ["icon-spark"],
      }),
    ).toBe("120 Coins + Spark");
  });

  it("returns an empty string when nothing was awarded", () => {
    expect(formatRewardSummary({})).toBe("");
  });
});
