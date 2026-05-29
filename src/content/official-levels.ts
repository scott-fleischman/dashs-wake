import {
  analyzeLevelProfile,
  type LevelProfileAnalysis,
} from "../core/level-analysis";
import {
  recordConservativeDemo,
  type LevelDemo,
} from "../core/level-solver";
import { combinedRunLevel } from "./combined-run";
import { firstWakeLevel, type LevelContent } from "./first-wake";
import { launchSequenceLevel } from "./launch-sequence";
import { orbitalLoopLevel } from "./orbital-loop";
import { trapLaneLevel } from "./trap-lane";
import {
  blockPulseLevel,
  foundryOverdriveLevel,
  skylineStepLevel,
} from "./block-courses";
import {
  apexCircuitLevel,
  highlineAscentLevel,
  riftStairLevel,
  tunnelVectorLevel,
} from "./vertical-courses";
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
  {
    id: "level_6",
    name: "Block Pulse",
    difficulty: "normal",
    track: trackFor("level_6"),
    unlockRequirement: { requiredCompletedLevels: ["level_5"] },
  },
  {
    id: "level_7",
    name: "Skyline Step",
    difficulty: "hard",
    track: trackFor("level_7"),
    unlockRequirement: { requiredCompletedLevels: ["level_6"] },
  },
  {
    id: "level_8",
    name: "Foundry Overdrive",
    difficulty: "insane",
    track: trackFor("level_8"),
    unlockRequirement: { requiredCompletedLevels: ["level_7"] },
  },
  {
    id: "level_9",
    name: "Highline Ascent",
    difficulty: "hard",
    track: trackFor("level_9"),
    unlockRequirement: { requiredCompletedLevels: ["level_8"] },
  },
  {
    id: "level_10",
    name: "Tunnel Vector",
    difficulty: "harder",
    track: trackFor("level_10"),
    unlockRequirement: { requiredCompletedLevels: ["level_9"] },
  },
  {
    id: "level_11",
    name: "Rift Stair",
    difficulty: "insane",
    track: trackFor("level_11"),
    unlockRequirement: { requiredCompletedLevels: ["level_10"] },
  },
  {
    id: "level_12",
    name: "Apex Circuit",
    difficulty: "insane",
    track: trackFor("level_12"),
    unlockRequirement: { requiredCompletedLevels: ["level_11"] },
  },
];

const LEVEL_CONTENT_BY_ID: Readonly<Record<string, LevelContent>> = {
  level_1: firstWakeLevel,
  level_2: launchSequenceLevel,
  level_3: orbitalLoopLevel,
  level_4: combinedRunLevel,
  level_5: trapLaneLevel,
  level_6: blockPulseLevel,
  level_7: skylineStepLevel,
  level_8: foundryOverdriveLevel,
  level_9: highlineAscentLevel,
  level_10: tunnelVectorLevel,
  level_11: riftStairLevel,
  level_12: apexCircuitLevel,
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

const officialDemoCache = new Map<string, LevelDemo>();
const officialProfileCache = new Map<string, LevelProfileAnalysis>();

export function getOfficialLevelDemo(levelId: string): LevelDemo | null {
  if (!LEVEL_CONTENT_BY_ID[levelId]) {
    return null;
  }

  if (!officialDemoCache.has(levelId)) {
    officialDemoCache.set(
      levelId,
      recordConservativeDemo(getOfficialLevelContent(levelId)),
    );
  }

  const demo = officialDemoCache.get(levelId)!;
  return demo.success ? demo : null;
}

export function getOfficialLevelProfile(levelId: string): LevelProfileAnalysis {
  if (!officialProfileCache.has(levelId)) {
    const content = getOfficialLevelContent(levelId);
    const demo = officialDemoCache.get(levelId) ?? recordConservativeDemo(content);
    if (!officialDemoCache.has(levelId)) {
      officialDemoCache.set(levelId, demo);
    }
    officialProfileCache.set(
      levelId,
      analyzeLevelProfile(content, demo.success ? demo : null),
    );
  }

  return officialProfileCache.get(levelId)!;
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
