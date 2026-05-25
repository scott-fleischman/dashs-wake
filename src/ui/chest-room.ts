import {
  applyOpenChest,
  chestCatalog,
  type ChestReward,
} from "../core/chests";
import { cosmeticCatalog } from "../core/inventory";
import type { PlayerProfile } from "../core/profile";
import { buildRoomRow, buildRoomShell, safeTestId } from "./room-shell";

interface ChestRoomActions {
  onProfileChange: (next: PlayerProfile) => void;
  onReturnToLobby: () => void;
}

export function chestRewardSummary(reward: ChestReward): string {
  const parts: string[] = [];
  if (reward.coinsAwarded && reward.coinsAwarded > 0) {
    parts.push(`${reward.coinsAwarded} coins`);
  }
  if (reward.cosmeticAwarded) {
    const item = cosmeticCatalog.find(
      (entry) => entry.id === reward.cosmeticAwarded,
    );
    parts.push(item?.name ?? reward.cosmeticAwarded);
  }
  return parts.join(" + ");
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

      list.appendChild(
        buildRoomRow({
          actionDisabled: opened || keyCount < 1,
          actionLabel: "Open",
          actionTestId: `chest-${testId}-open`,
          detail: `1 ${chest.keyType} Key → ${chestRewardSummary(chest.reward)}`,
          name: chest.id,
          onAction: () => {
            const result = applyOpenChest(profileRef.current, chest.id);
            if (result.profile !== profileRef.current) {
              actions.onProfileChange(result.profile);
              render();
            }
          },
          statusLabel: "Opened",
          statusTestId: `chest-${testId}-opened`,
          statusVisible: opened,
        }),
      );
    }
  }

  render();

  return () => {
    root.replaceChildren();
  };
}
