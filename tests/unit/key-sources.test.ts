import { describe, expect, it } from "vitest";
import { describeKeySource } from "../../src/core/key-sources";

describe("describeKeySource", () => {
  it("lists the easy-key sources by level name", () => {
    expect(describeKeySource("easy")).toBe(
      "Earn from First Wake, Hollow Steps",
    );
  });

  it("lists the normal-key sources by level name", () => {
    expect(describeKeySource("normal")).toBe(
      "Earn from Neon Drift, Prism Ascent",
    );
  });

  it("includes gauntlet sources when they award the requested key", () => {
    expect(describeKeySource("hard")).toContain("Electric Wake Gauntlet");
  });

  it("lists insane-key sources across the final level and gauntlets", () => {
    const insane = describeKeySource("insane");
    expect(insane).toContain("Final Rift");
    expect(insane).toContain("Skyline Trial Gauntlet");
    expect(insane).toContain("Void Circuit Gauntlet");
  });

  it("returns empty string when no level or gauntlet awards the key", () => {
    expect(describeKeySource("mythic")).toBe("");
  });
});
