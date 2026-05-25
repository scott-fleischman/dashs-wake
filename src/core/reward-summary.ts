import { cosmeticCatalog } from "./inventory";
import type { Reward } from "./profile";

const KEY_TYPE_ORDER: readonly string[] = ["easy", "normal", "hard"];

function capitalize(text: string): string {
  if (text.length === 0) return text;
  return text[0]!.toUpperCase() + text.slice(1);
}

export function formatRewardSummary(reward: Reward): string {
  const parts: string[] = [];

  if (reward.coinsAwarded && reward.coinsAwarded > 0) {
    parts.push(
      `${reward.coinsAwarded} Coin${reward.coinsAwarded === 1 ? "" : "s"}`,
    );
  }

  if (reward.keysAwarded) {
    const orderedKeyTypes = [
      ...KEY_TYPE_ORDER,
      ...Object.keys(reward.keysAwarded).filter(
        (keyType) => !KEY_TYPE_ORDER.includes(keyType),
      ),
    ];
    for (const keyType of orderedKeyTypes) {
      const count = reward.keysAwarded[keyType] ?? 0;
      if (count > 0) {
        parts.push(
          `${count} ${capitalize(keyType)} Key${count === 1 ? "" : "s"}`,
        );
      }
    }
  }

  if (reward.cosmeticsAwarded) {
    for (const cosmeticId of reward.cosmeticsAwarded) {
      const item = cosmeticCatalog.find((entry) => entry.id === cosmeticId);
      parts.push(item?.name ?? cosmeticId);
    }
  }

  return parts.join(" + ");
}
