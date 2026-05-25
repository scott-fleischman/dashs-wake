import type {
  GeneratedLevelRecord,
  PlayerProfile,
} from "../core/profile";
import { buildRoomRow, buildRoomShell, safeTestId } from "./room-shell";

interface GeneratedLevelsRoomActions {
  onGenerate: () => void;
  onImportAudio: (file: File) => void;
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

function buildAudioUploadInput(
  onImportAudio: (file: File) => void,
): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "file";
  input.className = "audio-upload";
  input.accept = "audio/*";
  input.setAttribute("data-testid", "upload-audio");
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (file) {
      onImportAudio(file);
      input.value = "";
    }
  });
  return input;
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
    header?.appendChild(buildAudioUploadInput(actions.onImportAudio));

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
      const isAudio = record.audioFileName !== undefined;
      const displayName = isAudio
        ? `${record.audioFileName} (Audio)`
        : record.name;
      list.appendChild(
        buildRoomRow({
          actionDisabled: false,
          actionLabel: "Play",
          actionTestId: `${testId}-play`,
          detail: isAudio ? "Synchronized" : `Seed ${record.seed}`,
          name: displayName,
          nameTestId: isAudio ? `${testId}-name` : undefined,
          onAction: () => actions.onPlay(record.id),
          statusLabel: isAudio ? "Imported" : "Generated",
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

export function buildAudioDerivedLevel(
  index: number,
  fileName: string,
  audioBlobKey?: string,
): GeneratedLevelRecord {
  const seed = 2000 + index;
  return {
    ...(audioBlobKey ? { audioBlobKey } : {}),
    audioFileName: fileName,
    beatIntensities: ["quiet", "quiet", "quiet"],
    beatMap: { beats: [0, 600, 1200], durationMs: 1800 },
    difficulty: "easy",
    id: `audio-derived-level-${index}`,
    name: fileName,
    seed,
  };
}
