import type { AnalyzedAudio } from "../core/audio-decoder";
import type { GeneratorTuning } from "../core/generator-tuning";
import type {
  GeneratedLevelRecord,
  PlayerProfile,
} from "../core/profile";
import { hasRecording } from "../persistence/level-recordings";
import { mountGeneratorTuningPanel } from "./generator-tuning-panel";
import { buildRoomRow, buildRoomShell, safeTestId } from "./room-shell";

interface GeneratedLevelsRoomActions {
  onCreate: () => void;
  onDelete: (recordId: string) => void;
  onEdit: (recordId: string) => void;
  onGenerate: (tuning: GeneratorTuning) => void;
  onImportAudio: (file: File, tuning: GeneratorTuning) => void;
  onPlay: (recordId: string) => void;
  onReturnToLobby: () => void;
  onWatchDemo: (recordId: string) => void;
  onWatchReplay: (recordId: string) => void;
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

function buildGenerateButton(onGenerate: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "primary-button";
  button.setAttribute("data-testid", "generate-level");
  button.textContent = "Generate & Watch Demo";
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
    const tuningPanel = mountGeneratorTuningPanel();
    main.insertBefore(tuningPanel.element, main.querySelector(".room-list"));

    const headerActions = document.createElement("div");
    headerActions.className = "generated-header-actions";
    headerActions.append(
      buildGenerateButton(() => actions.onGenerate(tuningPanel.readTuning())),
      buildCreateButton(actions.onCreate),
      buildAudioUploadInput((file) =>
        actions.onImportAudio(file, tuningPanel.readTuning()),
      ),
    );
    header?.appendChild(headerActions);

    if (profile.generatedLevels.length === 0) {
      const empty = document.createElement("p");
      empty.className = "room-empty";
      empty.setAttribute("data-testid", "generated-empty");
      empty.textContent =
        "No generated levels yet. Tune the dials and generate one to watch a reference run.";
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
            : `${record.subRank ?? "bronze"} - Seed ${record.seed}`,
        name: displayName,
        nameTestId: isAudio || isCreated ? `${testId}-name` : undefined,
        onAction: () => actions.onPlay(record.id),
        statusLabel: isCreated ? "Created" : isAudio ? audioStatusLabel : "Generated",
        statusTestId: `${testId}-status`,
        statusVisible: true,
      });

      if (hasRecording(record.id, "reference")) {
        const demo = document.createElement("button");
        demo.type = "button";
        demo.className = "utility-button";
        demo.textContent = "Watch Demo";
        demo.setAttribute("data-testid", `${testId}-demo`);
        demo.addEventListener("click", () => actions.onWatchDemo(record.id));
        row.appendChild(demo);
      }

      if (hasRecording(record.id, "personal")) {
        const replay = document.createElement("button");
        replay.type = "button";
        replay.className = "utility-button";
        replay.textContent = "Your Run";
        replay.setAttribute("data-testid", `${testId}-replay`);
        replay.addEventListener("click", () => actions.onWatchReplay(record.id));
        row.appendChild(replay);
      }

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
  difficulty: GeneratedLevelRecord["difficulty"] = "normal",
  subRank: NonNullable<GeneratedLevelRecord["subRank"]> = "bronze",
  theme: NonNullable<GeneratedLevelRecord["theme"]> = "electric",
): GeneratedLevelRecord {
  const seed = 1000 + index;
  return {
    beatIntensities: ["quiet", "intense", "quiet", "intense", "quiet", "intense"],
    beatMap: { beats: [0, 600, 1200, 1800, 2400, 3000], durationMs: 3600 },
    difficulty,
    id: `generated-level-${index}`,
    name: `Generated Level ${index}`,
    seed,
    subRank,
    source: "generator",
    theme,
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
  audioBlobKey: string | undefined,
  analyzed: AnalyzedAudio | null | undefined,
  tuning: GeneratorTuning,
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
    difficulty: tuning.difficulty,
    generatorTuning: tuning,
    id: `audio-derived-level-${index}`,
    name: fileName,
    seed,
    source: "generator",
    subRank: tuning.subRank,
    synced,
    theme: tuning.theme,
  };
}
