import type { BeatMap } from "./first-wake";

export interface OfficialTrack {
  artist: string;
  audioPath: string;
  bpm: number;
  durationMs: number;
  id: string;
  license: "Original";
  levelId: string;
  sourceUrl: string;
  title: string;
}

function officialAudioPath(filename: string): string {
  return `${import.meta.env.BASE_URL}audio/official/${filename}`;
}

export const officialSoundtrack: readonly OfficialTrack[] = [
  {
    artist: "Dash's Wake",
    audioPath: officialAudioPath("level-1-dawn-circuit.ogg"),
    bpm: 100,
    durationMs: 21_000,
    id: "track-dawn-circuit",
    license: "Original",
    levelId: "level_1",
    sourceUrl: "Original in-repository composition",
    title: "Dawn Circuit",
  },
  {
    artist: "Dash's Wake",
    audioPath: officialAudioPath("level-2-launch-relay.ogg"),
    bpm: 120,
    durationMs: 21_000,
    id: "track-launch-relay",
    license: "Original",
    levelId: "level_2",
    sourceUrl: "Original in-repository composition",
    title: "Hollow Steps",
  },
  {
    artist: "Dash's Wake",
    audioPath: officialAudioPath("level-3-orbit-glass.ogg"),
    bpm: 108,
    durationMs: 28_000,
    id: "track-orbit-glass",
    license: "Original",
    levelId: "level_3",
    sourceUrl: "Original in-repository composition",
    title: "Neon Drift",
  },
  {
    artist: "Dash's Wake",
    audioPath: officialAudioPath("level-4-switchyard.ogg"),
    bpm: 132,
    durationMs: 28_000,
    id: "track-switchyard",
    license: "Original",
    levelId: "level_4",
    sourceUrl: "Original in-repository composition",
    title: "Prism Ascent",
  },
  {
    artist: "Dash's Wake",
    audioPath: officialAudioPath("level-5-false-signal.ogg"),
    bpm: 145,
    durationMs: 28_000,
    id: "track-final-rift",
    license: "Original",
    levelId: "level_5",
    sourceUrl: "Original in-repository composition",
    title: "Final Rift",
  },
];

export function getOfficialTrack(levelId: string): OfficialTrack | undefined {
  return officialSoundtrack.find((track) => track.levelId === levelId);
}

export function buildOfficialBeatMap(levelId: string): BeatMap {
  const track = getOfficialTrack(levelId);

  if (!track) {
    throw new Error(`Missing official track for ${levelId}.`);
  }

  const beatIntervalMs = 60_000 / track.bpm;
  const beats: number[] = [];

  for (let timeMs = 0; timeMs <= track.durationMs; timeMs += beatIntervalMs) {
    beats.push(Math.round(timeMs));
  }

  return { beats, durationMs: track.durationMs };
}
