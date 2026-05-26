import type { PlayerProfile } from "./profile";

export type CosmeticCategory = "icon";

export type CubeShapeKind = "rectangle" | "diamond" | "circle";
export type ShipShapeKind = "triangle" | "arrow" | "dart";

export interface CosmeticAppearance {
  accent: number;
  cubeShape: CubeShapeKind;
  fillDead: number;
  fillRunning: number;
  motif: "bolt" | "circuit" | "core" | "flare" | "prism" | "ring";
  shipShape: ShipShapeKind;
}

export interface CosmeticItem {
  appearance: CosmeticAppearance;
  category: CosmeticCategory;
  id: string;
  name: string;
  price: number;
}

const DEFAULT_APPEARANCE: CosmeticAppearance = {
  accent: 0xecfcff,
  cubeShape: "rectangle",
  fillDead: 0xff437d,
  fillRunning: 0x19d9f3,
  motif: "core",
  shipShape: "triangle",
};

const SPARK_APPEARANCE: CosmeticAppearance = {
  accent: 0xffffff,
  cubeShape: "diamond",
  fillDead: 0xff8c42,
  fillRunning: 0xffc857,
  motif: "bolt",
  shipShape: "arrow",
};

const PULSE_APPEARANCE: CosmeticAppearance = {
  accent: 0xffd6f4,
  cubeShape: "circle",
  fillDead: 0xff437d,
  fillRunning: 0xa45bff,
  motif: "ring",
  shipShape: "dart",
};

const PRISM_APPEARANCE: CosmeticAppearance = {
  accent: 0xb4fff1,
  cubeShape: "diamond",
  fillDead: 0xff437d,
  fillRunning: 0x34e8b3,
  motif: "prism",
  shipShape: "dart",
};

const CIRCUIT_APPEARANCE: CosmeticAppearance = {
  accent: 0x19d9f3,
  cubeShape: "rectangle",
  fillDead: 0xff8c42,
  fillRunning: 0x2056da,
  motif: "circuit",
  shipShape: "arrow",
};

const FLARE_APPEARANCE: CosmeticAppearance = {
  accent: 0xffefb0,
  cubeShape: "circle",
  fillDead: 0xff437d,
  fillRunning: 0xff714b,
  motif: "flare",
  shipShape: "triangle",
};

export const cosmeticCatalog: readonly CosmeticItem[] = [
  {
    appearance: DEFAULT_APPEARANCE,
    category: "icon",
    id: "icon-default",
    name: "Default",
    price: 0,
  },
  {
    appearance: SPARK_APPEARANCE,
    category: "icon",
    id: "icon-spark",
    name: "Spark",
    price: 50,
  },
  {
    appearance: PULSE_APPEARANCE,
    category: "icon",
    id: "icon-pulse",
    name: "Pulse",
    price: 80,
  },
  {
    appearance: PRISM_APPEARANCE,
    category: "icon",
    id: "icon-prism",
    name: "Prism",
    price: 110,
  },
  {
    appearance: CIRCUIT_APPEARANCE,
    category: "icon",
    id: "icon-circuit",
    name: "Circuit",
    price: 150,
  },
  {
    appearance: FLARE_APPEARANCE,
    category: "icon",
    id: "icon-flare",
    name: "Flare",
    price: 190,
  },
];

export function selectedAppearance(profile: PlayerProfile): CosmeticAppearance {
  const id = profile.selectedCosmetics["icon"];
  if (!id) return DEFAULT_APPEARANCE;
  const item = cosmeticCatalog.find((entry) => entry.id === id);
  return item?.appearance ?? DEFAULT_APPEARANCE;
}

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
