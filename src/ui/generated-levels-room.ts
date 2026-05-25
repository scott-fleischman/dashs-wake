import type {
  GeneratedLevelRecord,
  PlayerProfile,
} from "../core/profile";
import { buildRoomRow, buildRoomShell, safeTestId } from "./room-shell";

interface GeneratedLevelsRoomActions {
  onGenerate: () => void;
  onPlay: (recordId: string) => void;
  onReturnToLobby: () => void;
}

function buildGenerateButton(onGenerate: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "primary-button";
  button.setAttribute("data-testid", "generate-level");
  button.textContent = "Generate Level";
  button.addEventListener("click", onGenerate);
  return button;
}

export function mountGeneratedLevelsRoom(
  root: HTMLElement,
  profileRef: { current: PlayerProfile },
  actions: GeneratedLevelsRoomActions,
): () => void {
  function render(): void {
    const profile = profileRef.current;

    root.replaceChildren();

    const { list, main } = buildRoomShell(
      "Generated Levels",
      actions.onReturnToLobby,
    );
    root.appendChild(main);

    const header = main.querySelector("header");
    header?.appendChild(buildGenerateButton(actions.onGenerate));

    if (profile.generatedLevels.length === 0) {
      const empty = document.createElement("p");
      empty.className = "room-empty";
      empty.setAttribute("data-testid", "generated-empty");
      empty.textContent = "No generated levels yet. Generate one to get started.";
      main.appendChild(empty);
      return;
    }

    for (const record of profile.generatedLevels) {
      const testId = safeTestId(record.id);
      list.appendChild(
        buildRoomRow({
          actionDisabled: false,
          actionLabel: "Play",
          actionTestId: `${testId}-play`,
          detail: `Seed ${record.seed}`,
          name: record.name,
          onAction: () => actions.onPlay(record.id),
          statusLabel: "Generated",
          statusTestId: `${testId}-status`,
          statusVisible: true,
        }),
      );
    }
  }

  render();

  return () => {
    root.replaceChildren();
  };
}

export function buildPlaceholderGeneratedLevel(
  index: number,
): GeneratedLevelRecord {
  const seed = 1000 + index;
  return {
    beatIntensities: ["quiet", "quiet", "quiet"],
    beatMap: { beats: [0, 600, 1200], durationMs: 1800 },
    difficulty: "easy",
    id: `generated-level-${index}`,
    name: `Generated Level ${index}`,
    seed,
  };
}
