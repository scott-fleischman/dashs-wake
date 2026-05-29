import Phaser from "phaser";
import { firstWakeLevel, type LevelContent } from "../content/first-wake";
import type {
  CosmeticAppearance,
  CubeShapeKind,
  ShipShapeKind,
} from "../core/inventory";
import type { LevelColorTheme } from "../core/profile";
import {
  createRunState,
  resetRunState,
  tickRun,
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

function applyPlayerStrokeStyle<T extends Phaser.GameObjects.Shape>(
  shape: T,
): T {
  shape.setStrokeStyle(
    PLAYER_STYLE.strokeWidth,
    PLAYER_STYLE.stroke,
    PLAYER_STYLE.strokeAlpha,
  );
  return shape;
}

function createPlayerCube(
  scene: Phaser.Scene,
  kind: CubeShapeKind,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: number,
): Phaser.GameObjects.Shape {
  if (kind === "circle") {
    return scene.add.circle(x, y, Math.min(width, height) / 2, fill);
  }
  if (kind === "diamond") {
    const halfW = width / 2;
    const halfH = height / 2;
    return scene.add.polygon(
      x,
      y,
      [0, -halfH, halfW, 0, 0, halfH, -halfW, 0],
      fill,
    );
  }
  return scene.add.rectangle(x, y, width, height, fill);
}

function createPlayerShip(
  scene: Phaser.Scene,
  _kind: ShipShapeKind,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: number,
): Phaser.GameObjects.Shape {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  return scene.add.polygon(
    x,
    y,
    [
      -halfWidth,
      -halfHeight * 0.62,
      halfWidth,
      0,
      -halfWidth,
      halfHeight * 0.62,
      -halfWidth * 0.48,
      0,
    ],
    fill,
  );
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
  private jumpHeld = false;
  private lastSnapshotKey = "";
  private levelContent: LevelContent = firstWakeLevel;
  private onSnapshot?: (snapshot: LevelSnapshot) => void;
  private paused = false;
  private playerCube?: Phaser.GameObjects.Shape;
  private postFxLayer?: Phaser.GameObjects.Container;
  private playerShip?: Phaser.GameObjects.Shape;
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
    return this.levelContent.entities.some(
      (entity) =>
        entity.type === "orb" &&
        !this.state.consumedTriggerIds.has(entity.id) &&
        entity.x + entity.width >= this.state.player.x &&
        entity.x - this.state.player.x <= triggerReach,
    );
  }

  restart(): void {
    this.accumulator = 0;
    this.attempt += 1;
    this.cubeJumpPending = false;
    this.cubeInputBufferMs = 0;
    this.jumpHeld = false;
    this.paused = false;
    this.demoFrameIndex = 0;
    this.runRecordingFrames = [];
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
    const entities = this.levelContent.entities;
    const finishX = this.levelContent.finishX;
    const palette = LEVEL_PALETTES[this.theme];

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

    const horizon = this.add.graphics();
    horizon.lineStyle(1, palette.accent, 0.16);
    for (let y = spawnScreenY - 150; y < spawnScreenY; y += 38) {
      horizon.lineBetween(0, y, width, y);
    }

    this.courseLayer = this.add.container(0, 0);

    const hazards = this.add.graphics();
    hazards.fillStyle(palette.spike, 1);
    for (const entity of entities) {
      if (entity.type !== "spike") {
        continue;
      }

      const y = this.worldOffsetY + entity.y;
      hazards.fillTriangle(
        entity.x,
        y + entity.height,
        entity.x + entity.width / 2,
        y,
        entity.x + entity.width,
        y + entity.height,
      );
    }
    this.courseLayer.add(hazards);

    const blocks = this.add.graphics();
    for (const entity of entities) {
      if (entity.type !== "block") {
        continue;
      }
      const y = this.worldOffsetY + entity.y;
      blocks.fillStyle(palette.block, 0.96);
      blocks.lineStyle(2, palette.accent, 0.8);
      if (entity.shape === "ramp-up") {
        blocks.fillTriangle(
          entity.x,
          y + entity.height,
          entity.x + entity.width,
          y,
          entity.x + entity.width,
          y + entity.height,
        );
        blocks.strokeTriangle(
          entity.x,
          y + entity.height,
          entity.x + entity.width,
          y,
          entity.x + entity.width,
          y + entity.height,
        );
      } else if (entity.shape === "ramp-down") {
        blocks.fillTriangle(
          entity.x,
          y,
          entity.x + entity.width,
          y + entity.height,
          entity.x,
          y + entity.height,
        );
        blocks.strokeTriangle(
          entity.x,
          y,
          entity.x + entity.width,
          y + entity.height,
          entity.x,
          y + entity.height,
        );
      } else {
        blocks.fillRect(entity.x, y, entity.width, entity.height);
        blocks.strokeRect(entity.x, y, entity.width, entity.height);
        blocks.lineStyle(1, palette.accent, 0.35);
        blocks.lineBetween(entity.x + 8, y + 10, entity.x + entity.width - 8, y + 10);
      }
    }
    this.courseLayer.add(blocks);

    const decorations = this.add.graphics();
    const postFxLayer = this.add.container(0, 0);
    for (const entity of entities) {
      if (entity.type !== "decoration") {
        continue;
      }
      const y = this.worldOffsetY + entity.y;
      decorations.lineStyle(2, palette.decoration, 0.27);
      if (entity.kind === "diamond") {
        decorations.strokeTriangle(
          entity.x + entity.width / 2,
          y,
          entity.x + entity.width,
          y + entity.height / 2,
          entity.x + entity.width / 2,
          y + entity.height,
        );
        decorations.lineBetween(
          entity.x + entity.width / 2,
          y + entity.height,
          entity.x,
          y + entity.height / 2,
        );
      } else if (entity.kind === "beam") {
        decorations.lineBetween(entity.x, y + entity.height, entity.x + entity.width, y);
        decorations.lineBetween(entity.x + 12, y + entity.height, entity.x + entity.width + 12, y);
      } else if (entity.kind === "flash") {
        decorations.lineStyle(2, palette.accent, 0.5);
        decorations.strokeRect(entity.x, y, entity.width, entity.height);
        decorations.lineBetween(entity.x, y + entity.height / 2, entity.x + entity.width, y + entity.height / 2);
      } else if (entity.kind === "fog") {
        const fog = this.add.rectangle(
          entity.x + entity.width / 2,
          y + entity.height / 2,
          entity.width,
          entity.height,
          0xd8f8ff,
          0.07,
        );
        postFxLayer.add(fog);
      } else if (entity.kind === "dark") {
        const dark = this.add.rectangle(
          entity.x + entity.width / 2,
          y + entity.height / 2,
          entity.width,
          entity.height,
          0x02030a,
          0.4,
        );
        postFxLayer.add(dark);
      } else {
        decorations.strokeRect(entity.x, y, entity.width, entity.height);
      }
    }
    this.courseLayer.add(decorations);
    this.courseLayer.add(postFxLayer);
    this.postFxLayer = postFxLayer;

    const portals = this.add.graphics();
    for (const entity of entities) {
      if (entity.type !== "portal") {
        continue;
      }

      const y = this.worldOffsetY + entity.y;
      const portalColor = PORTAL_STYLE[entity.mode as "cube" | "ship"];
      portals.fillStyle(portalColor, 0.18);
      portals.fillRect(entity.x, y, entity.width, entity.height);
      portals.lineStyle(3, portalColor, 0.95);
      portals.strokeRect(entity.x, y, entity.width, entity.height);
    }
    this.courseLayer.add(portals);

    const pads = this.add.graphics();
    for (const entity of entities) {
      if (entity.type !== "pad") {
        continue;
      }

      const y = this.worldOffsetY + entity.y;
      pads.fillStyle(PAD_STYLE.fill, 0.85);
      pads.fillRect(entity.x, y, entity.width, entity.height);
      pads.lineStyle(2, PAD_STYLE.stroke, 0.95);
      pads.strokeRect(entity.x, y, entity.width, entity.height);
      pads.lineStyle(2, PAD_STYLE.stroke, 0.55);
      pads.lineBetween(entity.x + 6, y + 2, entity.x + entity.width - 6, y + 2);
    }
    this.courseLayer.add(pads);

    const orbs = this.add.graphics();
    for (const entity of entities) {
      if (entity.type !== "orb") {
        continue;
      }

      const centerX = entity.x + entity.width / 2;
      const centerY = this.worldOffsetY + entity.y + entity.height / 2;
      const radius = Math.min(entity.width, entity.height) / 2;

      orbs.fillStyle(ORB_STYLE.fill, 0.55);
      orbs.fillCircle(centerX, centerY, radius);
      orbs.lineStyle(2, ORB_STYLE.stroke, 0.95);
      orbs.strokeCircle(centerX, centerY, radius);
      orbs.lineStyle(2, ORB_STYLE.stroke, 0.45);
      orbs.strokeCircle(centerX, centerY, radius + 5);
    }
    this.courseLayer.add(orbs);

    const finishGate = this.add.graphics();
    const finishBaseY = this.worldOffsetY + rules.spawnY;
    finishGate.lineStyle(4, palette.accent, 0.85);
    finishGate.lineBetween(finishX, finishBaseY - 132, finishX, finishBaseY);
    finishGate.lineStyle(2, 0xecfcff, 0.62);
    finishGate.strokeCircle(finishX, finishBaseY - 145, 10);
    this.courseLayer.add(finishGate);
    this.courseLayer.add(
      this.add.text(finishX - 30, finishBaseY - 177, "FINISH", {
        color: "#ecfcff",
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        letterSpacing: 2,
      }),
    );

    const playerScreenX = width * 0.22;
    const playerScreenY = finishBaseY - rules.playerHeight / 2;
    const initialFill = playerFillFor(this.status, this.appearance);

    this.playerCube = applyPlayerStrokeStyle(
      createPlayerCube(
        this,
        this.appearance.cubeShape,
        playerScreenX,
        playerScreenY,
        rules.playerWidth,
        rules.playerHeight,
        initialFill,
      ),
    );

    this.playerShip = applyPlayerStrokeStyle(
      createPlayerShip(
        this,
        this.appearance.shipShape,
        playerScreenX,
        playerScreenY,
        rules.playerWidth,
        rules.playerHeight,
        initialFill,
      ),
    ).setVisible(false);

    this.updatePresentation();
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

    this.courseLayer?.setX(playerScreenX - this.state.player.x);
    this.playerCube
      ?.setVisible(!isShip)
      .setY(cubeScreenY)
      .setRotation(isShip ? 0 : cubeRotation)
      .setFillStyle(fillColor);
    this.playerShip
      ?.setVisible(isShip)
      .setY(simulationCenterY)
      .setRotation(this.state.player.velocityY * 0.0006)
      .setFillStyle(fillColor);
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
    const key = JSON.stringify(snapshot);

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
