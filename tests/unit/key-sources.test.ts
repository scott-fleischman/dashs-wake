import { describe, expect, it } from "vitest";
import { describeKeySource } from "../../src/core/key-sources";

describe("describeKeySource", () => {
  it("lists the easy-key sources by level name", () => {
    expect(describeKeySource("easy")).toBe(
      "Earn from First Wake, Launch Sequence",
    );
  });

  it("lists the normal-key sources by level name", () => {
    expect(describeKeySource("normal")).toBe(
      "Earn from Orbital Loop, Combined Run",
    );
  });

  it("includes gauntlet sources when they award the requested key", () => {
    expect(describeKeySource("hard")).toContain("Trap Lane");
    expect(describeKeySource("hard")).toContain("Electric Wake Gauntlet");
  });

  it("returns empty string when no level or gauntlet awards the key", () => {
    expect(describeKeySource("mythic")).toBe("");
  });
});
