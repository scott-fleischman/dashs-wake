import type { GeneratorTuning } from "./generator-tuning";
import type { LevelEntity } from "./run-simulation";

export type LevelColorTheme = "neon" | "sunset" | "forest" | "void";

export interface GameplaySettings {
  levelColor: LevelColorTheme;
  speedMultiplier: number;
}

export const DEFAULT_GAMEPLAY_SETTINGS: GameplaySettings = {
  levelColor: "neon",
  speedMultiplier: 1,
};

export interface AuthoredLevelLayout {
  entities: readonly LevelEntity[];
  finishX: number;
}

export interface GeneratedLevelRecord {
  authoredLayout?: AuthoredLevelLayout;
  audioBlobKey?: string;
  /** Set when the level uses a bundled in-game song instead of an uploaded file. */
  bundledAudioPath?: string;
  audioFileName?: string;
  beatIntensities: readonly ("intense" | "quiet")[];
  beatMap: { readonly beats: readonly number[]; readonly durationMs: number };
  difficulty:
    | "easy"
    | "normal"
    | "hard"
    | "harder"
    | "insane"
    | "demon"
    | "nightmare";
  generatorTuning?: GeneratorTuning;
  id: string;
  name: string;
  subRank?: "bronze" | "gold" | "diamond" | "void";
  theme?:
    | "cave"
    | "disco"
    | "electric"
    | "flash"
    | "forest"
    | "space"
    | "sunset"
    | "void";
  seed: number;
  source?: "creator" | "generator";
  synced?: boolean;
}

export interface PlayerProfile {
  bestPercents: Readonly<Record<string, number>>;
  coins: number;
  completedGauntletIds: readonly string[];
  completedLevels: readonly string[];
  generatedLevels: readonly GeneratedLevelRecord[];
  keys: Readonly<Record<string, number>>;
  openedChestIds: readonly string[];
  ownedCosmetics: readonly string[];
  selectedCosmetics: Readonly<Record<string, string>>;
  settings: GameplaySettings;
  unlockedLevels: readonly string[];
}

export interface ProgressAwardInput {
  levelId: string;
  percentReached: number;
}

export interface ProgressAwardResult {
  coinsAwarded: number;
  profile: PlayerProfile;
}

export interface KeyReward {
  type: string;
  amount: number;
}

export interface LevelCompletionRule {
  keyAwarded?: KeyReward;
  unlocks?: readonly string[];
}

export type LevelCompletionRules = Readonly<Record<string, LevelCompletionRule>>;

export interface CompletionAwardInput {
  levelId: string;
}

export interface CompletionAwardResult {
  keysAwarded: Readonly<Record<string, number>>;
  profile: PlayerProfile;
  unlockedLevels: readonly string[];
}

export interface Reward {
  coinsAwarded?: number;
  cosmeticsAwarded?: readonly string[];
  keysAwarded?: Readonly<Record<string, number>>;
  unlocks?: readonly string[];
}

export interface UnlockRequirement {
  requiredCompletedLevels: readonly string[];
}

export function isUnlockMet(
  profile: PlayerProfile,
  requirement: UnlockRequirement,
): boolean {
  return requirement.requiredCompletedLevels.every((levelId) =>
    profile.completedLevels.includes(levelId),
  );
}

function mergeKeys(
  current: Readonly<Record<string, number>>,
  added: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  const next: Record<string, number> = { ...current };

  for (const [type, amount] of Object.entries(added)) {
    next[type] = (next[type] ?? 0) + amount;
  }

  return next;
}

function mergeUnique(
  current: readonly string[],
  added: readonly string[],
): readonly string[] {
  const next = [...current];

  for (const id of added) {
    if (!next.includes(id)) {
      next.push(id);
    }
  }

  return next;
}

export function applyReward(
  profile: PlayerProfile,
  reward: Reward,
): PlayerProfile {
  return {
    ...profile,
    coins: profile.coins + (reward.coinsAwarded ?? 0),
    keys: reward.keysAwarded
      ? mergeKeys(profile.keys, reward.keysAwarded)
      : profile.keys,
    ownedCosmetics: reward.cosmeticsAwarded
      ? mergeUnique(profile.ownedCosmetics, reward.cosmeticsAwarded)
      : profile.ownedCosmetics,
    unlockedLevels: reward.unlocks
      ? mergeUnique(profile.unlockedLevels, reward.unlocks)
      : profile.unlockedLevels,
  };
}

const MAX_PERCENT_PER_LEVEL = 100;

export const OFFICIAL_LEVEL_COMPLETION_RULES: LevelCompletionRules = {
  level_1: {
    keyAwarded: { type: "easy", amount: 1 },
    unlocks: ["level_2"],
  },
  level_2: {
    keyAwarded: { type: "easy", amount: 1 },
    unlocks: ["level_3"],
  },
  level_3: {
    keyAwarded: { type: "normal", amount: 1 },
    unlocks: ["level_4"],
  },
  level_4: {
    keyAwarded: { type: "normal", amount: 1 },
    unlocks: ["level_5"],
  },
  level_5: {
    keyAwarded: { type: "hard", amount: 1 },
    unlocks: ["level_6"],
  },
  level_6: {
    keyAwarded: { type: "hard", amount: 1 },
    unlocks: ["level_7"],
  },
  level_7: {
    keyAwarded: { type: "insane", amount: 1 },
    unlocks: ["level_8"],
  },
  level_8: {
    keyAwarded: { type: "insane", amount: 1 },
  },
};

const DEFAULT_OWNED_COSMETICS = [
  "icon-default",
  "ship-default",
  "primary-neon",
  "secondary-azure",
  "trail-core",
] as const;
const DEFAULT_SELECTED_COSMETICS: Readonly<Record<string, string>> = {
  icon: "icon-default",
  ship: "ship-default",
  "primary-color": "primary-neon",
  "secondary-color": "secondary-azure",
  trail: "trail-core",
};

export function createProfile(): PlayerProfile {
  return {
    bestPercents: {},
    coins: 0,
    completedGauntletIds: [],
    completedLevels: [],
    generatedLevels: [],
    keys: {},
    openedChestIds: [],
    ownedCosmetics: [...DEFAULT_OWNED_COSMETICS],
    selectedCosmetics: { ...DEFAULT_SELECTED_COSMETICS },
    settings: DEFAULT_GAMEPLAY_SETTINGS,
    unlockedLevels: [],
  };
}

function clampReachedPercent(percentReached: number): number {
  if (!Number.isFinite(percentReached) || percentReached <= 0) {
    return 0;
  }

  const floored = Math.floor(percentReached);

  return floored > MAX_PERCENT_PER_LEVEL ? MAX_PERCENT_PER_LEVEL : floored;
}

export function applyProgressAward(
  profile: PlayerProfile,
  input: ProgressAwardInput,
): ProgressAwardResult {
  const storedBest = profile.bestPercents[input.levelId] ?? 0;
  const clampedReached = clampReachedPercent(input.percentReached);
  const coinsAwarded = Math.max(0, clampedReached - storedBest);

  if (coinsAwarded === 0) {
    return { coinsAwarded: 0, profile };
  }

  return {
    coinsAwarded,
    profile: {
      ...profile,
      bestPercents: {
        ...profile.bestPercents,
        [input.levelId]: clampedReached,
      },
      coins: profile.coins + coinsAwarded,
    },
  };
}

export function applyCompletionAward(
  profile: PlayerProfile,
  input: CompletionAwardInput,
  rules: LevelCompletionRules = OFFICIAL_LEVEL_COMPLETION_RULES,
): CompletionAwardResult {
  if (profile.completedLevels.includes(input.levelId)) {
    return { keysAwarded: {}, profile, unlockedLevels: [] };
  }

  const rule = rules[input.levelId];
  const keysAwarded: Record<string, number> = {};
  const reward: Reward = {};

  if (rule?.keyAwarded && rule.keyAwarded.amount > 0) {
    keysAwarded[rule.keyAwarded.type] = rule.keyAwarded.amount;
    reward.keysAwarded = keysAwarded;
  }

  const newlyUnlocked = (rule?.unlocks ?? []).filter(
    (id) => !profile.unlockedLevels.includes(id),
  );

  if (newlyUnlocked.length > 0) {
    reward.unlocks = newlyUnlocked;
  }

  const rewarded = applyReward(profile, reward);

  return {
    keysAwarded,
    profile: {
      ...rewarded,
      completedLevels: [...rewarded.completedLevels, input.levelId],
    },
    unlockedLevels: newlyUnlocked,
  };
}

export function previewLevelCompletionReward(
  profile: PlayerProfile,
  levelId: string,
  rules: LevelCompletionRules = OFFICIAL_LEVEL_COMPLETION_RULES,
): Reward {
  const storedBest = profile.bestPercents[levelId] ?? 0;
  const coinsFromProgress = Math.max(0, MAX_PERCENT_PER_LEVEL - storedBest);
  const reward: Reward = {};

  if (coinsFromProgress > 0) {
    reward.coinsAwarded = coinsFromProgress;
  }

  if (!profile.completedLevels.includes(levelId)) {
    const rule = rules[levelId];
    if (rule?.keyAwarded && rule.keyAwarded.amount > 0) {
      reward.keysAwarded = {
        [rule.keyAwarded.type]: rule.keyAwarded.amount,
      };
    }
  }

  return reward;
}
