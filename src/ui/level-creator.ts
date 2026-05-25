import type { AnalyzedAudio } from "../core/audio-decoder";
import type {
  AuthoredLevelLayout,
  GeneratedLevelRecord,
} from "../core/profile";
import type { LevelEntity } from "../core/run-simulation";
import { firstWakeLevel, type LevelContent } from "../content/first-wake";

type CreatorTool =
  | "cube-portal"
  | "erase"
  | "finish"
  | "orb"
  | "pad"
  | "ship-portal"
  | "spike";

export interface CreatorSubmission {
  audioFile: File;
  layout: AuthoredLevelLayout;
  name: string;
}

interface LevelCreatorActions {
  onReturn: () => void;
  onSave: (submission: CreatorSubmission) => void;
}

const WORLD_SCALE = 0.22;
const MIN_FINISH_X = 760;
const DEFAULT_FINISH_X = 2900;
const CANVAS_HEIGHT = 290;

interface ToolConfig {
  icon: string;
  id: CreatorTool;
  label: string;
}

const TOOL_CONFIGS: readonly ToolConfig[] = [
  { id: "spike", label: "Spike", icon: "creator-icon-spike" },
  { id: "pad", label: "Launch Pad", icon: "creator-icon-pad" },
  { id: "orb", label: "Jump Orb", icon: "creator-icon-orb" },
  { id: "ship-portal", label: "Ship Portal", icon: "creator-icon-portal" },
  { id: "cube-portal", label: "Cube Portal", icon: "creator-icon-portal cube" },
  { id: "finish", label: "Finish Point", icon: "creator-icon-finish" },
  { id: "erase", label: "Erase", icon: "creator-icon-erase" },
];

function snapX(x: number): number {
  return Math.max(60, Math.round(x / 20) * 20);
}

function entityForTool(
  tool: CreatorTool,
  id: string,
  x: number,
): LevelEntity | undefined {
  switch (tool) {
    case "spike":
      return { type: "spike", height: 30, width: 30, x, y: 270 };
    case "pad":
      return {
        type: "pad",
        id,
        impulse: 720,
        height: 18,
        width: 40,
        x,
        y: 290,
      };
    case "orb":
      return {
        type: "orb",
        id,
        effect: { kind: "impulse", magnitude: 720 },
        height: 30,
        width: 30,
        x,
        y: 205,
      };
    case "ship-portal":
      return { type: "portal", mode: "ship", height: 80, width: 12, x, y: 220 };
    case "cube-portal":
      return { type: "portal", mode: "cube", height: 80, width: 12, x, y: 220 };
    default:
      return undefined;
  }
}

function classForEntity(entity: LevelEntity): string {
  if (entity.type === "portal") {
    return `creator-entity portal ${entity.mode}`;
  }
  return `creator-entity ${entity.type}`;
}

function worldDurationLabel(finishX: number): string {
  const durationSeconds = finishX / firstWakeLevel.rules.horizontalSpeed;
  return `${durationSeconds.toFixed(1)} sec course`;
}

export function buildCreatedLevelRecord(
  index: number,
  submission: CreatorSubmission,
  audioBlobKey: string | undefined,
  analyzed: AnalyzedAudio | null,
): GeneratedLevelRecord {
  const durationMs = Math.round(
    (submission.layout.finishX / firstWakeLevel.rules.horizontalSpeed) * 1000,
  );
  const beats =
    analyzed && analyzed.beats.length > 0
      ? analyzed.beats.filter((beat) => beat <= durationMs)
      : [];

  return {
    authoredLayout: submission.layout,
    ...(audioBlobKey ? { audioBlobKey } : {}),
    audioFileName: submission.audioFile.name,
    beatIntensities:
      analyzed && beats.length > 0
        ? analyzed.beatIntensities.slice(0, beats.length)
        : [],
    beatMap: { beats, durationMs },
    difficulty: "normal",
    id: `created-level-${index}`,
    name: submission.name,
    seed: 3000 + index,
    source: "creator",
    synced: analyzed != null && analyzed.beats.length > 0,
  };
}

export function contentForCreatedLevel(
  record: GeneratedLevelRecord,
): LevelContent | undefined {
  if (!record.authoredLayout) {
    return undefined;
  }

  return {
    beatMap: record.beatMap,
    entities: record.authoredLayout.entities,
    finishX: record.authoredLayout.finishX,
    rules: firstWakeLevel.rules,
  };
}

export function mountLevelCreator(
  root: HTMLElement,
  actions: LevelCreatorActions,
): () => void {
  root.innerHTML = `
    <main class="level-creator">
      <header class="creator-header">
        <button class="utility-button" type="button" data-action="return">Back</button>
        <div>
          <p class="kicker">Level Studio</p>
          <h1>Level Creator</h1>
        </div>
        <button class="primary-button" type="button" data-action="save" disabled>Save Level</button>
      </header>
      <section class="creator-settings" aria-label="Level settings">
        <label>
          <span>Level Name</span>
          <input type="text" data-testid="creator-name" value="My Song Level" maxlength="36">
        </label>
        <label>
          <span>Song</span>
          <input class="audio-upload" data-testid="creator-audio" type="file" accept="audio/*">
        </label>
        <p class="creator-song-status" data-testid="creator-song-status">Choose a song to save this level.</p>
        <p class="creator-finish-status" data-testid="creator-finish-status"></p>
      </section>
      <section class="creator-palette" aria-label="Build pieces"></section>
      <section class="creator-workspace" aria-label="Course editor">
        <p class="creator-instruction">Select a piece, then click the course to place it. Orbs snap into the air; pads snap onto the floor.</p>
        <div class="creator-scroll">
          <div class="creator-course" data-testid="creator-course" role="application" aria-label="Editable level area"></div>
        </div>
      </section>
    </main>
  `;

  const palette = root.querySelector<HTMLElement>(".creator-palette");
  const course = root.querySelector<HTMLElement>(".creator-course");
  const saveButton = root.querySelector<HTMLButtonElement>("[data-action='save']");
  const returnButton = root.querySelector<HTMLButtonElement>("[data-action='return']");
  const songInput = root.querySelector<HTMLInputElement>("[data-testid='creator-audio']");
  const nameInput = root.querySelector<HTMLInputElement>("[data-testid='creator-name']");
  const songStatus = root.querySelector<HTMLElement>("[data-testid='creator-song-status']");
  const finishStatus = root.querySelector<HTMLElement>("[data-testid='creator-finish-status']");

  if (
    !palette ||
    !course ||
    !saveButton ||
    !returnButton ||
    !songInput ||
    !nameInput ||
    !songStatus ||
    !finishStatus
  ) {
    throw new Error("Level creator did not mount correctly.");
  }

  let selectedTool: CreatorTool = "spike";
  let entities: LevelEntity[] = [];
  let finishX = DEFAULT_FINISH_X;
  let audioFile: File | undefined;
  let audioObjectUrl: string | undefined;
  let nextEntityId = 1;

  for (const config of TOOL_CONFIGS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `creator-tool${config.id === selectedTool ? " selected" : ""}`;
    button.dataset.tool = config.id;
    button.setAttribute("data-testid", `creator-tool-${config.id}`);
    button.innerHTML = `<span class="${config.icon}" aria-hidden="true"></span><small>${config.label}</small>`;
    button.addEventListener("click", () => {
      selectedTool = config.id;
      for (const toolButton of palette.querySelectorAll<HTMLElement>(".creator-tool")) {
        toolButton.classList.toggle(
          "selected",
          toolButton.dataset.tool === selectedTool,
        );
      }
    });
    palette.appendChild(button);
  }

  const renderCourse = (): void => {
    const displayWidth = Math.max(980, (finishX + 380) * WORLD_SCALE);
    course.style.width = `${displayWidth}px`;
    course.replaceChildren();

    for (const entity of entities) {
      if (entity.type === "gap") {
        continue;
      }
      const marker = document.createElement("span");
      marker.className = classForEntity(entity);
      marker.style.left = `${entity.x * WORLD_SCALE}px`;
      marker.style.top = `${(entity.y / firstWakeLevel.rules.groundY) * 225}px`;
      marker.style.width = `${Math.max(entity.width * WORLD_SCALE, entity.type === "portal" ? 8 : 12)}px`;
      marker.style.height = `${Math.max(entity.height * WORLD_SCALE, entity.type === "portal" ? 56 : 12)}px`;
      course.appendChild(marker);
    }

    const finish = document.createElement("span");
    finish.className = "creator-finish";
    finish.style.left = `${finishX * WORLD_SCALE}px`;
    finish.innerHTML = "<small>Finish</small>";
    course.appendChild(finish);
    finishStatus.textContent = worldDurationLabel(finishX);
  };

  const onCourseClick = (event: MouseEvent): void => {
    const bounds = course.getBoundingClientRect();
    const x = snapX((event.clientX - bounds.left) / WORLD_SCALE);

    if (selectedTool === "finish") {
      finishX = Math.max(MIN_FINISH_X, x);
      entities = entities.filter((entity) => entity.x + entity.width < finishX);
      renderCourse();
      return;
    }

    if (selectedTool === "erase") {
      const nearbyIndex = entities.findIndex(
        (entity) => Math.abs(entity.x - x) <= 45,
      );
      if (nearbyIndex >= 0) {
        entities.splice(nearbyIndex, 1);
        renderCourse();
      }
      return;
    }

    if (x >= finishX - 40) {
      return;
    }

    const entity = entityForTool(selectedTool, `created-trigger-${nextEntityId}`, x);
    if (entity) {
      nextEntityId += 1;
      entities = [...entities.filter((existing) => Math.abs(existing.x - x) > 18), entity];
      renderCourse();
    }
  };

  const onSongChange = (): void => {
    audioFile = songInput.files?.[0];
    saveButton.disabled = !audioFile;

    if (audioObjectUrl) {
      URL.revokeObjectURL(audioObjectUrl);
      audioObjectUrl = undefined;
    }
    if (!audioFile) {
      songStatus.textContent = "Choose a song to save this level.";
      return;
    }

    songStatus.textContent = `${audioFile.name} selected. Loading song length...`;
    audioObjectUrl = URL.createObjectURL(audioFile);
    const audio = new Audio(audioObjectUrl);
    audio.addEventListener("loadedmetadata", () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        songStatus.textContent = `${audioFile?.name ?? "Song"} selected. Place your finish point.`;
        return;
      }
      finishX = Math.max(
        MIN_FINISH_X,
        Math.round(audio.duration * firstWakeLevel.rules.horizontalSpeed),
      );
      songStatus.textContent = `${audioFile?.name ?? "Song"} loaded. Finish starts at the end of the song; use Finish Point to change it.`;
      renderCourse();
    });
  };

  const onSave = (): void => {
    if (!audioFile) {
      return;
    }
    actions.onSave({
      audioFile,
      layout: { entities, finishX },
      name: nameInput.value.trim() || "My Song Level",
    });
  };

  course.addEventListener("click", onCourseClick);
  songInput.addEventListener("change", onSongChange);
  saveButton.addEventListener("click", onSave);
  returnButton.addEventListener("click", actions.onReturn);
  renderCourse();

  return () => {
    if (audioObjectUrl) {
      URL.revokeObjectURL(audioObjectUrl);
    }
    course.removeEventListener("click", onCourseClick);
    songInput.removeEventListener("change", onSongChange);
    saveButton.removeEventListener("click", onSave);
    returnButton.removeEventListener("click", actions.onReturn);
    root.replaceChildren();
  };
}
