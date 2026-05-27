import type { PlayerProfile } from "../core/profile";
import { renderLevelList, renderProfileStats } from "./lobby";

interface OfficialLevelsRoomActions {
  onPlay: (levelId: string) => void;
  onReturnToLobby: () => void;
}

export function mountOfficialLevelsRoom(
  root: HTMLElement,
  profile: PlayerProfile,
  actions: OfficialLevelsRoomActions,
): () => void {
  root.innerHTML = `
    <main class="room levels-room" aria-label="Official Levels">
      <header>
        <h1>Official Levels</h1>
        <button class="utility-button" type="button" data-testid="room-back">Back to Lobby</button>
      </header>
      ${renderProfileStats(profile)}
      ${renderLevelList(profile)}
    </main>
  `;

  const backButton = root.querySelector<HTMLButtonElement>("[data-testid='room-back']");
  const playButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-action='play']"),
  );
  if (!backButton || playButtons.length === 0) {
    throw new Error("Official levels room did not mount correctly.");
  }

  backButton.addEventListener("click", actions.onReturnToLobby);
  const handlers = playButtons.map((button) => {
    const handler = (): void => actions.onPlay(button.dataset.levelId ?? "level_1");
    button.addEventListener("click", handler);
    return { button, handler };
  });

  return () => {
    backButton.removeEventListener("click", actions.onReturnToLobby);
    for (const { button, handler } of handlers) {
      button.removeEventListener("click", handler);
    }
    root.replaceChildren();
  };
}
