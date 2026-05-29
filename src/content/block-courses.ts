import { firstWakeLevel, type LevelContent } from "./first-wake";
import { buildEpicLevel } from "./epic-course-builder";

export const blockPulseLevel: LevelContent = {
  ...buildEpicLevel({
    id: "level_6",
    bpm: 112,
    sections: [
      { kind: "cube-run", lengthBeats: 6 },
      { kind: "cube-intro", lengthBeats: 10 },
      { kind: "ship-open", lengthBeats: 22 },
      { kind: "cube-run", lengthBeats: 12 },
    ],
  }),
  rules: firstWakeLevel.rules,
};

export const skylineStepLevel: LevelContent = {
  ...buildEpicLevel({
    id: "level_7",
    bpm: 128,
    sections: [
      { kind: "cube-intro", lengthBeats: 10 },
      { kind: "ship-open", lengthBeats: 14 },
      { kind: "cube-run", lengthBeats: 8 },
      { kind: "cube-intro", lengthBeats: 12, loft: true },
      { kind: "ship-open", lengthBeats: 12, loft: true },
    ],
  }),
  rules: firstWakeLevel.rules,
};

export const foundryOverdriveLevel: LevelContent = {
  ...buildEpicLevel({
    id: "level_8",
    bpm: 150,
    sections: [
      { kind: "cube-pad", lengthBeats: 10, pulse: true },
      { kind: "ship-open", lengthBeats: 14 },
      { kind: "cube-intro", lengthBeats: 10 },
      { kind: "ship-cave", lengthBeats: 12, loft: true },
    ],
  }),
  rules: firstWakeLevel.rules,
};
