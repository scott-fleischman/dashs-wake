import type { LevelEntity } from "../core/run-simulation";
import { firstWakeLevel, type LevelContent } from "./first-wake";
import { buildOfficialBeatMap } from "./official-soundtrack";
import { withSupportingTerrain, type FlightChannel } from "./terrain";

type SectionKind = "cube-tech" | "ship-cave" | "air-orb";

export interface EpicSection {
  kind: SectionKind;
  lengthBeats: number;
  loft?: boolean;
  pulse?: boolean;
}

export interface EpicLevelConfig {
  id: string;
  bpm: number;
  sections: readonly EpicSection[];
}

function beatX(beat: number, bpm: number): number {
  return Math.round(beat * (60 / bpm) * firstWakeLevel.rules.horizontalSpeed);
}

export function buildEpicLevel(config: EpicLevelConfig): LevelContent {
  const entities: LevelEntity[] = [];
  const channels: FlightChannel[] = [];
  let beatCursor = 2;
  let triggerCounter = 1;

  for (const section of config.sections) {
    const sectionStartX = beatX(beatCursor, config.bpm);
    const sectionEndBeat = beatCursor + section.lengthBeats;
    const sectionEndX = beatX(sectionEndBeat, config.bpm);

    if (section.kind === "ship-cave") {
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
        ceilingBottomY: section.loft ? 70 : 56,
        lowerSurfaceY: section.loft ? 350 : 330,
        gates: [
          { edge: "ceiling", x: sectionStartX + 220, width: 80, limitY: 170 },
          { edge: "lower", x: sectionStartX + 420, width: 100, limitY: 245 },
          { edge: "ceiling", x: sectionStartX + 640, width: 90, limitY: 150 },
        ],
      });
      for (let x = sectionStartX + 120; x < sectionEndX - 160; x += 170) {
        entities.push({
          type: "spike",
          x,
          y: section.loft ? 320 : 300,
          width: 30,
          height: 30,
        });
      }
    } else if (section.kind === "air-orb") {
      for (let beat = beatCursor; beat < sectionEndBeat; beat += 2) {
        const x = beatX(beat, config.bpm);
        entities.push({
          type: "spike",
          x,
          y: 270,
          width: 30,
          height: 30,
        });
        entities.push({
          type: "orb",
          id: `${config.id}-orb-${triggerCounter}`,
          effect: { kind: "impulse", magnitude: section.pulse ? 760 : 720 },
          x: x + 10,
          y: section.loft ? 140 : 170,
          width: 62,
          height: 76,
        });
        triggerCounter += 1;
      }
    } else {
      for (let beat = beatCursor; beat < sectionEndBeat; beat += 2) {
        const x = beatX(beat, config.bpm);
        entities.push({ type: "spike", x, y: 270, width: 30, height: 30 });
        if (beat % 4 === 0) {
          entities.push({
            type: "pad",
            id: `${config.id}-pad-${triggerCounter}`,
            impulse: section.pulse ? 760 : 720,
            x: x + 46,
            y: 282,
            width: 40,
            height: 18,
          });
          triggerCounter += 1;
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
  return {
    beatMap: buildOfficialBeatMap(config.id),
    entities: withSupportingTerrain(entities, finishX, channels),
    finishX,
    rules: firstWakeLevel.rules,
  };
}
