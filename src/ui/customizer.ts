import {
  applyCosmeticSelection,
  cosmeticCatalog,
  type CosmeticCategory,
} from "../core/inventory";
import type { PlayerProfile } from "../core/profile";

interface CustomizerActions {
  onProfileChange: (next: PlayerProfile) => void;
  onReturnToLobby: () => void;
}

const ICON_CATEGORY: CosmeticCategory = "icon";

function testIdFor(itemId: string): string {
  return itemId.replace(/[^a-z0-9-]/gi, "-");
}

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

    const main = document.createElement("main");
    main.className = "room";
    main.setAttribute("aria-label", "Icon Customizer");
    root.appendChild(main);

    const header = document.createElement("header");
    main.appendChild(header);

    const heading = document.createElement("h1");
    heading.textContent = "Icon Customizer";
    header.appendChild(heading);

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "utility-button";
    backButton.setAttribute("data-testid", "room-back");
    backButton.textContent = "Back to Lobby";
    backButton.addEventListener("click", actions.onReturnToLobby);
    header.appendChild(backButton);

    const list = document.createElement("ul");
    list.className = "cosmetic-list";
    main.appendChild(list);

    for (const item of ownedIcons) {
      const li = document.createElement("li");
      li.className = "cosmetic-row";

      const name = document.createElement("span");
      name.className = "cosmetic-name";
      name.textContent = item.name;
      li.appendChild(name);

      const selectButton = document.createElement("button");
      selectButton.type = "button";
      selectButton.className = "primary-button";
      selectButton.setAttribute(
        "data-testid",
        `cosmetic-${testIdFor(item.id)}-select`,
      );
      selectButton.textContent = "Select";
      selectButton.addEventListener("click", () => {
        const result = applyCosmeticSelection(profileRef.current, item.id);
        if (result.profile !== profileRef.current) {
          actions.onProfileChange(result.profile);
          render();
        }
      });
      li.appendChild(selectButton);

      const equipped = document.createElement("span");
      equipped.className = "cosmetic-equipped";
      equipped.setAttribute(
        "data-testid",
        `cosmetic-${testIdFor(item.id)}-equipped`,
      );
      equipped.textContent = "Equipped";
      equipped.hidden = selectedId !== item.id;
      li.appendChild(equipped);

      list.appendChild(li);
    }
  }

  render();

  return () => {
    root.replaceChildren();
  };
}
