import type { LevelEntity } from "../core/run-simulation";
import {
  cubes,
  CUBE,
  JUMP_REACH_Y,
  ORB_IMPULSE,
  ORB_STACK_SPACING,
  PAD_CHAIN_SPACING,
  PAD_IMPULSE,
  PAD_ONLY_RISE,
  SAFE_STEP_RISE,
  STEP_APPROACH_WIDTH,
  STEP_LANDING_WIDTH,
  STEP_SPAN_X,
} from "./jump-grid";
import {
  cubePlatform,
  decor,
  groundSpike,
  jumpOrb,
  launchPad,
  openPitChannel,
} from "./official-handcrafted-helpers";
import type { FlightChannel } from "./terrain";
import { SPAWN_SURFACE_Y } from "./terrain";
import type { CourseBuilder, PatternTag } from "./course-builder";
import { CourseBuilder as CourseBuilderClass } from "./course-builder";

export type AtomicPatternId =
  | "floor-run"
  | "stair-step"
  | "stair-gap"
  | "stair-spike-edge"
  | "pad-boost"
  | "pad-chain"
  | "jump-orb"
  | "orb-stack"
  | "fake-pad"
  | "spike-strip"
  | "fog"
  | "flash";

export interface AtomicPatternOptions {
  /** Floor-run width in player-cubes. */
  cubesWide?: number;
  /** Repeat count for stair, pad-chain, and orb-stack patterns. */
  count?: number;
  /** Stair-step repeat count (alias for count). */
  steps?: number;
  /** Mark jump orbs as required for reachability analysis. */
  required?: boolean;
}

export interface AtomicStampOrigin {
  idPrefix: string;
  surfaceY?: number;
  x: number;
}

export interface AtomicStampResult {
  channels: readonly FlightChannel[];
  entities: readonly LevelEntity[];
  tags: readonly PatternTag[];
  width: number;
}

function pitSpikes(startX: number, endX: number): LevelEntity[] {
  const spikes: LevelEntity[] = [];
  for (let pitX = startX + cubes(1); pitX < endX - cubes(2); pitX += cubes(3)) {
    spikes.push({
      type: "spike",
      height: 40,
      width: 40,
      x: pitX,
      y: 418,
    });
  }
  return spikes;
}

/** Continuous floor — glide straight across with support the whole way. */
export function floorRun(
  b: CourseBuilder,
  cubesWide = 6,
  options: { surfaceY?: number } = {},
): void {
  const surfaceY = options.surfaceY ?? b.surfaceY;
  const width = cubes(cubesWide);
  b.add(cubePlatform(b.x, surfaceY, width));
  b.advance(width);
  b.tag("rest");
}

/** Horizontal air gap after each takeoff so jump arcs clear block sides. */
const STEP_AIR_GAP = cubes(1);
/** Wider gap for pad/orb arcs that carry more horizontal momentum. */
const LAUNCH_AIR_GAP = cubes(2);

function stepUp(b: CourseBuilder): void {
  b.add(cubePlatform(b.x, b.surfaceY, STEP_APPROACH_WIDTH));
  b.advance(STEP_APPROACH_WIDTH);
  const nextSurface = b.surfaceY - SAFE_STEP_RISE;
  const landingX = b.x + STEP_AIR_GAP;
  b.add(cubePlatform(landingX, nextSurface, STEP_LANDING_WIDTH));
  b.surfaceY = nextSurface;
  b.advance(STEP_AIR_GAP + STEP_LANDING_WIDTH);
}

function stepDown(b: CourseBuilder): void {
  b.add(cubePlatform(b.x, b.surfaceY, STEP_APPROACH_WIDTH));
  b.advance(STEP_APPROACH_WIDTH);
  const nextSurface = b.surfaceY + SAFE_STEP_RISE;
  b.add(cubePlatform(b.x, nextSurface, STEP_LANDING_WIDTH));
  b.surfaceY = nextSurface;
  b.advance(STEP_LANDING_WIDTH);
}

/** One jump arc per riser; miss the jump and you face the next block. */
export function stairStep(
  b: CourseBuilder,
  options: { steps?: number } = {},
): void {
  const steps = Math.max(1, options.steps ?? 1);
  const startSurface = b.surfaceY;

  for (let step = 0; step < steps; step += 1) {
    stepUp(b);
  }
  for (let step = 0; step < steps; step += 1) {
    stepDown(b);
  }

  if (b.surfaceY !== startSurface) {
    b.add(cubePlatform(b.x, startSurface, STEP_LANDING_WIDTH));
    b.surfaceY = startSurface;
    b.advance(STEP_LANDING_WIDTH);
  }
  b.tag("jump", "vertical");
}

/** Stair steps on floating ledges over a spike pit. */
export function stairGap(
  b: CourseBuilder,
  options: { steps?: number } = {},
): void {
  const steps = Math.max(1, options.steps ?? 1);
  const startX = b.x;
  const startSurface = b.surfaceY;

  for (let step = 0; step < steps; step += 1) {
    stepUp(b);
  }
  b.channel(openPitChannel(startX - cubes(1), b.x));
  b.add(...pitSpikes(startX, b.x));

  for (let step = 0; step < steps; step += 1) {
    stepDown(b);
  }

  if (b.surfaceY !== startSurface) {
    b.add(cubePlatform(b.x, startSurface, STEP_LANDING_WIDTH));
    b.surfaceY = startSurface;
    b.advance(STEP_LANDING_WIDTH);
  }
  b.tag("jump", "gap", "vertical");
}

/** Stair steps with spikes in the pit below each gap. */
export function stairSpikeEdge(
  b: CourseBuilder,
  options: { steps?: number } = {},
): void {
  const steps = Math.max(1, options.steps ?? 2);
  const startX = b.x;
  const startSurface = b.surfaceY;

  for (let step = 0; step < steps; step += 1) {
    stepUp(b);
  }
  for (let step = 0; step < steps; step += 1) {
    stepDown(b);
  }

  if (b.surfaceY !== startSurface) {
    b.add(cubePlatform(b.x, startSurface, STEP_LANDING_WIDTH));
    b.surfaceY = startSurface;
    b.advance(STEP_LANDING_WIDTH);
  }

  b.channel(openPitChannel(startX - cubes(1), b.x));
  b.add(...pitSpikes(startX, b.x));
  for (let pitX = startX + STEP_APPROACH_WIDTH; pitX < b.x; pitX += STEP_APPROACH_WIDTH + STEP_AIR_GAP) {
    b.add(groundSpike(pitX));
  }
  b.tag("jump", "spike", "gap", "vertical");
}

/** Launch pad that throws the runner onto a ledge above jump height. */
export function padBoost(b: CourseBuilder): void {
  const startSurface = b.surfaceY;
  const targetSurface = startSurface - PAD_ONLY_RISE;

  b.add(cubePlatform(b.x, startSurface, STEP_APPROACH_WIDTH));
  b.add(launchPad(b.nextId("pad"), b.x + cubes(1), startSurface, PAD_IMPULSE));
  b.add(
    cubePlatform(b.x + STEP_APPROACH_WIDTH + LAUNCH_AIR_GAP, targetSurface, STEP_LANDING_WIDTH),
  );
  b.advance(STEP_APPROACH_WIDTH + LAUNCH_AIR_GAP + STEP_LANDING_WIDTH);
  stepDown(b);
  b.tag("pad", "vertical", "jump");
}

/** Passive pad chain — hold forward and bounce across automatically. */
export function padChain(
  b: CourseBuilder,
  options: { count?: number } = {},
): void {
  const count = Math.max(2, options.count ?? 3);
  const totalWidth = STEP_APPROACH_WIDTH + PAD_CHAIN_SPACING * (count - 1) + cubes(2);

  b.add(cubePlatform(b.x, b.surfaceY, totalWidth));
  for (let index = 0; index < count; index += 1) {
    const padX = b.x + cubes(1) + PAD_CHAIN_SPACING * index;
    b.add(launchPad(b.nextId("pad"), padX, b.surfaceY, PAD_IMPULSE));
  }
  b.advance(totalWidth);
  b.tag("pad", "rest");
}

/** Jump, then tap the orb mid-arc to reach a higher platform. */
export function jumpOrbPattern(b: CourseBuilder): void {
  const startSurface = b.surfaceY;
  const targetSurface = startSurface - SAFE_STEP_RISE * 2;
  const orbId = b.nextId("orb");

  b.add(cubePlatform(b.x, startSurface, STEP_APPROACH_WIDTH));
  b.add(
    jumpOrb(
      orbId,
      b.x + STEP_APPROACH_WIDTH + Math.round(LAUNCH_AIR_GAP * 0.5),
      startSurface - JUMP_REACH_Y + cubes(2),
      ORB_IMPULSE,
    ),
  );
  b.require(orbId);
  b.add(
    cubePlatform(
      b.x + STEP_APPROACH_WIDTH + LAUNCH_AIR_GAP,
      targetSurface,
      STEP_LANDING_WIDTH,
    ),
  );
  b.advance(STEP_APPROACH_WIDTH + LAUNCH_AIR_GAP + STEP_LANDING_WIDTH);
  stepDown(b);
  stepDown(b);
  b.tag("orb", "jump", "vertical");
}

/** Chain orbs upward, then land on a summit platform. */
export function orbStack(
  b: CourseBuilder,
  options: { count?: number; required?: boolean } = {},
): void {
  const count = Math.max(2, options.count ?? 3);
  const startSurface = b.surfaceY;
  const startX = b.x;

  b.add(cubePlatform(b.x, b.surfaceY, STEP_APPROACH_WIDTH));
  b.advance(STEP_APPROACH_WIDTH);

  for (let index = 0; index < count; index += 1) {
    const id = b.nextId("orb");
    const lift = SAFE_STEP_RISE * (index + 1);
    b.add(
      jumpOrb(
        id,
        startX + STEP_APPROACH_WIDTH + ORB_STACK_SPACING * index,
        startSurface - lift,
        ORB_IMPULSE,
      ),
    );
    if (options.required) {
      b.require(id);
    }
  }

  const summitY = startSurface - SAFE_STEP_RISE * (count + 1);
  const endX =
    startX + STEP_APPROACH_WIDTH + ORB_STACK_SPACING * (count - 1) + STEP_LANDING_WIDTH;
  b.x = endX - STEP_LANDING_WIDTH;
  b.add(cubePlatform(b.x, summitY, STEP_LANDING_WIDTH));
  b.advance(STEP_LANDING_WIDTH);
  b.add(cubePlatform(b.x, startSurface, STEP_LANDING_WIDTH));
  b.surfaceY = startSurface;
  b.advance(STEP_LANDING_WIDTH);
  b.tag("orb", "vertical", "jump");
}

/** Safe floor run with a visible decoy pad route (decoration-only for the solver). */
export function fakePadRoute(b: CourseBuilder): void {
  const startSurface = b.surfaceY;
  const width = cubes(10);

  b.add(cubePlatform(b.x, startSurface, width));
  b.add(decor("flash", b.x + cubes(3), startSurface - PAD_ONLY_RISE, cubes(4), cubes(3)));
  b.add(decor("beam", b.x + cubes(5), startSurface - PAD_ONLY_RISE - cubes(2), cubes(2), cubes(4)));
  b.add(decor("diamond", b.x + cubes(7), startSurface - cubes(2), cubes(2), cubes(2)));
  b.advance(width);
  b.tag("pad", "spike", "jump");
}

/** Short ground-spike cluster the conservative jump can clear. */
export function spikeStrip(
  b: CourseBuilder,
  options: { spikes?: number } = {},
): void {
  const spikes = Math.max(1, Math.min(3, options.spikes ?? 2));
  b.add(cubePlatform(b.x, b.surfaceY, cubes(2)));
  b.advance(cubes(2));
  for (let index = 0; index < spikes; index += 1) {
    b.add(groundSpike(b.x + index * CUBE));
  }
  b.advance(cubes(3 + spikes));
  b.tag("spike", "jump");
}

export function fogStrip(b: CourseBuilder): void {
  b.add({
    type: "decoration",
    kind: "fog",
    height: 100,
    width: cubes(6),
    x: b.x,
    y: 76,
  });
  b.advance(cubes(6));
  b.tag("lighting-dark");
}

export function flashStrip(b: CourseBuilder): void {
  b.add({
    type: "decoration",
    kind: "flash",
    height: 82,
    width: cubes(5),
    x: b.x,
    y: 112,
  });
  b.advance(cubes(5));
  b.tag("lighting-bright");
}

const ATOMIC_APPLIERS: Record<
  AtomicPatternId,
  (b: CourseBuilder, options: AtomicPatternOptions) => void
> = {
  "floor-run": (b, options) => floorRun(b, options.cubesWide ?? 6),
  "stair-step": (b, options) =>
    stairStep(b, { steps: options.steps ?? options.count ?? 2 }),
  "stair-gap": (b, options) =>
    stairGap(b, { steps: options.steps ?? options.count ?? 2 }),
  "stair-spike-edge": (b, options) =>
    stairSpikeEdge(b, { steps: options.steps ?? options.count ?? 2 }),
  "pad-boost": (b) => padBoost(b),
  "pad-chain": (b, options) => padChain(b, { count: options.count ?? 3 }),
  "jump-orb": (b) => jumpOrbPattern(b),
  "orb-stack": (b, options) =>
    orbStack(b, {
      count: options.count ?? 3,
      required: options.required ?? true,
    }),
  "fake-pad": (b) => fakePadRoute(b),
  "spike-strip": (b, options) => spikeStrip(b, { spikes: options.count ?? 2 }),
  fog: (b) => fogStrip(b),
  flash: (b) => flashStrip(b),
};

/** Apply a named atomic pattern to a course builder. */
export function applyAtomicPattern(
  b: CourseBuilder,
  id: AtomicPatternId,
  options: AtomicPatternOptions = {},
): void {
  ATOMIC_APPLIERS[id](b, options);
}

/** Stamp a pattern at an absolute origin for the editor or generator. */
export function stampAtomicPattern(
  id: AtomicPatternId,
  origin: AtomicStampOrigin,
  options: AtomicPatternOptions = {},
): AtomicStampResult {
  const b = new CourseBuilderClass({
    idPrefix: origin.idPrefix,
    startX: origin.x,
  });
  b.surfaceY = origin.surfaceY ?? SPAWN_SURFACE_Y;
  const startX = b.x;
  applyAtomicPattern(b, id, options);
  return {
    channels: b.channels,
    entities: b.entities,
    tags: b.tags,
    width: b.x - startX,
  };
}

export const ATOMIC_PATTERN_IDS = Object.keys(
  ATOMIC_APPLIERS,
) as AtomicPatternId[];

export const ATOMIC_PATTERN_LABELS: Record<AtomicPatternId, string> = {
  "floor-run": "Floor Run",
  "stair-step": "Stair Step",
  "stair-gap": "Stair Gap",
  "stair-spike-edge": "Stair + Spike",
  "pad-boost": "Pad Boost",
  "pad-chain": "Pad Chain",
  "jump-orb": "Jump + Orb",
  "orb-stack": "Orb Stack",
  "fake-pad": "Fake Pad",
  "spike-strip": "Spike Strip",
  fog: "Fog Strip",
  flash: "Flash Strip",
};
