import {
  formatLevelClearList,
  levelKicker,
  officialLevelCatalog,
  type OfficialLevelDifficulty,
  type OfficialLevelMetadata,
} from "../content/official-levels";
import { getSelectedCosmetic } from "../core/inventory";
import { isUnlockMet, type PlayerProfile } from "../core/profile";
import { formatCoinAmount } from "../core/reward-summary";

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
  return (
    isUnlockMet(profile, metadata.unlockRequirement) ||
    profile.unlockedLevels.includes(metadata.id)
  );
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

function unlockHintText(metadata: OfficialLevelMetadata): string {
  return formatLevelClearList(
    metadata.unlockRequirement.requiredCompletedLevels,
  );
}

interface DestinationConfig {
  name: string;
  route: string | null;
  testId: string;
}

const DESTINATIONS: readonly DestinationConfig[] = [
  { name: "Generated Levels", route: "#generated", testId: "destination-generated-levels" },
  { name: "Gauntlets", route: "#gauntlets", testId: "destination-gauntlets" },
  { name: "Chest Room", route: "#chest-room", testId: "destination-chest-room" },
  { name: "Shop", route: "#shop", testId: "destination-shop" },
  { name: "Icon Customizer", route: "#customizer", testId: "destination-customizer" },
  { name: "Settings", route: null, testId: "destination-settings" },
];

function destinationButton(destination: DestinationConfig): string {
  if (destination.route === null) {
    return `
      <button class="destination future" type="button" aria-label="${destination.name} - Coming later" data-testid="${destination.testId}" disabled>
        <span>${destination.name}</span>
        <small>Coming later</small>
      </button>
    `;
  }

  return `
    <button class="destination" type="button" data-action="navigate" data-route="${destination.route}" data-testid="${destination.testId}">
      <span>${destination.name}</span>
      <small>Open</small>
    </button>
  `;
}


const KEY_TYPE_LABELS: Record<string, string> = {
  easy: "Easy",
  normal: "Normal",
  hard: "Hard",
};

const KEY_TYPE_ORDER: readonly string[] = ["easy", "normal", "hard"];

function keysText(label: string, count: number): string {
  return `${count} ${label} Key${count === 1 ? "" : "s"}`;
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
  const completed = profile.completedLevels.includes(metadata.id);
  const buttonLabel = !unlocked ? "Locked" : completed ? "Replay" : "Play";
  const buttonDisabledAttr = unlocked ? "" : "disabled";
  const cardClasses = completed
    ? "level-card level-complete"
    : unlocked
      ? "level-card"
      : "level-card level-locked";
  const hintText = unlocked ? "" : unlockHintText(metadata);
  const hintHidden = hintText === "" ? "hidden" : "";

  return `
    <div class="${cardClasses}">
      <div class="level-card-info">
        <p class="level-kicker">${kicker}</p>
        <h2 class="level-title">${metadata.name}</h2>
        <p class="level-stat" data-testid="${testId}-status">${status}</p>
        <p class="level-difficulty" data-testid="${testId}-difficulty">${difficulty}</p>
        <p class="level-stat level-best" data-testid="${testId}-best-percent" ${bestHidden}>${bestText}</p>
        <p class="level-stat level-unlock-hint" data-testid="${testId}-unlock-hint" ${hintHidden}>${hintText}</p>
      </div>
      <button class="play-button" type="button" data-testid="${testId}-play" data-action="play" data-level-id="${metadata.id}" ${buttonDisabledAttr}>
        <span>${buttonLabel}</span>
      </button>
    </div>
  `;
}

function renderKeyChip(keyType: string, count: number): string {
  const label = KEY_TYPE_LABELS[keyType] ?? keyType;
  if (count > 0) {
    return `<span class="profile-stat" data-testid="profile-keys-${keyType}">${keysText(label, count)}</span>`;
  }
  return `<span class="profile-stat" data-testid="profile-keys-${keyType}" hidden></span>`;
}

function renderEquippedIconChip(profile: PlayerProfile): string {
  const equipped = getSelectedCosmetic(profile, "icon");
  if (!equipped) {
    return "";
  }
  const color = `#${equipped.appearance.fillRunning
    .toString(16)
    .padStart(6, "0")}`;
  const shapeClass =
    equipped.appearance.cubeShape === "circle"
      ? " shape-circle"
      : equipped.appearance.cubeShape === "diamond"
        ? " shape-diamond"
        : "";
  return `<span class="profile-stat profile-equipped-icon" data-testid="profile-equipped-icon"><span class="cosmetic-swatch${shapeClass}" style="background: ${color}"></span>${equipped.name}</span>`;
}

function renderProfileStats(profile: PlayerProfile): string {
  const keysHtml = KEY_TYPE_ORDER.map((keyType) =>
    renderKeyChip(keyType, profile.keys[keyType] ?? 0),
  ).join("");

  return `
    <div class="profile-stats" aria-label="Profile stats">
      <span class="profile-stat" data-testid="profile-coins">${formatCoinAmount(profile.coins)}</span>
      ${keysHtml}
      ${renderEquippedIconChip(profile)}
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
          ${DESTINATIONS.slice(0, 3).map(destinationButton).join("")}
        </div>

        ${renderLevelList(profile)}

        <div class="future-right">
          ${DESTINATIONS.slice(3).map(destinationButton).join("")}
        </div>
      </nav>
    </main>
  `;

  const playButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-action='play']"),
  );
  const navigateButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-action='navigate']"),
  );

  if (playButtons.length === 0) {
    throw new Error("Lobby controls did not mount correctly.");
  }

  const playHandlers = playButtons.map((button) => {
    const levelId = button.dataset.levelId ?? "level_1";
    const handler = (): void => onPlay(levelId);
    button.addEventListener("click", handler);
    return { button, handler };
  });

  const navigateHandlers = navigateButtons.map((button) => {
    const route = button.dataset.route ?? "";
    const handler = (): void => {
      if (route) {
        window.location.hash = route;
      }
    };
    button.addEventListener("click", handler);
    return { button, handler };
  });

  return () => {
    for (const { button, handler } of playHandlers) {
      button.removeEventListener("click", handler);
    }
    for (const { button, handler } of navigateHandlers) {
      button.removeEventListener("click", handler);
    }
  };
}
