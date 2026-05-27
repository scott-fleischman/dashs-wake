import { firstWakeLevel, type LevelContent } from "./first-wake";
import { buildEpicLevel } from "./epic-course-builder";

export const blockPulseLevel: LevelContent = {
  ...buildEpicLevel({
    id: "level_6",
    bpm: 112,
    sections: [
      { kind: "cube-tech", lengthBeats: 18 },
      { kind: "air-orb", lengthBeats: 14, pulse: true },
      { kind: "cube-tech", lengthBeats: 18, pulse: true },
      { kind: "ship-cave", lengthBeats: 20 },
    ],
  }),
  rules: firstWakeLevel.rules,
};

export const skylineStepLevel: LevelContent = {
  ...buildEpicLevel({
    id: "level_7",
    bpm: 128,
    sections: [
      { kind: "cube-tech", lengthBeats: 12, pulse: true },
      { kind: "ship-cave", lengthBeats: 22, loft: true },
      { kind: "air-orb", lengthBeats: 16, pulse: true },
      { kind: "cube-tech", lengthBeats: 14, loft: true },
    ],
  }),
  rules: firstWakeLevel.rules,
};

export const foundryOverdriveLevel: LevelContent = {
  ...buildEpicLevel({
    id: "level_8",
    bpm: 150,
    sections: [
      { kind: "cube-tech", lengthBeats: 14, pulse: true },
      { kind: "ship-cave", lengthBeats: 24, loft: true, pulse: true },
      { kind: "air-orb", lengthBeats: 18, loft: true, pulse: true },
      { kind: "ship-cave", lengthBeats: 24, loft: true },
    ],
  }),
  rules: firstWakeLevel.rules,
};
