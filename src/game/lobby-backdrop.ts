import Phaser from "phaser";
import { firstWakeLevel, type LevelContent } from "../content/first-wake";
import type { CosmeticAppearance } from "../core/inventory";
import type { LevelColorTheme } from "../core/profile";
import {
  createRunState,
  resetRunState,
  tickRun,
  type LevelEntity,
  type RunState,
} from "../core/run-simulation";
import type { LevelDemo, LevelDemoFrame } from "../core/level-solver";
import {
  consumeSimulationTicks,
  SIMULATION_STEP_MS,
} from "../core/simulation-pace";
import { groundedCubeCenterY } from "./player-presentation";

const LOBBY_SCENE_KEY = "lobby-backdrop";
const LEVEL_SCENE_KEY = "level-run";

/** Smoothing factor for the vertical follow-camera (0 = frozen, 1 = instant). */
const CAMERA_FOLLOW_LERP = 0.22;
/** Screen-height fraction the player rides at while the course scrolls beneath. */
const CAMERA_TOP_BAND_RATIO = 0.36;
/**
 * Extra world width (px) drawn beyond each screen edge so entities don't pop in.
 * Only entities inside the visible window are drawn each frame, which keeps the
 * per-frame draw work bounded regardless of total level length.
 */
const VIRTUAL_DRAW_MARGIN = 220;

class LobbyBackdropScene extends Phaser.Scene {
  private pulse?: Phaser.GameObjects.Arc;
  private pulseHalo?: Phaser.GameObjects.Arc;

  constructor() {
    super(LOBBY_SCENE_KEY);
  }

  create(): void {
    this.drawScene();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.drawScene, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.drawScene, this);
    });
  }

  update(time: number): void {
    const wave = (Math.sin(time / 750) + 1) / 2;

    this.pulse?.setScale(1 + wave * 0.045).setAlpha(0.25 + wave * 0.2);
    this.pulseHalo
      ?.setScale(1 + wave * 0.1)
      .setAlpha(0.08 + (1 - wave) * 0.1);
  }

  private drawScene(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const horizon = height * 0.67;
    const centerX = width / 2;

    this.children.removeAll();

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x15324d, 0.58);

    for (let x = -80; x <= width + 80; x += 64) {
      grid.lineBetween(centerX, horizon, x, height);
    }

    for (let y = horizon; y < height + 55; y += 42) {
      const depth = (y - horizon) / Math.max(height - horizon, 1);
      grid.lineBetween(0, y + depth * depth * 24, width, y + depth * depth * 24);
    }

    const skyline = this.add.graphics();
    skyline.fillStyle(0x091824, 1);
    skyline.fillRect(0, horizon - 74, width, 74);
    skyline.fillStyle(0x11283c, 0.92);

    for (let x = 0; x < width + 80; x += 76) {
      const offset = (x / 76) % 3;
      const buildingHeight = 28 + offset * 18;
      skyline.fillRect(x, horizon - buildingHeight, 54, buildingHeight);
    }

    const blocks = this.add.graphics();
    for (let x = -24; x < width + 40; x += 72) {
      const top = horizon + ((x / 72) % 3 === 1 ? -22 : 0);
      blocks.fillStyle(0x0d1d2d, 1);
      blocks.fillRect(x, top, 66, height - top);
      blocks.lineStyle(2, 0x19d9f3, 0.34);
      blocks.strokeRect(x, top, 66, height - top);
      blocks.lineStyle(1, 0xa45bff, 0.32);
      blocks.lineBetween(x + 8, top + 14, x + 56, top + 14);
    }

    this.pulseHalo = this.add
      .circle(centerX, height * 0.45, Math.min(width, height) * 0.235, 0x19d9f3, 0)
      .setStrokeStyle(2, 0x19d9f3, 0.18);
    this.pulse = this.add
      .circle(centerX, height * 0.45, Math.min(width, height) * 0.19, 0x07111d, 0.22)
      .setStrokeStyle(2, 0xa45bff, 0.4);

    const shard = this.add.graphics();
    shard.fillStyle(0x19d9f3, 0.08);
    shard.fillTriangle(centerX - 260, horizon - 80, centerX - 150, horizon - 210, centerX - 55, horizon - 80);
    shard.fillStyle(0xa45bff, 0.1);
    shard.fillTriangle(centerX + 80, horizon - 72, centerX + 170, horizon - 225, centerX + 265, horizon - 72);
  }
}

export interface LevelSnapshot {
  attempt: number;
  deathCause?: "block" | "fall" | "spike" | "trap";
  mode: "cube" | "ship";
  percent: number;
  runRecording?: readonly LevelDemoFrame[];
  status: "complete" | "dead" | "running";
}

const DEFAULT_PLAYER_APPEARANCE: CosmeticAppearance = {
  accent: 0xecfcff,
  cubeShape: "rectangle",
  fillDead: 0xff437d,
  fillRunning: 0x19d9f3,
  motif: "core",
  shipShape: "triangle",
  iconArt: "plate",
  shipArt: "skiff",
  trailArt: "core",
};

const PLAYER_STYLE = {
  stroke: 0xecfcff,
  strokeAlpha: 0.85,
  strokeWidth: 3,
} as const;

const PORTAL_STYLE: Record<"cube" | "ship", number> = {
  cube: 0x6cf2c5,
  ship: 0xffc857,
};

const PAD_STYLE = {
  fill: 0xffc857,
  stroke: 0xfff3c4,
};

const ORB_STYLE = {
  fill: 0xff7adf,
  stroke: 0xffd6f4,
};

interface LevelPalette {
  accent: number;
  block: number;
  decoration: number;
  skyBottom: number;
  skyTop: number;
  spike: number;
}

const LEVEL_PALETTES: Record<LevelColorTheme, LevelPalette> = {
  neon: {
    accent: 0x19d9f3,
    block: 0x154d69,
    decoration: 0x19d9f3,
    skyBottom: 0x112037,
    skyTop: 0x07111d,
    spike: 0xff437d,
  },
  sunset: {
    accent: 0xff7958,
    block: 0x723548,
    decoration: 0xffc857,
    skyBottom: 0x45243c,
    skyTop: 0x150f1b,
    spike: 0xffdc78,
  },
  forest: {
    accent: 0x34e8b3,
    block: 0x125545,
    decoration: 0x34e8b3,
    skyBottom: 0x103b38,
    skyTop: 0x061817,
    spike: 0xff6682,
  },
  void: {
    accent: 0xa45bff,
    block: 0x342363,
    decoration: 0xa45bff,
    skyBottom: 0x211541,
    skyTop: 0x09081b,
    spike: 0xff437d,
  },
};

function playerFillFor(
  status: LevelSnapshot["status"],
  appearance: CosmeticAppearance,
): number {
  return status === "dead" ? appearance.fillDead : appearance.fillRunning;
}

function shade(color: number, factor: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (clamp(r * factor) << 16) | (clamp(g * factor) << 8) | clamp(b * factor);
}

function poly(coords: readonly number[]): Phaser.Math.Vector2[] {
  const points: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < coords.length; i += 2) {
    points.push(new Phaser.Math.Vector2(coords[i]!, coords[i + 1]!));
  }
  return points;
}

/**
 * Soft neon bloom centered on the player. Stacked translucent discs fake an
 * additive glow without a post-process pipeline, so the avatar reads as a
 * lit object against the dark course instead of a flat sticker.
 */
function drawNeonGlow(
  g: Phaser.GameObjects.Graphics,
  color: number,
  radius: number,
): void {
  const halo = shade(color, 1.35);
  g.fillStyle(halo, 0.08);
  g.fillCircle(0, 0, radius * 2.1);
  g.fillStyle(halo, 0.12);
  g.fillCircle(0, 0, radius * 1.55);
  g.fillStyle(color, 0.18);
  g.fillCircle(0, 0, radius * 1.12);
}

/** Draws the cube/icon centered at local (0,0) with distinct per-icon detailing. */
function drawCubeArt(
  g: Phaser.GameObjects.Graphics,
  appearance: CosmeticAppearance,
  fill: number,
  width: number,
  height: number,
): void {
  const hw = width / 2;
  const hh = height / 2;
  const accent = appearance.accent;
  const stroke = PLAYER_STYLE.stroke;

  drawNeonGlow(g, fill, Math.max(hw, hh));

  g.lineStyle(PLAYER_STYLE.strokeWidth, stroke, PLAYER_STYLE.strokeAlpha);
  if (appearance.cubeShape === "circle") {
    g.fillStyle(fill, 1);
    g.fillCircle(0, 0, Math.min(width, height) / 2);
    g.strokeCircle(0, 0, Math.min(width, height) / 2);
  } else if (appearance.cubeShape === "diamond") {
    const pts = poly([0, -hh, hw, 0, 0, hh, -hw, 0]);
    g.fillStyle(fill, 1);
    g.fillPoints(pts, true);
    g.strokePoints(pts, true);
  } else {
    g.fillStyle(fill, 1);
    g.fillRect(-hw, -hh, width, height);
    g.strokeRect(-hw, -hh, width, height);
  }

  const light = shade(fill, 1.5);
  const dark = shade(fill, 0.55);
  switch (appearance.iconArt) {
    case "circuit": {
      // Circuit-board traces with solder nodes.
      g.lineStyle(2, accent, 0.95);
      g.lineBetween(-hw + 5, -4, 2, -4);
      g.lineBetween(2, -4, 2, hh - 5);
      g.lineBetween(-2, -hh + 5, -2, 6);
      g.lineBetween(-2, 6, hw - 5, 6);
      g.fillStyle(light, 1);
      g.fillCircle(2, -4, 2.6);
      g.fillCircle(-2, 6, 2.6);
      g.fillCircle(hw - 5, 6, 2.2);
      g.fillStyle(dark, 1);
      g.fillRect(-hw + 4, hh - 9, 6, 5);
      break;
    }
    case "spark": {
      // Lightning bolt.
      g.fillStyle(accent, 1);
      g.fillPoints(
        poly([2, -hh + 4, -5, 2, 0, 2, -3, hh - 4, 8, -3, 2, -3]),
        true,
      );
      break;
    }
    case "pulse": {
      // Concentric rings.
      g.lineStyle(2, accent, 0.9);
      g.strokeCircle(0, 0, hw * 0.62);
      g.lineStyle(1.5, light, 0.8);
      g.strokeCircle(0, 0, hw * 0.32);
      g.fillStyle(light, 1);
      g.fillCircle(0, 0, 2);
      break;
    }
    case "prism": {
      // Faceted gem lines.
      g.lineStyle(1.5, light, 0.85);
      g.lineBetween(0, -hh + 3, 0, hh - 3);
      g.lineBetween(-hw + 3, 0, hw - 3, 0);
      g.lineStyle(1.5, accent, 0.7);
      g.lineBetween(0, -hh + 3, hw - 3, 0);
      g.lineBetween(0, hh - 3, -hw + 3, 0);
      break;
    }
    case "flare": {
      // Radiating burst.
      g.lineStyle(1.5, accent, 0.85);
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2;
        g.lineBetween(0, 0, Math.cos(a) * hw * 0.85, Math.sin(a) * hh * 0.85);
      }
      g.fillStyle(light, 1);
      g.fillCircle(0, 0, 3);
      break;
    }
    default: {
      // Clean plate with sheen + bevel.
      g.lineStyle(2, light, 0.7);
      g.lineBetween(-hw + 5, -hh + 5, hw - 5, -hh + 5);
      g.fillStyle(dark, 0.8);
      g.fillRect(-hw + 4, hh - 8, width - 8, 4);
      break;
    }
  }
}

/** Draws the ship hull centered at local (0,0), nose pointing +x. */
function drawShipArt(
  g: Phaser.GameObjects.Graphics,
  appearance: CosmeticAppearance,
  fill: number,
  width: number,
  height: number,
): void {
  const hw = width / 2;
  const hh = height / 2;
  const accent = appearance.accent;
  const light = shade(fill, 1.5);

  drawNeonGlow(g, fill, Math.max(hw, hh));

  g.lineStyle(PLAYER_STYLE.strokeWidth, PLAYER_STYLE.stroke, PLAYER_STYLE.strokeAlpha);

  if (appearance.shipArt === "nova") {
    // Swept arrow fighter with wings.
    const hull = poly([hw, 0, -hw * 0.4, -hh * 0.7, -hw, -hh * 0.3, -hw * 0.5, 0, -hw, hh * 0.3, -hw * 0.4, hh * 0.7]);
    g.fillStyle(fill, 1);
    g.fillPoints(hull, true);
    g.strokePoints(hull, true);
    g.fillStyle(accent, 0.95);
    g.fillCircle(hw * 0.2, 0, 3.2);
  } else if (appearance.shipArt === "comet") {
    // Narrow dart with twin tail fins.
    const hull = poly([hw, 0, -hw * 0.6, -hh * 0.5, -hw, -hh * 0.85, -hw * 0.4, 0, -hw, hh * 0.85, -hw * 0.6, hh * 0.5]);
    g.fillStyle(fill, 1);
    g.fillPoints(hull, true);
    g.strokePoints(hull, true);
    g.fillStyle(light, 1);
    g.fillCircle(hw * 0.1, 0, 2.6);
  } else {
    // Skiff: classic rounded glider.
    const hull = poly([hw, 0, -hw, -hh * 0.62, -hw * 0.48, 0, -hw, hh * 0.62]);
    g.fillStyle(fill, 1);
    g.fillPoints(hull, true);
    g.strokePoints(hull, true);
    g.fillStyle(accent, 0.9);
    g.fillCircle(0, -hh * 0.1, 3);
  }
}

/** Trail style per cosmetic, streamed behind the player in world coordinates. */
function drawTrail(
  g: Phaser.GameObjects.Graphics,
  points: readonly { x: number; y: number; ship: boolean }[],
  appearance: CosmeticAppearance,
  fill: number,
): void {
  g.clear();
  if (points.length < 2) {
    return;
  }
  const accent = appearance.accent;
  const count = points.length;
  for (let i = 0; i < count; i += 1) {
    const p = points[i]!;
    const age = i / count; // 0 = oldest, 1 = newest
    const alpha = age * age * 0.8;
    if (alpha <= 0.01) {
      continue;
    }
    const size = (p.ship ? 7 : 5) * (0.35 + age * 0.65);
    // Soft bloom under the freshest points so the wake glows where it is
    // brightest and dissolves cleanly into the older, dimmer tail.
    if (age > 0.5) {
      g.fillStyle(shade(fill, 1.3), alpha * 0.3);
      g.fillCircle(p.x, p.y, size * 2.1);
    }
    switch (appearance.trailArt) {
      case "ring":
        g.lineStyle(1.5, accent, alpha);
        g.strokeCircle(p.x, p.y, size);
        break;
      case "flare":
        g.fillStyle(shade(fill, 1.4), alpha);
        g.fillTriangle(
          p.x - size,
          p.y - size,
          p.x + size,
          p.y,
          p.x - size,
          p.y + size,
        );
        break;
      case "prism":
        g.fillStyle(i % 2 === 0 ? accent : fill, alpha);
        g.fillPoints(
          poly([p.x, p.y - size, p.x + size, p.y, p.x, p.y + size, p.x - size, p.y]),
          true,
        );
        break;
      default:
        g.fillStyle(fill, alpha);
        g.fillCircle(p.x, p.y, size);
        break;
    }
  }
}

interface LevelSceneInitData {
  appearance?: CosmeticAppearance;
  demoPlayback?: LevelDemo;
  levelContent?: LevelContent;
  recordRun?: boolean;
  runSpeedMultiplier?: number;
  theme?: LevelColorTheme;
}

class LevelScene extends Phaser.Scene {
  private accumulator = 0;
  private appearance: CosmeticAppearance = DEFAULT_PLAYER_APPEARANCE;
  private attempt = 1;
  private courseLayer?: Phaser.GameObjects.Container;
  private demoFrameIndex = 0;
  private demoPlayback?: LevelDemo;
  private recordRun = false;
  private runRecordingFrames: LevelDemoFrame[] = [];
  private cubeJumpPending = false;
  private cubeInputBufferMs = 0;
  private worldOffsetY = 0;
  private cameraY = 0;
  private jumpHeld = false;
  private lastSnapshotKey = "";
  private levelContent: LevelContent = firstWakeLevel;
  private onSnapshot?: (snapshot: LevelSnapshot) => void;
  private paused = false;
  private playerGfx?: Phaser.GameObjects.Graphics;
  private trailGfx?: Phaser.GameObjects.Graphics;
  private trailPoints: { x: number; y: number; ship: boolean }[] = [];
  private courseGraphics?: Phaser.GameObjects.Graphics;
  private finishText?: Phaser.GameObjects.Text;
  private sortedEntities: readonly LevelEntity[] = [];
  private maxEntityWidth = 0;
  private palette: LevelPalette = LEVEL_PALETTES.neon;
  private state: RunState = createRunState(firstWakeLevel.rules);
  private status: LevelSnapshot["status"] = "running";
  private theme: LevelColorTheme = "neon";
  private runSpeedMultiplier = 1;

  constructor() {
    super(LEVEL_SCENE_KEY);
  }

  init(data: LevelSceneInitData): void {
    if (data.levelContent) {
      this.levelContent = data.levelContent;
    }
    if (data.appearance) {
      this.appearance = data.appearance;
    }
    if (data.theme) {
      this.theme = data.theme;
    }
    this.runSpeedMultiplier = data.runSpeedMultiplier ?? 1;
    this.demoPlayback = data.demoPlayback;
    this.recordRun = data.recordRun ?? false;
    this.demoFrameIndex = 0;
    this.runRecordingFrames = [];
  }

  create(): void {
    this.accumulator = 0;
    this.attempt = 1;
    this.demoFrameIndex = 0;
    this.runRecordingFrames = [];
    this.cubeJumpPending = false;
    this.cubeInputBufferMs = 0;
    this.jumpHeld = false;
    this.paused = false;
    this.cameraY = 0;
    this.state = createRunState(this.levelContent.rules);
    this.status = "running";
    this.drawScene();
    this.publishSnapshot(true);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.drawScene, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.drawScene, this);
    });
  }

  update(_time: number, delta: number): void {
    if (this.paused || this.status !== "running") {
      return;
    }

    const { accumulator, tickCount } = consumeSimulationTicks(
      this.accumulator,
      delta,
      this.runSpeedMultiplier,
    );
    this.accumulator = accumulator;

    for (let step = 0; step < tickCount; step += 1) {
      if (this.demoPlayback) {
        if (this.demoFrameIndex >= this.demoPlayback.frames.length) {
          this.status = "complete";
          break;
        }

        const frame = this.demoPlayback.frames[this.demoFrameIndex]!;
        this.demoFrameIndex += 1;
        this.state = {
          ...this.state,
          player: {
            grounded: Math.abs(frame.velocityY) < 12,
            mode: frame.mode,
            velocityY: frame.velocityY,
            x: frame.x,
            y: frame.y,
          },
          status: "running",
        };
        continue;
      }

      const jumpPressed =
        this.state.player.mode === "ship"
          ? this.jumpHeld
          : this.cubeJumpPending ||
            this.cubeInputBufferMs > 0 ||
            (this.jumpHeld && this.state.player.grounded);
      const wasGrounded = this.state.player.grounded;
      const consumedCount = this.state.consumedTriggerIds.size;
      this.state = tickRun(
        this.state,
        { jumpPressed },
        SIMULATION_STEP_MS,
        this.levelContent.rules,
        this.levelContent.entities,
      );
      if (this.recordRun) {
        this.runRecordingFrames.push({
          mode: this.state.player.mode,
          velocityY: this.state.player.velocityY,
          x: this.state.player.x,
          y: this.state.player.y,
        });
      }
      this.cubeJumpPending = false;
      if (this.state.player.mode === "cube" && this.cubeInputBufferMs > 0) {
        const impulseActivated =
          this.state.consumedTriggerIds.size > consumedCount;
        this.cubeInputBufferMs =
          impulseActivated || (wasGrounded && jumpPressed)
            ? 0
            : Math.max(0, this.cubeInputBufferMs - SIMULATION_STEP_MS);
      }

      if (this.state.status === "dead") {
        this.status = "dead";
        break;
      }

      if (this.state.player.x >= this.levelContent.finishX) {
        this.status = "complete";
        break;
      }
    }

    this.updatePresentation();
    this.publishSnapshot();
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  setRunSpeedMultiplier(multiplier: number): void {
    this.runSpeedMultiplier = multiplier;
  }

  setJumpHeld(held: boolean): boolean {
    if (this.demoPlayback) {
      return false;
    }

    if (this.paused || this.status !== "running") {
      this.cubeJumpPending = false;
      this.jumpHeld = false;
      return false;
    }

    const wasHeld = this.jumpHeld;
    this.jumpHeld = held;

    if (!held || wasHeld) {
      return true;
    }

    if (this.state.player.mode === "ship") {
      return true;
    }

    if (this.cubeJumpPending) {
      return false;
    }

    if (this.state.player.grounded) {
      this.cubeJumpPending = true;
      this.cubeInputBufferMs = 0;
      return true;
    }

    if (!this.hasApproachingOrb()) {
      return false;
    }

    this.cubeJumpPending = true;
    this.cubeInputBufferMs = 150;
    return true;
  }

  private hasApproachingOrb(): boolean {
    const triggerReach =
      this.levelContent.rules.horizontalSpeed * (this.cubeInputBufferMs > 0 ? 0.2 : 0.15);
    const playerX = this.state.player.x;
    // Dense song levels can hold thousands of entities; binary-search the sorted
    // course so a held jump only inspects the orbs immediately ahead instead of
    // scanning the whole level every input.
    const lowerBound = playerX - this.maxEntityWidth;
    let lo = 0;
    let hi = this.sortedEntities.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.sortedEntities[mid]!.x < lowerBound) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    for (let index = lo; index < this.sortedEntities.length; index += 1) {
      const entity = this.sortedEntities[index]!;
      if (entity.x - playerX > triggerReach) {
        break;
      }
      if (
        entity.type === "orb" &&
        !this.state.consumedTriggerIds.has(entity.id) &&
        entity.x + entity.width >= playerX
      ) {
        return true;
      }
    }
    return false;
  }

  restart(): void {
    this.accumulator = 0;
    this.attempt += 1;
    this.cubeJumpPending = false;
    this.cubeInputBufferMs = 0;
    this.jumpHeld = false;
    this.paused = false;
    this.cameraY = 0;
    this.demoFrameIndex = 0;
    this.runRecordingFrames = [];
    this.trailPoints = [];
    this.state = resetRunState(this.state, this.levelContent.rules);
    this.status = "running";
    this.updatePresentation();
    this.publishSnapshot(true);
  }

  setSnapshotListener(
    listener: ((snapshot: LevelSnapshot) => void) | undefined,
  ): void {
    this.onSnapshot = listener;
    this.publishSnapshot(true);
  }

  private drawScene(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const rules = this.levelContent.rules;
    const finishX = this.levelContent.finishX;
    const palette = LEVEL_PALETTES[this.theme];
    this.palette = palette;

    this.children.removeAll();
    const spawnScreenY = height * 0.71;
    this.worldOffsetY = spawnScreenY - rules.spawnY;

    const wash = this.add.graphics();
    wash.fillGradientStyle(
      palette.skyTop,
      palette.skyTop,
      palette.skyBottom,
      palette.skyBottom,
      1,
    );
    wash.fillRect(0, 0, width, height);

    const backdrop = this.add.graphics();
    this.drawThemeBackdrop(backdrop, width, height, spawnScreenY);

    // Entities are sorted by their left edge so the per-frame redraw can scan a
    // contiguous visible window and stop early once it passes the right edge.
    this.sortedEntities = [...this.levelContent.entities].sort(
      (a, b) => a.x - b.x,
    );
    this.maxEntityWidth = this.sortedEntities.reduce(
      (widest, entity) => Math.max(widest, entity.width),
      0,
    );

    this.courseLayer = this.add.container(0, 0);
    this.courseGraphics = this.add.graphics();
    this.courseLayer.add(this.courseGraphics);
    this.trailGfx = this.add.graphics();
    this.courseLayer.add(this.trailGfx);
    this.trailPoints = [];

    const finishBaseY = this.worldOffsetY + rules.spawnY;
    this.finishText = this.add.text(finishX - 30, finishBaseY - 177, "FINISH", {
      color: "#ecfcff",
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      letterSpacing: 2,
    });
    this.courseLayer.add(this.finishText);

    // Player is drawn on top of the scrolling course layer.
    this.playerGfx = this.add.graphics();

    this.updatePresentation();
  }

  /**
   * Draws a distinct, themed parallax backdrop plus a ground band so each level
   * theme reads as its own place rather than a flat gradient.
   */
  private drawThemeBackdrop(
    g: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    groundY: number,
  ): void {
    const palette = this.palette;
    const rng = (seed: number): number => {
      const x = Math.sin(seed * 127.1) * 43758.5453;
      return x - Math.floor(x);
    };

    // Atmospheric horizon haze: a soft accent bloom hugging the ground line
    // sits behind every theme's silhouette layers and adds a sense of depth.
    g.fillStyle(palette.accent, 0.05);
    g.fillRect(0, groundY - 72, width, 72);
    g.fillStyle(palette.accent, 0.08);
    g.fillRect(0, groundY - 32, width, 32);

    if (this.theme === "neon") {
      // Layered neon skyline with a glowing grid floor.
      for (let layer = 0; layer < 2; layer += 1) {
        const baseY = groundY - 30 - layer * 26;
        const tint = layer === 0 ? shade(palette.block, 0.7) : shade(palette.block, 1.1);
        g.fillStyle(tint, layer === 0 ? 0.5 : 0.7);
        for (let x = -40; x < width + 60; x += 58) {
          const h = 40 + rng(x * (layer + 1)) * (90 + layer * 50);
          g.fillRect(x, baseY - h, 40, h);
          g.fillStyle(palette.accent, 0.18);
          g.fillRect(x + 8, baseY - h + 8, 6, 6);
          g.fillStyle(tint, layer === 0 ? 0.5 : 0.7);
        }
      }
      g.lineStyle(1, palette.accent, 0.12);
      for (let y = groundY + 26; y < height; y += 26) {
        g.lineBetween(0, y, width, y);
      }
    } else if (this.theme === "sunset") {
      // Setting sun with layered dune ridges.
      g.fillStyle(0xffd27a, 0.32);
      g.fillCircle(width * 0.72, groundY - 150, 110);
      g.fillStyle(0xffb15a, 0.5);
      g.fillCircle(width * 0.72, groundY - 150, 70);
      for (let layer = 0; layer < 3; layer += 1) {
        const baseY = groundY - 40 + layer * 24;
        g.fillStyle(shade(palette.block, 0.7 + layer * 0.25), 0.6);
        g.beginPath();
        g.moveTo(0, height);
        for (let x = 0; x <= width; x += 40) {
          const ridge = baseY - Math.sin((x / width) * Math.PI * (2 + layer)) * (26 - layer * 6);
          g.lineTo(x, ridge);
        }
        g.lineTo(width, height);
        g.closePath();
        g.fillPath();
      }
    } else if (this.theme === "forest") {
      // Silhouetted canopy and trunks.
      for (let layer = 0; layer < 2; layer += 1) {
        const baseY = groundY - 10 - layer * 18;
        g.fillStyle(shade(palette.block, 0.6 + layer * 0.5), layer === 0 ? 0.55 : 0.75);
        for (let x = -30; x < width + 60; x += 70) {
          const treeH = 90 + rng(x * (layer + 3)) * 110;
          const trunkW = 14;
          g.fillRect(x + 12, baseY - treeH * 0.4, trunkW, treeH * 0.4);
          g.fillTriangle(x - 6, baseY - treeH * 0.35, x + 18, baseY - treeH, x + 42, baseY - treeH * 0.35);
        }
      }
    } else {
      // Void: starfield and distant shards.
      for (let i = 0; i < 80; i += 1) {
        const x = rng(i * 1.7) * width;
        const y = rng(i * 3.3) * groundY;
        const r = rng(i * 5.1) * 1.6 + 0.4;
        g.fillStyle(0xeafdff, 0.15 + rng(i) * 0.4);
        g.fillCircle(x, y, r);
      }
      g.fillStyle(palette.accent, 0.1);
      for (let i = 0; i < 4; i += 1) {
        const cx = (i + 0.5) * (width / 4);
        const cy = groundY - 60 - rng(i) * 80;
        const s = 30 + rng(i * 2) * 50;
        g.fillTriangle(cx, cy - s, cx + s * 0.6, cy + s, cx - s * 0.6, cy + s);
      }
    }

    // Ground band beneath the playfield surface for a consistent floor.
    g.fillStyle(shade(palette.block, 0.55), 1);
    g.fillRect(0, groundY, width, height - groundY);
    g.lineStyle(2, palette.accent, 0.4);
    g.lineBetween(0, groundY, width, groundY);
  }

  /**
   * Redraws only the entities inside the current viewport into a single reused
   * Graphics object. This bounds per-frame draw cost to roughly one screen of
   * geometry, so long generated levels keep a steady frame rate.
   */
  private redrawVisibleCourse(): void {
    const g = this.courseGraphics;
    if (!g) {
      return;
    }

    g.clear();
    const palette = this.palette;
    const offsetY = this.worldOffsetY;
    const playerScreenX = this.scale.width * 0.22;
    const left = this.state.player.x - playerScreenX - VIRTUAL_DRAW_MARGIN;
    const right = left + this.scale.width + VIRTUAL_DRAW_MARGIN * 2;

    // Binary-search the first entity that can still be visible so we don't scan
    // (and skip) every entity already behind the camera each frame. Entities are
    // sorted by left edge, so anything with x < left - maxWidth is fully behind.
    const lowerBound = left - this.maxEntityWidth;
    let lo = 0;
    let hi = this.sortedEntities.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.sortedEntities[mid]!.x < lowerBound) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    for (let index = lo; index < this.sortedEntities.length; index += 1) {
      const entity = this.sortedEntities[index]!;
      if (entity.x > right) {
        break;
      }
      if (entity.x + entity.width < left) {
        continue;
      }
      this.drawEntity(g, entity, offsetY, palette);
    }

    const finishX = this.levelContent.finishX;
    if (finishX + 20 >= left && finishX - 20 <= right) {
      const finishBaseY = offsetY + this.levelContent.rules.spawnY;
      g.lineStyle(4, palette.accent, 0.85);
      g.lineBetween(finishX, finishBaseY - 132, finishX, finishBaseY);
      g.lineStyle(2, 0xecfcff, 0.62);
      g.strokeCircle(finishX, finishBaseY - 145, 10);
    }
  }

  private drawEntity(
    g: Phaser.GameObjects.Graphics,
    entity: LevelEntity,
    offsetY: number,
    palette: LevelPalette,
  ): void {
    const y = offsetY + entity.y;
    if (entity.type === "spike") {
      const tipX = entity.x + entity.width / 2;
      const baseY = y + entity.height;
      // Shaded body with a glinting left facet and bright tip for readability.
      g.fillStyle(shade(palette.spike, 0.62), 1);
      g.fillTriangle(entity.x, baseY, tipX, y, entity.x + entity.width, baseY);
      g.fillStyle(palette.spike, 1);
      g.fillTriangle(entity.x, baseY, tipX, y, tipX, baseY);
      g.fillStyle(shade(palette.spike, 1.7), 0.85);
      g.fillTriangle(tipX, y, tipX - 3, y + 9, tipX + 3, y + 9);
      g.lineStyle(1.5, shade(palette.spike, 1.4), 0.6);
      g.lineBetween(entity.x, baseY, tipX, y);
      return;
    }

    if (entity.type === "block") {
      const light = shade(palette.block, 1.4);
      const dark = shade(palette.block, 0.62);
      g.lineStyle(2, palette.accent, 0.8);
      if (entity.shape === "ramp-up") {
        g.fillStyle(palette.block, 0.96);
        g.fillTriangle(
          entity.x,
          y + entity.height,
          entity.x + entity.width,
          y,
          entity.x + entity.width,
          y + entity.height,
        );
        // Bright lip along the climbing surface.
        g.lineStyle(2.5, light, 0.85);
        g.lineBetween(entity.x, y + entity.height, entity.x + entity.width, y);
        g.lineStyle(2, palette.accent, 0.8);
        g.strokeTriangle(
          entity.x,
          y + entity.height,
          entity.x + entity.width,
          y,
          entity.x + entity.width,
          y + entity.height,
        );
      } else if (entity.shape === "ramp-down") {
        g.fillStyle(palette.block, 0.96);
        g.fillTriangle(
          entity.x,
          y,
          entity.x + entity.width,
          y + entity.height,
          entity.x,
          y + entity.height,
        );
        g.lineStyle(2.5, light, 0.85);
        g.lineBetween(entity.x, y, entity.x + entity.width, y + entity.height);
        g.lineStyle(2, palette.accent, 0.8);
        g.strokeTriangle(
          entity.x,
          y,
          entity.x + entity.width,
          y + entity.height,
          entity.x,
          y + entity.height,
        );
      } else {
        // Vertical gradient face with a lit top edge and a shaded base for depth.
        g.fillGradientStyle(light, light, palette.block, dark, 1);
        g.fillRect(entity.x, y, entity.width, entity.height);
        g.strokeRect(entity.x, y, entity.width, entity.height);
        g.fillStyle(light, 0.55);
        g.fillRect(entity.x + 2, y + 2, entity.width - 4, 3);
        g.fillStyle(dark, 0.5);
        g.fillRect(entity.x + 2, y + entity.height - 5, entity.width - 4, 3);
        g.lineStyle(1, palette.accent, 0.32);
        g.lineBetween(entity.x + 8, y + 12, entity.x + entity.width - 8, y + 12);
      }
      return;
    }

    if (entity.type === "decoration") {
      this.drawDecoration(g, entity, y, palette);
      return;
    }

    if (entity.type === "portal") {
      const portalColor = PORTAL_STYLE[entity.mode as "cube" | "ship"];
      g.fillStyle(portalColor, 0.18);
      g.fillRect(entity.x, y, entity.width, entity.height);
      g.lineStyle(3, portalColor, 0.95);
      g.strokeRect(entity.x, y, entity.width, entity.height);
      return;
    }

    if (entity.type === "pad") {
      g.fillStyle(PAD_STYLE.fill, 0.85);
      g.fillRect(entity.x, y, entity.width, entity.height);
      g.lineStyle(2, PAD_STYLE.stroke, 0.95);
      g.strokeRect(entity.x, y, entity.width, entity.height);
      g.lineStyle(2, PAD_STYLE.stroke, 0.55);
      g.lineBetween(entity.x + 6, y + 2, entity.x + entity.width - 6, y + 2);
      return;
    }

    if (entity.type === "orb") {
      const centerX = entity.x + entity.width / 2;
      const centerY = y + entity.height / 2;
      const radius = Math.min(entity.width, entity.height) / 2;
      g.fillStyle(ORB_STYLE.fill, 0.55);
      g.fillCircle(centerX, centerY, radius);
      g.lineStyle(2, ORB_STYLE.stroke, 0.95);
      g.strokeCircle(centerX, centerY, radius);
      g.lineStyle(2, ORB_STYLE.stroke, 0.45);
      g.strokeCircle(centerX, centerY, radius + 5);
    }
  }

  private drawDecoration(
    g: Phaser.GameObjects.Graphics,
    entity: Extract<LevelEntity, { type: "decoration" }>,
    y: number,
    palette: LevelPalette,
  ): void {
    const cx = entity.x + entity.width / 2;
    const cy = y + entity.height / 2;
    if (entity.kind === "diamond") {
      g.lineStyle(2, palette.decoration, 0.27);
      g.strokeTriangle(
        cx,
        y,
        entity.x + entity.width,
        cy,
        cx,
        y + entity.height,
      );
      g.lineBetween(cx, y + entity.height, entity.x, cy);
    } else if (entity.kind === "beam") {
      g.lineStyle(2, palette.decoration, 0.27);
      g.lineBetween(entity.x, y + entity.height, entity.x + entity.width, y);
      g.lineBetween(entity.x + 12, y + entity.height, entity.x + entity.width + 12, y);
    } else if (entity.kind === "flash") {
      g.lineStyle(2, palette.accent, 0.5);
      g.strokeRect(entity.x, y, entity.width, entity.height);
      g.lineBetween(entity.x, cy, entity.x + entity.width, cy);
    } else if (entity.kind === "fog") {
      g.fillStyle(0xd8f8ff, 0.07);
      g.fillRect(entity.x, y, entity.width, entity.height);
    } else if (entity.kind === "dark") {
      g.fillStyle(0x02030a, 0.4);
      g.fillRect(entity.x, y, entity.width, entity.height);
    } else if (entity.kind === "shadow") {
      g.fillStyle(0x01020a, 0.66);
      g.fillRect(entity.x, y, entity.width, entity.height);
    } else if (entity.kind === "glow") {
      g.fillStyle(0x8ff6ff, 0.12);
      g.fillRect(entity.x, y, entity.width, entity.height);
      g.fillStyle(0xeafdff, 0.16);
      g.fillRect(
        cx - entity.width * 0.25,
        cy - entity.height * 0.25,
        entity.width * 0.5,
        entity.height * 0.5,
      );
    } else if (entity.kind === "spotlight") {
      g.fillStyle(0xfff4c4, 0.12);
      g.fillTriangle(cx, y, entity.x, y + entity.height, entity.x + entity.width, y + entity.height);
      g.fillStyle(0xffffff, 0.18);
      g.fillCircle(cx, y + 6, 7);
    } else {
      g.lineStyle(2, palette.decoration, 0.27);
      g.strokeRect(entity.x, y, entity.width, entity.height);
    }
  }

  private updatePresentation(): void {
    const rules = this.levelContent.rules;
    const playerScreenX = this.scale.width * 0.22;
    const simulationCenterY =
      this.worldOffsetY +
      this.state.player.y -
      rules.playerHeight / 2;
    const isShip = this.state.player.mode === "ship";
    const fillColor = playerFillFor(this.status, this.appearance);
    const cubeRotation = this.state.player.x / 62;
    const cubeScreenY = this.state.player.grounded
      ? groundedCubeCenterY(
          this.worldOffsetY + this.state.player.y,
          this.appearance.cubeShape,
          rules.playerWidth,
          rules.playerHeight,
          cubeRotation,
        )
      : simulationCenterY;

    const naturalScreenY = this.worldOffsetY + this.state.player.y;
    const topBand = this.scale.height * CAMERA_TOP_BAND_RATIO;
    const targetCameraY = Math.max(0, topBand - naturalScreenY);
    this.cameraY += (targetCameraY - this.cameraY) * CAMERA_FOLLOW_LERP;
    const camY = this.cameraY;

    this.redrawVisibleCourse();
    this.courseLayer?.setPosition(playerScreenX - this.state.player.x, camY);

    // Stream a trail in world coordinates so it lags behind as the world scrolls.
    const trailWorldY = isShip
      ? simulationCenterY
      : cubeScreenY;
    this.trailPoints.push({
      x: this.state.player.x,
      y: trailWorldY,
      ship: isShip,
    });
    if (this.trailPoints.length > 26) {
      this.trailPoints.shift();
    }
    if (this.trailGfx) {
      drawTrail(this.trailGfx, this.trailPoints, this.appearance, fillColor);
    }

    if (this.playerGfx) {
      const screenY = isShip ? simulationCenterY + camY : cubeScreenY + camY;
      const rotation = isShip
        ? this.state.player.velocityY * 0.0006
        : cubeRotation;
      this.playerGfx.clear();
      this.playerGfx.setPosition(playerScreenX, screenY).setRotation(rotation);
      if (isShip) {
        drawShipArt(
          this.playerGfx,
          this.appearance,
          fillColor,
          rules.playerWidth,
          rules.playerHeight,
        );
      } else {
        drawCubeArt(
          this.playerGfx,
          this.appearance,
          fillColor,
          rules.playerWidth,
          rules.playerHeight,
        );
      }
    }
  }

  private publishSnapshot(force = false): void {
    const finishX = this.levelContent.finishX;
    const percent =
      this.status === "complete"
        ? 100
        : Math.min(99, Math.floor((this.state.player.x / finishX) * 100));
    const snapshot: LevelSnapshot = {
      attempt: this.attempt,
      ...(this.state.deathCause ? { deathCause: this.state.deathCause } : {}),
      mode: this.state.player.mode,
      percent,
      ...(this.status === "complete" && this.runRecordingFrames.length > 0
        ? { runRecording: this.runRecordingFrames.slice() }
        : {}),
      status: this.status,
    };
    // Build the dedupe key from primitives so the hot path never serializes the
    // (potentially large) run-recording array that rides along on completion.
    const key = `${this.attempt}|${this.state.deathCause ?? ""}|${
      this.state.player.mode
    }|${percent}|${this.status}`;

    if (!force && key === this.lastSnapshotKey) {
      return;
    }

    this.lastSnapshotKey = key;
    this.onSnapshot?.(snapshot);
  }
}

export interface BackdropController {
  destroy(removeCanvas?: boolean): void;
  setLevelJumpHeld(held: boolean): boolean;
  restartLevel(): void;
  setLevelSnapshotListener(
    listener: ((snapshot: LevelSnapshot) => void) | undefined,
  ): void;
  setLevelPaused(paused: boolean): void;
  setLevelRunSpeed(multiplier: number): void;
  showLobby(): void;
  showLevel(
    content: LevelContent,
    appearance?: CosmeticAppearance,
    theme?: LevelColorTheme,
    runSpeedMultiplier?: number,
    demoPlayback?: LevelDemo,
    recordRun?: boolean,
  ): void;
}

export function startLobbyBackdrop(parent: HTMLElement): BackdropController {
  let requestedScene = LOBBY_SCENE_KEY;
  let scenesReady = false;
  let snapshotListener: ((snapshot: LevelSnapshot) => void) | undefined;
  let pendingLevelContent: LevelContent | undefined;
  let pendingAppearance: CosmeticAppearance | undefined;
  let pendingTheme: LevelColorTheme | undefined;
  let pendingRunSpeedMultiplier = 1;
  let pendingDemoPlayback: LevelDemo | undefined;
  let pendingRecordRun = false;
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#07111d",
    banner: false,
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: parent.clientWidth,
      height: parent.clientHeight,
    },
    scene: LobbyBackdropScene,
  });

  const applyRequestedScene = (): void => {
    if (!game.isBooted || !scenesReady) {
      return;
    }

    if (requestedScene === LOBBY_SCENE_KEY) {
      if (game.scene.isActive(LEVEL_SCENE_KEY)) {
        game.scene.stop(LEVEL_SCENE_KEY);
      }
      if (!game.scene.isActive(LOBBY_SCENE_KEY)) {
        game.scene.start(LOBBY_SCENE_KEY);
      }
      return;
    }

    if (game.scene.isActive(LOBBY_SCENE_KEY)) {
      game.scene.stop(LOBBY_SCENE_KEY);
    }
    if (game.scene.isActive(LEVEL_SCENE_KEY)) {
      game.scene.stop(LEVEL_SCENE_KEY);
    }
    game.scene.start(LEVEL_SCENE_KEY, {
      appearance: pendingAppearance,
      demoPlayback: pendingDemoPlayback,
      recordRun: pendingRecordRun,
      levelContent: pendingLevelContent ?? firstWakeLevel,
      runSpeedMultiplier: pendingRunSpeedMultiplier,
      theme: pendingTheme,
    });
    (game.scene.getScene(LEVEL_SCENE_KEY) as LevelScene).setSnapshotListener(
      snapshotListener,
    );
  };

  game.events.once(Phaser.Core.Events.READY, () => {
    game.scene.add(LEVEL_SCENE_KEY, LevelScene, false);
    scenesReady = true;
    applyRequestedScene();
  });

  return {
    destroy: (removeCanvas = false) => game.destroy(removeCanvas),
    setLevelJumpHeld: (held: boolean) => {
      if (game.scene.isActive(LEVEL_SCENE_KEY)) {
        return (
          game.scene.getScene(LEVEL_SCENE_KEY) as LevelScene
        ).setJumpHeld(held);
      }

      return false;
    },
    restartLevel: () => {
      if (game.scene.isActive(LEVEL_SCENE_KEY)) {
        (game.scene.getScene(LEVEL_SCENE_KEY) as LevelScene).restart();
      }
    },
    setLevelSnapshotListener: (listener) => {
      snapshotListener = listener;

      if (scenesReady && game.scene.isActive(LEVEL_SCENE_KEY)) {
        (game.scene.getScene(LEVEL_SCENE_KEY) as LevelScene).setSnapshotListener(
          listener,
        );
      }
    },
    setLevelPaused: (paused: boolean) => {
      if (game.scene.isActive(LEVEL_SCENE_KEY)) {
        (game.scene.getScene(LEVEL_SCENE_KEY) as LevelScene).setPaused(paused);
      }
    },
    setLevelRunSpeed: (multiplier: number) => {
      if (game.scene.isActive(LEVEL_SCENE_KEY)) {
        (
          game.scene.getScene(LEVEL_SCENE_KEY) as LevelScene
        ).setRunSpeedMultiplier(multiplier);
      }
    },
    showLobby: () => {
      requestedScene = LOBBY_SCENE_KEY;
      applyRequestedScene();
    },
    showLevel: (
      content: LevelContent,
      appearance?: CosmeticAppearance,
      theme?: LevelColorTheme,
      runSpeedMultiplier?: number,
      demoPlayback?: LevelDemo,
      recordRun?: boolean,
    ) => {
      pendingLevelContent = content;
      pendingAppearance = appearance;
      pendingTheme = theme;
      pendingRunSpeedMultiplier = runSpeedMultiplier ?? 1;
      pendingDemoPlayback = demoPlayback;
      pendingRecordRun = recordRun ?? false;
      requestedScene = LEVEL_SCENE_KEY;
      applyRequestedScene();
    },
  };
}
