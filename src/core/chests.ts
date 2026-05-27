import { applyReward, type PlayerProfile, type Reward } from "./profile";

export interface ChestReward {
  coinsAwarded?: number;
  cosmeticAwarded?: string;
  keysAwarded?: Readonly<Record<string, number>>;
}

export interface ChestDefinition {
  id: string;
  keyType: string;
  name: string;
  rewardPool: readonly ChestReward[];
}

function rewardFromChestReward(chestReward: ChestReward): Reward {
  return {
    coinsAwarded: chestReward.coinsAwarded,
    cosmeticsAwarded: chestReward.cosmeticAwarded
      ? [chestReward.cosmeticAwarded]
      : undefined,
    keysAwarded: chestReward.keysAwarded,
  };
}

export const chestCatalog: readonly ChestDefinition[] = [
  {
    id: "chest-starter",
    name: "Starter Chest",
    keyType: "easy",
    rewardPool: [
      { coinsAwarded: 50 },
      { coinsAwarded: 50, keysAwarded: { normal: 1 } },
    ],
  },
  {
    id: "chest-normal",
    name: "Wake Chest",
    keyType: "normal",
    rewardPool: [
      { coinsAwarded: 120, cosmeticAwarded: "icon-spark" },
      {
        coinsAwarded: 120,
        cosmeticAwarded: "icon-spark",
        keysAwarded: { hard: 1 },
      },
    ],
  },
  {
    id: "chest-hard",
    name: "Surge Chest",
    keyType: "hard",
    rewardPool: [
      { coinsAwarded: 200, cosmeticAwarded: "icon-pulse" },
      {
        coinsAwarded: 200,
        cosmeticAwarded: "icon-pulse",
        keysAwarded: { insane: 1 },
      },
    ],
  },
  {
    id: "chest-insane",
    name: "Rift Chest",
    keyType: "insane",
    rewardPool: [
      { coinsAwarded: 300, cosmeticAwarded: "icon-prism" },
      { coinsAwarded: 360, keysAwarded: { demon: 1 } },
    ],
  },
  {
    id: "chest-demon",
    name: "Abyss Chest",
    keyType: "demon",
    rewardPool: [
      { coinsAwarded: 500, cosmeticAwarded: "icon-flare" },
      { coinsAwarded: 650, cosmeticAwarded: "icon-circuit" },
    ],
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
  random: () => number = Math.random,
): OpenChestResult {
  const chest = findChest(chestId);

  if (!chest || profile.openedChestIds.includes(chestId)) {
    return { granted: {}, profile };
  }

  const currentKeyCount = profile.keys[chest.keyType] ?? 0;
  if (currentKeyCount < 1) {
    return { granted: {}, profile };
  }

  const rewardIndex = Math.min(
    chest.rewardPool.length - 1,
    Math.max(0, Math.floor(random() * chest.rewardPool.length)),
  );
  const reward = chest.rewardPool[rewardIndex] ?? {};
  const rewarded = applyReward(profile, rewardFromChestReward(reward));

  return {
    granted: reward,
    profile: {
      ...rewarded,
      keys: { ...rewarded.keys, [chest.keyType]: currentKeyCount - 1 },
      openedChestIds: [...rewarded.openedChestIds, chest.id],
    },
  };
}
