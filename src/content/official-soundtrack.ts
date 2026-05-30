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
    bpm: 96,
    durationMs: 22_000,
    id: "track-dawn-circuit",
    license: "Original",
    levelId: "level_1",
    sourceUrl: "Original in-repository composition",
    title: "Dawn Circuit",
  },
  {
    artist: "Dash's Wake",
    audioPath: officialAudioPath("level-2-launch-relay.ogg"),
    bpm: 124,
    durationMs: 22_000,
    id: "track-launch-relay",
    license: "Original",
    levelId: "level_2",
    sourceUrl: "Original in-repository composition",
    title: "Hollow Steps",
  },
  {
    artist: "Dash's Wake",
    audioPath: officialAudioPath("level-3-orbit-glass.ogg"),
    bpm: 110,
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
    bpm: 134,
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
    bpm: 150,
    durationMs: 28_000,
    id: "track-final-rift",
    license: "Original",
    levelId: "level_5",
    sourceUrl: "Original in-repository composition",
    title: "Final Rift",
  },
];

export interface SongLibraryEntry {
  audioPath: string;
  bpm: number;
  durationMs: number;
  id: string;
  mood: string;
  title: string;
}

/**
 * Bundled songs selectable in-game (the level tracks plus a few extras), so a
 * player can pick and preview a song instead of having to upload an audio file.
 */
export const songLibrary: readonly SongLibraryEntry[] = [
  { id: "song-dawn-circuit", title: "Dawn Circuit", mood: "Warm / easygoing", audioPath: officialAudioPath("level-1-dawn-circuit.ogg"), bpm: 96, durationMs: 22_000 },
  { id: "song-hollow-steps", title: "Hollow Steps", mood: "Tense march", audioPath: officialAudioPath("level-2-launch-relay.ogg"), bpm: 124, durationMs: 22_000 },
  { id: "song-neon-drift", title: "Neon Drift", mood: "Dreamy float", audioPath: officialAudioPath("level-3-orbit-glass.ogg"), bpm: 110, durationMs: 28_000 },
  { id: "song-prism-ascent", title: "Prism Ascent", mood: "Driving riff", audioPath: officialAudioPath("level-4-switchyard.ogg"), bpm: 134, durationMs: 28_000 },
  { id: "song-final-rift", title: "Final Rift", mood: "Dark & exotic", audioPath: officialAudioPath("level-5-false-signal.ogg"), bpm: 150, durationMs: 28_000 },
  { id: "song-block-pulse", title: "Block Pulse", mood: "Funky groove", audioPath: officialAudioPath("level-6-block-pulse.ogg"), bpm: 118, durationMs: 24_000 },
  { id: "song-steel-skyline", title: "Steel Skyline", mood: "Anthemic", audioPath: officialAudioPath("level-7-steel-skyline.ogg"), bpm: 128, durationMs: 26_000 },
  { id: "song-foundry-overdrive", title: "Foundry Overdrive", mood: "Industrial fury", audioPath: officialAudioPath("level-8-foundry-overdrive.ogg"), bpm: 156, durationMs: 27_000 },
];

export function buildBeatMapForBpm(bpm: number, durationMs: number): BeatMap {
  const beatIntervalMs = 60_000 / bpm;
  const beats: number[] = [];
  for (let timeMs = 0; timeMs <= durationMs; timeMs += beatIntervalMs) {
    beats.push(Math.round(timeMs));
  }
  return { beats, durationMs };
}

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
