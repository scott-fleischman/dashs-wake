export interface PlayerProfile {
  bestPercents: Readonly<Record<string, number>>;
  coins: number;
  completedLevels: readonly string[];
  keys: Readonly<Record<string, number>>;
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
    completedLevels: [],
    keys: {},
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
  let nextKeys = profile.keys;
  let nextUnlockedLevels = profile.unlockedLevels;
  const newlyUnlocked: string[] = [];

  if (rule?.keyAwarded && rule.keyAwarded.amount > 0) {
    const { type, amount } = rule.keyAwarded;
    keysAwarded[type] = amount;
    nextKeys = {
      ...nextKeys,
      [type]: (nextKeys[type] ?? 0) + amount,
    };
  }

  if (rule?.unlocks) {
    for (const unlockId of rule.unlocks) {
      if (!nextUnlockedLevels.includes(unlockId)) {
        nextUnlockedLevels = [...nextUnlockedLevels, unlockId];
        newlyUnlocked.push(unlockId);
      }
    }
  }

  return {
    keysAwarded,
    profile: {
      ...profile,
      completedLevels: [...profile.completedLevels, input.levelId],
      keys: nextKeys,
      unlockedLevels: nextUnlockedLevels,
    },
    unlockedLevels: newlyUnlocked,
  };
}
