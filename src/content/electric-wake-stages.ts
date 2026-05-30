import type { LevelContent } from "./first-wake";
import { OFFICIAL_LEVEL_RULES } from "./level-rules";
import {
  bigClimb,
  brightZone,
  CourseBuilder,
  darkZone,
  decorateDensely,
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
  templeSteps,
  trapOrb,
} from "./level-patterns";
import {
  buildBeatMapForBpm,
  songLibrary,
  type SongLibraryEntry,
} from "./official-soundtrack";
import { withSupportingTerrain } from "./terrain";

// Gauntlet stages are full, normal-sized courses (like the official campaign)
// set to bundled music, assembled from the shared, solver-validated pattern
// language so the whole game shares one vocabulary of fun.
//
// Reliability contract by gauntlet:
//   - Electric Wake (the only gauntlet with an end-to-end completion test):
//     cube-only and clearable while the jump key is held the entire run, so the
//     journey test can drive it deterministically (see gauntlet stage tests).
//   - Skyline Trial / Void Circuit: the full vocabulary (ship flight, climbs,
//     traps). Every stage must clear under the conservative solver.

export interface GauntletStageTrack {
  audioPath: string;
  bpm: number;
  durationMs: number;
  title: string;
}

/** Bundled song backing each stage (drives both the beat map and playback). */
const STAGE_SONG_IDS: Readonly<Record<string, string>> = {
  "electric-wake-1": "song-block-pulse",
  "electric-wake-2": "song-steel-skyline",
  "electric-wake-3": "song-dawn-circuit",
  "skyline-trial-1": "song-neon-drift",
  "skyline-trial-2": "song-hollow-steps",
  "skyline-trial-3": "song-prism-ascent",
  "void-circuit-1": "song-final-rift",
  "void-circuit-2": "song-foundry-overdrive",
  "void-circuit-3": "song-final-rift",
};

function songFor(stageId: string): SongLibraryEntry {
  const songId = STAGE_SONG_IDS[stageId];
  const song = songLibrary.find((entry) => entry.id === songId);
  if (!song) {
    throw new Error(`Gauntlet stage ${stageId} has no bundled song.`);
  }
  return song;
}

function buildStage(
  stageId: string,
  build: (b: CourseBuilder) => void,
): LevelContent {
  const song = songFor(stageId);
  const b = new CourseBuilder({ idPrefix: stageId });
  build(b);
  let seed = 0;
  for (let i = 0; i < stageId.length; i += 1) {
    seed = (seed * 31 + stageId.charCodeAt(i)) | 0;
  }
  decorateDensely(b, { seed, mood: stageId.startsWith("void") ? "dark" : "bright" });
  const finishX = b.finishX(96);
  return {
    beatMap: buildBeatMapForBpm(song.bpm, song.durationMs),
    entities: withSupportingTerrain(b.entities, finishX, b.channels),
    finishX,
    rules: OFFICIAL_LEVEL_RULES,
  };
}

const STAGE_CONTENT: Readonly<Record<string, LevelContent>> = {
  // --- Electric Wake: cube-only and clearable with the jump key held the whole
  // run. Built from hills, vaults, and lighting (no ground spikes) so a held
  // bunny-hop never lands on a hazard, which keeps the journey test deterministic.
  "electric-wake-1": buildStage("electric-wake-1", (b) => {
    rest(b, 300);
    brightZone(b, 360);
    hill(b, 56, 160);
    rest(b, 260);
    padVault(b, { impulse: 700, landAhead: 380, light: true });
    strobeZone(b, 320);
    hill(b, 60, 170);
    rest(b, 260);
    padVault(b, { impulse: 720, landAhead: 380 });
    brightZone(b, 320);
    hill(b, 56, 160);
    rest(b, 260);
    spotlights(b, 320);
    hill(b, 64, 170);
    rest(b, 340);
  }),
  "electric-wake-2": buildStage("electric-wake-2", (b) => {
    rest(b, 300);
    darkZone(b, 360);
    hill(b, 64, 170);
    rest(b, 260);
    padVault(b, { impulse: 720, landAhead: 380, light: true });
    strobeZone(b, 320);
    hill(b, 72, 180);
    rest(b, 260);
    padVault(b, { impulse: 740, landAhead: 380 });
    darkZone(b, 320);
    hill(b, 64, 170);
    rest(b, 260);
    padVault(b, { impulse: 720, landAhead: 380, light: true });
    spotlights(b, 320);
    hill(b, 68, 170);
    rest(b, 340);
  }),
  "electric-wake-3": buildStage("electric-wake-3", (b) => {
    rest(b, 300);
    brightZone(b, 360);
    hill(b, 72, 180);
    rest(b, 260);
    padVault(b, { impulse: 740, landAhead: 380, light: true });
    strobeZone(b, 320);
    hill(b, 80, 180);
    rest(b, 260);
    padVault(b, { impulse: 760, landAhead: 380 });
    brightZone(b, 320);
    hill(b, 72, 180);
    rest(b, 260);
    padVault(b, { impulse: 740, landAhead: 380, light: true });
    spotlights(b, 320);
    hill(b, 76, 180);
    rest(b, 360);
  }),

  // --- Skyline Trial: the dedicated vertical-scroll gauntlet (giant ladder,
  // temple steps, pyramid). The follow-camera rides up and over each summit.
  "skyline-trial-1": buildStage("skyline-trial-1", (b) => {
    // Giant ladder: a tall, many-runged staircase now gated by spike clusters.
    rest(b, 220);
    brightZone(b, 360);
    spikeRhythm(b, [2, 1]);
    templeSteps(b, { tiers: 10, tierRise: 36, tierWidth: 88, light: "bright" });
    rest(b, 140);
    padVault(b, { impulse: 760, landAhead: 340, light: true });
    rest(b, 140);
    spikeRhythm(b, [2, 1, 2]);
    orbLift(b, { count: 2 });
    rest(b, 150);
    spikeRhythm(b, [2, 2]);
    rest(b, 220);
  }),
  "skyline-trial-2": buildStage("skyline-trial-2", (b) => {
    // Temple steps flanked by a launch over the summit and a flight corridor.
    rest(b, 240);
    darkZone(b, 360);
    spikeRhythm(b, [2, 1, 2]);
    templeSteps(b, { tiers: 8, tierRise: 46, tierWidth: 118, light: "dark" });
    rest(b, 140);
    padVault(b, { impulse: 760, landAhead: 340, light: true });
    rest(b, 140);
    spotlights(b, 280);
    shipGallery(b, { length: 640, light: "dark" });
    rest(b, 160);
    spikeRhythm(b, [2, 2]);
    orbLift(b, { count: 2 });
    rest(b, 240);
  }),
  "skyline-trial-3": buildStage("skyline-trial-3", (b) => {
    // Pyramid trap: a towering climb, a ship reef, and a lure over the descent.
    rest(b, 220);
    strobeZone(b, 360);
    spikeRhythm(b, [2, 1, 2]);
    templeSteps(b, { tiers: 8, tierRise: 44, tierWidth: 110, light: "bright" });
    rest(b, 150);
    padVault(b, { impulse: 760, landAhead: 340, light: true });
    rest(b, 150);
    shipGallery(b, { length: 600, light: "dark" });
    rest(b, 170);
    spikeRhythm(b, [2, 2]);
    orbLift(b, { count: 2 });
    rest(b, 220);
  }),

  // --- Void Circuit: the full vocabulary, hardest tier, solver-validated ---
  "void-circuit-1": buildStage("void-circuit-1", (b) => {
    rest(b, 220);
    darkZone(b, 360);
    spikeRhythm(b, [2, 1, 2]);
    bigClimb(b, { rise: 230, plateauWidth: 210, light: "dark" });
    orbLift(b, { count: 3 });
    rest(b, 150);
    spotlights(b, 280);
    shipReef(b, { length: 640, gates: reefGates(b.x, 640), light: "dark" });
    rest(b, 160);
    spikeRhythm(b, [2, 2]);
    trapOrb(b, { magnitude: 700 });
    spikeRhythm(b, [2, 1]);
    rest(b, 220);
  }),
  "void-circuit-2": buildStage("void-circuit-2", (b) => {
    rest(b, 220);
    spikeRhythm(b, [2, 1, 2]);
    pitBridge(b, { steps: 7 });
    trapOrb(b, { magnitude: 700 });
    bigClimb(b, { rise: 220, plateauWidth: 210, light: "dark" });
    rest(b, 140);
    padVault(b, { impulse: 760, landAhead: 340, light: true });
    rest(b, 150);
    shipGallery(b, { length: 680, light: "dark" });
    rest(b, 160);
    spikeRhythm(b, [2, 2]);
    orbLift(b, { count: 3 });
    spikeRhythm(b, [2, 1, 2]);
    rest(b, 220);
  }),
  "void-circuit-3": buildStage("void-circuit-3", (b) => {
    rest(b, 200);
    darkZone(b, 360);
    spikeRhythm(b, [2, 1, 2]);
    shipReef(b, { length: 660, gates: reefGates(b.x, 660), light: "dark" });
    rest(b, 160);
    spikeRhythm(b, [2, 2]);
    bigClimb(b, { rise: 240, plateauWidth: 230, light: "dark" });
    trapOrb(b, { magnitude: 720 });
    shipGallery(b, { length: 720, light: "dark" });
    rest(b, 160);
    padVault(b, { impulse: 760, landAhead: 340, light: true });
    rest(b, 150);
    spikeRhythm(b, [2, 1, 2]);
    trapOrb(b, { magnitude: 700 });
    spikeRhythm(b, [2, 2]);
    rest(b, 220);
  }),
};

export function getGauntletStageContent(
  stageId: string,
): LevelContent | undefined {
  return STAGE_CONTENT[stageId];
}

export function getGauntletStageTrack(
  stageId: string,
): GauntletStageTrack | undefined {
  const songId = STAGE_SONG_IDS[stageId];
  if (!songId) {
    return undefined;
  }
  const song = songLibrary.find((entry) => entry.id === songId);
  if (!song) {
    return undefined;
  }
  return {
    audioPath: song.audioPath,
    bpm: song.bpm,
    durationMs: song.durationMs,
    title: song.title,
  };
}
