import type { BlockEntity, LevelEntity } from "../core/run-simulation";
import { firstWakeLevel, type LevelContent } from "./first-wake";
import { buildOfficialBeatMap } from "./official-soundtrack";
import { buildSurfaceRun } from "./terrain";

function ramp(
  x: number,
  width: number,
  y: number,
  height: number,
  shape: "ramp-up" | "ramp-down",
): BlockEntity {
  return { type: "block", shape, height, width, x, y };
}

function ceiling(startX: number, endX: number, bottomY: number): readonly BlockEntity[] {
  const width = 92;
  const result: BlockEntity[] = [];
  for (let x = startX; x < endX; x += width) {
    result.push({
      type: "block",
      height: bottomY,
      width: Math.min(width, endX - x),
      x,
      y: 0,
    });
  }
  return result;
}

function spike(x: number, surfaceY: number): LevelEntity {
  return { type: "spike", height: 30, width: 30, x, y: surfaceY - 30 };
}

function decor(x: number, y: number): LevelEntity {
  return { type: "decoration", kind: "diamond", height: 70, width: 44, x, y };
}

const HIGHLINE_ENTITIES: readonly LevelEntity[] = [
  ...buildSurfaceRun(0, 700, 300),
  ramp(700, 120, 240, 60, "ramp-up"),
  ...buildSurfaceRun(820, 1500, 240),
  spike(1050, 240),
  ramp(1500, 120, 240, 60, "ramp-down"),
  ...buildSurfaceRun(1620, 2280, 300),
  spike(1840, 300),
  ramp(2280, 100, 300, 50, "ramp-down"),
  ...buildSurfaceRun(2380, 3060, 350),
  spike(2660, 350),
  spike(2720, 350),
  ramp(3060, 120, 230, 120, "ramp-up"),
  ...buildSurfaceRun(3180, 4010, 230),
  spike(3480, 230),
  spike(3540, 230),
  spike(3760, 230),
  ramp(4010, 120, 230, 70, "ramp-down"),
  ...buildSurfaceRun(4130, 5100, 300),
  decor(900, 92),
  decor(2480, 150),
  decor(3320, 74),
];

export const highlineAscentLevel: LevelContent = {
  beatMap: buildOfficialBeatMap("level_9"),
  entities: HIGHLINE_ENTITIES,
  finishX: 5100,
  rules: firstWakeLevel.rules,
};

const TUNNEL_ENTITIES: readonly LevelEntity[] = [
  ...buildSurfaceRun(0, 720, 300),
  spike(330, 300),
  { type: "portal", mode: "ship", height: 310, width: 12, x: 650, y: 62 },
  ramp(720, 120, 300, 80, "ramp-down"),
  ...buildSurfaceRun(840, 2460, 380),
  ...ceiling(720, 2460, 88),
  { type: "block", height: 98, width: 70, x: 1240, y: 88 },
  { type: "block", height: 88, width: 70, x: 1680, y: 292 },
  { type: "block", height: 112, width: 70, x: 2020, y: 88 },
  { type: "block", height: 94, width: 70, x: 2180, y: 286 },
  { type: "portal", mode: "cube", height: 292, width: 12, x: 2320, y: 88 },
  ramp(2460, 140, 300, 80, "ramp-up"),
  ...buildSurfaceRun(2600, 3480, 300),
  spike(2920, 300),
  ramp(3480, 100, 235, 65, "ramp-up"),
  ...buildSurfaceRun(3580, 4400, 235),
  spike(3920, 235),
  ramp(4400, 100, 235, 65, "ramp-down"),
  ...buildSurfaceRun(4500, 5580, 300),
  decor(1040, 205),
  decor(2700, 118),
];

export const tunnelVectorLevel: LevelContent = {
  beatMap: buildOfficialBeatMap("level_10"),
  entities: TUNNEL_ENTITIES,
  finishX: 5580,
  rules: firstWakeLevel.rules,
};

const RIFT_ENTITIES: readonly LevelEntity[] = [
  ...buildSurfaceRun(0, 760, 300),
  spike(390, 300),
  ramp(760, 120, 210, 90, "ramp-up"),
  ...buildSurfaceRun(880, 1550, 210),
  spike(1150, 210),
  ...buildSurfaceRun(1660, 2160, 270),
  ramp(2160, 100, 270, 90, "ramp-down"),
  ...buildSurfaceRun(2260, 2920, 360),
  spike(2520, 360),
  ramp(2920, 140, 190, 170, "ramp-up"),
  ...buildSurfaceRun(3060, 3880, 190),
  spike(3400, 190),
  spike(3460, 190),
  ...buildSurfaceRun(3990, 4540, 260),
  ramp(4540, 100, 260, 70, "ramp-down"),
  ...buildSurfaceRun(4640, 5280, 330),
  ramp(5280, 120, 240, 90, "ramp-up"),
  ...buildSurfaceRun(5400, 6200, 240),
  spike(5720, 240),
  decor(1020, 62),
  decor(3160, 46),
  decor(4740, 156),
];

export const riftStairLevel: LevelContent = {
  beatMap: buildOfficialBeatMap("level_11"),
  entities: RIFT_ENTITIES,
  finishX: 6200,
  rules: firstWakeLevel.rules,
};

const APEX_ENTITIES: readonly LevelEntity[] = [
  ...buildSurfaceRun(0, 680, 300),
  ramp(680, 100, 230, 70, "ramp-up"),
  ...buildSurfaceRun(780, 1280, 230),
  spike(1020, 230),
  { type: "portal", mode: "ship", height: 294, width: 12, x: 1200, y: 80 },
  ramp(1280, 100, 230, 144, "ramp-down"),
  ...buildSurfaceRun(1380, 2800, 374),
  ...ceiling(1280, 2800, 80),
  { type: "block", height: 124, width: 84, x: 1720, y: 80 },
  { type: "block", height: 90, width: 76, x: 1880, y: 284 },
  { type: "block", height: 118, width: 84, x: 2100, y: 256 },
  { type: "portal", mode: "cube", height: 294, width: 12, x: 2660, y: 80 },
  ramp(2800, 140, 230, 144, "ramp-up"),
  ...buildSurfaceRun(2940, 3720, 230),
  spike(3260, 230),
  ramp(3720, 100, 230, 100, "ramp-down"),
  ...buildSurfaceRun(3820, 4320, 330),
  { type: "portal", mode: "ship", height: 280, width: 12, x: 4220, y: 94 },
  ...buildSurfaceRun(4320, 5400, 374),
  ...ceiling(4320, 5400, 94),
  { type: "block", height: 100, width: 82, x: 4680, y: 274 },
  { type: "block", height: 88, width: 82, x: 4860, y: 94 },
  { type: "block", height: 104, width: 82, x: 5060, y: 94 },
  { type: "portal", mode: "cube", height: 280, width: 12, x: 5280, y: 94 },
  ramp(5400, 120, 254, 120, "ramp-up"),
  ...buildSurfaceRun(5520, 6400, 254),
  spike(5840, 254),
  spike(6120, 254),
  decor(1440, 215),
  decor(3060, 75),
  decor(4480, 205),
];

export const apexCircuitLevel: LevelContent = {
  beatMap: buildOfficialBeatMap("level_12"),
  entities: APEX_ENTITIES,
  finishX: 6400,
  rules: firstWakeLevel.rules,
};
