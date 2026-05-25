import type { LevelEntity, RunRules } from "../core/run-simulation";
import { firstWakeLevel, type LevelContent } from "./first-wake";

export type OfficialLevelDifficulty =
  | "easy"
  | "normal"
  | "hard"
  | "harder"
  | "insane";

export interface OfficialLevelMetadata {
  difficulty: OfficialLevelDifficulty;
  id: string;
  name: string;
  unlockedBy: string | null;
}

export const officialLevelCatalog: readonly OfficialLevelMetadata[] = [
  { id: "level_1", name: "First Wake", difficulty: "easy", unlockedBy: null },
  {
    id: "level_2",
    name: "Launch Sequence",
    difficulty: "easy",
    unlockedBy: "level_1",
  },
  {
    id: "level_3",
    name: "Orbital Loop",
    difficulty: "normal",
    unlockedBy: "level_2",
  },
  {
    id: "level_4",
    name: "Combined Run",
    difficulty: "normal",
    unlockedBy: "level_3",
  },
  {
    id: "level_5",
    name: "Trap Lane",
    difficulty: "hard",
    unlockedBy: "level_4",
  },
];

const LEVEL_2_RULES: RunRules = firstWakeLevel.rules;

const LEVEL_2_ENTITIES: readonly LevelEntity[] = [
  { type: "spike", height: 30, width: 30, x: 160, y: 270 },
  {
    type: "pad",
    id: "level-2-pad-1",
    impulse: 720,
    height: 18,
    width: 40,
    x: 380,
    y: 290,
  },
  { type: "spike", height: 30, width: 30, x: 620, y: 270 },
];

const LEVEL_2_FINISH_X = 820;

function buildPlaceholderBeatMap(
  finishX: number,
  horizontalSpeed: number,
): LevelContent["beatMap"] {
  const traversalMs = Math.ceil((finishX / horizontalSpeed) * 1000);
  const durationMs = traversalMs + 600;
  const intervalMs = 600;
  const beats: number[] = [];

  for (let timeMs = 0; timeMs <= durationMs; timeMs += intervalMs) {
    beats.push(timeMs);
  }

  return { beats, durationMs };
}

const launchSequenceLevel: LevelContent = {
  beatMap: buildPlaceholderBeatMap(
    LEVEL_2_FINISH_X,
    LEVEL_2_RULES.horizontalSpeed,
  ),
  entities: LEVEL_2_ENTITIES,
  finishX: LEVEL_2_FINISH_X,
  rules: LEVEL_2_RULES,
};

const LEVEL_CONTENT_BY_ID: Readonly<Record<string, LevelContent>> = {
  level_1: firstWakeLevel,
  level_2: launchSequenceLevel,
};

export function getOfficialLevelContent(id: string): LevelContent {
  const content = LEVEL_CONTENT_BY_ID[id];

  if (!content) {
    throw new Error(`Official level content for ${id} is not yet authored.`);
  }

  return content;
}
