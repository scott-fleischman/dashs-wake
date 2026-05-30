import { assembleOfficialLevel, type LevelContent } from "./official-course";
import {
  awakeningMotif,
  bigClimb,
  brightZone,
  CourseBuilder,
  darkZone,
  flightMotif,
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

// Official courses are composed from the shared pattern language so every level
// is built out of the same reusable, solver-validated motifs (see
// level-patterns.ts) layered together into distinct experiences. Run
// `npx vite-node tools/level-report.ts` to re-score difficulty and variety.

// ---------------------------------------------------------------------------
// Level 1 — First Wake (easy): teaches spikes, hills, and bounded ship flight.
// Beginner contract: blocks/portals/spikes/decoration only (no pads or orbs).
// ---------------------------------------------------------------------------
function buildFirstWake(): LevelContent {
  const b = new CourseBuilder({ idPrefix: "first-wake", startX: 0 });
  rest(b, 320);
  brightZone(b, 360);
  awakeningMotif(b);
  darkZone(b, 360);
  // First, gentle bounded ship passage.
  shipReef(b, { length: 560, light: "bright" });
  rest(b, 200);
  spikeRhythm(b, [1, 1]);
  // A calm vertical hill so the camera lifts before the second flight.
  bigClimb(b, { rise: 130, runUp: 360, plateauWidth: 220, runDown: 320, light: "bright" });
  spotlights(b, 320);
  // Second ship passage with a single soft pinch gate.
  shipReef(b, {
    length: 640,
    gates: [{ edge: "ceiling", limitY: 168, width: 64, x: b.x + 320 }],
  });
  rest(b, 160);
  spikeRhythm(b, [1]);
  rest(b, 220);
  return assembleOfficialLevel("level_1", b.entities, b.finishX(), b.channels);
}

export const firstWakeLevel: LevelContent = buildFirstWake();

// ---------------------------------------------------------------------------
// Level 2 — Hollow Steps (normal): pit ascents and a towering climb.
// ---------------------------------------------------------------------------
function buildHollowSteps(): LevelContent {
  const b = new CourseBuilder({ idPrefix: "hollow", startX: 0 });
  rest(b, 300);
  spikeRhythm(b, [1, 2]);
  darkZone(b, 420);
  pitBridge(b, { steps: 7 });
  brightZone(b, 320);
  padVault(b, { impulse: 760, landAhead: 340, light: true });
  // Headline tower climb — the camera scrolls way up and back down.
  bigClimb(b, { rise: 224, runUp: 460, plateauWidth: 260, runDown: 340, light: "dark" });
  spotlights(b, 300);
  shipReef(b, {
    length: 680,
    gates: [
      { edge: "lower", limitY: 300, width: 64, x: b.x + 240 },
      { edge: "ceiling", limitY: 170, width: 60, x: b.x + 470 },
    ],
    light: "dark",
  });
  rest(b, 180);
  spikeRhythm(b, [2, 1]);
  rest(b, 200);
  return assembleOfficialLevel("level_2", b.entities, b.finishX(), b.channels);
}

export const hollowStepsLevel: LevelContent = buildHollowSteps();

// ---------------------------------------------------------------------------
// Level 3 — Neon Drift (normal): ship-forward, neon-lit galleries.
// ---------------------------------------------------------------------------
function buildNeonDrift(): LevelContent {
  const b = new CourseBuilder({ idPrefix: "neon", startX: 0 });
  rest(b, 300);
  strobeZone(b, 360);
  spikeRhythm(b, [1, 1]);
  shipReef(b, { length: 760, gates: reefGates(b.x, 760), light: "bright" });
  rest(b, 160);
  shipGallery(b, { length: 900, light: "dark" });
  brightZone(b, 320);
  padVault(b, { impulse: 740, landAhead: 320, light: true });
  spikeRhythm(b, [1]);
  shipReef(b, { length: 720, gates: reefGates(b.x, 720), light: "bright" });
  spotlights(b, 320);
  rest(b, 220);
  return assembleOfficialLevel("level_3", b.entities, b.finishX(), b.channels);
}

export const neonDriftLevel: LevelContent = buildNeonDrift();

// ---------------------------------------------------------------------------
// Level 4 — Prism Ascent (hard): a required orb-lift route up the prism.
// ---------------------------------------------------------------------------
function buildPrismAscent(): LevelContent {
  const b = new CourseBuilder({ idPrefix: "prism", startX: 0 });
  rest(b, 300);
  brightZone(b, 320);
  spikeRhythm(b, [1, 2]);
  bigClimb(b, { rise: 200, runUp: 420, plateauWidth: 220, runDown: 300, light: "bright" });
  spotlights(b, 300);
  // The four required orbs form the only way up the prism's heart.
  orbLift(b, { count: 4, required: true, centerY: 198 });
  darkZone(b, 320);
  padVault(b, { impulse: 760, landAhead: 340, light: true });
  shipReef(b, {
    length: 700,
    gates: reefGates(b.x, 700),
    light: "bright",
  });
  rest(b, 180);
  spikeRhythm(b, [2, 1]);
  rest(b, 200);
  return assembleOfficialLevel("level_4", b.entities, b.finishX(), b.channels, {
    requiredTriggerIds: b.requiredTriggerIds.slice(),
  });
}

export const prismAscentLevel: LevelContent = buildPrismAscent();

// ---------------------------------------------------------------------------
// Level 5 — Final Rift (insane): the full vocabulary, with lure traps.
// ---------------------------------------------------------------------------
function buildFinalRift(): LevelContent {
  const b = new CourseBuilder({ idPrefix: "rift", startX: 0 });
  rest(b, 300);
  darkZone(b, 420);
  spikeRhythm(b, [2, 1, 2]);
  pitBridge(b, { steps: 6 });
  shipReef(b, {
    length: 760,
    gates: reefGates(b.x, 760),
    light: "dark",
  });
  trapOrb(b, { magnitude: 680 });
  spotlights(b, 280);
  bigClimb(b, { rise: 232, runUp: 460, plateauWidth: 240, runDown: 320, light: "dark" });
  flightMotif(b, { length: 720, light: "dark" });
  trapOrb(b, { magnitude: 700 });
  spikeRhythm(b, [2, 2]);
  rest(b, 220);
  return assembleOfficialLevel("level_5", b.entities, b.finishX(), b.channels);
}

export const finalRiftLevel: LevelContent = buildFinalRift();

export const OFFICIAL_HANDCRAFTED_BY_ID: Readonly<Record<string, LevelContent>> = {
  level_1: firstWakeLevel,
  level_2: hollowStepsLevel,
  level_3: neonDriftLevel,
  level_4: prismAscentLevel,
  level_5: finalRiftLevel,
};
