import {
  applyCosmeticPurchase,
  cosmeticCatalog,
} from "../core/inventory";
import type { PlayerProfile } from "../core/profile";
import { buildRoomRow, buildRoomShell, safeTestId } from "./room-shell";

interface ShopActions {
  onProfileChange: (next: PlayerProfile) => void;
  onReturnToLobby: () => void;
}

export function mountShop(
  root: HTMLElement,
  profileRef: { current: PlayerProfile },
  actions: ShopActions,
): () => void {
  function render(): void {
    const profile = profileRef.current;

    root.replaceChildren();

    const { list, main } = buildRoomShell("Shop", actions.onReturnToLobby);

    const balance = document.createElement("p");
    balance.className = "room-balance";
    balance.textContent = `${profile.coins} Coins`;
    main.querySelector("header")?.appendChild(balance);

    root.appendChild(main);

    for (const item of cosmeticCatalog) {
      const owned = profile.ownedCosmetics.includes(item.id);
      const testId = safeTestId(item.id);

      list.appendChild(
        buildRoomRow({
          actionDisabled: owned || profile.coins < item.price,
          actionLabel: "Buy",
          actionTestId: `cosmetic-${testId}-buy`,
          detail: `${item.price} Coins`,
          name: item.name,
          onAction: () => {
            const result = applyCosmeticPurchase(profileRef.current, item.id);
            if (result.profile !== profileRef.current) {
              actions.onProfileChange(result.profile);
              render();
            }
          },
          statusLabel: "Owned",
          statusTestId: `cosmetic-${testId}-owned`,
          statusVisible: owned,
        }),
      );
    }
  }

  render();

  return () => {
    root.replaceChildren();
  };
}
