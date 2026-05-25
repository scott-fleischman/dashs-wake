import type { PlayerProfile } from "./profile";

export interface ChestReward {
  coinsAwarded?: number;
  cosmeticAwarded?: string;
}

export interface ChestDefinition {
  id: string;
  keyType: string;
  reward: ChestReward;
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

  const nextKeys = {
    ...profile.keys,
    [chest.keyType]: currentKeyCount - 1,
  };
  const nextCoins = profile.coins + (chest.reward.coinsAwarded ?? 0);
  const nextOwned =
    chest.reward.cosmeticAwarded &&
    !profile.ownedCosmetics.includes(chest.reward.cosmeticAwarded)
      ? [...profile.ownedCosmetics, chest.reward.cosmeticAwarded]
      : profile.ownedCosmetics;

  return {
    granted: chest.reward,
    profile: {
      ...profile,
      coins: nextCoins,
      keys: nextKeys,
      openedChestIds: [...profile.openedChestIds, chest.id],
      ownedCosmetics: nextOwned,
    },
  };
}
