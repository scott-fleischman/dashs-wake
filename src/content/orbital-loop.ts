import type { RunRules } from "../core/run-simulation";
import { firstWakeLevel, type LevelContent } from "./first-wake";
import { buildEpicLevel } from "./epic-course-builder";

const ORBITAL_LOOP_RULES: RunRules = firstWakeLevel.rules;

export const orbitalLoopLevel: LevelContent = {
  ...buildEpicLevel({
    id: "level_3",
    bpm: 108,
    requireOrbRoute: true,
    sections: [
      { kind: "cube-intro", lengthBeats: 8 },
      { kind: "air-orb", lengthBeats: 18, pulse: true },
      { kind: "ship-open", lengthBeats: 14 },
      { kind: "air-orb", lengthBeats: 12, loft: true },
    ],
  }),
  rules: ORBITAL_LOOP_RULES,
};
