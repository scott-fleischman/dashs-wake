// Content builders must not import runtime values from first-wake.ts.
// first-wake initializes from buildEpicLevel, so reading firstWakeLevel
// during that init causes a circular-import crash and a blank app screen.
// Shared physics/rules live in level-rules.ts instead.
import type { LevelEntity, OrbEntity } from "../core/run-simulation";
import type { ExpectedRoute, LevelContent } from "./official-course";
import { beatsForOfficialTrack, beatLengthPx } from "./official-course";
import { OFFICIAL_LEVEL_RULES } from "./level-rules";
import { buildOfficialBeatMap } from "./official-soundtrack";
import { SHIP_FLOOR_Y, withSupportingTerrain, type FlightChannel } from "./terrain";

type SectionKind =
  | "air-orb"
  | "air-trap"
  | "cube-intro"
  | "cube-pad"
  | "cube-run"
  | "cube-tech"
  | "ship-cave"
  | "ship-open";

export interface EpicSection {
  kind: SectionKind;
  /** Relative weight; scaled to the official track beat budget. */
  lengthBeats: number;
  loft?: boolean;
  pulse?: boolean;
}

export interface EpicLevelConfig {
  id: string;
  bpm: number;
  sections: readonly EpicSection[];
  /** When set, every impulse orb id in air-orb sections is required for reachability. */
  requireOrbRoute?: boolean;
}

function beatX(beat: number, bpm: number): number {
  return Math.round(beat * beatLengthPx(bpm));
}

function allocateSectionBeats(
  sections: readonly EpicSection[],
  totalBeats: number,
): readonly number[] {
  const weightSum = sections.reduce((sum, section) => sum + section.lengthBeats, 0);
  const allocated: number[] = [];
  let used = 0;

  for (let index = 0; index < sections.length; index += 1) {
    if (index === sections.length - 1) {
      allocated.push(Math.max(4, totalBeats - used));
      break;
    }

    const beats = Math.max(
      4,
      Math.round((sections[index]!.lengthBeats / weightSum) * totalBeats),
    );
    allocated.push(beats);
    used += beats;
  }

  return allocated;
}

function pushSpike(
  entities: LevelEntity[],
  x: number,
  loft: boolean,
): void {
  entities.push({
    type: "spike",
    x,
    y: loft ? 250 : 270,
    width: 30,
    height: 30,
  });
}

function pushPad(
  entities: LevelEntity[],
  config: EpicLevelConfig,
  triggerCounter: number,
  x: number,
  pulse: boolean,
): number {
  entities.push({
    type: "pad",
    id: `${config.id}-pad-${triggerCounter}`,
    impulse: pulse ? 760 : 720,
    x,
    y: 282,
    width: 40,
    height: 18,
  });
  return triggerCounter + 1;
}

function pushOrb(
  entities: LevelEntity[],
  config: EpicLevelConfig,
  triggerCounter: number,
  x: number,
  loft: boolean,
  pulse: boolean,
  trap: boolean,
): { counter: number; id: string } {
  const id = trap
    ? `${config.id}-trap-${triggerCounter}`
    : `${config.id}-orb-${triggerCounter}`;
  const entity: OrbEntity = {
    type: "orb",
    id,
    effect: { kind: "impulse", magnitude: pulse ? 760 : 720 },
    x: x + 10,
    y: loft ? 140 : 170,
    width: 62,
    height: 76,
  };
  entities.push(entity);
  return { counter: triggerCounter + 1, id };
}

export function buildEpicLevel(config: EpicLevelConfig): LevelContent {
  const entities: LevelEntity[] = [];
  const channels: FlightChannel[] = [];
  const requiredTriggerIds: string[] = [];
  let beatCursor = 2;
  let triggerCounter = 1;
  const sectionBeats = allocateSectionBeats(
    config.sections,
    beatsForOfficialTrack(config.id, config.bpm),
  );

  for (let sectionIndex = 0; sectionIndex < config.sections.length; sectionIndex += 1) {
    const section = config.sections[sectionIndex]!;
    const sectionLength = sectionBeats[sectionIndex]!;
    const sectionStartX = beatX(beatCursor, config.bpm);
    const sectionEndBeat = beatCursor + sectionLength;
    const sectionEndX = beatX(sectionEndBeat, config.bpm);

    if (section.kind === "ship-open" || section.kind === "ship-cave") {
      const hard = section.kind === "ship-cave";
      entities.push({
        type: "portal",
        mode: "ship",
        x: sectionStartX - 40,
        y: 36,
        width: 12,
        height: 360,
      });
      entities.push({
        type: "portal",
        mode: "cube",
        x: sectionEndX - 80,
        y: 36,
        width: 12,
        height: 360,
      });
      channels.push({
        startX: sectionStartX - 80,
        endX: sectionEndX + 80,
        ceilingBottomY: hard ? (section.loft ? 70 : 56) : 96,
        lowerSurfaceY: SHIP_FLOOR_Y,
        gates: hard
          ? [
              {
                edge: "ceiling",
                x: sectionStartX + 220,
                width: 80,
                limitY: 170,
              },
              {
                edge: "lower",
                x: sectionStartX + 420,
                width: 100,
                limitY: 245,
              },
              {
                edge: "ceiling",
                x: sectionStartX + 640,
                width: 90,
                limitY: 150,
              },
            ]
          : [],
      });
      if (hard) {
        for (let x = sectionStartX + 120; x < sectionEndX - 160; x += 170) {
          pushSpike(entities, x, Boolean(section.loft));
        }
      }
    } else if (section.kind === "air-orb" || section.kind === "air-trap") {
      for (let beat = beatCursor; beat < sectionEndBeat; beat += 2) {
        const x = beatX(beat, config.bpm);
        pushSpike(entities, x, Boolean(section.loft));
        const trap =
          section.kind === "air-trap" && (beat - beatCursor) % 6 === 2;
        const orb = pushOrb(
          entities,
          config,
          triggerCounter,
          x,
          Boolean(section.loft),
          Boolean(section.pulse),
          trap,
        );
        triggerCounter = orb.counter;
        if (trap) {
          entities.push({
            type: "spike",
            x: x + 55,
            y: 200,
            width: 30,
            height: 30,
          });
        }
        if (!trap && config.requireOrbRoute) {
          requiredTriggerIds.push(orb.id);
        }
      }
    } else if (section.kind === "cube-pad") {
      for (let beat = beatCursor; beat < sectionEndBeat; beat += 1) {
        const beatInSection = beat - beatCursor;
        const x = beatX(beat, config.bpm);
        if (beatInSection % 6 === 0) {
          triggerCounter = pushPad(
            entities,
            config,
            triggerCounter,
            x,
            Boolean(section.pulse),
          );
        } else if (beatInSection % 4 === 2) {
          pushSpike(entities, x, Boolean(section.loft));
        }
      }
    } else if (section.kind === "cube-intro") {
      for (let beat = beatCursor + 4; beat < sectionEndBeat; beat += 6) {
        pushSpike(entities, beatX(beat, config.bpm), Boolean(section.loft));
      }
    } else if (section.kind === "cube-run") {
      // Rhythm pacing without new hazards (used after ship exits).
    } else {
      for (let beat = beatCursor; beat < sectionEndBeat; beat += 1) {
        const beatInSection = beat - beatCursor;
        const x = beatX(beat, config.bpm);
        if (beatInSection % 2 === 0) {
          pushSpike(entities, x, Boolean(section.loft));
        }
        if (beatInSection % 8 === 4) {
          triggerCounter = pushPad(
            entities,
            config,
            triggerCounter,
            x,
            Boolean(section.pulse),
          );
        }
      }
    }

    entities.push({
      type: "decoration",
      kind: section.pulse ? "flash" : "beam",
      x: sectionStartX + 40,
      y: 112,
      width: 180,
      height: 88,
    });
    entities.push({
      type: "decoration",
      kind: section.loft ? "dark" : "fog",
      x: sectionStartX + 200,
      y: section.loft ? 0 : 70,
      width: Math.max(240, sectionEndX - sectionStartX - 120),
      height: section.loft ? 170 : 120,
    });

    beatCursor = sectionEndBeat;
  }

  const finishX = beatX(beatCursor + 2, config.bpm);
  const expectedRoute: ExpectedRoute | undefined =
    requiredTriggerIds.length > 0
      ? { requiredTriggerIds }
      : undefined;

  return {
    beatMap: buildOfficialBeatMap(config.id),
    entities: withSupportingTerrain(entities, finishX, channels),
    finishX,
    rules: OFFICIAL_LEVEL_RULES,
    ...(expectedRoute ? { expectedRoute } : {}),
  };
}
