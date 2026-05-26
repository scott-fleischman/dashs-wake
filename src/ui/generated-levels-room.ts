import type { AnalyzedAudio } from "../core/audio-decoder";
import type {
  GeneratedLevelRecord,
  PlayerProfile,
} from "../core/profile";
import type { OfficialLevelDifficulty } from "../content/official-levels";
import { buildRoomRow, buildRoomShell, safeTestId } from "./room-shell";

interface GeneratedLevelsRoomActions {
  onCreate: () => void;
  onDelete: (recordId: string) => void;
  onEdit: (recordId: string) => void;
  onGenerate: (difficulty: OfficialLevelDifficulty) => void;
  onImportAudio: (file: File, difficulty: OfficialLevelDifficulty) => void;
  onPlay: (recordId: string) => void;
  onReturnToLobby: () => void;
}

function buildCreateButton(onCreate: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "primary-button";
  button.setAttribute("data-testid", "create-level");
  button.textContent = "Level Creator";
  button.addEventListener("click", onCreate);
  return button;
}

function buildGenerateButton(
  difficulty: () => OfficialLevelDifficulty,
  onGenerate: (difficulty: OfficialLevelDifficulty) => void,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "primary-button";
  button.setAttribute("data-testid", "generate-level");
  button.textContent = "Generate Level";
  button.addEventListener("click", () => onGenerate(difficulty()));
  return button;
}

function buildAudioUploadInput(
  difficulty: () => OfficialLevelDifficulty,
  onImportAudio: (file: File, difficulty: OfficialLevelDifficulty) => void,
): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "file";
  input.className = "audio-upload";
  input.accept = "audio/*";
  input.setAttribute("data-testid", "upload-audio");
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (file) {
      onImportAudio(file, difficulty());
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
    const difficulty = document.createElement("select");
    difficulty.className = "difficulty-select";
    difficulty.setAttribute("data-testid", "generated-difficulty");
    for (const value of ["normal", "hard", "insane"] as const) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = `${value[0]!.toUpperCase()}${value.slice(1)} Blocks`;
      difficulty.appendChild(option);
    }
    const getDifficulty = (): OfficialLevelDifficulty =>
      difficulty.value as OfficialLevelDifficulty;
    header?.appendChild(difficulty);
    header?.appendChild(buildGenerateButton(getDifficulty, actions.onGenerate));
    header?.appendChild(buildCreateButton(actions.onCreate));
    header?.appendChild(buildAudioUploadInput(getDifficulty, actions.onImportAudio));

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
      const isCreated = record.source === "creator";
      const isAudio = record.audioFileName !== undefined;
      const isSynced = isAudio && record.synced !== false;
      const displayName = isCreated
        ? record.name
        : isAudio
        ? `${record.audioFileName} (Audio)`
        : record.name;
      const audioStatusLabel = isSynced ? "Synced" : "Not synced";
      const row = buildRoomRow({
          actionDisabled: false,
          actionLabel: "Play",
          actionTestId: `${testId}-play`,
          detail: isCreated
            ? record.audioFileName ?? "Authored course"
            : isAudio
            ? isSynced
              ? "Synchronized"
              : "Placeholder beats"
            : `Seed ${record.seed}`,
          name: displayName,
          nameTestId: isAudio || isCreated ? `${testId}-name` : undefined,
          onAction: () => actions.onPlay(record.id),
          statusLabel: isCreated ? "Created" : isAudio ? audioStatusLabel : "Generated",
          statusTestId: `${testId}-status`,
          statusVisible: true,
        });
      if (isCreated) {
        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "utility-button";
        edit.textContent = "Edit";
        edit.setAttribute("data-testid", `${testId}-edit`);
        edit.addEventListener("click", () => actions.onEdit(record.id));
        row.appendChild(edit);
      }
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "utility-button danger";
      remove.textContent = "Delete";
      remove.setAttribute("data-testid", `${testId}-delete`);
      remove.addEventListener("click", () => actions.onDelete(record.id));
      row.appendChild(remove);
      list.appendChild(row);
    }
  }

  render();

  return () => {
    root.replaceChildren();
  };
}

export function buildPlaceholderGeneratedLevel(
  index: number,
  difficulty: OfficialLevelDifficulty = "normal",
): GeneratedLevelRecord {
  const seed = 1000 + index;
  return {
    beatIntensities: ["intense", "intense", "intense", "intense", "intense", "intense"],
    beatMap: { beats: [0, 600, 1200, 1800, 2400, 3000], durationMs: 3600 },
    difficulty,
    id: `generated-level-${index}`,
    name: `Generated Level ${index}`,
    seed,
    source: "generator",
  };
}

const PLACEHOLDER_BEATS: readonly number[] = [0, 600, 1200];
const PLACEHOLDER_DURATION_MS = 1800;
const PLACEHOLDER_INTENSITIES: readonly ("intense" | "quiet")[] = [
  "quiet",
  "quiet",
  "quiet",
];

export function buildAudioDerivedLevel(
  index: number,
  fileName: string,
  audioBlobKey?: string,
  analyzed?: AnalyzedAudio | null,
  difficulty: OfficialLevelDifficulty = "normal",
): GeneratedLevelRecord {
  const seed = 2000 + index;
  const synced = analyzed != null && analyzed.beats.length > 0;
  const beats = synced ? analyzed!.beats : PLACEHOLDER_BEATS;
  const durationMs = synced ? analyzed!.durationMs : PLACEHOLDER_DURATION_MS;
  const beatIntensities = synced
    ? analyzed!.beatIntensities
    : PLACEHOLDER_INTENSITIES;
  return {
    ...(audioBlobKey ? { audioBlobKey } : {}),
    audioFileName: fileName,
    beatIntensities,
    beatMap: { beats, durationMs },
    difficulty,
    id: `audio-derived-level-${index}`,
    name: fileName,
    seed,
    source: "generator",
    synced,
  };
}
