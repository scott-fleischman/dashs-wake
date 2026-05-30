import type { RunRules } from "../core/run-simulation";
import { OFFICIAL_LEVEL_RULES } from "./level-rules";

/** One player-cube unit — the atomic spacing grid for patterns. */
export const CUBE = OFFICIAL_LEVEL_RULES.playerWidth;

/** Shared run rules every pattern is authored against. */
export const PATTERN_RULES: RunRules = OFFICIAL_LEVEL_RULES;

const rules = OFFICIAL_LEVEL_RULES;

/** Time aloft for a full cube jump arc (seconds). */
export const JUMP_AIRTIME_S =
  (2 * Math.abs(rules.jumpVelocity)) / rules.gravity;

/** Horizontal travel during one conservative jump arc (px). */
export const JUMP_REACH_X = Math.round(rules.horizontalSpeed * JUMP_AIRTIME_S);

/** Peak rise of a cube jump above the takeoff surface (px). */
export const JUMP_REACH_Y = Math.round(
  (rules.jumpVelocity * rules.jumpVelocity) / (2 * rules.gravity),
);

/** Highest single jump a conservative solver reliably clears (px). */
export const SAFE_STEP_RISE = 64;

/** Horizontal span between stair landings, snapped to the cube grid. */
export const STEP_SPAN_X = snapCube(JUMP_REACH_X);

/** Comfortable run-up before each stair riser (px). */
export const STEP_APPROACH_WIDTH = cubes(2);

/** Standable width for a stair landing (px). */
export const STEP_LANDING_WIDTH = cubes(3);

/** Default impulse for launch pads in atomic patterns. */
export const PAD_IMPULSE = 720;

/** Default impulse for jump orbs in atomic patterns. */
export const ORB_IMPULSE = 740;

/** Horizontal spacing between chained launch pads (px). */
export const PAD_CHAIN_SPACING = cubes(8);

/** Horizontal spacing between stacked orbs (px). */
export const ORB_STACK_SPACING = Math.round(STEP_SPAN_X * 0.85);

/** Minimum spacing between independent pattern placements (px). */
export const PATTERN_BEAT_SPACING = 220;

/** Convert a cube count to world pixels. */
export function cubes(count: number): number {
  return Math.round(count * CUBE);
}

/** Snap a world coordinate to the nearest cube boundary. */
export function snapCube(value: number): number {
  return Math.round(value / CUBE) * CUBE;
}

/** Peak vertical rise from an upward impulse (px). */
export function impulseReachY(
  magnitude: number,
  gravity = rules.gravity,
): number {
  return Math.round((magnitude * magnitude) / (2 * gravity));
}

export const PAD_REACH_Y = impulseReachY(PAD_IMPULSE);
export const ORB_REACH_Y = impulseReachY(ORB_IMPULSE);

/** Rise that only a pad/orb can reach — above a single cube jump. */
export const PAD_ONLY_RISE = Math.max(
  SAFE_STEP_RISE + cubes(1),
  Math.min(PAD_REACH_Y - cubes(2), SAFE_STEP_RISE * 2),
);
