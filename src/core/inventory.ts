import type { PlayerProfile } from "./profile";

export type CosmeticCategory = "icon";

export interface CosmeticItem {
  category: CosmeticCategory;
  id: string;
  name: string;
  price: number;
}

export const cosmeticCatalog: readonly CosmeticItem[] = [
  { id: "icon-default", category: "icon", name: "Default", price: 0 },
  { id: "icon-spark", category: "icon", name: "Spark", price: 50 },
  { id: "icon-pulse", category: "icon", name: "Pulse", price: 80 },
];

export const cosmeticCategories: readonly CosmeticCategory[] = Array.from(
  new Set(cosmeticCatalog.map((item) => item.category)),
);

export function getCatalogByCategory(
  category: CosmeticCategory,
): readonly CosmeticItem[] {
  return cosmeticCatalog.filter((item) => item.category === category);
}

export function getSelectedCosmetic(
  profile: PlayerProfile,
  category: CosmeticCategory,
): CosmeticItem | undefined {
  const id = profile.selectedCosmetics[category];

  if (!id) {
    return undefined;
  }

  return cosmeticCatalog.find((item) => item.id === id);
}

export interface PurchaseResult {
  debited: number;
  profile: PlayerProfile;
}

export interface SelectionResult {
  profile: PlayerProfile;
}

function findCatalogItem(itemId: string): CosmeticItem | undefined {
  return cosmeticCatalog.find((item) => item.id === itemId);
}

export function applyCosmeticPurchase(
  profile: PlayerProfile,
  itemId: string,
): PurchaseResult {
  const item = findCatalogItem(itemId);

  if (!item || profile.ownedCosmetics.includes(item.id)) {
    return { debited: 0, profile };
  }

  if (profile.coins < item.price) {
    return { debited: 0, profile };
  }

  return {
    debited: item.price,
    profile: {
      ...profile,
      coins: profile.coins - item.price,
      ownedCosmetics: [...profile.ownedCosmetics, item.id],
    },
  };
}

export function applyCosmeticSelection(
  profile: PlayerProfile,
  itemId: string,
): SelectionResult {
  const item = findCatalogItem(itemId);

  if (!item || !profile.ownedCosmetics.includes(item.id)) {
    return { profile };
  }

  return {
    profile: {
      ...profile,
      selectedCosmetics: {
        ...profile.selectedCosmetics,
        [item.category]: item.id,
      },
    },
  };
}
