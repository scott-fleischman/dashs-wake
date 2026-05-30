import type {
  BlockEntity,
  DecorationEntity,
  LevelEntity,
  OrbEntity,
  PadEntity,
  SpikeEntity,
} from "../core/run-simulation";
import type { FlightChannel } from "./terrain";
import { SHIP_FLOOR_Y, SPAWN_SURFACE_Y } from "./terrain";

export const PLATFORM_THICKNESS = 36;

/** Top surface Y for a standable cube platform. */
export function cubePlatform(
  x: number,
  surfaceY: number,
  width = 56,
): BlockEntity {
  return {
    type: "block",
    height: PLATFORM_THICKNESS,
    width,
    x,
    y: surfaceY,
  };
}

export function groundSpike(x: number): SpikeEntity {
  return { type: "spike", height: 30, width: 30, x, y: SPAWN_SURFACE_Y - 30 };
}

export function ceilingSpike(x: number, ceilingY: number): SpikeEntity {
  return { type: "spike", height: 30, width: 30, x, y: ceilingY };
}

export function launchPad(
  id: string,
  x: number,
  surfaceY: number,
  impulse = 720,
): PadEntity {
  return {
    type: "pad",
    height: 12,
    id,
    impulse,
    width: 48,
    x,
    y: surfaceY - 12,
  };
}

export function jumpOrb(
  id: string,
  x: number,
  centerY: number,
  magnitude = 740,
): OrbEntity {
  return {
    type: "orb",
    effect: { kind: "impulse", magnitude },
    height: 28,
    id,
    width: 28,
    x,
    y: centerY - 14,
  };
}

export function decor(
  kind: DecorationEntity["kind"],
  x: number,
  y: number,
  width: number,
  height: number,
): DecorationEntity {
  return { type: "decoration", kind, height, width, x, y };
}

/** Removes auto floor so only authored platforms are standable. */
export function openPitChannel(startX: number, endX: number): FlightChannel {
  return {
    ceilingBottomY: 72,
    endX,
    lowerSurfaceY: 520,
    startX,
  };
}

export function shipChannel(
  startX: number,
  endX: number,
  gates?: FlightChannel["gates"],
): FlightChannel {
  return {
    ceilingBottomY: 96,
    endX,
    gates,
    lowerSurfaceY: SHIP_FLOOR_Y,
    startX,
  };
}

export interface StairPitSection {
  channel: FlightChannel;
  entities: LevelEntity[];
  endX: number;
}

/**
 * Ascending ramp over a spike pit with floating step markers (decor) so the
 * route is readable and the conservative solver can walk the ramp surface.
 */
export function buildStairPitSection(
  startX: number,
  stepCount: number,
  options: {
    firstSurfaceY?: number;
    rampWidth?: number;
    stepGap?: number;
    stepRise?: number;
    platformWidth?: number;
  } = {},
): StairPitSection {
  const stepRise = options.stepRise ?? 22;
  const peakSurfaceY = Math.max(
    SPAWN_SURFACE_Y - 128,
    (options.firstSurfaceY ?? SPAWN_SURFACE_Y) - stepCount * stepRise,
  );
  const rampWidth =
    options.rampWidth ??
    Math.max(320, stepCount * (options.stepGap ?? 78) + 80);
  const endX = startX + rampWidth + 48;
  const rise = SPAWN_SURFACE_Y - peakSurfaceY;
  const entities: LevelEntity[] = [
    cubePlatform(startX - 84, SPAWN_SURFACE_Y, 84),
    {
      type: "block",
      height: rise + PLATFORM_THICKNESS,
      shape: "ramp-up",
      width: rampWidth,
      x: startX,
      y: peakSurfaceY,
    },
  ];

  for (let step = 1; step <= stepCount; step += 1) {
    const t = step / stepCount;
    const markerX = startX + rampWidth * t - 18;
    const markerY = peakSurfaceY + rise * (1 - t) - 64;
    entities.push(decor(step % 2 === 0 ? "diamond" : "flash", markerX, markerY, 28, 28));
  }

  for (let pitX = startX + 32; pitX < endX - 56; pitX += 104) {
    entities.push({
      type: "spike",
      height: 40,
      width: 40,
      x: pitX,
      y: 418,
    });
  }

  const landingX = startX + rampWidth + 8;
  entities.push({
    type: "block",
    height: rise + PLATFORM_THICKNESS,
    shape: "ramp-down",
    width: 96,
    x: landingX,
    y: SPAWN_SURFACE_Y,
  });
  entities.push(cubePlatform(landingX + 88, SPAWN_SURFACE_Y, 120));

  return {
    channel: openPitChannel(startX - 52, endX),
    entities,
    endX,
  };
}

export function shipPortalPair(
  shipX: number,
  cubeX: number,
): readonly LevelEntity[] {
  return [
    { type: "portal", height: 320, mode: "ship", width: 12, x: shipX, y: 36 },
    { type: "portal", height: 320, mode: "cube", width: 12, x: cubeX, y: 36 },
  ];
}
