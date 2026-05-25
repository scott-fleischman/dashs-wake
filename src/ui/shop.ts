import {
  applyCosmeticPurchase,
  cosmeticCatalog,
  type CosmeticItem,
} from "../core/inventory";
import type { PlayerProfile } from "../core/profile";
import { formatCoinAmount } from "../core/reward-summary";
import { buildRoomRow, buildRoomShell, safeTestId } from "./room-shell";

interface ShopActions {
  onProfileChange: (next: PlayerProfile) => void;
  onReturnToLobby: () => void;
}

function buildPurchaseConfirmation(
  item: CosmeticItem,
  testId: string,
  onConfirm: () => void,
  onCancel: () => void,
): HTMLElement {
  const overlay = document.createElement("section");
  overlay.className = "pause-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-label", "Confirm purchase");
  overlay.setAttribute("data-testid", `cosmetic-${testId}-confirm`);

  const kicker = document.createElement("p");
  kicker.className = "kicker";
  kicker.textContent = "Confirm Purchase";
  overlay.appendChild(kicker);

  const heading = document.createElement("h2");
  heading.textContent = `Buy ${item.name}?`;
  overlay.appendChild(heading);

  const swatch = document.createElement("span");
  const shapeClass =
    item.appearance.cubeShape === "circle"
      ? " shape-circle"
      : item.appearance.cubeShape === "diamond"
        ? " shape-diamond"
        : "";
  swatch.className = `cosmetic-swatch confirm-swatch${shapeClass}`;
  swatch.style.background = `#${item.appearance.fillRunning
    .toString(16)
    .padStart(6, "0")}`;
  swatch.setAttribute("data-testid", `cosmetic-${testId}-confirm-swatch`);
  overlay.appendChild(swatch);

  const message = document.createElement("p");
  message.className = "result-message";
  message.textContent = formatCoinAmount(item.price);
  overlay.appendChild(message);

  const actionsRow = document.createElement("div");
  actionsRow.className = "overlay-actions";
  overlay.appendChild(actionsRow);

  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.className = "primary-button";
  confirmBtn.textContent = "Buy";
  confirmBtn.setAttribute("data-testid", `cosmetic-${testId}-confirm-buy`);
  confirmBtn.addEventListener("click", onConfirm);
  actionsRow.appendChild(confirmBtn);

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "utility-button";
  cancelBtn.textContent = "Cancel";
  cancelBtn.setAttribute("data-testid", `cosmetic-${testId}-confirm-cancel`);
  cancelBtn.addEventListener("click", onCancel);
  actionsRow.appendChild(cancelBtn);

  return overlay;
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
    balance.setAttribute("data-testid", "shop-balance");
    balance.textContent = formatCoinAmount(profile.coins);
    main.querySelector("header")?.appendChild(balance);

    root.appendChild(main);

    const purchasable = cosmeticCatalog.filter((item) => item.price > 0);
    for (const item of purchasable) {
      const owned = profile.ownedCosmetics.includes(item.id);
      const testId = safeTestId(item.id);

      list.appendChild(
        buildRoomRow({
          actionDisabled: owned || profile.coins < item.price,
          actionLabel: "Buy",
          actionTestId: `cosmetic-${testId}-buy`,
          detail: formatCoinAmount(item.price),
          name: item.name,
          rowExtraClass: owned ? "row-complete" : undefined,
          onAction: () => {
            const overlay = buildPurchaseConfirmation(
              item,
              testId,
              () => {
                const result = applyCosmeticPurchase(
                  profileRef.current,
                  item.id,
                );
                if (result.profile !== profileRef.current) {
                  actions.onProfileChange(result.profile);
                }
                render();
              },
              () => {
                overlay.remove();
              },
            );
            main.appendChild(overlay);
          },
          statusLabel: "Owned",
          statusTestId: `cosmetic-${testId}-owned`,
          statusVisible: owned,
          swatchColor: item.appearance.fillRunning,
          swatchShape: item.appearance.cubeShape,
          swatchTestId: `cosmetic-${testId}-swatch`,
        }),
      );
    }
  }

  render();

  return () => {
    root.replaceChildren();
  };
}
