import { describe, expect, it } from "vitest";
import {
  getGauntletStageContent,
  getGauntletStageTrack,
} from "../../src/content/electric-wake-stages";
import { gauntletCatalog } from "../../src/core/gauntlet";
import { recordConservativeDemo } from "../../src/core/level-solver";
import { createRunState, tickRun } from "../../src/core/run-simulation";

const ALL_STAGE_IDS = gauntletCatalog.flatMap((gauntlet) => gauntlet.stages);

describe("gauntlet stages", () => {
  it("returns LevelContent for each authored stage id", () => {
    for (const id of ALL_STAGE_IDS) {
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
    for (const id of ALL_STAGE_IDS) {
      const content = getGauntletStageContent(id);
      expect(content).toBeDefined();
      for (const entity of content!.entities) {
        expect(entity.x + entity.width).toBeLessThanOrEqual(content!.finishX);
      }
    }
  });

  it("makes each stage a normal-sized course backed by bundled music", () => {
    for (const id of ALL_STAGE_IDS) {
      const content = getGauntletStageContent(id)!;
      const track = getGauntletStageTrack(id);
      expect(track, id).toBeDefined();
      expect(track!.audioPath, id).toContain("audio/official/");
      expect(content.beatMap.beats.length, id).toBeGreaterThan(8);
      // Normal-sized: comparable to the official campaign, not a 3-second sprint.
      expect(content.finishX, id).toBeGreaterThan(3_000);
    }
  });

  it("clears every stage under the conservative solver", () => {
    for (const id of ALL_STAGE_IDS) {
      const content = getGauntletStageContent(id)!;
      const demo = recordConservativeDemo(content);
      expect(demo.success, `${id} is not solver-clearable`).toBe(true);
    }
  });

  it("lets the Electric Wake stages clear while auto-jump is held", () => {
    for (const stageId of [
      "electric-wake-1",
      "electric-wake-2",
      "electric-wake-3",
    ]) {
      const content = getGauntletStageContent(stageId)!;
      let state = createRunState(content.rules);

      for (let tick = 0; tick < 2_500 && state.player.x < content.finishX; tick += 1) {
        state = tickRun(state, { jumpPressed: true }, 1000 / 60, content.rules, content.entities);
        expect(
          state.status,
          `${stageId} death=${state.deathCause ?? "none"} x=${state.player.x.toFixed(1)} y=${state.player.y.toFixed(1)}`,
        ).toBe("running");
      }

      expect(state.player.x, stageId).toBeGreaterThanOrEqual(content.finishX);
    }
  });
});
