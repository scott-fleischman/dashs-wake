import { applyOpenChest, chestCatalog } from "../core/chests";
import type { PlayerProfile } from "../core/profile";
import { buildRoomRow, buildRoomShell, safeTestId } from "./room-shell";

interface ChestRoomActions {
  onProfileChange: (next: PlayerProfile) => void;
  onReturnToLobby: () => void;
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
          detail: `1 ${chest.keyType} Key`,
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
