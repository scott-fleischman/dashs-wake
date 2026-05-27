import {
  applyCosmeticSelection,
  cosmeticCategories,
  cosmeticCatalog,
  type CosmeticCategory,
} from "../core/inventory";
import type { PlayerProfile } from "../core/profile";
import { buildRoomRow, buildRoomShell, safeTestId } from "./room-shell";

interface CustomizerActions {
  onProfileChange: (next: PlayerProfile) => void;
  onReturnToLobby: () => void;
}

const CATEGORY_LABELS: Record<CosmeticCategory, string> = {
  icon: "Icons",
  ship: "Ships",
  "primary-color": "Primary Colors",
  "secondary-color": "Secondary Colors",
  trail: "Trails",
};

export function mountCustomizer(
  root: HTMLElement,
  profileRef: { current: PlayerProfile },
  actions: CustomizerActions,
): () => void {
  function render(): void {
    const profile = profileRef.current;

    root.replaceChildren();

    const { list, main } = buildRoomShell("Icon Customizer", actions.onReturnToLobby);
    root.appendChild(main);

    for (const category of cosmeticCategories) {
      const heading = document.createElement("h2");
      heading.className = "room-subheading";
      heading.textContent = CATEGORY_LABELS[category];
      list.appendChild(heading);
      const selectedId = profile.selectedCosmetics[category];
      const owned = cosmeticCatalog.filter(
        (item) =>
          item.category === category &&
          profile.ownedCosmetics.includes(item.id),
      );
      for (const item of owned) {
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
  }

  render();

  return () => {
    root.replaceChildren();
  };
}
