// A composable "pattern language" for hand-authored courses.
//
// Patterns are small, reusable, *solver-safe* fragments of a level. Each pattern
// reads the builder's cursor (x + current ground surface), appends entities and
// flight channels, advances the cursor, and records semantic tags that the level
// analyzer uses to score variety. Patterns are authored ground-to-ground so they
// compose freely: a pattern always leaves the runner back on the spawn surface,
// even if it climbs high in the middle (the follow-camera scrolls up with it).
//
// Higher-level "meta-patterns" (patterns of patterns) layer the base patterns
// in atomic-patterns.ts into recognizable motifs that whole levels are built from.
//
// This module must avoid importing runtime values from first-wake.ts (see the
// circular-import note in epic-course-builder.ts). It only depends on shared
// primitives, types, and terrain helpers.
import type { DecorationKind, LevelEntity } from "../core/run-simulation";
import {
  PATTERN_BEAT_SPACING,
  SAFE_STEP_RISE,
} from "./jump-grid";
export {
  applyAtomicPattern,
  ATOMIC_PATTERN_IDS,
  ATOMIC_PATTERN_LABELS,
  floorRun,
  fakePadRoute,
  jumpOrbPattern,
  orbStack,
  padBoost,
  padChain,
  spikeStrip,
  stairGap,
  stairSpikeEdge,
  stairStep,
  stampAtomicPattern,
  type AtomicPatternId,
  type AtomicPatternOptions,
  type AtomicStampResult,
} from "./atomic-patterns";
export { CourseBuilder, type CourseBuilderOptions, type PatternTag } from "./course-builder";
import type { CourseBuilder, PatternTag } from "./course-builder";

/** Tightest reliable spacing between independent gameplay beats (px). */
export const BEAT_SPACING = PATTERN_BEAT_SPACING;
export { SAFE_STEP_RISE };

import {
  buildStairPitSection,
  cubePlatform,
  decor,
  groundSpike,
  jumpOrb,
  launchPad,
  shipChannel,
  shipPortalPair,
} from "./official-handcrafted-helpers";
import type { FlightChannel, FlightGate } from "./terrain";
import { SHIP_FLOOR_Y, SPAWN_SURFACE_Y } from "./terrain";

/** Comfortable climbing slope for tall hero ramps. */
const HERO_ASCENT_SLOPE = 0.34;

// ---------------------------------------------------------------------------
// Decorative density (purely cosmetic background detail)
// ---------------------------------------------------------------------------

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DENSITY_BANDS: readonly {
  kinds: readonly DecorationKind[];
  spacing: number;
  yRange: readonly [number, number];
  size: readonly [number, number];
}[] = [
  // Deep parallax skyline far above the playfield.
  { kinds: ["pillar", "beam"], spacing: 30, yRange: [-260, -150], size: [34, 72] },
  // Tall pillar forest closer in.
  { kinds: ["pillar", "beam"], spacing: 26, yRange: [-180, -90], size: [28, 58] },
  // Dense upper sparkle field of diamonds and flashes.
  { kinds: ["diamond", "flash", "beam"], spacing: 22, yRange: [-90, 0], size: [18, 44] },
  // Second sparkle layer woven through the same band.
  { kinds: ["diamond", "flash", "glow"], spacing: 24, yRange: [-60, 24], size: [14, 34] },
  // Mid sparkle band threaded through the upper play space.
  { kinds: ["diamond", "flash", "glow"], spacing: 26, yRange: [10, 100], size: [14, 32] },
  // Low drifting fog/glow that hugs the surface line.
  { kinds: ["fog", "glow", "spotlight"], spacing: 40, yRange: [120, 220], size: [36, 84] },
  // A second low layer of fog for depth at the floor.
  { kinds: ["fog", "glow"], spacing: 46, yRange: [170, 250], size: [40, 96] },
];

/**
 * Scatters a deterministic field of background decorations across the whole
 * authored course so levels read as dense, detailed places rather than sparse
 * lanes. Decorations never affect the route (the solver ignores them) and are
 * clamped to the existing course extent so the finish line and bounds checks
 * are unaffected. Per-frame rendering is virtualized, so even a very heavy field
 * only draws what is on screen. Call this last, right before assembling the
 * level.
 *
 * `density` multiplies the base layer count (1 = the authored bands, higher =
 * proportionally tighter spacing). The default leans heavy for a busy,
 * arcade-dense look.
 */
export function decorateDensely(
  b: CourseBuilder,
  options: { seed?: number; mood?: "bright" | "dark"; density?: number } = {},
): void {
  const end = b.x;
  if (end <= 200) {
    return;
  }
  const density = Math.max(0.25, options.density ?? 1);
  const rng = mulberry(options.seed ?? 1);
  let bandIndex = 0;
  for (const band of DENSITY_BANDS) {
    bandIndex += 1;
    const spacing = Math.max(10, band.spacing / density);
    for (let x = 40; x < end - 60; x += spacing) {
      const jitterX = (rng() - 0.5) * spacing * 0.7;
      const px = Math.round(x + jitterX);
      if (px < 0 || px > end - 60) {
        continue;
      }
      const [yLo, yHi] = band.yRange;
      const py = Math.round(yLo + rng() * (yHi - yLo));
      const [sLo, sHi] = band.size;
      const size = Math.round(sLo + rng() * (sHi - sLo));
      const width = Math.min(size, end - px);
      const kind = band.kinds[Math.floor(rng() * band.kinds.length)]!;
      if (options.mood === "dark" && (kind === "glow" || kind === "spotlight") && rng() < 0.5) {
        b.add(decor("shadow", px, py, width, Math.round(size * 0.8)));
      } else {
        b.add(decor(kind, px, py, width, Math.round(size * (bandIndex <= 2 ? 1.3 : 0.9))));
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Geometry primitives (solver-safe by construction)
// ---------------------------------------------------------------------------

/** A wide standable plateau block whose top sits at `surfaceY`. */
export function plateau(
  x: number,
  surfaceY: number,
  width: number,
): LevelEntity {
  return cubePlatform(x, surfaceY, width);
}

/**
 * A ramp block bridging two ground surfaces. The conservative solver simply
 * walks the interpolated surface, so ramps are the reliable way to gain or shed
 * a lot of altitude.
 */
export function ramp(
  x: number,
  width: number,
  fromSurfaceY: number,
  toSurfaceY: number,
): LevelEntity {
  if (toSurfaceY < fromSurfaceY) {
    // Ascending: surface drops from (y + height) on the left to y on the right.
    return {
      type: "block",
      shape: "ramp-up",
      height: fromSurfaceY - toSurfaceY,
      width,
      x,
      y: toSurfaceY,
    };
  }
  // Descending: surface rises from y on the left to (y + height) on the right.
  return {
    type: "block",
    shape: "ramp-down",
    height: toSurfaceY - fromSurfaceY,
    width,
    x,
    y: fromSurfaceY,
  };
}

// ---------------------------------------------------------------------------
// Lighting patterns (purely cosmetic; shape the mood, not the route)
// ---------------------------------------------------------------------------

export function darkZone(b: CourseBuilder, width: number): void {
  b.add(decor("shadow", b.x, -10, width, 200));
  b.add(decor("dark", b.x + width * 0.2, 60, width * 0.6, 150));
  b.tag("lighting-dark");
}

export function brightZone(b: CourseBuilder, width: number): void {
  b.add(decor("glow", b.x + width * 0.1, 70, width * 0.8, 150));
  b.tag("lighting-bright");
}

export function spotlights(b: CourseBuilder, width: number, count = 3): void {
  const step = width / Math.max(1, count);
  for (let index = 0; index < count; index += 1) {
    b.add(decor("spotlight", b.x + index * step + 20, -40, 120, 260));
  }
  b.tag("lighting-bright");
}

export function strobeZone(b: CourseBuilder, width: number): void {
  b.add(decor("flash", b.x + 30, 96, Math.min(180, width * 0.4), 90));
  b.add(decor("beam", b.x + width * 0.5, 40, Math.min(220, width * 0.5), 130));
  b.tag("lighting-bright");
}

// ---------------------------------------------------------------------------
// Base gameplay patterns
// ---------------------------------------------------------------------------

/** Flat breathing room. */
export function rest(b: CourseBuilder, width = BEAT_SPACING): void {
  b.advance(width);
  b.tag("rest");
}

/**
 * Rhythmic ground-spike clusters (1-3 spikes each) separated by safe gaps.
 * The conservative cube jump clears up to three contiguous spikes.
 */
/** A single ground spike pinned at an absolute x (precise hop-safe placement). */
export function groundSpikeBeat(b: CourseBuilder, x: number): void {
  b.add(groundSpike(x));
  b.x = Math.max(b.x, x + 30);
  b.tag("spike", "jump");
}

export function spikeRhythm(
  b: CourseBuilder,
  clusterSizes: readonly number[],
  spacing = BEAT_SPACING,
): void {
  for (const rawSize of clusterSizes) {
    const size = Math.max(1, Math.min(3, Math.round(rawSize)));
    for (let index = 0; index < size; index += 1) {
      b.add(groundSpike(b.x + index * 30));
    }
    b.advance(Math.max(spacing, size * 30 + 140));
  }
  b.tag("spike", "jump");
}

/** A small hill: ramp up to a short plateau and back down. */
export function hill(
  b: CourseBuilder,
  rise = 60,
  plateauWidth = 150,
): void {
  const top = b.surfaceY - rise;
  b.add(ramp(b.x, 90, b.surfaceY, top));
  b.advance(90);
  b.add(plateau(b.x, top, plateauWidth));
  b.advance(plateauWidth);
  b.add(ramp(b.x, 90, top, b.surfaceY));
  b.advance(90 + 60);
  b.tag("jump", "vertical");
}

/**
 * A tall climb: a long ramp up to an elevated plateau, traversal, then a ramp
 * back down. This is the headline "up, up, up" pattern — the follow-camera
 * scrolls upward as the runner ascends and back down as it descends.
 */
export function bigClimb(
  b: CourseBuilder,
  options: {
    rise?: number;
    runUp?: number;
    plateauWidth?: number;
    runDown?: number;
    light?: "bright" | "dark";
  } = {},
): void {
  const rise = options.rise ?? 210;
  const runUp = Math.max(options.runUp ?? 0, Math.ceil(rise / HERO_ASCENT_SLOPE));
  const plateauWidth = options.plateauWidth ?? 240;
  const runDown = options.runDown ?? 260;
  const top = b.surfaceY - rise;

  b.add(ramp(b.x, runUp, b.surfaceY, top));
  b.advance(runUp);
  b.add(plateau(b.x, top, plateauWidth));
  if (options.light === "dark") {
    b.add(decor("shadow", b.x - 30, top - 150, plateauWidth + 60, 140));
  } else if (options.light === "bright") {
    b.add(decor("glow", b.x, top - 130, plateauWidth, 120));
  }
  b.advance(plateauWidth);
  b.add(ramp(b.x, runDown, top, b.surfaceY));
  b.advance(runDown + 80);
  b.tag("vertical", "jump");
}

/**
 * A dedicated vertical showcase: a symmetric staircase that climbs tier by tier
 * to a high summit and steps back down — reading as a temple/pyramid the
 * follow-camera scrolls up and over. Tiers are short ramps into plateaus, so the
 * conservative solver walks the whole structure (ramps are its reliable way up).
 */
export function templeSteps(
  b: CourseBuilder,
  options: {
    tiers?: number;
    tierRise?: number;
    tierWidth?: number;
    rampWidth?: number;
    light?: "bright" | "dark";
  } = {},
): void {
  const tiers = Math.max(2, options.tiers ?? 5);
  const tierRise = options.tierRise ?? 40;
  const tierWidth = options.tierWidth ?? 120;
  const rampWidth = options.rampWidth ?? 76;
  const base = b.surfaceY;

  const stepUp = (): void => {
    const top = b.surfaceY - tierRise;
    b.add(ramp(b.x, rampWidth, b.surfaceY, top));
    b.advance(rampWidth);
    b.surfaceY = top;
    b.add(plateau(b.x, b.surfaceY, tierWidth));
    b.add(decor("flash", b.x + tierWidth * 0.5 - 13, b.surfaceY - 48, 26, 26));
    b.advance(tierWidth);
  };

  const stepDown = (): void => {
    const bottom = b.surfaceY + tierRise;
    b.add(ramp(b.x, rampWidth, b.surfaceY, bottom));
    b.advance(rampWidth);
    b.surfaceY = bottom;
    b.add(plateau(b.x, b.surfaceY, tierWidth));
    b.advance(tierWidth);
  };

  for (let tier = 0; tier < tiers; tier += 1) {
    stepUp();
  }
  // Crown the summit so it reads as a temple landing.
  if (options.light === "dark") {
    b.add(decor("shadow", b.x - tierWidth, b.surfaceY - 150, tierWidth * 2, 140));
  } else {
    b.add(decor("glow", b.x - tierWidth, b.surfaceY - 140, tierWidth * 2, 120));
  }
  for (let tier = 0; tier < tiers; tier += 1) {
    stepDown();
  }
  // Guarantee we return exactly to the entry surface for clean composition.
  if (b.surfaceY !== base) {
    b.add(ramp(b.x, rampWidth, b.surfaceY, base));
    b.advance(rampWidth);
    b.surfaceY = base;
  }
  b.advance(60);
  b.tag("vertical", "jump");
}

/**
 * A spike-pit crossing bridged by an ascending ramp with floating step markers,
 * matching the proven stair-pit geometry. Removes the floor so a miss is fatal.
 */
export function pitBridge(
  b: CourseBuilder,
  options: { steps?: number; firstSurfaceY?: number } = {},
): void {
  // Delegates to the proven stair-pit geometry: an ascending ramp bridges a
  // spike pit (floor removed) with floating step markers. The conservative
  // solver reliably walks this; hand-rolled ramps tend to make it overshoot.
  const steps = options.steps ?? 6;
  const section = buildStairPitSection(
    b.x,
    steps,
    options.firstSurfaceY !== undefined
      ? { firstSurfaceY: options.firstSurfaceY }
      : {},
  );
  b.add(...section.entities);
  b.channel(section.channel);
  // section.endX precedes the landing ramp-down + plateau it appends, so leave
  // generous clearance for bounds-safety.
  b.x = section.endX + 220;
  b.tag("vertical", "gap", "jump");
}

/**
 * A launch pad that throws the runner up and forward into an open arc, landing
 * back on the ground further along. Pads fire on contact, so this is a pure
 * "air time" beat the solver clears passively.
 */
export function padVault(
  b: CourseBuilder,
  options: { impulse?: number; landAhead?: number; light?: boolean } = {},
): void {
  const impulse = options.impulse ?? 720;
  const landAhead = options.landAhead ?? 320;
  b.add(launchPad(b.nextId("pad"), b.x, b.surfaceY, impulse));
  if (options.light) {
    b.add(decor("spotlight", b.x - 40, -40, 120, 320));
  }
  b.advance(landAhead);
  b.tag("pad", "vertical", "jump");
}

/**
 * A chain of impulse orbs that lift the runner upward, each followed by a
 * landing platform. Returns the orb ids (useful when a level requires the orb
 * route for reachability). Orbs are catchable by the conservative pre-jump.
 */
export function orbLift(
  b: CourseBuilder,
  options: { count?: number; required?: boolean; centerY?: number } = {},
): readonly string[] {
  const count = options.count ?? 3;
  const centerY = options.centerY ?? 198;
  const ids: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const id = b.nextId("orb");
    b.add(jumpOrb(id, b.x, centerY));
    if (options.required) {
      b.require(id);
    }
    ids.push(id);
    b.advance(BEAT_SPACING + 20);
  }

  b.add(plateau(b.x, b.surfaceY, 120));
  b.advance(160);
  b.tag("orb", "vertical", "jump");
  return ids;
}

/**
 * A lure orb that flings the runner into a visible spike cap — an optional trap
 * the solver knows to skip but a greedy player will hit.
 */
export function trapOrb(
  b: CourseBuilder,
  options: { magnitude?: number } = {},
): string {
  const id = b.nextId("trap");
  const magnitude = options.magnitude ?? 680;
  b.add({
    type: "orb",
    id,
    effect: { kind: "impulse", magnitude },
    height: 28,
    width: 28,
    x: b.x,
    y: 210 - 14,
  });
  // The bait spike sits in the launch arc, not on the running surface.
  b.add({ type: "spike", height: 30, width: 30, x: b.x + 8, y: 150 });
  b.advance(BEAT_SPACING);
  b.tag("orb");
  return id;
}

/**
 * A bounded ship corridor: ship portal in, cube portal out, with a ceiling and
 * floor and optional pinch gates that demand precise altitude control.
 */
export function shipReef(
  b: CourseBuilder,
  options: {
    length?: number;
    gates?: readonly FlightGate[];
    ceilingBottomY?: number;
    lowerSurfaceY?: number;
    light?: "dark" | "bright";
  } = {},
): void {
  const length = options.length ?? 760;
  const shipX = b.x;
  const cubeX = shipX + length;
  b.add(...shipPortalPair(shipX, cubeX));
  b.channel(
    shipChannel(shipX - 40, cubeX + 60, options.gates as FlightGate[] | undefined),
  );
  if (options.ceilingBottomY !== undefined || options.lowerSurfaceY !== undefined) {
    // Override defaults by replacing the just-pushed channel.
    const channel = b.channels[b.channels.length - 1]!;
    if (options.ceilingBottomY !== undefined) {
      channel.ceilingBottomY = options.ceilingBottomY;
    }
    if (options.lowerSurfaceY !== undefined) {
      channel.lowerSurfaceY = options.lowerSurfaceY;
    }
  }
  if (options.light === "dark") {
    b.add(decor("shadow", shipX, -10, length, 130));
    b.add(decor("dark", shipX + length * 0.3, 40, length * 0.5, 150));
  } else if (options.light === "bright") {
    b.add(decor("glow", shipX + 40, 40, length - 80, 120));
  }
  b.x = cubeX + 80;
  b.tag("ship", "portal-challenge");
}

/**
 * An open ship gallery — wider corridor, fewer pinch gates, room to surf big
 * vertical waves. Pairs well with a dark or starlit mood.
 */
export function shipGallery(
  b: CourseBuilder,
  options: { length?: number; light?: "dark" | "bright" } = {},
): void {
  shipReef(b, {
    length: options.length ?? 900,
    ceilingBottomY: 80,
    lowerSurfaceY: SHIP_FLOOR_Y,
    ...(options.light ? { light: options.light } : {}),
  });
}

// ---------------------------------------------------------------------------
// Ceiling-spike pinch helper for ship corridors
// ---------------------------------------------------------------------------

/** Standard alternating pinch gates for a ship reef of the given length. */
export function reefGates(
  startX: number,
  length: number,
): readonly FlightGate[] {
  const gates: FlightGate[] = [];
  const stops = Math.max(2, Math.floor(length / 240));
  for (let index = 1; index <= stops; index += 1) {
    const gx = startX + (length * index) / (stops + 1);
    if (index % 2 === 1) {
      gates.push({ edge: "ceiling", limitY: 165, width: 70, x: Math.round(gx) });
    } else {
      gates.push({ edge: "lower", limitY: 270, width: 80, x: Math.round(gx) });
    }
  }
  return gates;
}

// ---------------------------------------------------------------------------
// Meta-patterns (patterns of patterns)
// ---------------------------------------------------------------------------

/** Gentle teaching motif: a couple of spikes then a friendly hill. */
export function awakeningMotif(b: CourseBuilder): void {
  spikeRhythm(b, [1, 1]);
  hill(b, 56, 150);
  rest(b, 160);
}

/** Vertical showcase: dramatic climb crowned by a launch over the summit. */
export function summitMotif(
  b: CourseBuilder,
  options: { light?: "bright" | "dark" } = {},
): void {
  bigClimb(b, { rise: 220, ...(options.light ? { light: options.light } : {}) });
  padVault(b, { impulse: 760, landAhead: 340, light: true });
  rest(b, 150);
}

/** Flight motif: lead-in spikes, a pinch-gated reef, then a soft landing. */
export function flightMotif(
  b: CourseBuilder,
  options: { length?: number; light?: "dark" | "bright" } = {},
): void {
  const length = options.length ?? 820;
  spikeRhythm(b, [1]);
  const gates = reefGates(b.x, length);
  shipReef(b, {
    length,
    gates,
    ...(options.light ? { light: options.light } : {}),
  });
  rest(b, 180);
}

/** Rift motif: a spike-pit ascent chased by a tight spike rhythm. */
export function riftMotif(b: CourseBuilder): void {
  pitBridge(b, { steps: 6 });
  spikeRhythm(b, [2, 1, 2]);
  rest(b, 150);
}
