import { combinedRunLevel } from "./combined-run";
import { firstWakeLevel, type LevelContent } from "./first-wake";
import { launchSequenceLevel } from "./launch-sequence";
import { orbitalLoopLevel } from "./orbital-loop";
import { trapLaneLevel } from "./trap-lane";
import type { UnlockRequirement } from "../core/profile";
import {
  getOfficialTrack,
  type OfficialTrack,
} from "./official-soundtrack";

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
  track: OfficialTrack;
  unlockRequirement: UnlockRequirement;
}

function trackFor(levelId: string): OfficialTrack {
  const track = getOfficialTrack(levelId);

  if (!track) {
    throw new Error(`Official track for ${levelId} is not configured.`);
  }

  return track;
}

export const officialLevelCatalog: readonly OfficialLevelMetadata[] = [
  {
    id: "level_1",
    name: "First Wake",
    difficulty: "easy",
    track: trackFor("level_1"),
    unlockRequirement: { requiredCompletedLevels: [] },
  },
  {
    id: "level_2",
    name: "Launch Sequence",
    difficulty: "easy",
    track: trackFor("level_2"),
    unlockRequirement: { requiredCompletedLevels: ["level_1"] },
  },
  {
    id: "level_3",
    name: "Orbital Loop",
    difficulty: "normal",
    track: trackFor("level_3"),
    unlockRequirement: { requiredCompletedLevels: ["level_2"] },
  },
  {
    id: "level_4",
    name: "Combined Run",
    difficulty: "normal",
    track: trackFor("level_4"),
    unlockRequirement: { requiredCompletedLevels: ["level_3"] },
  },
  {
    id: "level_5",
    name: "Trap Lane",
    difficulty: "hard",
    track: trackFor("level_5"),
    unlockRequirement: { requiredCompletedLevels: ["level_4"] },
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

export function formatLevelClearList(
  requiredLevelIds: readonly string[],
): string {
  if (requiredLevelIds.length === 0) {
    return "";
  }
  const names = requiredLevelIds.map((id) => {
    const meta = officialLevelCatalog.find((entry) => entry.id === id);
    return meta?.name ?? id;
  });
  return `Clear ${names.join(", ")}`;
}
