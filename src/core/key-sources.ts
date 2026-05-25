import { officialLevelCatalog } from "../content/official-levels";
import { gauntletCatalog } from "./gauntlet";
import { OFFICIAL_LEVEL_COMPLETION_RULES } from "./profile";

export function describeKeySource(keyType: string): string {
  const sources: string[] = [];

  for (const level of officialLevelCatalog) {
    const rule = OFFICIAL_LEVEL_COMPLETION_RULES[level.id];
    if (rule?.keyAwarded?.type === keyType) {
      sources.push(level.name);
    }
  }

  for (const gauntlet of gauntletCatalog) {
    if ((gauntlet.reward.keysAwarded?.[keyType] ?? 0) > 0) {
      sources.push(gauntlet.name);
    }
  }

  if (sources.length === 0) {
    return "";
  }

  return `Earn from ${sources.join(", ")}`;
}
