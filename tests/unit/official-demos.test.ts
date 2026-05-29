import { describe, expect, it } from "vitest";
import {
  getOfficialLevelContent,
  getOfficialLevelDemo,
  officialLevelCatalog,
} from "../../src/content/official-levels";
import { validateLevelReachability } from "../../src/content/first-wake";
import { recordConservativeDemo } from "../../src/core/level-solver";

describe("official handcrafted demos", () => {
  it("publishes five official levels", () => {
    expect(officialLevelCatalog).toHaveLength(5);
    expect(officialLevelCatalog.map((level) => level.id)).toEqual([
      "level_1",
      "level_2",
      "level_3",
      "level_4",
      "level_5",
    ]);
  });

  it("validates reachability and records a successful demo for every official level", () => {
    for (const level of officialLevelCatalog) {
      const content = getOfficialLevelContent(level.id);
      const validation = validateLevelReachability(content);
      const demo = recordConservativeDemo(content);

      expect(validation.ok, validation.issues.join("; ")).toBe(true);
      expect(demo.success, `${level.id} demo stopped early`).toBe(true);
      expect(getOfficialLevelDemo(level.id)).not.toBeNull();
    }
  });
});
