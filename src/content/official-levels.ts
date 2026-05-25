import { combinedRunLevel } from "./combined-run";
import { firstWakeLevel, type LevelContent } from "./first-wake";
import { launchSequenceLevel } from "./launch-sequence";
import { orbitalLoopLevel } from "./orbital-loop";
import { trapLaneLevel } from "./trap-lane";

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

const LEVEL_CONTENT_BY_ID: Readonly<Record<string, LevelContent>> = {
  level_1: firstWakeLevel,
  level_2: launchSequenceLevel,
  level_3: orbitalLoopLevel,
  level_4: combinedRunLevel,
  level_5: trapLaneLevel,
};

export function getOfficialLevelContent(id: string): LevelContent {
  const content = LEVEL_CONTENT_BY_ID[id];

  if (!content) {
    throw new Error(`Official level content for ${id} is not yet authored.`);
  }

  return content;
}

export function getOfficialLevelMetadata(
  id: string,
): OfficialLevelMetadata | undefined {
  return officialLevelCatalog.find((level) => level.id === id);
}

export function levelKicker(id: string): string {
  const index = officialLevelCatalog.findIndex((level) => level.id === id);

  if (index < 0) {
    return "";
  }

  return `Official Level ${String(index + 1).padStart(2, "0")}`;
}
