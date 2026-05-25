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

function renderLevel1Status(profile: PlayerProfile): string {
  const completed = profile.completedLevels.includes("level_1");
  const hidden = completed ? "" : "hidden";
  const text = completed ? "Complete" : "";
  return `<p class="level-stat" data-testid="level-1-status" ${hidden}>${text}</p>`;
}

function renderLevel1BestPercent(profile: PlayerProfile): string {
  const best = profile.bestPercents["level_1"];
  const hidden = best === undefined ? "hidden" : "";
  const text = best === undefined ? "" : `${best}%`;
  return `<p class="level-stat level-best" data-testid="level-1-best-percent" ${hidden}>${text}</p>`;
}

function level2StatusText(profile: PlayerProfile): string {
  return profile.unlockedLevels.includes("level_2") ? "Unlocked" : "Locked";
}

function level3StatusText(profile: PlayerProfile): string {
  return profile.unlockedLevels.includes("level_3") ? "Unlocked" : "Locked";
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
  const level3Unlocked = profile.unlockedLevels.includes("level_3");
  return `
    <div class="level-list" aria-label="Level select">
      <div class="level-card">
        <div class="level-card-info">
          <p class="level-kicker">Official Level 01</p>
          <h2 class="level-title">First Wake</h2>
          ${renderLevel1Status(profile)}
          ${renderLevel1BestPercent(profile)}
        </div>
        <button class="play-button" type="button" data-action="play" data-level-id="level_1">
          <span class="play-symbol" aria-hidden="true"></span>
          <span>Play</span>
        </button>
      </div>

      <div class="level-card ${level2Unlocked ? "" : "level-locked"}">
        <div class="level-card-info">
          <p class="level-kicker">Official Level 02</p>
          <h2 class="level-title">Launch Sequence</h2>
          <p class="level-stat" data-testid="level-2-status">${level2StatusText(profile)}</p>
        </div>
        <button class="play-button" type="button" data-testid="level-2-play" data-action="play" data-level-id="level_2" ${level2Unlocked ? "" : "disabled"}>
          <span>${level2Unlocked ? "Play" : "Locked"}</span>
        </button>
      </div>

      <div class="level-card ${level3Unlocked ? "" : "level-locked"}">
        <div class="level-card-info">
          <p class="level-kicker">Official Level 03</p>
          <h2 class="level-title">Orbital Loop</h2>
          <p class="level-stat" data-testid="level-3-status">${level3StatusText(profile)}</p>
        </div>
        <button class="play-button" type="button" data-testid="level-3-play" data-action="play" data-level-id="level_3" ${level3Unlocked ? "" : "disabled"}>
          <span>${level3Unlocked ? "Play" : "Locked"}</span>
        </button>
      </div>
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
