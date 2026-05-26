import {
  applyCosmeticSelection,
  cosmeticCatalog,
  type CosmeticCategory,
} from "../core/inventory";
import type { PlayerProfile } from "../core/profile";
import { buildRoomRow, buildRoomShell, safeTestId } from "./room-shell";

interface CustomizerActions {
  onProfileChange: (next: PlayerProfile) => void;
  onReturnToLobby: () => void;
}

const ICON_CATEGORY: CosmeticCategory = "icon";

export function mountCustomizer(
  root: HTMLElement,
  profileRef: { current: PlayerProfile },
  actions: CustomizerActions,
): () => void {
  function render(): void {
    const profile = profileRef.current;
    const selectedId = profile.selectedCosmetics[ICON_CATEGORY];
    const ownedIcons = cosmeticCatalog.filter(
      (item) =>
        item.category === ICON_CATEGORY &&
        profile.ownedCosmetics.includes(item.id),
    );

    root.replaceChildren();

    const { list, main } = buildRoomShell("Icon Customizer", actions.onReturnToLobby);
    root.appendChild(main);

    for (const item of ownedIcons) {
      const testId = safeTestId(item.id);
      list.appendChild(
        buildRoomRow({
          actionDisabled: selectedId === item.id,
          actionLabel: "Select",
          actionTestId: `cosmetic-${testId}-select`,
          name: item.name,
          onAction: () => {
            const result = applyCosmeticSelection(profileRef.current, item.id);
            if (result.profile !== profileRef.current) {
              actions.onProfileChange(result.profile);
              render();
            }
          },
          statusLabel: "Equipped",
          statusTestId: `cosmetic-${testId}-equipped`,
          statusVisible: selectedId === item.id,
          swatchColor: item.appearance.fillRunning,
          swatchMotif: item.appearance.motif,
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
