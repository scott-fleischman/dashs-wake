import { describe, expect, it } from "vitest";
import { createProfile } from "../../src/core/profile";
import { applyOpenChest, chestCatalog } from "../../src/core/chests";

const STARTER_CHEST_ID = "chest-starter";

describe("chest rewards", () => {
  it("publishes a non-empty chest catalog with a key requirement per entry", () => {
    expect(chestCatalog.length).toBeGreaterThan(0);

    for (const chest of chestCatalog) {
      expect(chest.id.length).toBeGreaterThan(0);
      expect(chest.keyType.length).toBeGreaterThan(0);
    }
  });

  it("gives every chest a human-readable display name distinct from its id", () => {
    for (const chest of chestCatalog) {
      expect(chest.name.length).toBeGreaterThan(0);
      expect(chest.name).not.toBe(chest.id);
      expect(chest.name).not.toMatch(/^chest-/);
    }
  });

  it("offers a chest for every key type levels can award", () => {
    const keyTypes = new Set(chestCatalog.map((chest) => chest.keyType));

    for (const required of ["easy", "normal", "hard"]) {
      expect(keyTypes.has(required)).toBe(true);
    }
  });

  it("consumes one key of the chest's type and grants the deterministic reward on first open", () => {
    const profile = {
      ...createProfile(),
      keys: { easy: 2 },
    };

    const result = applyOpenChest(profile, STARTER_CHEST_ID);

    expect(result.profile.keys["easy"]).toBe(1);
    expect(result.profile.openedChestIds).toContain(STARTER_CHEST_ID);
    expect(result.granted.coinsAwarded ?? 0).toBeGreaterThan(0);
    expect(result.profile.coins).toBe(
      profile.coins + (result.granted.coinsAwarded ?? 0),
    );
  });

  it("refuses to open a chest when the profile has no matching keys", () => {
    const profile = createProfile();

    const result = applyOpenChest(profile, STARTER_CHEST_ID);

    expect(result.profile).toBe(profile);
    expect(result.granted.coinsAwarded ?? 0).toBe(0);
  });

  it("does not re-open or re-reward a chest that the profile already opened", () => {
    const profile = {
      ...createProfile(),
      keys: { easy: 1 },
      openedChestIds: [STARTER_CHEST_ID],
    };

    const result = applyOpenChest(profile, STARTER_CHEST_ID);

    expect(result.profile).toBe(profile);
    expect(result.profile.keys["easy"]).toBe(1);
  });

  it("ignores an unknown chest id without consuming keys", () => {
    const profile = {
      ...createProfile(),
      keys: { easy: 5 },
    };

    const result = applyOpenChest(profile, "chest-unknown");

    expect(result.profile).toBe(profile);
    expect(result.profile.keys["easy"]).toBe(5);
  });

  it("grants both coin and cosmetic rewards together when a chest awards both", () => {
    const profile = {
      ...createProfile(),
      keys: { normal: 1 },
    };

    const result = applyOpenChest(profile, "chest-normal");

    expect(result.granted.cosmeticAwarded).toBeDefined();
    expect(result.profile.ownedCosmetics).toContain(
      result.granted.cosmeticAwarded,
    );
    expect(result.profile.coins).toBe(
      profile.coins + (result.granted.coinsAwarded ?? 0),
    );
    expect(result.profile.keys["normal"]).toBe(0);
    expect(result.profile.openedChestIds).toContain("chest-normal");
  });
});
