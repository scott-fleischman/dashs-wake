export interface PlayerProfile {
  bestPercents: Readonly<Record<string, number>>;
  coins: number;
  completedGauntletIds: readonly string[];
  completedLevels: readonly string[];
  keys: Readonly<Record<string, number>>;
  openedChestIds: readonly string[];
  ownedCosmetics: readonly string[];
  selectedCosmetics: Readonly<Record<string, string>>;
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
  },
};

export function createProfile(): PlayerProfile {
  return {
    bestPercents: {},
    coins: 0,
    completedGauntletIds: [],
    completedLevels: [],
    keys: {},
    openedChestIds: [],
    ownedCosmetics: [],
    selectedCosmetics: {},
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
