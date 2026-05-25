import { describe, expect, it } from "vitest";
import { getGauntletStageContent } from "../../src/content/electric-wake-stages";
import { gauntletCatalog } from "../../src/core/gauntlet";

describe("electric wake gauntlet stages", () => {
  it("returns LevelContent for each authored stage id", () => {
    for (const id of ["electric-wake-1", "electric-wake-2", "electric-wake-3"]) {
      const content = getGauntletStageContent(id);
      expect(content).toBeDefined();
      expect(content?.finishX).toBeGreaterThan(0);
      expect(content?.entities.length).toBeGreaterThan(0);
    }
  });

  it("returns undefined for an unknown stage id", () => {
    expect(getGauntletStageContent("unknown-stage")).toBeUndefined();
  });

  it("supplies content for every stage referenced by the gauntlet catalog", () => {
    const electricWake = gauntletCatalog.find(
      (entry) => entry.id === "electric-wake",
    );

    expect(electricWake).toBeDefined();
    for (const stageId of electricWake!.stages) {
      expect(getGauntletStageContent(stageId)).toBeDefined();
    }
  });

  it("keeps every entity inside each stage's finish line", () => {
    for (const id of ["electric-wake-1", "electric-wake-2", "electric-wake-3"]) {
      const content = getGauntletStageContent(id);
      expect(content).toBeDefined();
      for (const entity of content!.entities) {
        expect(entity.x + entity.width).toBeLessThanOrEqual(content!.finishX);
      }
    }
  });
});
