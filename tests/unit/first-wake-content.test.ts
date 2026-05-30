import { describe, expect, it } from "vitest";
import {
  firstWakeLevel,
  validateLevelReachability,
} from "../../src/content/first-wake";
import {
  createRunState,
  tickRun,
  type LevelEntity,
  type PortalEntity,
} from "../../src/core/run-simulation";
import { buildSupportingTerrain } from "../../src/content/terrain";

const STARTER_MECHANIC_TYPES = new Set([
  "block",
  "decoration",
  "portal",
  "spike",
]);

function canClearContiguousSpikes(count: number): boolean {
  const firstSpikeX = 300;
  const spikes: readonly LevelEntity[] = Array.from(
    { length: count },
    (_, index) => ({
      type: "spike",
      height: 30,
      width: 30,
      x: firstSpikeX + index * 30,
      y: 270,
    }),
  );
  const endX =
    firstSpikeX + count * 30 + firstWakeLevel.rules.playerWidth / 2;
  const entities = [...buildSupportingTerrain(endX + 100), ...spikes];

  for (let lead = 0; lead <= 200; lead += 1) {
    let state = {
      ...createRunState(firstWakeLevel.rules),
      player: {
        ...createRunState(firstWakeLevel.rules).player,
        x: firstSpikeX - lead,
      },
    };

    for (let tick = 0; tick < 120; tick += 1) {
      state = tickRun(
        state,
        { jumpPressed: tick === 0 },
        1000 / 60,
        firstWakeLevel.rules,
        entities,
      );

      if (state.status === "dead") {
        break;
      }

      if (state.player.x >= endX) {
        return true;
      }
    }
  }

  return false;
}

describe("First Wake content contract", () => {
  it("uses the accelerated player pace", () => {
    expect(firstWakeLevel.rules.horizontalSpeed).toBe(240);
  });

  it("uses only authored beginner mechanics, with no launch pads or orbs", () => {
    expect(firstWakeLevel.entities.length).toBeGreaterThan(0);

    for (const entity of firstWakeLevel.entities) {
      expect(STARTER_MECHANIC_TYPES.has(entity.type)).toBe(true);
      expect(entity.type).not.toBe("pad");
      expect(entity.type).not.toBe("orb");
    }
  });

  it("ships a soundtrack beat map whose duration covers the finish line", () => {
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

  it("limits a normal cube jump to a tightly timed three-spike clear", () => {
    expect(canClearContiguousSpikes(3)).toBe(true);
    expect(canClearContiguousSpikes(4)).toBe(false);
  });

  it("flags content without an explicit starting support block", () => {
    const result = validateLevelReachability({
      ...firstWakeLevel,
      entities: firstWakeLevel.entities.filter(
        (entity) => entity.type !== "block",
      ),
    });

    expect(result.ok).toBe(false);
    expect(result.issues.join(" ")).toMatch(/supporting block/i);
  });

  it("teaches ship mode through repeated ship and cube portal passages", () => {
    const portals = firstWakeLevel.entities.filter(
      (entity): entity is PortalEntity => entity.type === "portal",
    );
    const shipPortals = portals.filter((portal) => portal.mode === "ship");
    const cubePortals = portals.filter((portal) => portal.mode === "cube");

    expect(shipPortals.length).toBeGreaterThanOrEqual(2);
    expect(cubePortals).toHaveLength(shipPortals.length);

    for (const shipPortal of shipPortals) {
      const exit = cubePortals.find((portal) => portal.x > shipPortal.x);
      expect(exit).toBeDefined();
    }
  });

  it("authors a bounded beginner ship corridor rather than open-air flight", () => {
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

    const blocksInCorridor = firstWakeLevel.entities.filter(
      (entity) =>
        entity.type === "block" &&
        entity.x + entity.width > shipPortal!.x &&
        entity.x < cubePortal!.x,
    );
    expect(
      blocksInCorridor.some(
        (block) =>
          block.y + block.height <
          firstWakeLevel.rules.spawnY - firstWakeLevel.rules.playerHeight,
      ),
    ).toBe(true);
    expect(
      blocksInCorridor.some(
        (block) => block.y > firstWakeLevel.rules.spawnY,
      ),
    ).toBe(true);
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
