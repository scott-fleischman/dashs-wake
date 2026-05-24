import Phaser from "phaser";

const LOBBY_SCENE_KEY = "lobby-backdrop";
const PRACTICE_SCENE_KEY = "practice-lane";

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

interface MovingMarker {
  object: Phaser.GameObjects.Rectangle;
  startX: number;
}

class PracticeLaneScene extends Phaser.Scene {
  private elapsed = 0;
  private floorY = 0;
  private movingMarkers: MovingMarker[] = [];
  private player?: Phaser.GameObjects.Rectangle;
  private pulseRemaining = 0;
  private running = true;

  constructor() {
    super(PRACTICE_SCENE_KEY);
  }

  create(): void {
    this.elapsed = 0;
    this.pulseRemaining = 0;
    this.running = true;
    this.drawScene();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.drawScene, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.drawScene, this);
    });
  }

  update(_time: number, delta: number): void {
    if (!this.running) {
      return;
    }

    this.elapsed += delta;
    this.pulseRemaining = Math.max(0, this.pulseRemaining - delta);

    const span = this.scale.width + 180;
    const distance = (this.elapsed * 0.22) % span;

    for (const marker of this.movingMarkers) {
      marker.object.x = ((marker.startX - distance + span) % span) - 70;
    }

    const pulseProgress = this.pulseRemaining / 360;
    const lift = Math.sin((1 - pulseProgress) * Math.PI) * 56;
    const baseline = this.floorY - 27;

    this.player
      ?.setY(baseline - lift)
      .setRotation(this.elapsed / 350)
      .setFillStyle(this.pulseRemaining > 0 ? 0xecfcff : 0x19d9f3);
  }

  setPaused(paused: boolean): void {
    this.running = !paused;
  }

  pulsePlayer(): void {
    if (this.running) {
      this.pulseRemaining = 360;
    }
  }

  private drawScene(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.children.removeAll();
    this.floorY = height * 0.71;
    this.movingMarkers = [];

    const wash = this.add.graphics();
    wash.fillGradientStyle(0x07111d, 0x07111d, 0x112037, 0x112037, 1);
    wash.fillRect(0, 0, width, height);

    const horizon = this.add.graphics();
    horizon.lineStyle(1, 0x19d9f3, 0.16);
    for (let y = this.floorY - 150; y < this.floorY; y += 38) {
      horizon.lineBetween(0, y, width, y);
    }

    const track = this.add.graphics();
    track.fillStyle(0x0d1d2d, 1);
    track.fillRect(0, this.floorY, width, height - this.floorY);
    track.lineStyle(3, 0x19d9f3, 0.75);
    track.lineBetween(0, this.floorY, width, this.floorY);

    const markerSpacing = 138;
    const markerCount = Math.ceil((width + 180) / markerSpacing) + 1;

    for (let index = 0; index < markerCount; index += 1) {
      const startX = index * markerSpacing;
      const marker = this.add
        .rectangle(startX, this.floorY + 34, 52, 3, 0xa45bff, 0.58)
        .setOrigin(0, 0.5);
      this.movingMarkers.push({ object: marker, startX });

      if (index % 3 === 2) {
        const obstacle = this.add
          .rectangle(startX + 70, this.floorY - 15, 22, 22, 0xa45bff, 0.34)
          .setRotation(Math.PI / 4);
        this.movingMarkers.push({ object: obstacle, startX: startX + 70 });
      }
    }

    this.player = this.add
      .rectangle(width * 0.22, this.floorY - 27, 38, 38, 0x19d9f3)
      .setStrokeStyle(3, 0xecfcff, 0.85);

    this.add
      .rectangle(width * 0.22, this.floorY + 2, 80, 3, 0x19d9f3, 0.28)
      .setOrigin(0.5, 0);
  }
}

export interface BackdropController {
  destroy(removeCanvas?: boolean): void;
  pulsePlayer(): void;
  setPracticePaused(paused: boolean): void;
  showLobby(): void;
  showPractice(): void;
}

export function startLobbyBackdrop(parent: HTMLElement): BackdropController {
  let requestedScene = LOBBY_SCENE_KEY;
  let scenesReady = false;
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
      requestedScene === LOBBY_SCENE_KEY ? PRACTICE_SCENE_KEY : LOBBY_SCENE_KEY;

    if (game.scene.isActive(inactiveScene)) {
      game.scene.stop(inactiveScene);
    }

    if (!game.scene.isActive(requestedScene)) {
      game.scene.start(requestedScene);
    }
  };

  game.events.once(Phaser.Core.Events.READY, () => {
    game.scene.add(PRACTICE_SCENE_KEY, PracticeLaneScene, false);
    scenesReady = true;
    applyRequestedScene();
  });

  return {
    destroy: (removeCanvas = false) => game.destroy(removeCanvas),
    pulsePlayer: () => {
      if (game.scene.isActive(PRACTICE_SCENE_KEY)) {
        (game.scene.getScene(PRACTICE_SCENE_KEY) as PracticeLaneScene).pulsePlayer();
      }
    },
    setPracticePaused: (paused: boolean) => {
      if (game.scene.isActive(PRACTICE_SCENE_KEY)) {
        (game.scene.getScene(PRACTICE_SCENE_KEY) as PracticeLaneScene).setPaused(
          paused,
        );
      }
    },
    showLobby: () => {
      requestedScene = LOBBY_SCENE_KEY;
      applyRequestedScene();
    },
    showPractice: () => {
      requestedScene = PRACTICE_SCENE_KEY;
      applyRequestedScene();
    },
  };
}
