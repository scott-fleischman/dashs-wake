import { applyReward, type PlayerProfile, type Reward } from "./profile";

export interface ChestReward {
  coinsAwarded?: number;
  cosmeticAwarded?: string;
}

export interface ChestDefinition {
  id: string;
  keyType: string;
  reward: ChestReward;
}

function rewardFromChestReward(chestReward: ChestReward): Reward {
  return {
    coinsAwarded: chestReward.coinsAwarded,
    cosmeticsAwarded: chestReward.cosmeticAwarded
      ? [chestReward.cosmeticAwarded]
      : undefined,
  };
}

export const chestCatalog: readonly ChestDefinition[] = [
  {
    id: "chest-starter",
    keyType: "easy",
    reward: { coinsAwarded: 50 },
  },
  {
    id: "chest-normal",
    keyType: "normal",
    reward: { coinsAwarded: 120, cosmeticAwarded: "icon-spark" },
  },
  {
    id: "chest-hard",
    keyType: "hard",
    reward: { coinsAwarded: 200, cosmeticAwarded: "icon-pulse" },
  },
];

export interface OpenChestResult {
  granted: ChestReward;
  profile: PlayerProfile;
}

function findChest(chestId: string): ChestDefinition | undefined {
  return chestCatalog.find((chest) => chest.id === chestId);
}

export function applyOpenChest(
  profile: PlayerProfile,
  chestId: string,
): OpenChestResult {
  const chest = findChest(chestId);

  if (!chest || profile.openedChestIds.includes(chestId)) {
    return { granted: {}, profile };
  }

  const currentKeyCount = profile.keys[chest.keyType] ?? 0;

  if (currentKeyCount < 1) {
    return { granted: {}, profile };
  }

  const rewarded = applyReward(profile, rewardFromChestReward(chest.reward));

  return {
    granted: chest.reward,
    profile: {
      ...rewarded,
      keys: { ...rewarded.keys, [chest.keyType]: currentKeyCount - 1 },
      openedChestIds: [...rewarded.openedChestIds, chest.id],
    },
  };
}
