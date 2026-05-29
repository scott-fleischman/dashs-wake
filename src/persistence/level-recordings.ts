import type { LevelDemo, LevelDemoFrame } from "../core/level-solver";

export type RecordingKind = "personal" | "reference";

export interface StoredRecording {
  frames: readonly LevelDemoFrame[];
  kind: RecordingKind;
  levelId: string;
  recordedAtMs: number;
  tickMs: number;
}

const RECORDINGS_STORAGE_KEY = "dashs-wake-recordings-v1";
const MAX_STORED_FRAMES = 900;
const MAX_PERSONAL_RUNS_PER_LEVEL = 5;

interface StoredRecordingsFile {
  version: 1;
  byLevelId: Record<string, readonly StoredRecording[]>;
}

function readStore(): StoredRecordingsFile {
  try {
    const raw = localStorage.getItem(RECORDINGS_STORAGE_KEY);
    if (!raw) {
      return { version: 1, byLevelId: {} };
    }
    const parsed = JSON.parse(raw) as StoredRecordingsFile;
    if (parsed.version !== 1 || !parsed.byLevelId) {
      return { version: 1, byLevelId: {} };
    }
    return parsed;
  } catch {
    return { version: 1, byLevelId: {} };
  }
}

function writeStore(store: StoredRecordingsFile): void {
  localStorage.setItem(RECORDINGS_STORAGE_KEY, JSON.stringify(store));
}

export function subsampleDemoFrames(
  frames: readonly LevelDemoFrame[],
  maxFrames = MAX_STORED_FRAMES,
): readonly LevelDemoFrame[] {
  if (frames.length <= maxFrames) {
    return frames;
  }

  const step = frames.length / maxFrames;
  const sampled: LevelDemoFrame[] = [];

  for (let index = 0; index < maxFrames; index += 1) {
    sampled.push(frames[Math.floor(index * step)]!);
  }

  return sampled;
}

export function saveLevelRecording(
  levelId: string,
  kind: RecordingKind,
  demo: LevelDemo,
): void {
  if (!demo.success || demo.frames.length === 0) {
    return;
  }

  const store = readStore();
  const existing = store.byLevelId[levelId] ?? [];
  const entry: StoredRecording = {
    frames: subsampleDemoFrames(demo.frames),
    kind,
    levelId,
    recordedAtMs: Date.now(),
    tickMs: demo.tickMs,
  };

  const withoutKind = existing.filter((recording) => recording.kind !== kind);
  const nextForLevel =
    kind === "personal"
      ? [...withoutKind, entry].slice(-MAX_PERSONAL_RUNS_PER_LEVEL)
      : [...withoutKind, entry];

  writeStore({
    version: 1,
    byLevelId: {
      ...store.byLevelId,
      [levelId]: nextForLevel,
    },
  });
}

export function getLatestRecording(
  levelId: string,
  kind: RecordingKind,
): LevelDemo | null {
  const store = readStore();
  const entries = store.byLevelId[levelId] ?? [];
  const match = [...entries].reverse().find((entry) => entry.kind === kind);

  if (!match || match.frames.length === 0) {
    return null;
  }

  return {
    frames: match.frames,
    success: true,
    tickMs: match.tickMs,
  };
}

export function hasRecording(levelId: string, kind: RecordingKind): boolean {
  return getLatestRecording(levelId, kind) !== null;
}

export function deleteRecordingsForLevel(levelId: string): void {
  const store = readStore();
  if (!store.byLevelId[levelId]) {
    return;
  }

  const { [levelId]: _removed, ...rest } = store.byLevelId;
  writeStore({ version: 1, byLevelId: rest });
}
