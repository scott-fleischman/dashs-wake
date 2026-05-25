import {
  levelKicker,
  officialLevelCatalog,
  type OfficialLevelDifficulty,
  type OfficialLevelMetadata,
} from "../content/official-levels";
import type { PlayerProfile } from "../core/profile";

const DIFFICULTY_LABELS: Record<OfficialLevelDifficulty, string> = {
  easy: "Easy",
  normal: "Normal",
  hard: "Hard",
  harder: "Harder",
  insane: "Insane",
};

function testIdFor(levelId: string): string {
  return levelId.replace(/_/g, "-");
}

function isLevelUnlocked(
  metadata: OfficialLevelMetadata,
  profile: PlayerProfile,
): boolean {
  if (metadata.unlockedBy === null) {
    return true;
  }
  return profile.unlockedLevels.includes(metadata.id);
}

function levelStatusText(
  metadata: OfficialLevelMetadata,
  profile: PlayerProfile,
): string {
  if (profile.completedLevels.includes(metadata.id)) {
    return "Complete";
  }
  return isLevelUnlocked(metadata, profile) ? "Unlocked" : "Locked";
}

const futureDestinations = [
  "Generated Levels",
  "Gauntlets",
  "Chest Room",
  "Shop",
  "Icon Customizer",
  "Settings",
] as const;

function destinationButton(name: (typeof futureDestinations)[number]): string {
  return `
    <button class="destination future" type="button" aria-label="${name} - Coming later" disabled>
      <span>${name}</span>
      <small>Coming later</small>
    </button>
  `;
}

function coinsText(coins: number): string {
  return `${coins} Coin${coins === 1 ? "" : "s"}`;
}

function keysText(count: number): string {
  return `${count} Easy Key${count === 1 ? "" : "s"}`;
}

function renderLevelCard(
  metadata: OfficialLevelMetadata,
  profile: PlayerProfile,
): string {
  const testId = testIdFor(metadata.id);
  const unlocked = isLevelUnlocked(metadata, profile);
  const status = levelStatusText(metadata, profile);
  const difficulty = DIFFICULTY_LABELS[metadata.difficulty];
  const kicker = levelKicker(metadata.id);
  const best = profile.bestPercents[metadata.id];
  const bestHidden = best === undefined ? "hidden" : "";
  const bestText = best === undefined ? "" : `${best}%`;
  const buttonLabel = unlocked ? "Play" : "Locked";
  const buttonDisabledAttr = unlocked ? "" : "disabled";
  const cardClasses = unlocked ? "level-card" : "level-card level-locked";

  return `
    <div class="${cardClasses}">
      <div class="level-card-info">
        <p class="level-kicker">${kicker}</p>
        <h2 class="level-title">${metadata.name}</h2>
        <p class="level-stat" data-testid="${testId}-status">${status}</p>
        <p class="level-difficulty" data-testid="${testId}-difficulty">${difficulty}</p>
        <p class="level-stat level-best" data-testid="${testId}-best-percent" ${bestHidden}>${bestText}</p>
      </div>
      <button class="play-button" type="button" data-testid="${testId}-play" data-action="play" data-level-id="${metadata.id}" ${buttonDisabledAttr}>
        <span>${buttonLabel}</span>
      </button>
    </div>
  `;
}

function renderProfileStats(profile: PlayerProfile): string {
  const easyKeys = profile.keys["easy"] ?? 0;
  const keysHtml =
    easyKeys > 0
      ? `<span class="profile-stat" data-testid="profile-keys-easy">${keysText(easyKeys)}</span>`
      : `<span class="profile-stat" data-testid="profile-keys-easy" hidden></span>`;

  return `
    <div class="profile-stats" aria-label="Profile stats">
      <span class="profile-stat" data-testid="profile-coins">${coinsText(profile.coins)}</span>
      ${keysHtml}
    </div>
  `;
}

function renderLevelList(profile: PlayerProfile): string {
  const cards = officialLevelCatalog
    .map((metadata) => renderLevelCard(metadata, profile))
    .join("");

  return `
    <div class="level-list" aria-label="Level select">
      ${cards}
    </div>
  `;
}

export function mountLobby(
  root: HTMLElement,
  profile: PlayerProfile,
  onPlay: (levelId: string) => void,
): () => void {
  root.innerHTML = `
    <main class="lobby">
      <header class="title">
        <p class="kicker">Rhythm Runner Prototype</p>
        <h1>Dash's Wake</h1>
        <p class="subtitle">Original geometric worlds shaped by the beat.</p>
      </header>

      ${renderProfileStats(profile)}

      <nav class="destination-grid" aria-label="Destinations">
        <div class="future-left">
          ${futureDestinations.slice(0, 3).map(destinationButton).join("")}
        </div>

        ${renderLevelList(profile)}

        <div class="future-right">
          ${futureDestinations.slice(3).map(destinationButton).join("")}
        </div>
      </nav>
    </main>
  `;

  const playButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-action='play']"),
  );

  if (playButtons.length === 0) {
    throw new Error("Lobby controls did not mount correctly.");
  }

  const handlers = playButtons.map((button) => {
    const levelId = button.dataset.levelId ?? "level_1";
    const handler = (): void => onPlay(levelId);
    button.addEventListener("click", handler);
    return { button, handler };
  });

  return () => {
    for (const { button, handler } of handlers) {
      button.removeEventListener("click", handler);
    }
  };
}
