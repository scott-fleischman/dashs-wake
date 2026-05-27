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
    title: "Launch Relay",
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
    title: "Orbit Glass",
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
    title: "Switchyard",
  },
  {
    artist: "Dash's Wake",
    audioPath: officialAudioPath("level-5-false-signal.ogg"),
    bpm: 145,
    durationMs: 28_000,
    id: "track-false-signal",
    license: "Original",
    levelId: "level_5",
    sourceUrl: "Original in-repository composition",
    title: "False Signal",
  },
  {
    artist: "Dash's Wake",
    audioPath: officialAudioPath("level-6-block-pulse.ogg"),
    bpm: 112,
    durationMs: 22_000,
    id: "track-block-pulse",
    license: "Original",
    levelId: "level_6",
    sourceUrl: "Original in-repository composition",
    title: "Block Pulse",
  },
  {
    artist: "Dash's Wake",
    audioPath: officialAudioPath("level-7-steel-skyline.ogg"),
    bpm: 128,
    durationMs: 24_000,
    id: "track-steel-skyline",
    license: "Original",
    levelId: "level_7",
    sourceUrl: "Original in-repository composition",
    title: "Steel Skyline",
  },
  {
    artist: "Dash's Wake",
    audioPath: officialAudioPath("level-8-foundry-overdrive.ogg"),
    bpm: 150,
    durationMs: 27_000,
    id: "track-foundry-overdrive",
    license: "Original",
    levelId: "level_8",
    sourceUrl: "Original in-repository composition",
    title: "Foundry Overdrive",
  },
  {
    artist: "Dash's Wake",
    audioPath: officialAudioPath("level-6-block-pulse.ogg"),
    bpm: 112,
    durationMs: 22_000,
    id: "track-highline-ascent",
    license: "Original",
    levelId: "level_9",
    sourceUrl: "Original in-repository composition",
    title: "Highline Ascent",
  },
  {
    artist: "Dash's Wake",
    audioPath: officialAudioPath("level-7-steel-skyline.ogg"),
    bpm: 128,
    durationMs: 24_000,
    id: "track-tunnel-vector",
    license: "Original",
    levelId: "level_10",
    sourceUrl: "Original in-repository composition",
    title: "Tunnel Vector",
  },
  {
    artist: "Dash's Wake",
    audioPath: officialAudioPath("level-8-foundry-overdrive.ogg"),
    bpm: 150,
    durationMs: 27_000,
    id: "track-rift-stair",
    license: "Original",
    levelId: "level_11",
    sourceUrl: "Original in-repository composition",
    title: "Rift Stair",
  },
  {
    artist: "Dash's Wake",
    audioPath: officialAudioPath("level-8-foundry-overdrive.ogg"),
    bpm: 156,
    durationMs: 27_000,
    id: "track-apex-circuit",
    license: "Original",
    levelId: "level_12",
    sourceUrl: "Original in-repository composition",
    title: "Apex Circuit",
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
