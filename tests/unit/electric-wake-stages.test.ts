import { describe, expect, it } from "vitest";
import { getGauntletStageContent } from "../../src/content/electric-wake-stages";
import { gauntletCatalog } from "../../src/core/gauntlet";
import { createRunState, tickRun } from "../../src/core/run-simulation";

describe("gauntlet stages", () => {
  it("returns LevelContent for each authored stage id", () => {
    for (const id of gauntletCatalog.flatMap((gauntlet) => gauntlet.stages)) {
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
    expect(gauntletCatalog).toHaveLength(3);
    for (const gauntlet of gauntletCatalog) {
      for (const stageId of gauntlet.stages) {
        expect(getGauntletStageContent(stageId)).toBeDefined();
      }
    }
  });

  it("keeps every entity inside each stage's finish line", () => {
    for (const id of gauntletCatalog.flatMap((gauntlet) => gauntlet.stages)) {
      const content = getGauntletStageContent(id);
      expect(content).toBeDefined();
      for (const entity of content!.entities) {
        expect(entity.x + entity.width).toBeLessThanOrEqual(content!.finishX);
      }
    }
  });

  it("allows the introductory cube stages to clear while auto-jump is held", () => {
    for (const stageId of ["electric-wake-1", "electric-wake-2"]) {
      const content = getGauntletStageContent(stageId)!;
      let state = createRunState(content.rules);

      for (let tick = 0; tick < 300 && state.player.x < content.finishX; tick += 1) {
        state = tickRun(state, { jumpPressed: true }, 1000 / 60, content.rules, content.entities);
        expect(
          state.status,
          `${stageId} death=${state.deathCause ?? "none"} x=${state.player.x.toFixed(1)} y=${state.player.y.toFixed(1)}`,
        ).toBe("running");
      }

      expect(state.player.x).toBeGreaterThanOrEqual(content.finishX);
    }
  });
});
