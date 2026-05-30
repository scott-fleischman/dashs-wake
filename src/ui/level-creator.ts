import type { AnalyzedAudio } from "../core/audio-decoder";
import type {
  AuthoredLevelLayout,
  GeneratedLevelRecord,
} from "../core/profile";
import type {
  BlockEntity,
  BlockShape,
  LevelEntity,
} from "../core/run-simulation";
import { firstWakeLevel, type LevelContent } from "../content/first-wake";
import {
  ATOMIC_PATTERN_IDS,
  ATOMIC_PATTERN_LABELS,
  stampAtomicPattern,
  type AtomicPatternId,
} from "../content/atomic-patterns";
import { buildPlaceholderBeatMap } from "../content/beat-maps";
import { CUBE, cubes, snapCube } from "../content/jump-grid";
import { PLATFORM_THICKNESS } from "../content/official-handcrafted-helpers";
import { buildSupportingTerrain, TERRAIN_DEPTH_Y } from "../content/terrain";

type CreatorTool =
  | "block"
  | "block-ramp-down"
  | "block-ramp-up"
  | "cube-portal"
  | "dark-zone"
  | "decoration"
  | "erase"
  | "flash-zone"
  | "finish"
  | "fog-zone"
  | "orb"
  | "pad"
  | "pattern-fake-pad"
  | "pattern-floor-run"
  | "pattern-jump-orb"
  | "pattern-orb-stack"
  | "pattern-pad-boost"
  | "pattern-pad-chain"
  | "pattern-spike-strip"
  | "pattern-stair-gap"
  | "pattern-stair-spike-edge"
  | "pattern-stair-step"
  | "ship-portal"
  | "spike";
type CreatorMode = "build" | "edit";

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

const GRID_SIZE = CUBE;
const MIN_FINISH_X = 760;
const DEFAULT_FINISH_X = 2900;
const ZOOM_CHOICES = [0.35, 0.5, 0.7, 1] as const;

interface ToolConfig {
  icon: string;
  id: CreatorTool;
  label: string;
}

const TOOL_CONFIGS: readonly ToolConfig[] = [
  { id: "block", label: "Block", icon: "creator-icon-block" },
  { id: "block-ramp-up", label: "Ramp Up", icon: "creator-icon-ramp-up" },
  { id: "block-ramp-down", label: "Ramp Down", icon: "creator-icon-ramp-down" },
  { id: "spike", label: "Spike", icon: "creator-icon-spike" },
  { id: "pad", label: "Launch Pad", icon: "creator-icon-pad" },
  { id: "orb", label: "Jump Orb", icon: "creator-icon-orb" },
  { id: "ship-portal", label: "Ship Portal", icon: "creator-icon-portal" },
  { id: "cube-portal", label: "Cube Portal", icon: "creator-icon-portal cube" },
  { id: "decoration", label: "Decor", icon: "creator-icon-decoration" },
  { id: "flash-zone", label: "Flash", icon: "creator-icon-flash" },
  { id: "fog-zone", label: "Fog", icon: "creator-icon-fog" },
  { id: "dark-zone", label: "Dark", icon: "creator-icon-dark" },
  { id: "finish", label: "Finish Point", icon: "creator-icon-finish" },
  { id: "erase", label: "Erase", icon: "creator-icon-erase" },
];

const PATTERN_TOOL_IDS = ATOMIC_PATTERN_IDS.filter(
  (id) => id !== "fog" && id !== "flash",
);

const PATTERN_TOOL_CONFIGS: readonly ToolConfig[] = PATTERN_TOOL_IDS.map((id) => ({
  id: `pattern-${id}` as CreatorTool,
  label: ATOMIC_PATTERN_LABELS[id],
  icon: "creator-icon-block",
}));

function snapWorld(value: number): number {
  return snapCube(value);
}

function placementTop(worldY: number, height: number): number {
  return Math.max(0, Math.min(TERRAIN_DEPTH_Y - height, snapWorld(worldY)));
}

/**
 * Dimensions for each placeable tool. Placement treats the pointer as the
 * CENTER of the piece (snapped to the grid), which makes positioning ramps and
 * wide pieces predictable instead of anchoring to a hard-to-see corner.
 */
const TOOL_DIMENSIONS: Partial<Record<CreatorTool, { width: number; height: number }>> = {
  block: { width: cubes(2), height: PLATFORM_THICKNESS },
  "block-ramp-up": { width: cubes(4), height: cubes(3) },
  "block-ramp-down": { width: cubes(4), height: cubes(3) },
  spike: { width: cubes(2), height: cubes(2) },
  pad: { width: cubes(3), height: CUBE },
  orb: { width: cubes(3), height: cubes(3) },
  "ship-portal": { width: CUBE, height: cubes(5) },
  "cube-portal": { width: CUBE, height: cubes(5) },
  decoration: { width: cubes(3), height: cubes(3) },
  "flash-zone": { width: cubes(7), height: cubes(4) },
  "fog-zone": { width: cubes(9), height: cubes(4) },
  "dark-zone": { width: cubes(9), height: cubes(6) },
};

function entityForTool(
  tool: CreatorTool,
  id: string,
  centerX: number,
  centerY: number,
): LevelEntity | undefined {
  const dims = TOOL_DIMENSIONS[tool];
  if (!dims) {
    return undefined;
  }
  const { width, height } = dims;
  const x = Math.max(0, snapWorld(centerX - width / 2));
  const y = placementTop(centerY - height / 2, height);

  switch (tool) {
    case "block":
      return { type: "block", shape: "rectangle", width, height, x, y };
    case "block-ramp-up":
      return { type: "block", shape: "ramp-up", width, height, x, y };
    case "block-ramp-down":
      return { type: "block", shape: "ramp-down", width, height, x, y };
    case "spike":
      return { type: "spike", width, height, x, y };
    case "pad":
      return { type: "pad", id, impulse: 720, width, height, x, y };
    case "orb":
      return {
        type: "orb",
        id,
        effect: { kind: "impulse", magnitude: 720 },
        width,
        height,
        x,
        y,
      };
    case "ship-portal":
      return { type: "portal", mode: "ship", width, height, x, y };
    case "cube-portal":
      return { type: "portal", mode: "cube", width, height, x, y };
    case "decoration":
      return { type: "decoration", kind: "diamond", width, height, x, y };
    case "flash-zone":
      return { type: "decoration", kind: "flash", width, height, x, y };
    case "fog-zone":
      return { type: "decoration", kind: "fog", width, height, x, y };
    case "dark-zone":
      return { type: "decoration", kind: "dark", width, height, x, y };
    default:
      return undefined;
  }
}

function classForEntity(entity: LevelEntity): string {
  if (entity.type === "portal") {
    return `creator-entity portal ${entity.mode}`;
  }
  if (entity.type === "block" && entity.shape && entity.shape !== "rectangle") {
    return `creator-entity block shape-${entity.shape}`;
  }
  if (entity.type === "decoration") {
    return `creator-entity decoration kind-${entity.kind}`;
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
      <section class="creator-toolbar" aria-label="Editing controls">
        <div class="creator-modes">
          <button class="utility-button selected" type="button" data-testid="creator-mode-build">Build</button>
          <button class="utility-button" type="button" data-testid="creator-mode-edit">Edit</button>
        </div>
        <label class="creator-paint-toggle"><input type="checkbox" data-testid="creator-paint"> Swipe paint (all pieces)</label>
        <div class="creator-zoom" aria-label="Zoom">
          <button class="utility-button" type="button" data-testid="creator-zoom-out">-</button>
          <span data-testid="creator-zoom-label">50%</span>
          <button class="utility-button" type="button" data-testid="creator-zoom-in">+</button>
        </div>
      </section>
      <section class="creator-palette" aria-label="Build pieces"></section>
      <section class="creator-pattern-palette" aria-label="Pattern stamps"></section>
      <section class="creator-edit-panel" aria-label="Selected shape" hidden>
        <p data-testid="creator-selection-status">Select a shape on the grid.</p>
        <label>X <input type="number" step="${GRID_SIZE}" data-testid="creator-edit-x"></label>
        <label>Y <input type="number" step="${GRID_SIZE}" data-testid="creator-edit-y"></label>
        <label>Width <input type="number" min="${GRID_SIZE}" step="${GRID_SIZE}" data-testid="creator-edit-width"></label>
        <label>Height <input type="number" min="${GRID_SIZE}" step="${GRID_SIZE}" data-testid="creator-edit-height"></label>
        <label>Block Shape
          <select data-testid="creator-edit-shape">
            <option value="rectangle">Rectangle</option>
            <option value="ramp-up">Ramp Up</option>
            <option value="ramp-down">Ramp Down</option>
          </select>
        </label>
        <button class="primary-button" type="button" data-testid="creator-edit-apply">Apply</button>
        <button class="utility-button danger" type="button" data-testid="creator-edit-delete">Delete</button>
      </section>
      <section class="creator-workspace" aria-label="Course editor">
        <p class="creator-instruction">Every cell is placeable. Build mode paints obstacles; Edit mode selects, sizes, moves, and turns blocks into ramps.</p>
        <div class="creator-scroll">
          <div class="creator-course" data-testid="creator-course" role="application" aria-label="Editable level area"></div>
        </div>
      </section>
    </main>
  `;

  const requireElement = <T extends HTMLElement>(selector: string): T => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error("Level creator did not mount correctly.");
    return element;
  };

  const palette = requireElement<HTMLElement>(".creator-palette");
  const patternPalette = requireElement<HTMLElement>(".creator-pattern-palette");
  const editPanel = requireElement<HTMLElement>(".creator-edit-panel");
  const course = requireElement<HTMLElement>(".creator-course");
  const saveButton = requireElement<HTMLButtonElement>("[data-action='save']");
  const previewButton = requireElement<HTMLButtonElement>("[data-action='preview']");
  const returnButton = requireElement<HTMLButtonElement>("[data-action='return']");
  const songInput = requireElement<HTMLInputElement>("[data-testid='creator-audio']");
  const nameInput = requireElement<HTMLInputElement>("[data-testid='creator-name']");
  const songStatus = requireElement<HTMLElement>("[data-testid='creator-song-status']");
  const finishStatus = requireElement<HTMLElement>("[data-testid='creator-finish-status']");
  const buildButton = requireElement<HTMLButtonElement>("[data-testid='creator-mode-build']");
  const editButton = requireElement<HTMLButtonElement>("[data-testid='creator-mode-edit']");
  const paintToggle = requireElement<HTMLInputElement>("[data-testid='creator-paint']");
  const zoomOut = requireElement<HTMLButtonElement>("[data-testid='creator-zoom-out']");
  const zoomIn = requireElement<HTMLButtonElement>("[data-testid='creator-zoom-in']");
  const zoomLabel = requireElement<HTMLElement>("[data-testid='creator-zoom-label']");
  const selectionStatus = requireElement<HTMLElement>("[data-testid='creator-selection-status']");
  const editX = requireElement<HTMLInputElement>("[data-testid='creator-edit-x']");
  const editY = requireElement<HTMLInputElement>("[data-testid='creator-edit-y']");
  const editWidth = requireElement<HTMLInputElement>("[data-testid='creator-edit-width']");
  const editHeight = requireElement<HTMLInputElement>("[data-testid='creator-edit-height']");
  const editShape = requireElement<HTMLSelectElement>("[data-testid='creator-edit-shape']");
  const editApply = requireElement<HTMLButtonElement>("[data-testid='creator-edit-apply']");
  const editDelete = requireElement<HTMLButtonElement>("[data-testid='creator-edit-delete']");

  let mode: CreatorMode = "build";
  let selectedTool: CreatorTool = "spike";
  let selectedIndex: number | undefined;
  let zoomIndex = 1;
  let finishX = actions.initial?.layout.finishX ?? DEFAULT_FINISH_X;
  let entities: LevelEntity[] = [
    ...(actions.initial?.layout.entities ?? buildSupportingTerrain(finishX)),
  ];
  let audioFile: File | undefined = actions.initial?.audioFile;
  let audioObjectUrl: string | undefined;
  let painting = false;
  let nextEntityId = entities.reduce((next, entity) => {
    if (!("id" in entity)) return next;
    const suffix = Number(entity.id.match(/\d+$/)?.[0] ?? 0);
    return Math.max(next, suffix + 1);
  }, 1);

  const zoom = (): number => ZOOM_CHOICES[zoomIndex];

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
      for (const toolButton of root.querySelectorAll<HTMLElement>(".creator-tool")) {
        toolButton.classList.toggle("selected", toolButton.dataset.tool === selectedTool);
      }
    });
    palette.appendChild(button);
  }

  for (const config of PATTERN_TOOL_CONFIGS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `creator-tool creator-pattern-tool${config.id === selectedTool ? " selected" : ""}`;
    button.dataset.tool = config.id;
    button.setAttribute("data-testid", `creator-tool-${config.id}`);
    button.innerHTML = `<span class="${config.icon}" aria-hidden="true"></span><small>${config.label}</small>`;
    button.addEventListener("click", () => {
      selectedTool = config.id;
      for (const toolButton of root.querySelectorAll<HTMLElement>(".creator-tool")) {
        toolButton.classList.toggle("selected", toolButton.dataset.tool === selectedTool);
      }
    });
    patternPalette.appendChild(button);
  }

  const renderSelection = (): void => {
    const entity = selectedIndex === undefined ? undefined : entities[selectedIndex];
    selectionStatus.textContent = entity
      ? `Editing ${entity.type} at ${entity.x}, ${entity.y}`
      : "Select a shape on the grid.";
    for (const input of [editX, editY, editWidth, editHeight, editShape, editApply, editDelete]) {
      input.toggleAttribute("disabled", !entity);
    }
    if (!entity) return;
    editX.value = String(entity.x);
    editY.value = String(entity.y);
    editWidth.value = String(entity.width);
    editHeight.value = String(entity.height);
    editShape.value =
      entity.type === "block" ? entity.shape ?? "rectangle" : "rectangle";
    editShape.disabled = entity.type !== "block";
  };

  const renderCourse = (): void => {
    const scale = zoom();
    course.classList.toggle("creator-editing", mode === "edit");
    course.style.width = `${Math.max(980, (finishX + 380) * scale)}px`;
    course.style.height = `${TERRAIN_DEPTH_Y * scale}px`;
    course.style.setProperty("--creator-grid-size", `${GRID_SIZE * scale}px`);
    zoomLabel.textContent = `${Math.round(scale * 100)}%`;
    zoomOut.disabled = zoomIndex === 0;
    zoomIn.disabled = zoomIndex === ZOOM_CHOICES.length - 1;
    course.replaceChildren();

    entities.forEach((entity, index) => {
      const marker = document.createElement("span");
      marker.className = `${classForEntity(entity)}${selectedIndex === index ? " selected" : ""}`;
      marker.dataset.entityIndex = String(index);
      marker.style.left = `${entity.x * scale}px`;
      marker.style.top = `${entity.y * scale}px`;
      marker.style.width = `${entity.width * scale}px`;
      marker.style.height = `${entity.height * scale}px`;
      course.appendChild(marker);
    });

    const finish = document.createElement("span");
    finish.className = "creator-finish";
    finish.style.left = `${finishX * scale}px`;
    finish.style.top = `${Math.max(0, (firstWakeLevel.rules.spawnY - 102) * scale)}px`;
    finish.style.height = `${102 * scale}px`;
    finish.innerHTML = "<small>Finish</small>";
    course.appendChild(finish);
    finishStatus.textContent = worldDurationLabel(finishX);
    renderSelection();
  };

  const setMode = (next: CreatorMode): void => {
    mode = next;
    buildButton.classList.toggle("selected", mode === "build");
    editButton.classList.toggle("selected", mode === "edit");
    palette.hidden = mode !== "build";
    patternPalette.hidden = mode !== "build";
    editPanel.hidden = mode !== "edit";
    if (mode === "build") selectedIndex = undefined;
    renderCourse();
  };

  const pointerWorld = (event: PointerEvent): { x: number; y: number } => {
    const bounds = course.getBoundingClientRect();
    return {
      x: Math.max(0, snapWorld((event.clientX - bounds.left) / zoom())),
      y: Math.max(
        0,
        Math.min(TERRAIN_DEPTH_Y - GRID_SIZE, snapWorld((event.clientY - bounds.top) / zoom())),
      ),
    };
  };

  const placeAtPointer = (event: PointerEvent): void => {
    const { x, y } = pointerWorld(event);
    if (selectedTool === "finish") {
      finishX = Math.max(MIN_FINISH_X, x);
      entities = entities.filter((entity) => entity.x + entity.width < finishX);
      renderCourse();
      return;
    }
    if (selectedTool === "erase") {
      let index = -1;
      for (let i = entities.length - 1; i >= 0; i -= 1) {
        const entity = entities[i]!;
        if (
          x >= entity.x &&
          x < entity.x + entity.width &&
          y >= entity.y &&
          y < entity.y + entity.height
        ) {
          index = i;
          break;
        }
      }
      if (index >= 0) {
        entities.splice(index, 1);
        renderCourse();
      }
      return;
    }
    if (x >= finishX - GRID_SIZE) return;
    if (selectedTool.startsWith("pattern-")) {
      const patternId = selectedTool.slice("pattern-".length) as AtomicPatternId;
      const stamp = stampAtomicPattern(
        patternId,
        {
          idPrefix: `creator-stamp-${nextEntityId}`,
          surfaceY: firstWakeLevel.rules.spawnY,
          x,
        },
        patternId === "floor-run" ? { cubesWide: 6 } : {},
      );
      const withinFinish = stamp.entities.every(
        (entity) => entity.x + entity.width <= finishX,
      );
      if (!withinFinish) return;
      nextEntityId += 1;
      entities.push(...stamp.entities);
      renderCourse();
      return;
    }
    const entity = entityForTool(selectedTool, `created-trigger-${nextEntityId}`, x, y);
    if (!entity) return;
    if (entity.x + entity.width > finishX) return;
    const duplicate = entities.some(
      (existing) =>
        existing.type === entity.type &&
        existing.x === entity.x &&
        existing.y === entity.y,
    );
    if (!duplicate) {
      nextEntityId += 1;
      entities.push(entity);
      renderCourse();
    }
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (mode === "edit") {
      const marker = (event.target as HTMLElement).closest<HTMLElement>("[data-entity-index]");
      selectedIndex = marker ? Number(marker.dataset.entityIndex) : undefined;
      renderCourse();
      return;
    }
    placeAtPointer(event);
    // Swipe paint now applies to every build tool (blocks, spikes, ramps,
    // pads, orbs, decor, zones) and erase — only the single finish point is
    // excluded from drag-painting.
    painting = paintToggle.checked && selectedTool !== "finish";
    if (painting) course.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (painting && mode === "build") placeAtPointer(event);
  };

  const stopPainting = (): void => {
    painting = false;
  };

  const onApplyEdit = (): void => {
    if (selectedIndex === undefined || !entities[selectedIndex]) return;
    const current = entities[selectedIndex];
    const changed = {
      ...current,
      x: Math.max(0, snapWorld(Number(editX.value) || 0)),
      y: placementTop(Number(editY.value) || 0, Math.max(GRID_SIZE, snapWorld(Number(editHeight.value) || GRID_SIZE))),
      width: Math.max(GRID_SIZE, snapWorld(Number(editWidth.value) || GRID_SIZE)),
      height: Math.max(GRID_SIZE, snapWorld(Number(editHeight.value) || GRID_SIZE)),
      ...(current.type === "block"
        ? { shape: editShape.value as BlockShape }
        : {}),
    } as LevelEntity;
    entities[selectedIndex] = changed;
    renderCourse();
  };

  const onDeleteSelection = (): void => {
    if (selectedIndex === undefined) return;
    entities.splice(selectedIndex, 1);
    selectedIndex = undefined;
    renderCourse();
  };

  const onSongChange = (): void => {
    audioFile = songInput.files?.[0];
    if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl);
    audioObjectUrl = undefined;
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
        snapWorld(audio.duration * firstWakeLevel.rules.horizontalSpeed),
      );
      songStatus.textContent = `${audioFile?.name ?? "Song"} loaded. Finish starts at the end of the song; use Finish Point to change it.`;
      renderCourse();
    });
  };

  const submission = (): CreatorSubmission => ({
    audioFile,
    audioFileName: actions.initial?.audioFileName,
    layout: { entities, finishX },
    name: nameInput.value.trim() || "My Song Level",
  });

  const onZoomOut = (): void => {
    zoomIndex = Math.max(0, zoomIndex - 1);
    renderCourse();
  };
  const onZoomIn = (): void => {
    zoomIndex = Math.min(ZOOM_CHOICES.length - 1, zoomIndex + 1);
    renderCourse();
  };

  buildButton.addEventListener("click", () => setMode("build"));
  editButton.addEventListener("click", () => setMode("edit"));
  zoomOut.addEventListener("click", onZoomOut);
  zoomIn.addEventListener("click", onZoomIn);
  editApply.addEventListener("click", onApplyEdit);
  editDelete.addEventListener("click", onDeleteSelection);
  course.addEventListener("pointerdown", onPointerDown);
  course.addEventListener("pointermove", onPointerMove);
  course.addEventListener("pointerup", stopPainting);
  course.addEventListener("pointercancel", stopPainting);
  songInput.addEventListener("change", onSongChange);
  saveButton.addEventListener("click", () => actions.onSave(submission()));
  previewButton.addEventListener("click", () => actions.onPreview(submission()));
  returnButton.addEventListener("click", actions.onReturn);
  setMode("build");

  return () => {
    if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl);
    root.replaceChildren();
  };
}
