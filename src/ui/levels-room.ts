import {
  formatLevelClearList,
  levelKicker,
  officialLevelCatalog,
  type OfficialLevelDifficulty,
  type OfficialLevelMetadata,
} from "../content/official-levels";
import { isUnlockMet, type PlayerProfile } from "../core/profile";
import { renderProfileStats } from "./lobby";

interface OfficialLevelsRoomActions {
  onPlay: (levelId: string) => void;
  onOpenLobby: () => void;
}

const DIFFICULTY_LABELS: Record<OfficialLevelDifficulty, string> = {
  easy: "Easy",
  normal: "Normal",
  hard: "Hard",
  harder: "Harder",
  insane: "Insane",
};

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

function testIdFor(levelId: string): string {
  return levelId.replace(/_/g, "-");
}

function buildPreviewGrid(metadata: OfficialLevelMetadata): HTMLElement {
  const grid = document.createElement("div");
  grid.className = "level-preview-grid";
  const strength = metadata.id.length + metadata.name.length;
  for (let index = 0; index < 7; index += 1) {
    const bar = document.createElement("span");
    bar.style.height = `${16 + ((strength + index * 5) % 36)}px`;
    grid.appendChild(bar);
  }
  return grid;
}

function makeStat(
  className: string,
  value: string,
  testId?: string,
  hidden = false,
): HTMLElement {
  const stat = document.createElement("p");
  stat.className = className;
  stat.textContent = value;
  if (testId) {
    stat.setAttribute("data-testid", testId);
  }
  if (hidden) {
    stat.hidden = true;
  }
  return stat;
}

export function mountOfficialLevelsRoom(
  root: HTMLElement,
  profile: PlayerProfile,
  actions: OfficialLevelsRoomActions,
): () => void {
  const main = document.createElement("main");
  main.className = "room levels-room level-select-screen";
  main.setAttribute("aria-label", "Official Levels");

  const header = document.createElement("header");
  header.className = "level-select-header";

  const lobbyButton = document.createElement("button");
  lobbyButton.className = "utility-button level-select-lobby";
  lobbyButton.type = "button";
  lobbyButton.dataset.action = "lobby";
  lobbyButton.setAttribute("aria-label", "Open Lobby");
  lobbyButton.title = "Open Lobby (L)";
  lobbyButton.textContent = "Lobby";

  const heading = document.createElement("h1");
  heading.textContent = "Official Levels";

  const help = document.createElement("p");
  help.className = "level-select-help";
  help.textContent = "Left / Right swap level, Space starts, L opens lobby";

  header.append(lobbyButton, heading, help);
  main.appendChild(header);

  const profileStatsShell = document.createElement("div");
  profileStatsShell.innerHTML = renderProfileStats(profile);
  const profileStats = profileStatsShell.firstElementChild;
  if (profileStats) {
    main.appendChild(profileStats);
  }

  const section = document.createElement("section");
  section.className = "level-carousel";
  section.setAttribute("aria-label", "Level select");
  const track = document.createElement("div");
  track.className = "level-carousel-track";
  track.setAttribute("data-testid", "level-carousel-track");
  section.appendChild(track);
  main.appendChild(section);

  const dotNav = document.createElement("nav");
  dotNav.className = "level-carousel-nav";
  dotNav.setAttribute("aria-label", "Level shortcuts");
  main.appendChild(dotNav);

  const playButtons: HTMLButtonElement[] = [];
  const dotButtons: HTMLButtonElement[] = [];

  for (const [index, metadata] of officialLevelCatalog.entries()) {
    const unlocked = isLevelUnlocked(metadata, profile);
    const testId = testIdFor(metadata.id);

    const article = document.createElement("article");
    article.className = `level-focus-card${unlocked ? "" : " level-focus-locked"}`;
    article.dataset.levelId = metadata.id;
    article.setAttribute("aria-label", metadata.name);

    const preview = document.createElement("div");
    preview.className = "level-focus-preview";
    preview.setAttribute("aria-hidden", "true");
    preview.appendChild(buildPreviewGrid(metadata));

    const info = document.createElement("div");
    info.className = "level-focus-info";
    info.appendChild(makeStat("level-kicker", levelKicker(metadata.id)));

    const title = document.createElement("h2");
    title.className = "level-title";
    title.textContent = metadata.name;
    info.appendChild(title);

    info.appendChild(makeStat("level-stat", levelStatusText(metadata, profile), `${testId}-status`));
    info.appendChild(
      makeStat(
        "level-difficulty",
        DIFFICULTY_LABELS[metadata.difficulty],
        `${testId}-difficulty`,
      ),
    );
    info.appendChild(
      makeStat(
        "level-track",
        `${metadata.track.title} - ${metadata.track.artist}`,
        `${testId}-track`,
      ),
    );

    const best = profile.bestPercents[metadata.id];
    info.appendChild(
      makeStat(
        "level-stat level-best",
        best === undefined ? "" : `Best ${best}%`,
        `${testId}-best-percent`,
        best === undefined,
      ),
    );

    const clearHint = formatLevelClearList(
      metadata.unlockRequirement.requiredCompletedLevels,
    );
    info.appendChild(
      makeStat(
        "level-stat level-unlock-hint",
        clearHint,
        `${testId}-unlock-hint`,
        unlocked || clearHint === "",
      ),
    );

    const playButton = document.createElement("button");
    playButton.className = "play-button";
    playButton.type = "button";
    playButton.dataset.action = "play";
    playButton.dataset.levelId = metadata.id;
    playButton.setAttribute("data-testid", `${testId}-play`);
    playButton.disabled = !unlocked;

    const symbol = document.createElement("span");
    symbol.className = "play-symbol";
    const label = document.createElement("span");
    label.textContent = unlocked
      ? profile.completedLevels.includes(metadata.id)
        ? "Replay"
        : "Play"
      : "Locked";
    playButton.append(symbol, label);
    playButtons.push(playButton);

    article.append(preview, info, playButton);
    track.appendChild(article);

    const dotButton = document.createElement("button");
    dotButton.className = "level-dot";
    dotButton.type = "button";
    dotButton.dataset.action = "jump";
    dotButton.dataset.index = String(index);
    dotButton.setAttribute("aria-label", `View ${metadata.name}`);
    dotButtons.push(dotButton);
    dotNav.appendChild(dotButton);
  }

  root.replaceChildren(main);

  const firstPlayableIndex = officialLevelCatalog.findIndex((metadata) =>
    isLevelUnlocked(metadata, profile),
  );
  let activeIndex = firstPlayableIndex >= 0 ? firstPlayableIndex : 0;

  const updateCarousel = (): void => {
    track.style.transform = `translate3d(-${activeIndex * 100}%, 0, 0)`;
    dotButtons.forEach((dot, index) => {
      dot.classList.toggle("active", index === activeIndex);
    });
  };

  const selectIndex = (nextIndex: number): void => {
    const total = officialLevelCatalog.length;
    activeIndex = (nextIndex + total) % total;
    updateCarousel();
  };

  const playActive = (): void => {
    const current = officialLevelCatalog[activeIndex];
    if (!current || !isLevelUnlocked(current, profile)) {
      return;
    }
    actions.onPlay(current.id);
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.repeat) return;
    if (event.code === "ArrowRight" || event.code === "KeyD") {
      event.preventDefault();
      selectIndex(activeIndex + 1);
      return;
    }
    if (event.code === "ArrowLeft" || event.code === "KeyA") {
      event.preventDefault();
      selectIndex(activeIndex - 1);
      return;
    }
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      playActive();
      return;
    }
    if (event.code === "KeyL") {
      event.preventDefault();
      actions.onOpenLobby();
    }
  };

  const playHandlers = playButtons.map((button) => {
    const handler = (): void => actions.onPlay(button.dataset.levelId ?? "level_1");
    button.addEventListener("click", handler);
    return { button, handler };
  });
  const dotHandlers = dotButtons.map((button) => {
    const handler = (): void => {
      selectIndex(Number(button.dataset.index ?? "0"));
    };
    button.addEventListener("click", handler);
    return { button, handler };
  });

  lobbyButton.addEventListener("click", actions.onOpenLobby);
  window.addEventListener("keydown", handleKeyDown);
  updateCarousel();

  return () => {
    lobbyButton.removeEventListener("click", actions.onOpenLobby);
    window.removeEventListener("keydown", handleKeyDown);
    for (const { button, handler } of playHandlers) {
      button.removeEventListener("click", handler);
    }
    for (const { button, handler } of dotHandlers) {
      button.removeEventListener("click", handler);
    }
    root.replaceChildren();
  };
}
