import Phaser from "phaser";
import {
  createRunState,
  resetRunState,
  tickRun,
  type LevelEntity,
  type RunRules,
  type RunState,
} from "../core/run-simulation";

const LOBBY_SCENE_KEY = "lobby-backdrop";
const FIRST_WAKE_SCENE_KEY = "first-wake";

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

export interface FirstWakeSnapshot {
  attempt: number;
  deathCause?: "fall" | "spike";
  percent: number;
  status: "complete" | "dead" | "running";
}

const FIRST_WAKE_RULES: RunRules = {
  fallBoundaryY: 420,
  gravity: 1250,
  groundY: 300,
  horizontalSpeed: 190,
  jumpVelocity: -540,
  playerHeight: 34,
  playerWidth: 34,
};
const FIRST_WAKE_ENTITIES: readonly LevelEntity[] = [
  { type: "spike", height: 30, width: 30, x: 160, y: 270 },
  { type: "spike", height: 30, width: 30, x: 425, y: 270 },
];
const FIRST_WAKE_FINISH_X = 690;
const SIMULATION_STEP_MS = 1000 / 60;

class FirstWakeScene extends Phaser.Scene {
  private accumulator = 0;
  private attempt = 1;
  private courseLayer?: Phaser.GameObjects.Container;
  private floorY = 0;
  private jumpQueued = false;
  private lastSnapshotKey = "";
  private onSnapshot?: (snapshot: FirstWakeSnapshot) => void;
  private paused = false;
  private player?: Phaser.GameObjects.Rectangle;
  private state: RunState = createRunState(FIRST_WAKE_RULES);
  private status: FirstWakeSnapshot["status"] = "running";

  constructor() {
    super(FIRST_WAKE_SCENE_KEY);
  }

  create(): void {
    this.accumulator = 0;
    this.attempt = 1;
    this.jumpQueued = false;
    this.paused = false;
    this.state = createRunState(FIRST_WAKE_RULES);
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
      this.state = tickRun(
        this.state,
        { jumpPressed: this.jumpQueued },
        SIMULATION_STEP_MS,
        FIRST_WAKE_RULES,
        FIRST_WAKE_ENTITIES,
      );
      this.jumpQueued = false;
      this.accumulator -= SIMULATION_STEP_MS;

      if (this.state.status === "dead") {
        this.status = "dead";
        break;
      }

      if (this.state.player.x >= FIRST_WAKE_FINISH_X) {
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

  jump(): boolean {
    if (
      this.paused ||
      this.status !== "running" ||
      this.jumpQueued ||
      !this.state.player.grounded
    ) {
      return false;
    }

    this.jumpQueued = true;
    return true;
  }

  restart(): void {
    this.accumulator = 0;
    this.attempt += 1;
    this.jumpQueued = false;
    this.paused = false;
    this.state = resetRunState(this.state, FIRST_WAKE_RULES);
    this.status = "running";
    this.updatePresentation();
    this.publishSnapshot(true);
  }

  setSnapshotListener(
    listener: ((snapshot: FirstWakeSnapshot) => void) | undefined,
  ): void {
    this.onSnapshot = listener;
    this.publishSnapshot(true);
  }

  private drawScene(): void {
    const width = this.scale.width;
    const height = this.scale.height;

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
    track.fillRect(-180, this.floorY, FIRST_WAKE_FINISH_X + width, height - this.floorY);
    track.lineStyle(3, 0x19d9f3, 0.75);
    track.lineBetween(-180, this.floorY, FIRST_WAKE_FINISH_X + width, this.floorY);
    track.lineStyle(2, 0xa45bff, 0.44);
    for (let x = 30; x < FIRST_WAKE_FINISH_X + width; x += 110) {
      track.lineBetween(x, this.floorY + 35, x + 48, this.floorY + 35);
    }
    this.courseLayer.add(track);

    const hazards = this.add.graphics();
    hazards.fillStyle(0xff437d, 1);
    for (const entity of FIRST_WAKE_ENTITIES) {
      if (entity.type !== "spike") {
        continue;
      }

      const y = this.floorY + entity.y - FIRST_WAKE_RULES.groundY;
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

    const finishGate = this.add.graphics();
    finishGate.lineStyle(4, 0x19d9f3, 0.85);
    finishGate.lineBetween(FIRST_WAKE_FINISH_X, this.floorY - 132, FIRST_WAKE_FINISH_X, this.floorY);
    finishGate.lineStyle(2, 0xecfcff, 0.62);
    finishGate.strokeCircle(FIRST_WAKE_FINISH_X, this.floorY - 145, 10);
    this.courseLayer.add(finishGate);
    this.courseLayer.add(
      this.add.text(FIRST_WAKE_FINISH_X - 30, this.floorY - 177, "FINISH", {
        color: "#ecfcff",
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        letterSpacing: 2,
      }),
    );

    this.player = this.add
      .rectangle(
        width * 0.22,
        this.floorY - FIRST_WAKE_RULES.playerHeight / 2,
        FIRST_WAKE_RULES.playerWidth,
        FIRST_WAKE_RULES.playerHeight,
        0x19d9f3,
      )
      .setStrokeStyle(3, 0xecfcff, 0.85);

    this.add
      .rectangle(width * 0.22, this.floorY + 2, 80, 3, 0x19d9f3, 0.28)
      .setOrigin(0.5, 0);

    this.updatePresentation();
  }

  private updatePresentation(): void {
    const playerScreenX = this.scale.width * 0.22;
    const playerScreenY =
      this.floorY +
      this.state.player.y -
      FIRST_WAKE_RULES.groundY -
      FIRST_WAKE_RULES.playerHeight / 2;

    this.courseLayer?.setX(playerScreenX - this.state.player.x);
    this.player
      ?.setY(playerScreenY)
      .setRotation(this.state.player.x / 62)
      .setFillStyle(this.status === "dead" ? 0xff437d : 0x19d9f3);
  }

  private publishSnapshot(force = false): void {
    const percent =
      this.status === "complete"
        ? 100
        : Math.min(99, Math.floor((this.state.player.x / FIRST_WAKE_FINISH_X) * 100));
    const snapshot: FirstWakeSnapshot = {
      attempt: this.attempt,
      ...(this.state.deathCause ? { deathCause: this.state.deathCause } : {}),
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
  jumpFirstWake(): boolean;
  restartFirstWake(): void;
  setFirstWakeSnapshotListener(
    listener: ((snapshot: FirstWakeSnapshot) => void) | undefined,
  ): void;
  setFirstWakePaused(paused: boolean): void;
  showLobby(): void;
  showFirstWake(): void;
}

export function startLobbyBackdrop(parent: HTMLElement): BackdropController {
  let requestedScene = LOBBY_SCENE_KEY;
  let scenesReady = false;
  let snapshotListener: ((snapshot: FirstWakeSnapshot) => void) | undefined;
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

    const inactiveScene =
      requestedScene === LOBBY_SCENE_KEY ? FIRST_WAKE_SCENE_KEY : LOBBY_SCENE_KEY;

    if (game.scene.isActive(inactiveScene)) {
      game.scene.stop(inactiveScene);
    }

    if (!game.scene.isActive(requestedScene)) {
      game.scene.start(requestedScene);
    }
  };

  game.events.once(Phaser.Core.Events.READY, () => {
    game.scene.add(FIRST_WAKE_SCENE_KEY, FirstWakeScene, false);
    (game.scene.getScene(FIRST_WAKE_SCENE_KEY) as FirstWakeScene).setSnapshotListener(
      snapshotListener,
    );
    scenesReady = true;
    applyRequestedScene();
  });

  return {
    destroy: (removeCanvas = false) => game.destroy(removeCanvas),
    jumpFirstWake: () => {
      if (game.scene.isActive(FIRST_WAKE_SCENE_KEY)) {
        return (game.scene.getScene(FIRST_WAKE_SCENE_KEY) as FirstWakeScene).jump();
      }

      return false;
    },
    restartFirstWake: () => {
      if (game.scene.isActive(FIRST_WAKE_SCENE_KEY)) {
        (game.scene.getScene(FIRST_WAKE_SCENE_KEY) as FirstWakeScene).restart();
      }
    },
    setFirstWakeSnapshotListener: (listener) => {
      snapshotListener = listener;

      if (scenesReady) {
        (game.scene.getScene(FIRST_WAKE_SCENE_KEY) as FirstWakeScene).setSnapshotListener(
          listener,
        );
      }
    },
    setFirstWakePaused: (paused: boolean) => {
      if (game.scene.isActive(FIRST_WAKE_SCENE_KEY)) {
        (game.scene.getScene(FIRST_WAKE_SCENE_KEY) as FirstWakeScene).setPaused(
          paused,
        );
      }
    },
    showLobby: () => {
      requestedScene = LOBBY_SCENE_KEY;
      applyRequestedScene();
    },
    showFirstWake: () => {
      requestedScene = FIRST_WAKE_SCENE_KEY;
      applyRequestedScene();
    },
  };
}
