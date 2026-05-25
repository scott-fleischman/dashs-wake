import Phaser from "phaser";
import { firstWakeLevel, type LevelContent } from "../content/first-wake";
import {
  createRunState,
  resetRunState,
  tickRun,
  type RunState,
} from "../core/run-simulation";

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

    const track = this.add.graphics();
    track.lineStyle(3, 0x19d9f3, 0.36);
    track.lineBetween(0, horizon, width, horizon);
    track.lineStyle(1, 0x7c47ff, 0.46);
    track.lineBetween(0, horizon + 10, width, horizon + 10);

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
  deathCause?: "fall" | "spike";
  mode: "cube" | "ship";
  percent: number;
  status: "complete" | "dead" | "running";
}

const SIMULATION_STEP_MS = 1000 / 60;

const PLAYER_STYLE = {
  fillRunning: 0x19d9f3,
  fillDead: 0xff437d,
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

function playerFillFor(status: LevelSnapshot["status"]): number {
  return status === "dead" ? PLAYER_STYLE.fillDead : PLAYER_STYLE.fillRunning;
}

function applyPlayerStrokeStyle<
  T extends Phaser.GameObjects.Rectangle | Phaser.GameObjects.Triangle,
>(shape: T): T {
  shape.setStrokeStyle(
    PLAYER_STYLE.strokeWidth,
    PLAYER_STYLE.stroke,
    PLAYER_STYLE.strokeAlpha,
  );
  return shape;
}

interface LevelSceneInitData {
  levelContent?: LevelContent;
}

class LevelScene extends Phaser.Scene {
  private accumulator = 0;
  private attempt = 1;
  private courseLayer?: Phaser.GameObjects.Container;
  private cubeJumpPending = false;
  private floorY = 0;
  private jumpHeld = false;
  private lastSnapshotKey = "";
  private levelContent: LevelContent = firstWakeLevel;
  private onSnapshot?: (snapshot: LevelSnapshot) => void;
  private paused = false;
  private playerCube?: Phaser.GameObjects.Rectangle;
  private playerShip?: Phaser.GameObjects.Triangle;
  private state: RunState = createRunState(firstWakeLevel.rules);
  private status: LevelSnapshot["status"] = "running";

  constructor() {
    super(LEVEL_SCENE_KEY);
  }

  init(data: LevelSceneInitData): void {
    if (data.levelContent) {
      this.levelContent = data.levelContent;
    }
  }

  create(): void {
    this.accumulator = 0;
    this.attempt = 1;
    this.cubeJumpPending = false;
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

    this.accumulator += Math.min(delta, 100);

    while (this.accumulator >= SIMULATION_STEP_MS) {
      const jumpPressed =
        this.state.player.mode === "ship"
          ? this.jumpHeld
          : this.cubeJumpPending;
      this.state = tickRun(
        this.state,
        { jumpPressed },
        SIMULATION_STEP_MS,
        this.levelContent.rules,
        this.levelContent.entities,
      );
      this.cubeJumpPending = false;
      this.accumulator -= SIMULATION_STEP_MS;

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

  setJumpHeld(held: boolean): boolean {
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

    if (this.cubeJumpPending || !this.state.player.grounded) {
      return false;
    }

    this.cubeJumpPending = true;
    return true;
  }

  restart(): void {
    this.accumulator = 0;
    this.attempt += 1;
    this.cubeJumpPending = false;
    this.jumpHeld = false;
    this.paused = false;
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

    this.children.removeAll();
    this.floorY = height * 0.71;

    const wash = this.add.graphics();
    wash.fillGradientStyle(0x07111d, 0x07111d, 0x112037, 0x112037, 1);
    wash.fillRect(0, 0, width, height);

    const horizon = this.add.graphics();
    horizon.lineStyle(1, 0x19d9f3, 0.16);
    for (let y = this.floorY - 150; y < this.floorY; y += 38) {
      horizon.lineBetween(0, y, width, y);
    }

    this.courseLayer = this.add.container(0, 0);

    const track = this.add.graphics();
    track.fillStyle(0x0d1d2d, 1);
    track.fillRect(-180, this.floorY, finishX + width, height - this.floorY);
    track.lineStyle(3, 0x19d9f3, 0.75);
    track.lineBetween(-180, this.floorY, finishX + width, this.floorY);
    track.lineStyle(2, 0xa45bff, 0.44);
    for (let x = 30; x < finishX + width; x += 110) {
      track.lineBetween(x, this.floorY + 35, x + 48, this.floorY + 35);
    }
    this.courseLayer.add(track);

    const hazards = this.add.graphics();
    hazards.fillStyle(0xff437d, 1);
    for (const entity of entities) {
      if (entity.type !== "spike") {
        continue;
      }

      const y = this.floorY + entity.y - rules.groundY;
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

    const portals = this.add.graphics();
    for (const entity of entities) {
      if (entity.type !== "portal") {
        continue;
      }

      const y = this.floorY + entity.y - rules.groundY;
      const portalColor = PORTAL_STYLE[entity.mode];
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

      const y = this.floorY + entity.y - rules.groundY;
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
      const centerY = this.floorY + entity.y - rules.groundY + entity.height / 2;
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
    finishGate.lineStyle(4, 0x19d9f3, 0.85);
    finishGate.lineBetween(finishX, this.floorY - 132, finishX, this.floorY);
    finishGate.lineStyle(2, 0xecfcff, 0.62);
    finishGate.strokeCircle(finishX, this.floorY - 145, 10);
    this.courseLayer.add(finishGate);
    this.courseLayer.add(
      this.add.text(finishX - 30, this.floorY - 177, "FINISH", {
        color: "#ecfcff",
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        letterSpacing: 2,
      }),
    );

    const playerScreenX = width * 0.22;
    const playerScreenY = this.floorY - rules.playerHeight / 2;
    const halfWidth = rules.playerWidth / 2;
    const halfHeight = rules.playerHeight / 2;
    const initialFill = playerFillFor(this.status);

    this.playerCube = applyPlayerStrokeStyle(
      this.add.rectangle(
        playerScreenX,
        playerScreenY,
        rules.playerWidth,
        rules.playerHeight,
        initialFill,
      ),
    );

    this.playerShip = applyPlayerStrokeStyle(
      this.add.triangle(
        playerScreenX,
        playerScreenY,
        -halfWidth,
        -halfHeight,
        halfWidth,
        0,
        -halfWidth,
        halfHeight,
        initialFill,
      ),
    ).setVisible(false);

    this.add
      .rectangle(
        playerScreenX,
        this.floorY + 2,
        80,
        3,
        PLAYER_STYLE.fillRunning,
        0.28,
      )
      .setOrigin(0.5, 0);

    this.updatePresentation();
  }

  private updatePresentation(): void {
    const rules = this.levelContent.rules;
    const playerScreenX = this.scale.width * 0.22;
    const playerScreenY =
      this.floorY +
      this.state.player.y -
      rules.groundY -
      rules.playerHeight / 2;
    const isShip = this.state.player.mode === "ship";
    const fillColor = playerFillFor(this.status);

    this.courseLayer?.setX(playerScreenX - this.state.player.x);
    this.playerCube
      ?.setVisible(!isShip)
      .setY(playerScreenY)
      .setRotation(isShip ? 0 : this.state.player.x / 62)
      .setFillStyle(fillColor);
    this.playerShip
      ?.setVisible(isShip)
      .setY(playerScreenY)
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
  showLobby(): void;
  showLevel(content: LevelContent): void;
}

export function startLobbyBackdrop(parent: HTMLElement): BackdropController {
  let requestedScene = LOBBY_SCENE_KEY;
  let scenesReady = false;
  let snapshotListener: ((snapshot: LevelSnapshot) => void) | undefined;
  let pendingLevelContent: LevelContent | undefined;
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
      levelContent: pendingLevelContent ?? firstWakeLevel,
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
    showLobby: () => {
      requestedScene = LOBBY_SCENE_KEY;
      applyRequestedScene();
    },
    showLevel: (content: LevelContent) => {
      pendingLevelContent = content;
      requestedScene = LEVEL_SCENE_KEY;
      applyRequestedScene();
    },
  };
}
