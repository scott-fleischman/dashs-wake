import type { LevelEntity, RunRules } from "../core/run-simulation";
import { OFFICIAL_LEVEL_RULES } from "./level-rules";
import { buildOfficialBeatMap } from "./official-soundtrack";
import { withSupportingTerrain, type FlightChannel } from "./terrain";

export interface BeatMap {
  beats: readonly number[];
  durationMs: number;
}

export interface ExpectedRoute {
  requiredTriggerIds: readonly string[];
}

export interface LevelContent {
  beatMap: BeatMap;
  entities: readonly LevelEntity[];
  expectedRoute?: ExpectedRoute;
  finishX: number;
  rules: RunRules;
}

export function beatLengthPx(bpm: number): number {
  return (60 / bpm) * OFFICIAL_LEVEL_RULES.horizontalSpeed;
}

/** Beat budget so traversal stays inside the bundled track (with headroom). */
export function beatsForOfficialTrack(levelId: string, bpm: number): number {
  const beatMap = buildOfficialBeatMap(levelId);
  const maxFinishX =
    (beatMap.durationMs / 1000) * OFFICIAL_LEVEL_RULES.horizontalSpeed * 0.95;
  return Math.max(8, Math.floor(maxFinishX / beatLengthPx(bpm)) - 2);
}

export function assembleOfficialLevel(
  levelId: string,
  entities: readonly LevelEntity[],
  finishX: number,
  channels: readonly FlightChannel[] = [],
  expectedRoute?: ExpectedRoute,
): LevelContent {
  return {
    beatMap: buildOfficialBeatMap(levelId),
    entities: withSupportingTerrain(entities, finishX, channels),
    finishX,
    rules: OFFICIAL_LEVEL_RULES,
    ...(expectedRoute ? { expectedRoute } : {}),
  };
}
