import type { AnalyzedAudio } from "../core/audio-decoder";
import type {
  AuthoredLevelLayout,
  GeneratedLevelRecord,
} from "../core/profile";
import type { LevelEntity } from "../core/run-simulation";
import { firstWakeLevel, type LevelContent } from "../content/first-wake";
import { buildPlaceholderBeatMap } from "../content/beat-maps";
import {
  buildSupportingTerrain,
  TERRAIN_DEPTH_Y,
} from "../content/terrain";

type CreatorTool =
  | "block"
  | "cube-portal"
  | "decoration"
  | "erase"
  | "finish"
  | "orb"
  | "pad"
  | "ship-portal"
  | "spike";

export interface CreatorSubmission {
  audioFile?: File;
  audioFileName?: string;
  layout: AuthoredLevelLayout;
  name: string;
}

interface LevelCreatorActions {
  initial?: CreatorSubmission;
  onPreview: (submission: CreatorSubmission) => void;
  onReturn: () => void;
  onSave: (submission: CreatorSubmission) => void;
}

const WORLD_SCALE = 0.22;
const GRID_PX = 20;
const MIN_FINISH_X = 760;
const DEFAULT_FINISH_X = 2900;
const CANVAS_HEIGHT = 290;
const Y_SCALE = CANVAS_HEIGHT / TERRAIN_DEPTH_Y;

interface ToolConfig {
  icon: string;
  id: CreatorTool;
  label: string;
}

const TOOL_CONFIGS: readonly ToolConfig[] = [
  { id: "block", label: "Block", icon: "creator-icon-block" },
  { id: "spike", label: "Spike", icon: "creator-icon-spike" },
  { id: "pad", label: "Launch Pad", icon: "creator-icon-pad" },
  { id: "orb", label: "Jump Orb", icon: "creator-icon-orb" },
  { id: "ship-portal", label: "Ship Portal", icon: "creator-icon-portal" },
  { id: "cube-portal", label: "Cube Portal", icon: "creator-icon-portal cube" },
  { id: "decoration", label: "Decor", icon: "creator-icon-decoration" },
  { id: "finish", label: "Finish Point", icon: "creator-icon-finish" },
  { id: "erase", label: "Erase", icon: "creator-icon-erase" },
];

function snapDisplay(value: number): number {
  return Math.round(value / GRID_PX) * GRID_PX;
}

function snapX(displayX: number): number {
  return Math.max(60, Math.round(snapDisplay(displayX) / WORLD_SCALE));
}

function placementY(displayY: number, height: number): number {
  const centeredTop = (snapDisplay(displayY) / Y_SCALE) - height / 2;
  return Math.max(
    0,
    Math.min(TERRAIN_DEPTH_Y - height, Math.round(centeredTop)),
  );
}

function entityForTool(
  tool: CreatorTool,
  id: string,
  x: number,
  displayY: number,
): LevelEntity | undefined {
  switch (tool) {
    case "block":
      return {
        type: "block",
        height: 60,
        width: 60,
        x,
        y: placementY(displayY, 60),
      };
    case "spike":
      return { type: "spike", height: 30, width: 30, x, y: placementY(displayY, 30) };
    case "pad":
      return {
        type: "pad",
        id,
        impulse: 720,
        height: 18,
        width: 40,
        x,
        y: placementY(displayY, 18),
      };
    case "orb":
      return {
        type: "orb",
        id,
        effect: { kind: "impulse", magnitude: 720 },
        height: 64,
        width: 56,
        x,
        y: placementY(displayY, 64),
      };
    case "ship-portal":
      return { type: "portal", mode: "ship", height: 80, width: 12, x, y: placementY(displayY, 80) };
    case "cube-portal":
      return { type: "portal", mode: "cube", height: 80, width: 12, x, y: placementY(displayY, 80) };
    case "decoration":
      return {
        type: "decoration",
        kind: "diamond",
        height: 70,
        width: 48,
        x,
        y: placementY(displayY, 70),
      };
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
  existing?: GeneratedLevelRecord,
): GeneratedLevelRecord {
  const courseDurationMs = Math.round(
    (submission.layout.finishX / firstWakeLevel.rules.horizontalSpeed) * 1000,
  );
  const analyzedBeats =
    analyzed && analyzed.beats.length > 0
      ? analyzed.beats.filter((beat) => beat <= courseDurationMs)
      : [];
  const retainedBeats = existing?.beatMap.beats.filter(
    (beat) => beat <= courseDurationMs,
  );
  const fallbackBeatMap = buildPlaceholderBeatMap(
    submission.layout.finishX,
    firstWakeLevel.rules.horizontalSpeed,
  );
  const beats =
    analyzedBeats.length > 0
      ? analyzedBeats
      : retainedBeats && retainedBeats.length > 0
        ? retainedBeats
        : fallbackBeatMap.beats;
  const audioFileName =
    submission.audioFile?.name ?? submission.audioFileName ?? existing?.audioFileName;
  const durationMs = audioFileName ? courseDurationMs : fallbackBeatMap.durationMs;

  return {
    authoredLayout: submission.layout,
    ...(audioBlobKey ?? existing?.audioBlobKey
      ? { audioBlobKey: audioBlobKey ?? existing?.audioBlobKey }
      : {}),
    ...(audioFileName ? { audioFileName } : {}),
    beatIntensities:
      analyzedBeats.length > 0 && analyzed
        ? analyzed.beatIntensities.slice(0, analyzedBeats.length)
        : existing?.beatIntensities.slice(0, beats.length) ??
          beats.map(() => "quiet" as const),
    beatMap: { beats, durationMs },
    difficulty: "normal",
    id: existing?.id ?? `created-level-${index}`,
    name: submission.name,
    seed: existing?.seed ?? 3000 + index,
    source: "creator",
    synced: analyzedBeats.length > 0 ? true : existing?.synced ?? false,
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
        <div class="creator-actions">
          <button class="utility-button" type="button" data-action="preview">Playtest</button>
          <button class="primary-button" type="button" data-action="save">Save Level</button>
        </div>
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
        <p class="creator-song-status" data-testid="creator-song-status"></p>
        <p class="creator-finish-status" data-testid="creator-finish-status"></p>
      </section>
      <section class="creator-palette" aria-label="Build pieces"></section>
      <section class="creator-workspace" aria-label="Course editor">
        <p class="creator-instruction">The starter path is made of solid blocks. Place or erase blocks to build ledges, drops, ceilings, and flight corridors; decorations do not collide.</p>
        <div class="creator-scroll">
          <div class="creator-course" data-testid="creator-course" role="application" aria-label="Editable level area"></div>
        </div>
      </section>
    </main>
  `;

  const palette = root.querySelector<HTMLElement>(".creator-palette");
  const course = root.querySelector<HTMLElement>(".creator-course");
  const saveButton = root.querySelector<HTMLButtonElement>("[data-action='save']");
  const previewButton = root.querySelector<HTMLButtonElement>("[data-action='preview']");
  const returnButton = root.querySelector<HTMLButtonElement>("[data-action='return']");
  const songInput = root.querySelector<HTMLInputElement>("[data-testid='creator-audio']");
  const nameInput = root.querySelector<HTMLInputElement>("[data-testid='creator-name']");
  const songStatus = root.querySelector<HTMLElement>("[data-testid='creator-song-status']");
  const finishStatus = root.querySelector<HTMLElement>("[data-testid='creator-finish-status']");

  if (
    !palette ||
    !course ||
    !saveButton ||
    !previewButton ||
    !returnButton ||
    !songInput ||
    !nameInput ||
    !songStatus ||
    !finishStatus
  ) {
    throw new Error("Level creator did not mount correctly.");
  }

  let selectedTool: CreatorTool = "spike";
  let finishX = actions.initial?.layout.finishX ?? DEFAULT_FINISH_X;
  let entities: LevelEntity[] = [
    ...(actions.initial?.layout.entities ?? buildSupportingTerrain(finishX)),
  ];
  let audioFile: File | undefined = actions.initial?.audioFile;
  let audioObjectUrl: string | undefined;
  let nextEntityId = entities.reduce((next, entity) => {
    if (!("id" in entity)) {
      return next;
    }
    const suffix = Number(entity.id.match(/\d+$/)?.[0] ?? 0);
    return Math.max(next, suffix + 1);
  }, 1);

  nameInput.value = actions.initial?.name ?? "My Song Level";
  songStatus.textContent = actions.initial?.audioFileName
    ? `${actions.initial.audioFileName} loaded from saved level.`
    : "Optional: choose a song, or build with a metronome beat map.";

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
      const marker = document.createElement("span");
      marker.className = classForEntity(entity);
      marker.style.left = `${entity.x * WORLD_SCALE}px`;
      marker.style.top = `${entity.y * Y_SCALE}px`;
      marker.style.width = `${Math.max(entity.width * WORLD_SCALE, entity.type === "portal" ? 8 : 12)}px`;
      marker.style.height = `${Math.max(entity.height * Y_SCALE, entity.type === "portal" ? 56 : 12)}px`;
      course.appendChild(marker);
    }

    const finish = document.createElement("span");
    finish.className = "creator-finish";
    finish.style.left = `${finishX * WORLD_SCALE}px`;
    finish.style.top = `${firstWakeLevel.rules.spawnY * Y_SCALE - 102}px`;
    finish.innerHTML = "<small>Finish</small>";
    course.appendChild(finish);
    finishStatus.textContent = worldDurationLabel(finishX);
  };

  const onCourseClick = (event: MouseEvent): void => {
    const bounds = course.getBoundingClientRect();
    const displayX = event.clientX - bounds.left;
    const displayY = Math.max(0, Math.min(CANVAS_HEIGHT, event.clientY - bounds.top));
    const x = snapX(displayX);

    if (selectedTool === "finish") {
      finishX = Math.max(MIN_FINISH_X, x);
      entities = entities.filter((entity) => entity.x + entity.width < finishX);
      renderCourse();
      return;
    }

    if (selectedTool === "erase") {
      const nearbyIndex = entities.findIndex(
        (entity) =>
          Math.abs(entity.x - x) <= 90 &&
          Math.abs(entity.y * Y_SCALE - displayY) <= GRID_PX * 1.5,
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

    const entity = entityForTool(
      selectedTool,
      `created-trigger-${nextEntityId}`,
      x,
      displayY,
    );
    if (entity) {
      nextEntityId += 1;
      entities = [
        ...entities.filter(
          (existing) =>
            existing.type !== entity.type ||
            Math.abs(existing.x - x) > 45 ||
            Math.abs(existing.y - entity.y) > 35,
        ),
        entity,
      ];
      renderCourse();
    }
  };

  const onSongChange = (): void => {
    audioFile = songInput.files?.[0];
    if (audioObjectUrl) {
      URL.revokeObjectURL(audioObjectUrl);
      audioObjectUrl = undefined;
    }
    if (!audioFile) {
      songStatus.textContent = "Optional: choose a song, or build with a metronome beat map.";
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
    actions.onSave({
      audioFile,
      audioFileName: actions.initial?.audioFileName,
      layout: { entities, finishX },
      name: nameInput.value.trim() || "My Song Level",
    });
  };

  const onPreview = (): void => {
    actions.onPreview({
      audioFile,
      audioFileName: actions.initial?.audioFileName,
      layout: { entities, finishX },
      name: nameInput.value.trim() || "My Song Level",
    });
  };

  course.addEventListener("click", onCourseClick);
  songInput.addEventListener("change", onSongChange);
  saveButton.addEventListener("click", onSave);
  previewButton.addEventListener("click", onPreview);
  returnButton.addEventListener("click", actions.onReturn);
  renderCourse();

  return () => {
    if (audioObjectUrl) {
      URL.revokeObjectURL(audioObjectUrl);
    }
    course.removeEventListener("click", onCourseClick);
    songInput.removeEventListener("change", onSongChange);
    saveButton.removeEventListener("click", onSave);
    previewButton.removeEventListener("click", onPreview);
    returnButton.removeEventListener("click", actions.onReturn);
    root.replaceChildren();
  };
}
