import type { LevelEntity } from "../core/run-simulation";
import { buildOfficialBeatMap } from "./official-soundtrack";
import { firstWakeLevel, type LevelContent } from "./first-wake";
import { withSupportingTerrain } from "./terrain";

function beatX(beat: number, bpm: number): number {
  return Math.round(
    beat * (60 / bpm) * firstWakeLevel.rules.horizontalSpeed,
  );
}

function block(x: number, y = 244, height = 56): LevelEntity {
  return { type: "block", height, width: 58, x, y };
}

function spike(x: number, y = 270): LevelEntity {
  return { type: "spike", height: 30, width: 30, x, y };
}

function decor(x: number, kind: "beam" | "diamond" | "pillar"): LevelEntity {
  return { type: "decoration", kind, height: 90, width: 48, x, y: 115 };
}

const BLOCK_PULSE_ENTITIES: readonly LevelEntity[] = [
  decor(beatX(2, 112), "diamond"),
  block(beatX(5, 112)),
  spike(beatX(8, 112)),
  block(beatX(11, 112), 232, 68),
  decor(beatX(14, 112), "beam"),
  block(beatX(17, 112)),
  spike(beatX(20, 112)),
  block(beatX(25, 112)),
  decor(beatX(29, 112), "pillar"),
  block(beatX(33, 112), 234, 66),
];

export const blockPulseLevel: LevelContent = {
  beatMap: buildOfficialBeatMap("level_6"),
  entities: withSupportingTerrain(BLOCK_PULSE_ENTITIES, 4680),
  finishX: 4680,
  rules: firstWakeLevel.rules,
};

const SKYLINE_STEP_ENTITIES: readonly LevelEntity[] = [
  decor(beatX(3, 128), "pillar"),
  block(beatX(5, 128)),
  spike(beatX(8, 128)),
  block(beatX(11, 128), 232, 68),
  {
    type: "pad",
    id: "level-7-pad-1",
    impulse: 720,
    height: 18,
    width: 40,
    x: beatX(14, 128),
    y: 282,
  },
  block(beatX(16, 128), 202, 98),
  decor(beatX(19, 128), "beam"),
  block(beatX(23, 128)),
  spike(beatX(27, 128)),
  block(beatX(31, 128), 232, 68),
  block(beatX(38, 128)),
  decor(beatX(43, 128), "diamond"),
];

export const skylineStepLevel: LevelContent = {
  beatMap: buildOfficialBeatMap("level_7"),
  entities: withSupportingTerrain(SKYLINE_STEP_ENTITIES, 5380),
  finishX: 5380,
  rules: firstWakeLevel.rules,
};

const FOUNDRY_OVERDRIVE_ENTITIES: readonly LevelEntity[] = [
  decor(beatX(3, 150), "beam"),
  block(beatX(6, 150)),
  block(beatX(10, 150), 232, 68),
  {
    type: "orb",
    id: "level-8-orb-1",
    effect: { kind: "impulse", magnitude: 720 },
    height: 76,
    width: 64,
    x: beatX(13, 150),
    y: 164,
  },
  spike(beatX(14, 150)),
  spike(beatX(15, 150)),
  block(beatX(20, 150)),
  decor(beatX(24, 150), "diamond"),
  block(beatX(28, 150), 234, 66),
  {
    type: "pad",
    id: "level-8-pad-1",
    impulse: 760,
    height: 18,
    width: 40,
    x: beatX(34, 150),
    y: 282,
  },
  block(beatX(36, 150), 220, 80),
  block(beatX(43, 150)),
  spike(beatX(49, 150)),
  block(beatX(54, 150), 232, 68),
  decor(beatX(58, 150), "pillar"),
];

export const foundryOverdriveLevel: LevelContent = {
  beatMap: buildOfficialBeatMap("level_8"),
  entities: withSupportingTerrain(FOUNDRY_OVERDRIVE_ENTITIES, 5940),
  expectedRoute: { requiredTriggerIds: ["level-8-orb-1", "level-8-pad-1"] },
  finishX: 5940,
  rules: firstWakeLevel.rules,
};
