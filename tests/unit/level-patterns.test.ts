import { describe, expect, it } from "vitest";
import {
  bigClimb,
  CourseBuilder,
  orbLift,
  padVault,
  pitBridge,
  reefGates,
  rest,
  shipReef,
  spikeRhythm,
  trapOrb,
} from "../../src/content/level-patterns";
import { OFFICIAL_LEVEL_RULES } from "../../src/content/level-rules";
import { withSupportingTerrain } from "../../src/content/terrain";
import { buildPlaceholderBeatMap } from "../../src/content/beat-maps";
import type { LevelContent } from "../../src/content/first-wake";
import { recordConservativeDemo } from "../../src/core/level-solver";
import type {
  OrbEntity,
  PortalEntity,
} from "../../src/core/run-simulation";

function assemble(b: CourseBuilder): LevelContent {
  const finishX = b.finishX();
  return {
    beatMap: buildPlaceholderBeatMap(
      finishX,
      OFFICIAL_LEVEL_RULES.horizontalSpeed,
    ),
    entities: withSupportingTerrain(b.entities, finishX, b.channels),
    finishX,
    rules: OFFICIAL_LEVEL_RULES,
  };
}

describe("level pattern language", () => {
  it("layers many patterns into a course the conservative solver clears", () => {
    const b = new CourseBuilder({ idPrefix: "test" });
    rest(b, 300);
    spikeRhythm(b, [1, 2]);
    pitBridge(b, { steps: 6 });
    bigClimb(b, { rise: 200 });
    padVault(b, { impulse: 760, landAhead: 340 });
    shipReef(b, { length: 640, gates: reefGates(b.x, 640) });
    orbLift(b, { count: 3 });
    trapOrb(b, {});
    spikeRhythm(b, [1]);
    rest(b, 220);

    const demo = recordConservativeDemo(assemble(b));
    expect(demo.success).toBe(true);
  });

  it("bigClimb gains real altitude with ramp-up and plateau blocks", () => {
    const b = new CourseBuilder({ idPrefix: "climb" });
    rest(b, 200);
    const beforeTop = b.surfaceY;
    bigClimb(b, { rise: 220 });

    const rampUps = b.entities.filter(
      (entity) => entity.type === "block" && entity.shape === "ramp-up",
    );
    const highPlateau = b.entities.some(
      (entity) =>
        entity.type === "block" &&
        entity.shape === undefined &&
        entity.y <= beforeTop - 200,
    );

    expect(rampUps.length).toBeGreaterThan(0);
    expect(highPlateau).toBe(true);
    expect(b.tags).toContain("vertical");
  });

  it("shipReef emits paired portals, a channel, and portal-challenge tags", () => {
    const b = new CourseBuilder({ idPrefix: "reef" });
    rest(b, 100);
    shipReef(b, { length: 600, gates: reefGates(b.x, 600) });

    const portals = b.entities.filter(
      (entity): entity is PortalEntity => entity.type === "portal",
    );
    expect(portals.filter((p) => p.mode === "ship")).toHaveLength(1);
    expect(portals.filter((p) => p.mode === "cube")).toHaveLength(1);
    expect(b.channels.length).toBe(1);
    expect(b.tags).toContain("ship");
    expect(b.tags).toContain("portal-challenge");
  });

  it("orbLift can mark its orbs as a required route", () => {
    const b = new CourseBuilder({ idPrefix: "lift" });
    const ids = orbLift(b, { count: 4, required: true });
    const orbs = b.entities.filter(
      (entity): entity is OrbEntity => entity.type === "orb",
    );

    expect(orbs).toHaveLength(4);
    expect(ids).toHaveLength(4);
    expect(b.requiredTriggerIds).toEqual(ids);
  });

  it("finishX clears every authored entity for bounds safety", () => {
    const b = new CourseBuilder({ idPrefix: "bounds" });
    rest(b, 200);
    spikeRhythm(b, [2]);
    bigClimb(b, { rise: 180 });
    shipReef(b, { length: 500 });
    const finishX = b.finishX();

    for (const entity of b.entities) {
      expect(entity.x + entity.width).toBeLessThanOrEqual(finishX);
    }
  });
});
