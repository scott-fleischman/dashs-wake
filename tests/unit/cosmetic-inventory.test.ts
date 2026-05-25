import { describe, expect, it } from "vitest";
import { createProfile } from "../../src/core/profile";
import {
  applyCosmeticPurchase,
  applyCosmeticSelection,
  cosmeticCatalog,
  cosmeticCategories,
  getCatalogByCategory,
  getSelectedCosmetic,
} from "../../src/core/inventory";

const SPARK_ICON = "icon-spark";

function profileWithCoins(coins: number): ReturnType<typeof createProfile> {
  return { ...createProfile(), coins };
}

describe("cosmetic inventory", () => {
  it("publishes a non-empty catalog with priced items", () => {
    expect(cosmeticCatalog.length).toBeGreaterThan(0);

    for (const item of cosmeticCatalog) {
      expect(item.id.length).toBeGreaterThan(0);
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.price).toBeGreaterThanOrEqual(0);
    }
  });

  it("debits the coin price exactly once when purchasing an item", () => {
    const profile = profileWithCoins(100);

    const result = applyCosmeticPurchase(profile, SPARK_ICON);

    expect(result.debited).toBeGreaterThan(0);
    expect(result.profile.coins).toBe(profile.coins - result.debited);
    expect(result.profile.ownedCosmetics).toContain(SPARK_ICON);
  });

  it("rejects a purchase when the profile cannot afford the item", () => {
    const profile = profileWithCoins(0);

    const result = applyCosmeticPurchase(profile, SPARK_ICON);

    expect(result.debited).toBe(0);
    expect(result.profile.coins).toBe(0);
    expect(result.profile.ownedCosmetics).not.toContain(SPARK_ICON);
  });

  it("does not double-debit an already owned cosmetic", () => {
    const profile = {
      ...profileWithCoins(100),
      ownedCosmetics: [SPARK_ICON],
    };

    const result = applyCosmeticPurchase(profile, SPARK_ICON);

    expect(result.debited).toBe(0);
    expect(result.profile.coins).toBe(100);
  });

  it("rejects a purchase whose item id is not in the catalog", () => {
    const profile = profileWithCoins(1000);

    const result = applyCosmeticPurchase(profile, "icon-unknown");

    expect(result.debited).toBe(0);
    expect(result.profile).toBe(profile);
  });

  it("selects an owned cosmetic into its category slot", () => {
    const profile = {
      ...createProfile(),
      ownedCosmetics: [SPARK_ICON],
    };

    const result = applyCosmeticSelection(profile, SPARK_ICON);

    expect(result.profile.selectedCosmetics["icon"]).toBe(SPARK_ICON);
  });

  it("rejects selecting a cosmetic that the profile does not own", () => {
    const profile = createProfile();

    const result = applyCosmeticSelection(profile, SPARK_ICON);

    expect(result.profile).toBe(profile);
  });

  it("derives the set of inventory categories from the catalog", () => {
    expect(cosmeticCategories.length).toBeGreaterThan(0);

    for (const category of cosmeticCategories) {
      const items = getCatalogByCategory(category);
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.category).toBe(category);
      }
    }
  });

  it("resolves the currently selected cosmetic for a category", () => {
    const profile = {
      ...createProfile(),
      ownedCosmetics: [SPARK_ICON],
      selectedCosmetics: { icon: SPARK_ICON },
    };

    const selected = getSelectedCosmetic(profile, "icon");

    expect(selected?.id).toBe(SPARK_ICON);
  });

  it("returns undefined when no cosmetic is selected for a category", () => {
    const profile = createProfile();

    expect(getSelectedCosmetic(profile, "icon")).toBeUndefined();
  });
});
