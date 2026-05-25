import { describe, expect, it } from "vitest";
import {
  firstWakeLevel,
  validateLevelReachability,
} from "../../src/content/first-wake";
import type { PortalEntity } from "../../src/core/run-simulation";

const STARTER_MECHANIC_TYPES = new Set([
  "gap",
  "platform",
  "portal",
  "spike",
]);

describe("First Wake content contract", () => {
  it("uses only authored beginner mechanics, with no launch pads or orbs", () => {
    expect(firstWakeLevel.entities.length).toBeGreaterThan(0);

    for (const entity of firstWakeLevel.entities) {
      expect(STARTER_MECHANIC_TYPES.has(entity.type)).toBe(true);
      expect(entity.type).not.toBe("pad");
      expect(entity.type).not.toBe("orb");
    }
  });

  it("ships a placeholder beat map whose duration covers the finish line", () => {
    const traversalMs =
      (firstWakeLevel.finishX / firstWakeLevel.rules.horizontalSpeed) * 1000;

    expect(firstWakeLevel.beatMap.durationMs).toBeGreaterThan(0);
    expect(firstWakeLevel.beatMap.durationMs).toBeGreaterThanOrEqual(traversalMs);
    expect(firstWakeLevel.beatMap.beats.length).toBeGreaterThan(0);

    for (const beat of firstWakeLevel.beatMap.beats) {
      expect(beat).toBeGreaterThanOrEqual(0);
      expect(beat).toBeLessThanOrEqual(firstWakeLevel.beatMap.durationMs);
    }
  });

  it("authors reachable starter segments validated against jump physics", () => {
    const result = validateLevelReachability(firstWakeLevel);

    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("flags content whose gap exceeds the jump arc", () => {
    const maxJump =
      firstWakeLevel.rules.horizontalSpeed *
      ((2 * Math.abs(firstWakeLevel.rules.jumpVelocity)) /
        firstWakeLevel.rules.gravity);

    const result = validateLevelReachability({
      ...firstWakeLevel,
      entities: [
        ...firstWakeLevel.entities,
        { type: "gap", width: maxJump + 10, x: 30 },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.issues.join(" ")).toMatch(/gap/i);
  });

  it("teaches ship mode with one ship portal followed by one cube portal", () => {
    const portals = firstWakeLevel.entities.filter(
      (entity): entity is PortalEntity => entity.type === "portal",
    );
    const shipPortals = portals.filter((portal) => portal.mode === "ship");
    const cubePortals = portals.filter((portal) => portal.mode === "cube");

    expect(shipPortals).toHaveLength(1);
    expect(cubePortals).toHaveLength(1);
    expect(shipPortals[0]!.x).toBeLessThan(cubePortals[0]!.x);
  });

  it("authors a wide, safe ship corridor without hazards between its portals", () => {
    const portals = firstWakeLevel.entities.filter(
      (entity): entity is PortalEntity => entity.type === "portal",
    );
    const shipPortal = portals.find((portal) => portal.mode === "ship");
    const cubePortal = portals.find((portal) => portal.mode === "cube");

    expect(shipPortal).toBeDefined();
    expect(cubePortal).toBeDefined();

    const corridorWidth = cubePortal!.x - shipPortal!.x;
    const minCorridorWidth = 5 * firstWakeLevel.rules.playerWidth;
    expect(corridorWidth).toBeGreaterThanOrEqual(minCorridorWidth);

    const hazardsInCorridor = firstWakeLevel.entities.filter(
      (entity) =>
        (entity.type === "spike" || entity.type === "gap") &&
        entity.x + entity.width > shipPortal!.x &&
        entity.x < cubePortal!.x,
    );
    expect(hazardsInCorridor).toEqual([]);
  });

  it("flags entities whose right edge extends past the finish line", () => {
    const broken = {
      ...firstWakeLevel,
      entities: [
        ...firstWakeLevel.entities,
        {
          type: "spike" as const,
          height: 30,
          width: 30,
          x: firstWakeLevel.finishX + 50,
          y: 270,
        },
      ],
    };

    const result = validateLevelReachability(broken);

    expect(result.ok).toBe(false);
    expect(result.issues.join(" ")).toMatch(/extends past the finish line/);
  });

  it("flags a spike that is wider than the max jump arc", () => {
    const maxJump =
      firstWakeLevel.rules.horizontalSpeed *
      ((2 * Math.abs(firstWakeLevel.rules.jumpVelocity)) /
        firstWakeLevel.rules.gravity);

    const broken = {
      ...firstWakeLevel,
      entities: [
        ...firstWakeLevel.entities,
        {
          type: "spike" as const,
          height: 30,
          width: maxJump + 20,
          x: 30,
          y: 270,
        },
      ],
    };

    const result = validateLevelReachability(broken);

    expect(result.ok).toBe(false);
    expect(result.issues.join(" ")).toMatch(/spike/i);
  });

  it("flags a ship corridor whose width is too tight for safe ship play", () => {
    const minCorridorWidth = 5 * firstWakeLevel.rules.playerWidth;

    const tightCorridor = {
      ...firstWakeLevel,
      entities: [
        ...firstWakeLevel.entities,
        {
          type: "portal" as const,
          mode: "ship" as const,
          height: 80,
          width: 12,
          x: 80,
          y: 240,
        },
        {
          type: "portal" as const,
          mode: "cube" as const,
          height: 80,
          width: 12,
          x: 80 + Math.floor(minCorridorWidth / 3),
          y: 240,
        },
      ],
    };

    const result = validateLevelReachability(tightCorridor);
    expect(result.ok).toBe(false);
    expect(result.issues.join(" ")).toMatch(/ship corridor/i);
  });
});
