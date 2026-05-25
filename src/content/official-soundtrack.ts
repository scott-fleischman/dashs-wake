import type { BeatMap } from "./first-wake";

export interface OfficialTrack {
  artist: string;
  audioPath: string;
  bpm: number;
  durationMs: number;
  id: string;
  license: "CC0";
  levelId: string;
  sourceUrl: string;
  title: string;
}

export const officialSoundtrack: readonly OfficialTrack[] = [
  {
    artist: "Fupi",
    audioPath: "/audio/official/level-1-brightmelodicedm.ogg",
    bpm: 140,
    durationMs: 20_625,
    id: "track-bright-melodic-edm",
    license: "CC0",
    levelId: "level_1",
    sourceUrl: "https://opengameart.org/content/melodic-edm-loops",
    title: "Bright Melodic EDM",
  },
  {
    artist: "Fupi",
    audioPath: "/audio/official/level-2-brightmelodicloopyedm.ogg",
    bpm: 140,
    durationMs: 20_625,
    id: "track-bright-melodic-loopy-edm",
    license: "CC0",
    levelId: "level_2",
    sourceUrl: "https://opengameart.org/content/melodic-edm-loops",
    title: "Bright Melodic Loopy EDM",
  },
  {
    artist: "Fupi",
    audioPath: "/audio/official/level-3-brightmelodicskippyedm.ogg",
    bpm: 140,
    durationMs: 27_464,
    id: "track-bright-melodic-skippy-edm",
    license: "CC0",
    levelId: "level_3",
    sourceUrl: "https://opengameart.org/content/melodic-edm-loops",
    title: "Bright Melodic Skippy EDM",
  },
  {
    artist: "Fupi",
    audioPath: "/audio/official/level-4-melodicloopyedm.ogg",
    bpm: 140,
    durationMs: 27_500,
    id: "track-melodic-loopy-edm",
    license: "CC0",
    levelId: "level_4",
    sourceUrl: "https://opengameart.org/content/melodic-edm-loops",
    title: "Melodic Loopy EDM",
  },
  {
    artist: "Fupi",
    audioPath: "/audio/official/level-5-melodicskippyedm.ogg",
    bpm: 140,
    durationMs: 27_464,
    id: "track-melodic-skippy-edm",
    license: "CC0",
    levelId: "level_5",
    sourceUrl: "https://opengameart.org/content/melodic-edm-loops",
    title: "Melodic Skippy EDM",
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
