import type { RunRules } from "../core/run-simulation";
import { PLAYER_HORIZONTAL_SPEED } from "./level-pace";
import { SPAWN_SURFACE_Y, TERRAIN_DEPTH_Y } from "./terrain";

/** Shared run rules for official and generated courses. Keep this module free of first-wake imports. */
export const OFFICIAL_LEVEL_RULES: RunRules = {
  fallBoundaryY: 500,
  // Ships only "fell" once they drop below the bottom row of terrain blocks, so
  // a descending ship lands on that visible floor line instead of dying in the
  // open air partway down the screen.
  shipFallBoundaryY: TERRAIN_DEPTH_Y,
  gravity: 1250,
  horizontalSpeed: PLAYER_HORIZONTAL_SPEED,
  jumpVelocity: -430,
  playerHeight: 34,
  playerWidth: 34,
  spawnY: SPAWN_SURFACE_Y,
};
