import type { BlockEntity, LevelEntity } from "../core/run-simulation";

export const SPAWN_SURFACE_Y = 300;
export const TERRAIN_DEPTH_Y = 540;
/**
 * Floor surface for ship corridors. Sits near the bottom of the playfield so a
 * descending ship lands on a visible line of blocks instead of triggering a
 * "fell" death high up the screen.
 */
export const SHIP_FLOOR_Y = 478;

const TERRAIN_TILE_WIDTH = 92;

export interface FlightGate {
  edge: "ceiling" | "lower";
  limitY: number;
  width: number;
  x: number;
}

export interface FlightChannel {
  ceilingBottomY?: number;
  ceilingEndX?: number;
  endX: number;
  gates?: readonly FlightGate[];
  lowerSurfaceY?: number;
  startX: number;
}

function tileRun(
  startX: number,
  endX: number,
  y: number,
  height: number,
): BlockEntity[] {
  const blocks: BlockEntity[] = [];

  for (let x = startX; x < endX; x += TERRAIN_TILE_WIDTH) {
    blocks.push({
      type: "block",
      height,
      width: Math.min(TERRAIN_TILE_WIDTH, endX - x),
      x,
      y,
    });
  }

  return blocks;
}

export function buildSurfaceRun(
  startX: number,
  endX: number,
  y: number,
): readonly BlockEntity[] {
  return tileRun(startX, endX, y, TERRAIN_DEPTH_Y - y);
}

function flightChannelBlocks(channel: FlightChannel): BlockEntity[] {
  const ceilingBottomY = channel.ceilingBottomY ?? 36;
  const ceilingEndX = Math.min(channel.ceilingEndX ?? channel.endX, channel.endX);
  // Ship corridors keep their floor as a low "line of blocks at the bottom" so
  // the runner never reads as falling into empty space (see SHIP_FLOOR_Y).
  const lowerSurfaceY = channel.lowerSurfaceY ?? SHIP_FLOOR_Y;
  // Keep the exit ramp gentle enough to walk even when the floor sits low: cap
  // the slope at ~0.9 so a deep corridor doesn't end in a wall-like incline.
  const rise = lowerSurfaceY - SPAWN_SURFACE_Y;
  const rampWidth =
    lowerSurfaceY > SPAWN_SURFACE_Y
      ? Math.min(Math.max(120, Math.ceil(rise / 0.9)), channel.endX - channel.startX)
      : 0;
  const lowerRunEndX = channel.endX - rampWidth;
  const blocks = [
    ...tileRun(
      channel.startX,
      ceilingEndX,
      0,
      ceilingBottomY,
    ),
    ...tileRun(
      channel.startX,
      lowerRunEndX,
      lowerSurfaceY,
      TERRAIN_DEPTH_Y - lowerSurfaceY,
    ),
  ];

  if (rampWidth > 0) {
    blocks.push({
      type: "block",
      shape: "ramp-up",
      height: lowerSurfaceY - SPAWN_SURFACE_Y,
      width: rampWidth,
      x: lowerRunEndX,
      y: SPAWN_SURFACE_Y,
    });
  }

  for (const gate of channel.gates ?? []) {
    blocks.push(
      gate.edge === "ceiling"
        ? {
            type: "block",
            height: gate.limitY - ceilingBottomY,
            width: gate.width,
            x: gate.x,
            y: ceilingBottomY,
          }
        : {
            type: "block",
            height: lowerSurfaceY - gate.limitY,
            width: gate.width,
            x: gate.x,
            y: gate.limitY,
          },
    );
  }

  return blocks;
}

export function buildSupportingTerrain(
  finishX: number,
  channels: readonly FlightChannel[] = [],
): readonly BlockEntity[] {
  const orderedChannels = channels.slice().sort((a, b) => a.startX - b.startX);
  const blocks: BlockEntity[] = [];
  let cursor = 0;

  for (const channel of orderedChannels) {
    if (channel.startX > cursor) {
      blocks.push(
        ...tileRun(
          cursor,
          channel.startX,
          SPAWN_SURFACE_Y,
          TERRAIN_DEPTH_Y - SPAWN_SURFACE_Y,
        ),
      );
    }

    blocks.push(...flightChannelBlocks(channel));
    cursor = Math.max(cursor, channel.endX);
  }

  if (cursor < finishX) {
    blocks.push(
      ...tileRun(
        cursor,
        finishX,
        SPAWN_SURFACE_Y,
        TERRAIN_DEPTH_Y - SPAWN_SURFACE_Y,
      ),
    );
  }

  return blocks;
}

export function withSupportingTerrain(
  entities: readonly LevelEntity[],
  finishX: number,
  channels: readonly FlightChannel[] = [],
): readonly LevelEntity[] {
  return [...buildSupportingTerrain(finishX, channels), ...entities];
}
