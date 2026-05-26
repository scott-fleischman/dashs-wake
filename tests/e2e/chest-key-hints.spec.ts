import { expect, test } from "@playwright/test";
import { seedProfile } from "./helpers/profile-storage";

test("chest rows tell the player where to earn the matching key", async ({
  page,
}) => {
  await page.goto("/");
  await seedProfile(page, {
    coins: 0,
    keys: {},
  });
  await page.reload();

  await page.getByTestId("destination-chest-room").click();

  await expect(page.getByTestId("chest-chest-starter-key-hint")).toHaveText(
    "Earn from First Wake, Launch Sequence",
  );
  await expect(page.getByTestId("chest-chest-normal-key-hint")).toHaveText(
    "Earn from Orbital Loop, Combined Run, Block Pulse",
  );
  await expect(page.getByTestId("chest-chest-hard-key-hint")).toContainText(
    "Trap Lane",
  );
  await expect(page.getByTestId("chest-chest-hard-key-hint")).toContainText(
    "Electric Wake Gauntlet",
  );
});

test("chest rows hide the key hint once the player has at least one matching key", async ({
  page,
}) => {
  await page.goto("/");
  await seedProfile(page, {
    coins: 0,
    keys: { easy: 1 },
  });
  await page.reload();

  await page.getByTestId("destination-chest-room").click();

  await expect(page.getByTestId("chest-chest-starter-key-hint")).toBeHidden();
});
