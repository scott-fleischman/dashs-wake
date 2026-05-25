import { applyOpenChest, chestCatalog } from "../core/chests";
import type { PlayerProfile } from "../core/profile";

interface ChestRoomActions {
  onProfileChange: (next: PlayerProfile) => void;
  onReturnToLobby: () => void;
}

function testIdFor(itemId: string): string {
  return itemId.replace(/[^a-z0-9-]/gi, "-");
}

export function mountChestRoom(
  root: HTMLElement,
  profileRef: { current: PlayerProfile },
  actions: ChestRoomActions,
): () => void {
  function render(): void {
    const profile = profileRef.current;

    root.replaceChildren();

    const main = document.createElement("main");
    main.className = "room";
    main.setAttribute("aria-label", "Chest Room");
    root.appendChild(main);

    const header = document.createElement("header");
    main.appendChild(header);

    const heading = document.createElement("h1");
    heading.textContent = "Chest Room";
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

    for (const chest of chestCatalog) {
      const li = document.createElement("li");
      li.className = "cosmetic-row";

      const name = document.createElement("span");
      name.className = "cosmetic-name";
      name.textContent = chest.id;
      li.appendChild(name);

      const requirement = document.createElement("span");
      requirement.className = "cosmetic-price";
      requirement.textContent = `1 ${chest.keyType} Key`;
      li.appendChild(requirement);

      const opened = profile.openedChestIds.includes(chest.id);
      const keyCount = profile.keys[chest.keyType] ?? 0;

      const openButton = document.createElement("button");
      openButton.type = "button";
      openButton.className = "primary-button";
      openButton.setAttribute(
        "data-testid",
        `chest-${testIdFor(chest.id)}-open`,
      );
      openButton.textContent = "Open";
      openButton.disabled = opened || keyCount < 1;
      openButton.addEventListener("click", () => {
        const result = applyOpenChest(profileRef.current, chest.id);
        if (result.profile !== profileRef.current) {
          actions.onProfileChange(result.profile);
          render();
        }
      });
      li.appendChild(openButton);

      const openedTag = document.createElement("span");
      openedTag.className = "cosmetic-owned";
      openedTag.setAttribute(
        "data-testid",
        `chest-${testIdFor(chest.id)}-opened`,
      );
      openedTag.textContent = "Opened";
      openedTag.hidden = !opened;
      li.appendChild(openedTag);

      list.appendChild(li);
    }
  }

  render();

  return () => {
    root.replaceChildren();
  };
}
