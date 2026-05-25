import { describe, expect, it } from "vitest";
import {
  applyGauntletCompletion,
  gauntletCatalog,
  isGauntletUnlocked,
} from "../../src/core/gauntlet";
import { createProfile } from "../../src/core/profile";

const ELECTRIC_WAKE_ID = "electric-wake";

function gauntletById(id: string) {
  return gauntletCatalog.find((gauntlet) => gauntlet.id === id);
}

describe("electric wake gauntlet rewards", () => {
  it("publishes the Electric Wake gauntlet with stages, reward, and unlock", () => {
    const gauntlet = gauntletById(ELECTRIC_WAKE_ID);

    expect(gauntlet).toBeDefined();
    expect(gauntlet!.stages.length).toBeGreaterThan(0);
    expect(
      gauntlet!.reward.keysAwarded ||
        gauntlet!.reward.coinsAwarded ||
        gauntlet!.reward.cosmeticsAwarded,
    ).toBeTruthy();
    expect(gauntlet!.unlockRequirement.requiredCompletedLevels.length).toBeGreaterThan(0);
  });

  it("blocks gauntlet access until the configured levels are completed", () => {
    const profile = createProfile();

    expect(isGauntletUnlocked(profile, ELECTRIC_WAKE_ID)).toBe(false);
  });

  it("unlocks the gauntlet once required levels are completed", () => {
    const gauntlet = gauntletById(ELECTRIC_WAKE_ID)!;
    const profile = {
      ...createProfile(),
      completedLevels: [...gauntlet.unlockRequirement.requiredCompletedLevels],
    };

    expect(isGauntletUnlocked(profile, ELECTRIC_WAKE_ID)).toBe(true);
  });

  it("grants the final reward and marks the gauntlet completed on first finish", () => {
    const profile = createProfile();

    const result = applyGauntletCompletion(profile, ELECTRIC_WAKE_ID);

    expect(result.profile.completedGauntletIds).toContain(ELECTRIC_WAKE_ID);
    expect(result.profile).not.toBe(profile);
  });

  it("does not re-grant the reward when the gauntlet is completed again", () => {
    const profile = {
      ...createProfile(),
      completedGauntletIds: [ELECTRIC_WAKE_ID],
    };

    const result = applyGauntletCompletion(profile, ELECTRIC_WAKE_ID);

    expect(result.profile).toBe(profile);
  });
});
