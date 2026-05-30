import { buildPlaceholderBeatMap } from "./beat-maps";
import type { LevelContent } from "./first-wake";
import { OFFICIAL_LEVEL_RULES } from "./level-rules";
import {
  bigClimb,
  brightZone,
  CourseBuilder,
  darkZone,
  groundSpikeBeat,
  hill,
  orbLift,
  padVault,
  pitBridge,
  reefGates,
  rest,
  shipGallery,
  shipReef,
  spikeRhythm,
  spotlights,
  strobeZone,
  trapOrb,
} from "./level-patterns";
import { withSupportingTerrain } from "./terrain";

// Gauntlet stages are short, punchy courses assembled from the same pattern
// language as the official campaign, so the whole game shares one vocabulary of
// fun. The introductory Electric Wake stages stay flat and sparse so they clear
// even while the jump key is held the entire run (see the gauntlet stage tests).

function buildStage(
  idPrefix: string,
  build: (b: CourseBuilder) => void,
): LevelContent {
  const b = new CourseBuilder({ idPrefix });
  build(b);
  const finishX = b.finishX(96);
  return {
    beatMap: buildPlaceholderBeatMap(finishX, OFFICIAL_LEVEL_RULES.horizontalSpeed),
    entities: withSupportingTerrain(b.entities, finishX, b.channels),
    finishX,
    rules: OFFICIAL_LEVEL_RULES,
  };
}

const STAGE_CONTENT: Readonly<Record<string, LevelContent>> = {
  // --- Electric Wake: gentle intro, clearable with jump held the whole run ---
  "electric-wake-1": buildStage("electric-wake-1", (b) => {
    rest(b, 230);
    brightZone(b, 300);
    groundSpikeBeat(b, 240);
    rest(b, 360);
  }),
  "electric-wake-2": buildStage("electric-wake-2", (b) => {
    rest(b, 230);
    strobeZone(b, 360);
    groundSpikeBeat(b, 240);
    rest(b, 200);
    padVault(b, { impulse: 700, landAhead: 360, light: true });
    rest(b, 200);
  }),
  "electric-wake-3": buildStage("electric-wake-3", (b) => {
    rest(b, 260);
    spikeRhythm(b, [1, 1]);
    shipReef(b, { length: 560, light: "bright" });
    padVault(b, { impulse: 720, landAhead: 320 });
    spotlights(b, 280);
    rest(b, 200);
  }),

  // --- Skyline Trial: verticality focus ---
  "skyline-trial-1": buildStage("skyline-trial-1", (b) => {
    rest(b, 260);
    spikeRhythm(b, [1, 2]);
    brightZone(b, 320);
    bigClimb(b, { rise: 170, plateauWidth: 200, light: "bright" });
    rest(b, 200);
  }),
  "skyline-trial-2": buildStage("skyline-trial-2", (b) => {
    rest(b, 260);
    darkZone(b, 360);
    pitBridge(b, { steps: 5 });
    padVault(b, { impulse: 760, landAhead: 340, light: true });
    spikeRhythm(b, [1]);
    rest(b, 180);
  }),
  "skyline-trial-3": buildStage("skyline-trial-3", (b) => {
    rest(b, 220);
    spikeRhythm(b, [1]);
    shipReef(b, { length: 620, gates: reefGates(b.x, 620), light: "bright" });
    shipGallery(b, { length: 620, light: "dark" });
    spotlights(b, 280);
    rest(b, 200);
  }),

  // --- Void Circuit: the full vocabulary, hardest tier ---
  "void-circuit-1": buildStage("void-circuit-1", (b) => {
    rest(b, 240);
    darkZone(b, 360);
    bigClimb(b, { rise: 210, plateauWidth: 220, light: "dark" });
    orbLift(b, { count: 2 });
    spikeRhythm(b, [2]);
    rest(b, 180);
  }),
  "void-circuit-2": buildStage("void-circuit-2", (b) => {
    rest(b, 240);
    spikeRhythm(b, [2, 1]);
    pitBridge(b, { steps: 6 });
    trapOrb(b, { magnitude: 680 });
    hill(b, 60, 150);
    rest(b, 180);
  }),
  "void-circuit-3": buildStage("void-circuit-3", (b) => {
    rest(b, 220);
    darkZone(b, 360);
    shipReef(b, { length: 620, gates: reefGates(b.x, 620), light: "dark" });
    shipGallery(b, { length: 700, light: "dark" });
    padVault(b, { impulse: 760, landAhead: 340, light: true });
    spotlights(b, 280);
    rest(b, 200);
  }),
};

export function getGauntletStageContent(
  stageId: string,
): LevelContent | undefined {
  return STAGE_CONTENT[stageId];
}
