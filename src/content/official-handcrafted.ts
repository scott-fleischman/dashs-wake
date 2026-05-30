import { assembleOfficialLevel, type LevelContent } from "./official-course";
import {
  bigClimb,
  brightZone,
  CourseBuilder,
  darkZone,
  decorateDensely,
  fakePadRoute,
  floorRun,
  hill,
  orbLift,
  padChain,
  padVault,
  pitBridge,
  reefGates,
  rest,
  shipGallery,
  shipReef,
  spikeRhythm,
  spikeStrip,
  spotlights,
  strobeZone,
  templeSteps,
  trapOrb,
} from "./level-patterns";

// Official courses are composed from the shared pattern language so every level
// is built out of the same reusable, solver-validated motifs (see
// level-patterns.ts) layered together into distinct experiences. Run
// `npx vite-node tools/level-report.ts` to re-score difficulty and variety.
//
// Difficulty contract: the campaign starts where the game used to *end*. Even
// First Wake is a dense, demanding course; the curve then ramps up across eight
// levels to a brutal foundry finale. Every level must still clear under the
// conservative solver, and each course must fit inside its bundled track
// (finishX / horizontalSpeed <= track.durationMs).

// ---------------------------------------------------------------------------
// Level 1 — First Wake (hard): dense spike rhythms and two bounded ship reefs.
// Beginner-mechanics contract preserved: blocks/portals/spikes/decoration only
// (no pads or orbs), but packed far tighter than the old tutorial.
// ---------------------------------------------------------------------------
function buildFirstWake(): LevelContent {
  const b = new CourseBuilder({ idPrefix: "first-wake", startX: 0 });
  rest(b, 200);
  brightZone(b, 320);
  spikeRhythm(b, [1, 2]);
  // First bounded ship passage with a soft pinch gate.
  shipReef(b, {
    length: 440,
    gates: [{ edge: "ceiling", limitY: 168, width: 64, x: b.x + 220 }],
    light: "bright",
  });
  rest(b, 150);
  spikeRhythm(b, [2, 1]);
  hill(b, 90, 150);
  spikeRhythm(b, [1, 2, 1]);
  darkZone(b, 320);
  // Second, tighter ship passage gated top and bottom.
  shipReef(b, {
    length: 480,
    gates: [
      { edge: "ceiling", limitY: 170, width: 60, x: b.x + 200 },
      { edge: "lower", limitY: 270, width: 70, x: b.x + 340 },
    ],
    light: "dark",
  });
  rest(b, 140);
  spikeRhythm(b, [2, 1]);
  rest(b, 160);
  decorateDensely(b, { seed: 101, mood: "bright" });
  return assembleOfficialLevel("level_1", b.entities, b.finishX(), b.channels);
}

export const firstWakeLevel: LevelContent = buildFirstWake();

// ---------------------------------------------------------------------------
// Level 2 — Hollow Steps (hard): a vertical temple climb threaded with pads and
// a spike pit. Verticality is the headline (the camera rides up and over).
// ---------------------------------------------------------------------------
// Level 2 — Hollow Steps (hard): atomic pattern showcase with generous floor buffers.
// ---------------------------------------------------------------------------
function buildHollowSteps(): LevelContent {
  const b = new CourseBuilder({ idPrefix: "hollow", startX: 0 });
  floorRun(b, 10);
  darkZone(b, 360);
  spikeStrip(b, { spikes: 2 });
  floorRun(b, 10);
  padChain(b, { count: 5 });
  floorRun(b, 10);
  fakePadRoute(b);
  floorRun(b, 10);
  decorateDensely(b, { seed: 202, mood: "dark" });
  return assembleOfficialLevel("level_2", b.entities, b.finishX(), b.channels);
}

export const hollowStepsLevel: LevelContent = buildHollowSteps();

// ---------------------------------------------------------------------------
// Level 3 — Neon Drift (harder): ship-forward, neon-lit galleries with orbs.
// ---------------------------------------------------------------------------
function buildNeonDrift(): LevelContent {
  const b = new CourseBuilder({ idPrefix: "neon", startX: 0 });
  rest(b, 180);
  strobeZone(b, 360);
  spikeRhythm(b, [1, 2]);
  orbLift(b, { count: 3 });
  shipReef(b, { length: 720, gates: reefGates(b.x, 720), light: "bright" });
  rest(b, 150);
  spikeRhythm(b, [2, 1]);
  shipGallery(b, { length: 640, light: "dark" });
  orbLift(b, { count: 2 });
  spikeRhythm(b, [1, 2]);
  shipReef(b, { length: 600, gates: reefGates(b.x, 600), light: "bright" });
  rest(b, 160);
  decorateDensely(b, { seed: 303, mood: "bright" });
  return assembleOfficialLevel("level_3", b.entities, b.finishX(), b.channels);
}

export const neonDriftLevel: LevelContent = buildNeonDrift();

// ---------------------------------------------------------------------------
// Level 4 — Prism Ascent (harder): a vertical temple crowned by a required
// orb-lift route up the prism's heart.
// ---------------------------------------------------------------------------
function buildPrismAscent(): LevelContent {
  const b = new CourseBuilder({ idPrefix: "prism", startX: 0 });
  rest(b, 200);
  brightZone(b, 320);
  spikeRhythm(b, [2, 1]);
  templeSteps(b, { tiers: 6, tierRise: 44, tierWidth: 118, light: "bright" });
  spotlights(b, 280);
  // The four required orbs form the only way up the prism's heart.
  orbLift(b, { count: 4, required: true, centerY: 198 });
  darkZone(b, 300);
  padVault(b, { impulse: 760, landAhead: 340, light: true });
  spikeRhythm(b, [2, 2]);
  rest(b, 160);
  decorateDensely(b, { seed: 404, mood: "bright" });
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
  rest(b, 180);
  darkZone(b, 360);
  spikeRhythm(b, [2, 1, 2]);
  shipReef(b, { length: 680, gates: reefGates(b.x, 680), light: "dark" });
  trapOrb(b, { magnitude: 680 });
  bigClimb(b, { rise: 180, plateauWidth: 220, runDown: 280, light: "dark" });
  spikeRhythm(b, [2, 2]);
  shipGallery(b, { length: 620, light: "dark" });
  trapOrb(b, { magnitude: 700 });
  spikeRhythm(b, [2, 1, 2]);
  rest(b, 160);
  decorateDensely(b, { seed: 505, mood: "dark" });
  return assembleOfficialLevel("level_5", b.entities, b.finishX(), b.channels);
}

export const finalRiftLevel: LevelContent = buildFinalRift();

// ---------------------------------------------------------------------------
// Level 6 — Block Pulse (insane): relentless ground tech — spike rhythms,
// pads, an orb lift and a ship pinch, with almost no rest.
// ---------------------------------------------------------------------------
function buildBlockPulse(): LevelContent {
  const b = new CourseBuilder({ idPrefix: "pulse", startX: 0 });
  rest(b, 160);
  strobeZone(b, 320);
  spikeRhythm(b, [2, 1, 2]);
  padVault(b, { impulse: 760, landAhead: 320, light: true });
  spikeRhythm(b, [2, 2]);
  orbLift(b, { count: 3 });
  hill(b, 96, 150);
  spikeRhythm(b, [2, 1, 2]);
  trapOrb(b, { magnitude: 700 });
  shipReef(b, { length: 560, gates: reefGates(b.x, 560), light: "dark" });
  // Settle after the ship exit before the next spike wall (a freshly converted
  // cube exits mid-air and needs ground to react).
  rest(b, 170);
  spikeRhythm(b, [2, 2]);
  rest(b, 150);
  decorateDensely(b, { seed: 606, mood: "dark", density: 1.15 });
  return assembleOfficialLevel("level_6", b.entities, b.finishX(), b.channels);
}

export const blockPulseLevel: LevelContent = buildBlockPulse();

// ---------------------------------------------------------------------------
// Level 7 — Steel Skyline (demon): a ship gauntlet — long, gated corridors
// chained back to back with only thin slivers of ground between them.
// ---------------------------------------------------------------------------
function buildSteelSkyline(): LevelContent {
  const b = new CourseBuilder({ idPrefix: "steel", startX: 0 });
  rest(b, 160);
  darkZone(b, 340);
  spikeRhythm(b, [2, 1]);
  shipReef(b, { length: 760, gates: reefGates(b.x, 760), light: "dark" });
  rest(b, 160);
  spikeRhythm(b, [2, 2]);
  shipGallery(b, { length: 680, light: "dark" });
  rest(b, 130);
  trapOrb(b, { magnitude: 700 });
  shipReef(b, { length: 720, gates: reefGates(b.x, 720), light: "dark" });
  rest(b, 160);
  spikeRhythm(b, [2, 1, 2]);
  rest(b, 150);
  decorateDensely(b, { seed: 707, mood: "dark", density: 1.15 });
  return assembleOfficialLevel("level_7", b.entities, b.finishX(), b.channels);
}

export const steelSkylineLevel: LevelContent = buildSteelSkyline();

// ---------------------------------------------------------------------------
// Level 8 — Foundry Overdrive (demon): the finale. A towering pyramid trap
// flanked by traps, an orb climb, a ship pinch, and tight spike rhythms.
// ---------------------------------------------------------------------------
function buildFoundryOverdrive(): LevelContent {
  const b = new CourseBuilder({ idPrefix: "foundry", startX: 0 });
  rest(b, 150);
  strobeZone(b, 340);
  spikeRhythm(b, [2, 1, 2]);
  // The pyramid: a tall symmetric staircase the camera rides up and over.
  templeSteps(b, { tiers: 6, tierRise: 44, tierWidth: 108, light: "dark" });
  trapOrb(b, { magnitude: 700 });
  orbLift(b, { count: 2 });
  shipReef(b, { length: 600, gates: reefGates(b.x, 600), light: "dark" });
  rest(b, 160);
  spikeRhythm(b, [2, 2]);
  trapOrb(b, { magnitude: 720 });
  spikeRhythm(b, [2, 1, 2]);
  rest(b, 150);
  decorateDensely(b, { seed: 808, mood: "dark", density: 1.2 });
  return assembleOfficialLevel("level_8", b.entities, b.finishX(), b.channels);
}

export const foundryOverdriveLevel: LevelContent = buildFoundryOverdrive();

export const OFFICIAL_HANDCRAFTED_BY_ID: Readonly<Record<string, LevelContent>> = {
  level_1: firstWakeLevel,
  level_2: hollowStepsLevel,
  level_3: neonDriftLevel,
  level_4: prismAscentLevel,
  level_5: finalRiftLevel,
  level_6: blockPulseLevel,
  level_7: steelSkylineLevel,
  level_8: foundryOverdriveLevel,
};
