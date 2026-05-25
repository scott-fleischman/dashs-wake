import type { BeatMap } from "./first-wake";

const PLACEHOLDER_BEAT_INTERVAL_MS = 600;
const PLACEHOLDER_BEAT_TAIL_MS = 600;

export function buildPlaceholderBeatMap(
  finishX: number,
  horizontalSpeed: number,
): BeatMap {
  const traversalMs = Math.ceil((finishX / horizontalSpeed) * 1000);
  const durationMs = traversalMs + PLACEHOLDER_BEAT_TAIL_MS;
  const beats: number[] = [];

  for (
    let timeMs = 0;
    timeMs <= durationMs;
    timeMs += PLACEHOLDER_BEAT_INTERVAL_MS
  ) {
    beats.push(timeMs);
  }

  return { beats, durationMs };
}
