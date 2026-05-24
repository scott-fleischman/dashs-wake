import type { PlayerProfile } from "../core/profile";

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

function level1StatusText(profile: PlayerProfile): string {
  return profile.completedLevels.includes("level_1") ? "Complete" : "—";
}

function level1BestPercentText(profile: PlayerProfile): string {
  const best = profile.bestPercents["level_1"];
  return best !== undefined ? `${best}%` : "—";
}

function level2StatusText(profile: PlayerProfile): string {
  return profile.unlockedLevels.includes("level_2") ? "Unlocked" : "Locked";
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
  const level2Unlocked = profile.unlockedLevels.includes("level_2");
  return `
    <div class="level-list" aria-label="Level select">
      <div class="level-card">
        <div class="level-card-info">
          <p class="level-kicker">Official Level 01</p>
          <h2 class="level-title">First Wake</h2>
          <p class="level-stat" data-testid="level-1-status">${level1StatusText(profile)}</p>
          <p class="level-stat level-best" data-testid="level-1-best-percent">${level1BestPercentText(profile)}</p>
        </div>
        <button class="play-button" type="button" data-action="play">
          <span class="play-symbol" aria-hidden="true"></span>
          <span>Play</span>
        </button>
      </div>

      <div class="level-card ${level2Unlocked ? "" : "level-locked"}">
        <div class="level-card-info">
          <p class="level-kicker">Official Level 02</p>
          <h2 class="level-title">Level 2</h2>
          <p class="level-stat" data-testid="level-2-status">${level2StatusText(profile)}</p>
        </div>
        <button class="play-button" type="button" disabled>
          <span>${level2Unlocked ? "Coming later" : "Locked"}</span>
        </button>
      </div>
    </div>
  `;
}

export function mountLobby(
  root: HTMLElement,
  profile: PlayerProfile,
  onPlay: () => void,
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

  const playButton = root.querySelector<HTMLButtonElement>("[data-action='play']");

  if (!playButton) {
    throw new Error("Lobby controls did not mount correctly.");
  }

  playButton.addEventListener("click", onPlay);

  return () => {
    playButton.removeEventListener("click", onPlay);
  };
}
