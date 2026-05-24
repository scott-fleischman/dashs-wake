export interface PlayerProfile {
  bestPercents: Readonly<Record<string, number>>;
  coins: number;
}

export interface ProgressAwardInput {
  levelId: string;
  percentReached: number;
}

export interface ProgressAwardResult {
  coinsAwarded: number;
  profile: PlayerProfile;
}

const MAX_PERCENT_PER_LEVEL = 100;

export function createProfile(): PlayerProfile {
  return {
    bestPercents: {},
    coins: 0,
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
      bestPercents: {
        ...profile.bestPercents,
        [input.levelId]: clampedReached,
      },
      coins: profile.coins + coinsAwarded,
    },
  };
}
