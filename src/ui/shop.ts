import {
  applyCosmeticPurchase,
  cosmeticCatalog,
} from "../core/inventory";
import type { PlayerProfile } from "../core/profile";

interface ShopActions {
  onProfileChange: (next: PlayerProfile) => void;
  onReturnToLobby: () => void;
}

function testIdFor(itemId: string): string {
  return itemId.replace(/[^a-z0-9-]/gi, "-");
}

export function mountShop(
  root: HTMLElement,
  profileRef: { current: PlayerProfile },
  actions: ShopActions,
): () => void {
  function render(): void {
    const profile = profileRef.current;

    root.replaceChildren();

    const main = document.createElement("main");
    main.className = "room";
    main.setAttribute("aria-label", "Shop");
    root.appendChild(main);

    const header = document.createElement("header");
    main.appendChild(header);

    const heading = document.createElement("h1");
    heading.textContent = "Shop";
    header.appendChild(heading);

    const coinsLabel = document.createElement("p");
    coinsLabel.className = "room-balance";
    coinsLabel.textContent = `${profile.coins} Coins`;
    header.appendChild(coinsLabel);

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

    for (const item of cosmeticCatalog) {
      const li = document.createElement("li");
      li.className = "cosmetic-row";

      const name = document.createElement("span");
      name.className = "cosmetic-name";
      name.textContent = item.name;
      li.appendChild(name);

      const price = document.createElement("span");
      price.className = "cosmetic-price";
      price.textContent = `${item.price} Coins`;
      li.appendChild(price);

      const owned = profile.ownedCosmetics.includes(item.id);

      const buyButton = document.createElement("button");
      buyButton.type = "button";
      buyButton.className = "primary-button";
      buyButton.setAttribute(
        "data-testid",
        `cosmetic-${testIdFor(item.id)}-buy`,
      );
      buyButton.textContent = "Buy";
      buyButton.disabled = owned || profile.coins < item.price;
      buyButton.addEventListener("click", () => {
        const result = applyCosmeticPurchase(profileRef.current, item.id);
        if (result.profile !== profileRef.current) {
          actions.onProfileChange(result.profile);
          render();
        }
      });
      li.appendChild(buyButton);

      const ownedTag = document.createElement("span");
      ownedTag.className = "cosmetic-owned";
      ownedTag.setAttribute(
        "data-testid",
        `cosmetic-${testIdFor(item.id)}-owned`,
      );
      ownedTag.textContent = "Owned";
      ownedTag.hidden = !owned;
      li.appendChild(ownedTag);

      list.appendChild(li);
    }
  }

  render();

  return () => {
    root.replaceChildren();
  };
}
