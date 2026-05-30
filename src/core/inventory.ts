import type { PlayerProfile } from "./profile";

export type CosmeticCategory =
  | "icon"
  | "primary-color"
  | "secondary-color"
  | "ship"
  | "trail";

export type CubeShapeKind = "rectangle" | "diamond" | "circle";
export type ShipShapeKind = "triangle" | "arrow" | "dart";

/** Distinct icon artwork, drawn independently of the chosen colors. */
export type IconArtKind =
  | "plate"
  | "spark"
  | "pulse"
  | "prism"
  | "circuit"
  | "flare";
/** Distinct ship hull artwork. */
export type ShipArtKind = "skiff" | "nova" | "comet";
/** Distinct trail rendering style streamed behind the player. */
export type TrailArtKind = "core" | "ring" | "flare" | "prism";

export interface CosmeticAppearance {
  accent: number;
  cubeShape: CubeShapeKind;
  fillDead: number;
  fillRunning: number;
  motif: "bolt" | "circuit" | "core" | "flare" | "prism" | "ring";
  shipShape: ShipShapeKind;
  iconArt: IconArtKind;
  shipArt: ShipArtKind;
  trailArt: TrailArtKind;
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
  iconArt: "plate",
  shipArt: "skiff",
  trailArt: "core",
};

const SPARK_APPEARANCE: CosmeticAppearance = {
  ...DEFAULT_APPEARANCE,
  accent: 0xffffff,
  cubeShape: "diamond",
  fillDead: 0xff8c42,
  fillRunning: 0xffc857,
  motif: "bolt",
  shipShape: "arrow",
  iconArt: "spark",
};

const PULSE_APPEARANCE: CosmeticAppearance = {
  ...DEFAULT_APPEARANCE,
  accent: 0xffd6f4,
  cubeShape: "circle",
  fillDead: 0xff437d,
  fillRunning: 0xa45bff,
  motif: "ring",
  shipShape: "dart",
  iconArt: "pulse",
};

const PRISM_APPEARANCE: CosmeticAppearance = {
  ...DEFAULT_APPEARANCE,
  accent: 0xb4fff1,
  cubeShape: "diamond",
  fillDead: 0xff437d,
  fillRunning: 0x34e8b3,
  motif: "prism",
  shipShape: "dart",
  iconArt: "prism",
};

const CIRCUIT_APPEARANCE: CosmeticAppearance = {
  ...DEFAULT_APPEARANCE,
  accent: 0x19d9f3,
  cubeShape: "rectangle",
  fillDead: 0xff8c42,
  fillRunning: 0x2056da,
  motif: "circuit",
  shipShape: "arrow",
  iconArt: "circuit",
};

const FLARE_APPEARANCE: CosmeticAppearance = {
  ...DEFAULT_APPEARANCE,
  accent: 0xffefb0,
  cubeShape: "circle",
  fillDead: 0xff437d,
  fillRunning: 0xff714b,
  motif: "flare",
  shipShape: "triangle",
  iconArt: "flare",
};

const NOVA_SHIP_APPEARANCE: CosmeticAppearance = {
  ...DEFAULT_APPEARANCE,
  shipShape: "arrow",
  shipArt: "nova",
};

const COMET_SHIP_APPEARANCE: CosmeticAppearance = {
  ...DEFAULT_APPEARANCE,
  shipShape: "dart",
  shipArt: "comet",
};

const PRIMARY_COLOR_SOLAR: CosmeticAppearance = {
  ...DEFAULT_APPEARANCE,
  fillRunning: 0xff9f1c,
  fillDead: 0xff5c58,
};

const PRIMARY_COLOR_MINT: CosmeticAppearance = {
  ...DEFAULT_APPEARANCE,
  fillRunning: 0x34e8b3,
  fillDead: 0xff5d8f,
};

const PRIMARY_COLOR_VIOLET: CosmeticAppearance = {
  ...DEFAULT_APPEARANCE,
  fillRunning: 0xa45bff,
  fillDead: 0xff4f7a,
};

const SECONDARY_COLOR_AZURE: CosmeticAppearance = {
  ...DEFAULT_APPEARANCE,
  accent: 0x19d9f3,
};

const SECONDARY_COLOR_GLOW: CosmeticAppearance = {
  ...DEFAULT_APPEARANCE,
  accent: 0xfff0a8,
};

const SECONDARY_COLOR_BLUSH: CosmeticAppearance = {
  ...DEFAULT_APPEARANCE,
  accent: 0xffb9e6,
};

const TRAIL_RING_APPEARANCE: CosmeticAppearance = {
  ...DEFAULT_APPEARANCE,
  motif: "ring",
  trailArt: "ring",
};

const TRAIL_FLARE_APPEARANCE: CosmeticAppearance = {
  ...DEFAULT_APPEARANCE,
  motif: "flare",
  trailArt: "flare",
};

const TRAIL_PRISM_APPEARANCE: CosmeticAppearance = {
  ...DEFAULT_APPEARANCE,
  motif: "prism",
  trailArt: "prism",
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
  {
    appearance: DEFAULT_APPEARANCE,
    category: "ship",
    id: "ship-default",
    name: "Skiff",
    price: 0,
  },
  {
    appearance: NOVA_SHIP_APPEARANCE,
    category: "ship",
    id: "ship-nova",
    name: "Nova",
    price: 90,
  },
  {
    appearance: COMET_SHIP_APPEARANCE,
    category: "ship",
    id: "ship-comet",
    name: "Comet",
    price: 140,
  },
  {
    appearance: DEFAULT_APPEARANCE,
    category: "primary-color",
    id: "primary-neon",
    name: "Neon Primary",
    price: 0,
  },
  {
    appearance: PRIMARY_COLOR_SOLAR,
    category: "primary-color",
    id: "primary-solar",
    name: "Solar Primary",
    price: 70,
  },
  {
    appearance: PRIMARY_COLOR_MINT,
    category: "primary-color",
    id: "primary-mint",
    name: "Mint Primary",
    price: 100,
  },
  {
    appearance: PRIMARY_COLOR_VIOLET,
    category: "primary-color",
    id: "primary-violet",
    name: "Violet Primary",
    price: 130,
  },
  {
    appearance: SECONDARY_COLOR_AZURE,
    category: "secondary-color",
    id: "secondary-azure",
    name: "Azure Secondary",
    price: 0,
  },
  {
    appearance: SECONDARY_COLOR_GLOW,
    category: "secondary-color",
    id: "secondary-glow",
    name: "Glow Secondary",
    price: 60,
  },
  {
    appearance: SECONDARY_COLOR_BLUSH,
    category: "secondary-color",
    id: "secondary-blush",
    name: "Blush Secondary",
    price: 95,
  },
  {
    appearance: DEFAULT_APPEARANCE,
    category: "trail",
    id: "trail-core",
    name: "Core Trail",
    price: 0,
  },
  {
    appearance: TRAIL_RING_APPEARANCE,
    category: "trail",
    id: "trail-ring",
    name: "Ring Trail",
    price: 75,
  },
  {
    appearance: TRAIL_FLARE_APPEARANCE,
    category: "trail",
    id: "trail-flare",
    name: "Flare Trail",
    price: 110,
  },
  {
    appearance: TRAIL_PRISM_APPEARANCE,
    category: "trail",
    id: "trail-prism",
    name: "Prism Trail",
    price: 145,
  },
];

export function selectedAppearance(profile: PlayerProfile): CosmeticAppearance {
  const selectedIn = (category: CosmeticCategory): CosmeticItem | undefined => {
    const id = profile.selectedCosmetics[category];
    if (!id) return undefined;
    return cosmeticCatalog.find((entry) => entry.id === id);
  };

  const icon = selectedIn("icon");
  const ship = selectedIn("ship");
  const primary = selectedIn("primary-color");
  const secondary = selectedIn("secondary-color");
  const trail = selectedIn("trail");

  return {
    ...DEFAULT_APPEARANCE,
    cubeShape: icon?.appearance.cubeShape ?? DEFAULT_APPEARANCE.cubeShape,
    iconArt: icon?.appearance.iconArt ?? DEFAULT_APPEARANCE.iconArt,
    shipShape: ship?.appearance.shipShape ?? DEFAULT_APPEARANCE.shipShape,
    shipArt: ship?.appearance.shipArt ?? DEFAULT_APPEARANCE.shipArt,
    fillRunning:
      primary?.appearance.fillRunning ?? DEFAULT_APPEARANCE.fillRunning,
    fillDead: primary?.appearance.fillDead ?? DEFAULT_APPEARANCE.fillDead,
    accent: secondary?.appearance.accent ?? DEFAULT_APPEARANCE.accent,
    motif: trail?.appearance.motif ?? DEFAULT_APPEARANCE.motif,
    trailArt: trail?.appearance.trailArt ?? DEFAULT_APPEARANCE.trailArt,
  };
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
