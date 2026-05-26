import {
  applyOpenChest,
  chestCatalog,
  type ChestReward,
} from "../core/chests";
import { cosmeticCatalog } from "../core/inventory";
import { describeKeySource } from "../core/key-sources";
import type { PlayerProfile } from "../core/profile";
import { formatRewardSummary } from "../core/reward-summary";
import { buildRoomRow, buildRoomShell, safeTestId } from "./room-shell";

interface ChestRoomActions {
  onProfileChange: (next: PlayerProfile) => void;
  onReturnToLobby: () => void;
}

export function chestRewardSummary(reward: ChestReward): string {
  return formatRewardSummary({
    coinsAwarded: reward.coinsAwarded,
    cosmeticsAwarded: reward.cosmeticAwarded
      ? [reward.cosmeticAwarded]
      : undefined,
  });
}

function capitalize(text: string): string {
  if (text.length === 0) return text;
  return text[0]!.toUpperCase() + text.slice(1);
}

export function mountChestRoom(
  root: HTMLElement,
  profileRef: { current: PlayerProfile },
  actions: ChestRoomActions,
): () => void {
  function render(): void {
    const profile = profileRef.current;

    root.replaceChildren();

    const { list, main } = buildRoomShell("Chest Room", actions.onReturnToLobby);
    root.appendChild(main);

    for (const chest of chestCatalog) {
      const opened = profile.openedChestIds.includes(chest.id);
      const keyCount = profile.keys[chest.keyType] ?? 0;
      const testId = safeTestId(chest.id);
      const rewardCosmetic = chest.reward.cosmeticAwarded
        ? cosmeticCatalog.find(
            (item) => item.id === chest.reward.cosmeticAwarded,
          )
        : undefined;

      const hintText = describeKeySource(chest.keyType);

      list.appendChild(
        buildRoomRow({
          actionDisabled: opened || keyCount < 1,
          actionLabel: "Open",
          actionTestId: `chest-${testId}-open`,
          detail: `1 ${capitalize(chest.keyType)} Key → ${chestRewardSummary(chest.reward)}`,
          hintTestId: `chest-${testId}-key-hint`,
          hintText,
          hintVisible: !opened && keyCount < 1 && hintText.length > 0,
          name: chest.name,
          onAction: () => {
            const result = applyOpenChest(profileRef.current, chest.id);
            if (result.profile !== profileRef.current) {
              actions.onProfileChange(result.profile);
              render();
            }
          },
          rowExtraClass: opened ? "row-complete" : undefined,
          statusLabel: "Opened",
          statusTestId: `chest-${testId}-opened`,
          statusVisible: opened,
          swatchColor: rewardCosmetic?.appearance.fillRunning,
          swatchMotif: rewardCosmetic?.appearance.motif,
          swatchPlaceholder: true,
          swatchShape: rewardCosmetic?.appearance.cubeShape,
          swatchTestId: rewardCosmetic
            ? `chest-${testId}-reward-swatch`
            : undefined,
        }),
      );
    }
  }

  render();

  return () => {
    root.replaceChildren();
  };
}
