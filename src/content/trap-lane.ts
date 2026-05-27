import type { RunRules } from "../core/run-simulation";
import { firstWakeLevel, type LevelContent } from "./first-wake";
import { buildEpicLevel } from "./epic-course-builder";

const TRAP_LANE_RULES: RunRules = firstWakeLevel.rules;

export const trapLaneLevel: LevelContent = {
  ...buildEpicLevel({
    id: "level_5",
    bpm: 145,
    sections: [
      { kind: "cube-tech", lengthBeats: 14, pulse: true },
      { kind: "ship-cave", lengthBeats: 22, loft: true },
      { kind: "air-orb", lengthBeats: 16, pulse: true, loft: true },
      { kind: "cube-tech", lengthBeats: 14, pulse: true },
      { kind: "ship-cave", lengthBeats: 18, loft: true },
    ],
  }),
  rules: TRAP_LANE_RULES,
};
