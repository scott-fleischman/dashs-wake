import type { LevelContent } from "../content/first-wake";
import type { DifficultyAnalysis } from "./generator";
import { analyzeLevelDifficulty } from "./generator";
import type { LevelDemo, LevelDemoFrame } from "./level-solver";

export interface LevelMechanicCounts {
  block: number;
  orb: number;
  pad: number;
  portalCube: number;
  portalShip: number;
  spike: number;
  trapOrb: number;
}

export interface LevelProfileVectors {
  /** Average spike count per 1000 world units. */
  spikeDensityPer1000: number;
  /** Share of demo frames (or estimated route) spent in ship mode, 0–1. */
  shipFlightRatio: number;
  /** Peak-to-trough player height observed or estimated from layout. */
  verticalExcursion: number;
  /** 0–100 — taller climbs and deeper falls score higher. */
  verticalityScore: number;
  /** 0–100 — more mechanic types and balanced use scores higher. */
  obstacleVarietyScore: number;
  /** 0–100 — more distinct lighting/atmosphere kinds in play score higher. */
  lightingVarietyScore: number;
  /** 0–100 — spikes aligned to the beat map score higher. */
  beatRegularityScore: number;
  /** Tightest hazard spacing expressed as reaction frames at run speed. */
  timingTightnessFrames: number;
  /** 0–100 — more airborne time / vertical motion scores higher. */
  jumpIntensityScore: number;
}

export interface LevelProfileAnalysis {
  difficulty: DifficultyAnalysis;
  hasWorkingDemo: boolean;
  mechanics: LevelMechanicCounts;
  vectors: LevelProfileVectors;
  /** 0–100 composite of variety, verticality, lighting, and motion. */
  interestingnessScore: number;
}

const ALL_DECORATION_KINDS = 9;

function distinctLightingKinds(level: LevelContent): number {
  const kinds = new Set<string>();
  for (const entity of level.entities) {
    if (entity.type === "decoration") {
      kinds.add(entity.kind);
    }
  }
  return kinds.size;
}

function verticalityScore(verticalExcursion: number): number {
  return Math.round(Math.max(0, Math.min(100, verticalExcursion / 4)));
}

function lightingVarietyScore(level: LevelContent): number {
  return Math.round(
    Math.min(100, (distinctLightingKinds(level) / ALL_DECORATION_KINDS) * 100),
  );
}

/**
 * A single 0–100 "is this level fun and varied?" number. It rewards balanced
 * mechanic variety, real verticality, lighting contrast, airborne motion, and
 * some ship flight, while not over-rewarding raw spike spam.
 */
export function scoreLevelInterest(vectors: LevelProfileVectors): number {
  const score =
    vectors.obstacleVarietyScore * 0.26 +
    vectors.verticalityScore * 0.24 +
    vectors.jumpIntensityScore * 0.18 +
    vectors.lightingVarietyScore * 0.14 +
    Math.min(100, vectors.shipFlightRatio * 100) * 0.1 +
    vectors.beatRegularityScore * 0.08;
  return Math.round(Math.max(0, Math.min(100, score)));
}

function mechanicCounts(level: LevelContent): LevelMechanicCounts {
  const counts: LevelMechanicCounts = {
    block: 0,
    orb: 0,
    pad: 0,
    portalCube: 0,
    portalShip: 0,
    spike: 0,
    trapOrb: 0,
  };

  for (const entity of level.entities) {
    switch (entity.type) {
      case "block":
        counts.block += 1;
        break;
      case "orb":
        counts.orb += 1;
        if (entity.id.includes("trap")) {
          counts.trapOrb += 1;
        }
        break;
      case "pad":
        counts.pad += 1;
        break;
      case "portal":
        if (entity.mode === "ship") {
          counts.portalShip += 1;
        } else {
          counts.portalCube += 1;
        }
        break;
      case "spike":
        counts.spike += 1;
        break;
      default:
        break;
    }
  }

  return counts;
}

function obstacleVarietyScore(counts: LevelMechanicCounts): number {
  const weights: readonly number[] = [
    counts.spike > 0 ? 1 : 0,
    counts.pad > 0 ? 1 : 0,
    counts.orb > 0 ? 1 : 0,
    counts.trapOrb > 0 ? 1 : 0,
    counts.portalShip > 0 ? 1 : 0,
    counts.block > 0 ? 1 : 0,
  ];
  const activeKinds = weights.reduce((sum, value) => sum + value, 0);
  return Math.round((activeKinds / weights.length) * 100);
}

function beatRegularityScore(level: LevelContent): number {
  const spikes = level.entities.filter((entity) => entity.type === "spike");
  if (spikes.length === 0 || level.beatMap.beats.length === 0) {
    return 100;
  }

  const beatPositions = level.beatMap.beats.map((beatMs) =>
    Math.round((beatMs / 1000) * level.rules.horizontalSpeed),
  );
  let totalDeviation = 0;

  for (const spike of spikes) {
    const spikeCenter = spike.x + spike.width / 2;
    let nearest = Number.POSITIVE_INFINITY;
    for (const beatX of beatPositions) {
      nearest = Math.min(nearest, Math.abs(spikeCenter - beatX));
    }
    totalDeviation += nearest;
  }

  const beatLength =
    level.beatMap.beats.length > 1
      ? Math.max(
          1,
          beatPositions[1]! - beatPositions[0]!,
        )
      : Math.max(1, level.rules.horizontalSpeed);
  const averageDeviation = totalDeviation / spikes.length;
  const normalized = Math.min(1, averageDeviation / (beatLength * 0.5));
  return Math.round((1 - normalized) * 100);
}

function layoutVerticalExcursion(level: LevelContent): number {
  const samples: number[] = [level.rules.spawnY];

  for (const entity of level.entities) {
    if (entity.type === "spike" || entity.type === "orb" || entity.type === "pad") {
      samples.push(entity.y, entity.y + entity.height);
    }
    if (entity.type === "block") {
      samples.push(entity.y, entity.y + entity.height);
    }
    if (entity.type === "portal") {
      samples.push(entity.y, entity.y + entity.height);
    }
  }

  return Math.max(...samples) - Math.min(...samples);
}

function demoVerticalExcursion(frames: readonly LevelDemoFrame[]): number {
  if (frames.length === 0) {
    return 0;
  }
  let minY = frames[0]!.y;
  let maxY = frames[0]!.y;
  for (const frame of frames) {
    minY = Math.min(minY, frame.y);
    maxY = Math.max(maxY, frame.y);
  }
  return maxY - minY;
}

function demoShipFlightRatio(frames: readonly LevelDemoFrame[]): number {
  if (frames.length === 0) {
    return 0;
  }
  const shipFrames = frames.filter((frame) => frame.mode === "ship").length;
  return shipFrames / frames.length;
}

function estimateShipFlightRatio(level: LevelContent): number {
  const shipPortals = level.entities.filter(
    (entity) => entity.type === "portal" && entity.mode === "ship",
  );
  if (shipPortals.length === 0) {
    return 0;
  }

  let shipSpan = 0;
  for (const portal of shipPortals) {
    const exit = level.entities.find(
      (entity) =>
        entity.type === "portal" &&
        entity.mode === "cube" &&
        entity.x > portal.x,
    );
    if (exit) {
      shipSpan += exit.x - portal.x;
    }
  }

  return Math.min(1, shipSpan / Math.max(1, level.finishX));
}

function jumpIntensityScore(frames: readonly LevelDemoFrame[]): number {
  if (frames.length < 2) {
    return 0;
  }

  let airTicks = 0;
  let modeChanges = 0;
  let previousMode = frames[0]!.mode;

  for (const frame of frames) {
    if (Math.abs(frame.velocityY) > 24) {
      airTicks += 1;
    }
    if (frame.mode !== previousMode) {
      modeChanges += 1;
      previousMode = frame.mode;
    }
  }

  const airRatio = airTicks / frames.length;
  const modeRatio = Math.min(1, modeChanges / 8);
  return Math.round(Math.min(100, airRatio * 70 + modeRatio * 30));
}

function hazardSpacingVariance(level: LevelContent): number {
  const hazardXs = level.entities
    .filter((entity) => entity.type === "spike")
    .map((entity) => entity.x)
    .sort((a, b) => a - b);
  if (hazardXs.length < 2) {
    return 0;
  }

  const gaps: number[] = [];
  for (let index = 1; index < hazardXs.length; index += 1) {
    gaps.push(hazardXs[index]! - hazardXs[index - 1]!);
  }
  const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  const variance =
    gaps.reduce((sum, gap) => sum + (gap - mean) ** 2, 0) / gaps.length;
  return Math.sqrt(variance);
}

export function analyzeLevelProfile(
  level: LevelContent,
  demo: LevelDemo | null,
): LevelProfileAnalysis {
  const mechanics = mechanicCounts(level);
  const difficulty = analyzeLevelDifficulty(level);
  const frames = demo?.success ? demo.frames : [];
  const spikeDensityPer1000 =
    mechanics.spike / Math.max(1, level.finishX / 1000);
  const spacingVariance = hazardSpacingVariance(level);
  const meanSpikeGap =
    mechanics.spike > 1
      ? level.finishX / Math.max(1, mechanics.spike)
      : level.finishX;
  const irregularityPenalty = Math.min(
    40,
    (spacingVariance / Math.max(1, meanSpikeGap)) * 40,
  );

  const excursion =
    frames.length > 0
      ? Math.max(demoVerticalExcursion(frames), layoutVerticalExcursion(level) * 0.35)
      : layoutVerticalExcursion(level);
  const vectors: LevelProfileVectors = {
    spikeDensityPer1000,
    shipFlightRatio:
      frames.length > 0
        ? demoShipFlightRatio(frames)
        : estimateShipFlightRatio(level),
    verticalExcursion: excursion,
    verticalityScore: verticalityScore(excursion),
    obstacleVarietyScore: obstacleVarietyScore(mechanics),
    lightingVarietyScore: lightingVarietyScore(level),
    beatRegularityScore: Math.max(
      0,
      beatRegularityScore(level) - irregularityPenalty,
    ),
    timingTightnessFrames: difficulty.peakPrecisionFrames,
    jumpIntensityScore: frames.length > 0 ? jumpIntensityScore(frames) : 0,
  };

  return {
    difficulty,
    hasWorkingDemo: demo?.success ?? false,
    mechanics,
    vectors,
    interestingnessScore: scoreLevelInterest(vectors),
  };
}

export function formatLevelProfileSummary(analysis: LevelProfileAnalysis): string {
  const { vectors: v } = analysis;
  const parts = [
    `Spike ${v.spikeDensityPer1000.toFixed(1)}/1k`,
    `Ship ${Math.round(v.shipFlightRatio * 100)}%`,
    `Vert ${Math.round(v.verticalExcursion)}`,
    `Light ${v.lightingVarietyScore}`,
    `Fun ${analysis.interestingnessScore}`,
    `Timing ${v.timingTightnessFrames}f`,
  ];
  if (analysis.hasWorkingDemo) {
    parts.push("Demo OK");
  }
  return parts.join(" · ");
}
