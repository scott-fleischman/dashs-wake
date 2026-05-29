import { firstWakeLevel, type LevelContent } from "./first-wake";
import { buildEpicLevel } from "./epic-course-builder";

export const highlineAscentLevel: LevelContent = {
  ...buildEpicLevel({
    id: "level_9",
    bpm: 112,
    sections: [
      { kind: "cube-pad", lengthBeats: 12, loft: true },
      { kind: "ship-open", lengthBeats: 16, loft: true },
      { kind: "air-orb", lengthBeats: 14, pulse: true, loft: true },
      { kind: "ship-cave", lengthBeats: 18, loft: true },
    ],
  }),
  rules: firstWakeLevel.rules,
};

export const tunnelVectorLevel: LevelContent = {
  ...buildEpicLevel({
    id: "level_10",
    bpm: 128,
    sections: [
      { kind: "ship-cave", lengthBeats: 18, loft: true, pulse: true },
      { kind: "cube-tech", lengthBeats: 12, loft: true },
      { kind: "air-trap", lengthBeats: 12, pulse: true },
      { kind: "ship-open", lengthBeats: 14, loft: true },
    ],
  }),
  rules: firstWakeLevel.rules,
};

export const riftStairLevel: LevelContent = {
  ...buildEpicLevel({
    id: "level_11",
    bpm: 150,
    sections: [
      { kind: "cube-tech", lengthBeats: 10, pulse: true, loft: true },
      { kind: "air-trap", lengthBeats: 14, pulse: true, loft: true },
      { kind: "ship-cave", lengthBeats: 18, loft: true, pulse: true },
      { kind: "cube-pad", lengthBeats: 10, pulse: true },
      { kind: "air-orb", lengthBeats: 10, loft: true },
    ],
  }),
  rules: firstWakeLevel.rules,
};

export const apexCircuitLevel: LevelContent = {
  ...buildEpicLevel({
    id: "level_12",
    bpm: 156,
    sections: [
      { kind: "ship-cave", lengthBeats: 16, loft: true, pulse: true },
      { kind: "air-trap", lengthBeats: 12, loft: true, pulse: true },
      { kind: "cube-tech", lengthBeats: 12, pulse: true },
      { kind: "ship-cave", lengthBeats: 16, loft: true, pulse: true },
      { kind: "air-orb", lengthBeats: 10, loft: true, pulse: true },
    ],
  }),
  rules: firstWakeLevel.rules,
};
