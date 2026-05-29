import type { LevelEntity } from "../core/run-simulation";
import { assembleOfficialLevel, type LevelContent } from "./official-course";
import {
  buildStairPitSection,
  ceilingSpike,
  cubePlatform,
  decor,
  groundSpike,
  jumpOrb,
  launchPad,
  openPitChannel,
  shipChannel,
  shipPortalPair,
} from "./official-handcrafted-helpers";
import type { FlightChannel } from "./terrain";
import { SPAWN_SURFACE_Y } from "./terrain";

const FIRST_WAKE_FINISH = 4_720;

export const firstWakeLevel: LevelContent = assembleOfficialLevel(
  "level_1",
  [
    { type: "spike", height: 30, width: 30, x: 360, y: 270 },
    { type: "block", shape: "ramp-up", height: 70, width: 90, x: 520, y: 230 },
    { type: "block", height: 70, width: 150, x: 610, y: 230 },
    { type: "block", shape: "ramp-down", height: 70, width: 90, x: 760, y: 230 },
    groundSpike(1_120),
    groundSpike(1_150),
    groundSpike(1_180),
    groundSpike(1_520),
    groundSpike(1_560),
    ...shipPortalPair(2_040, 2_520),
    ...shipPortalPair(2_620, 3_520),
    { type: "spike", height: 30, width: 30, x: 3_720, y: 270 },
    { type: "spike", height: 30, width: 30, x: 4_120, y: 270 },
    decor("beam", 880, 48, 180, 140),
    decor("flash", 2_200, 20, 120, 90),
  ],
  FIRST_WAKE_FINISH,
  [shipChannel(2_000, 2_560), shipChannel(2_540, 3_600)],
);

const hollowRiseStair = buildStairPitSection(920, 8);

const hollowSummitStair = buildStairPitSection(2_360, 5, {
  firstSurfaceY: SPAWN_SURFACE_Y,
});

const HOLLOW_FINISH = 4_950;

export const hollowStepsLevel: LevelContent = assembleOfficialLevel(
  "level_2",
  [
    groundSpike(420),
    groundSpike(460),
    cubePlatform(560, SPAWN_SURFACE_Y, 100),
    ...hollowRiseStair.entities,
    cubePlatform(hollowRiseStair.endX + 36, SPAWN_SURFACE_Y, 160),
    launchPad("hollow-pad-1", 1_840, SPAWN_SURFACE_Y),
    groundSpike(2_040),
    ...hollowSummitStair.entities,
    cubePlatform(hollowSummitStair.endX + 32, SPAWN_SURFACE_Y, 140),
    launchPad("hollow-pad-2", 3_120, SPAWN_SURFACE_Y, 760),
    ...shipPortalPair(3_820, 4_420),
    ceilingSpike(4_060, 96),
    ceilingSpike(4_120, 96),
    cubePlatform(4_520, SPAWN_SURFACE_Y, 200),
    groundSpike(4_780),
    groundSpike(4_820),
    decor("pillar", 300, 120, 48, 200),
    decor("fog", 1_600, 60, 240, 180),
    decor("beam", 3_900, 24, 200, 120),
    decor("diamond", 4_900, 140, 36, 36),
  ],
  HOLLOW_FINISH,
  [
    hollowRiseStair.channel,
    openPitChannel(1_600, 1_760),
    hollowSummitStair.channel,
    shipChannel(3_780, 4_460, [
      { edge: "lower", limitY: 320, width: 64, x: 3_960 },
      { edge: "ceiling", limitY: 180, width: 56, x: 4_140 },
    ]),
  ],
);

const NEON_FINISH = 5_520;

const neonShipGates: FlightChannel["gates"] = [
  { edge: "lower", limitY: 300, width: 72, x: 2_480 },
  { edge: "ceiling", limitY: 168, width: 64, x: 2_680 },
  { edge: "lower", limitY: 280, width: 80, x: 2_920 },
  { edge: "ceiling", limitY: 152, width: 72, x: 3_180 },
];

export const neonDriftLevel: LevelContent = assembleOfficialLevel(
  "level_3",
  [
    groundSpike(480),
    groundSpike(520),
    launchPad("neon-pad-1", 640, SPAWN_SURFACE_Y),
    ...shipPortalPair(1_420, 2_120),
    ...shipPortalPair(2_220, 3_420),
    ceilingSpike(2_360, 96),
    ceilingSpike(2_520, 96),
    ceilingSpike(2_760, 96),
    ...shipPortalPair(3_520, 4_320),
    cubePlatform(4_360, SPAWN_SURFACE_Y, 160),
    decor("flash", 1_200, 16, 160, 100),
    decor("beam", 2_000, 32, 220, 140),
    decor("flash", 3_000, 12, 140, 88),
    decor("dark", 4_100, 80, 320, 220),
  ],
  NEON_FINISH,
  [
    shipChannel(1_380, 2_160),
    shipChannel(2_140, 3_460, neonShipGates),
    shipChannel(3_480, 4_340),
  ],
);

const prismRiseStair = buildStairPitSection(520, 7);

const prismSummitStair = buildStairPitSection(2_400, 5);

const PRISM_FINISH = 5_640;

export const prismAscentLevel: LevelContent = assembleOfficialLevel(
  "level_4",
  [
    ...prismRiseStair.entities,
    cubePlatform(prismRiseStair.endX + 28, SPAWN_SURFACE_Y, 120),
    jumpOrb("prism-orb-1", 1_360, 200),
    launchPad("prism-pad-1", 1_520, SPAWN_SURFACE_Y),
    jumpOrb("prism-orb-2", 1_760, 176),
    ...prismSummitStair.entities,
    jumpOrb("prism-orb-3", 2_960, 148),
    cubePlatform(3_120, SPAWN_SURFACE_Y, 120),
    jumpOrb("prism-orb-4", 3_360, 168),
    cubePlatform(3_520, SPAWN_SURFACE_Y, 200),
    ...shipPortalPair(4_020, 4_720),
    cubePlatform(4_760, SPAWN_SURFACE_Y, 180),
    decor("diamond", 900, 100, 40, 40),
    decor("pillar", 2_000, 100, 52, 220),
    decor("beam", 3_400, 40, 200, 130),
    decor("fog", 4_500, 70, 280, 200),
  ],
  PRISM_FINISH,
  [
    prismRiseStair.channel,
    openPitChannel(1_200, 1_360),
    prismSummitStair.channel,
    shipChannel(3_820, 4_760),
  ],
  {
    requiredTriggerIds: [
      "prism-orb-1",
      "prism-orb-2",
      "prism-orb-3",
      "prism-orb-4",
    ],
  },
);

const finalRiseStair = buildStairPitSection(880, 6);

const finalDeepStair = buildStairPitSection(2_760, 6);

const FINAL_FINISH = 5_880;

export const finalRiftLevel: LevelContent = assembleOfficialLevel(
  "level_5",
  [
    groundSpike(440),
    launchPad("final-pad-1", 560, SPAWN_SURFACE_Y),
    ...finalRiseStair.entities,
    cubePlatform(finalRiseStair.endX + 24, SPAWN_SURFACE_Y, 120),
    jumpOrb("final-orb-safe", 1_680, 192),
    ...shipPortalPair(2_280, 2_920),
    ceilingSpike(2_440, 96),
    ceilingSpike(2_600, 96),
    ...finalDeepStair.entities,
    jumpOrb("final-orb-2", 3_720, 118),
    cubePlatform(3_880, SPAWN_SURFACE_Y, 110),
    launchPad("final-pad-2", 4_040, SPAWN_SURFACE_Y, 800),
    jumpOrb("final-trap-2", 4_360, 210, 680),
    ...shipPortalPair(4_480, 5_180),
    ceilingSpike(4_620, 96),
    cubePlatform(5_220, SPAWN_SURFACE_Y, 160),
    decor("dark", 200, 60, 360, 260),
    decor("fog", 1_200, 40, 300, 220),
    decor("flash", 2_500, 8, 120, 80),
    decor("pillar", 3_500, 90, 56, 240),
    decor("diamond", 5_600, 120, 44, 44),
  ],
  FINAL_FINISH,
  [
    finalRiseStair.channel,
    openPitChannel(1_520, 1_680),
    shipChannel(2_240, 2_980, [
      { edge: "lower", limitY: 310, width: 70, x: 2_420 },
      { edge: "ceiling", limitY: 160, width: 60, x: 2_620 },
    ]),
    finalDeepStair.channel,
    shipChannel(4_440, 5_220),
  ],
);

export const OFFICIAL_HANDCRAFTED_BY_ID: Readonly<Record<string, LevelContent>> = {
  level_1: firstWakeLevel,
  level_2: hollowStepsLevel,
  level_3: neonDriftLevel,
  level_4: prismAscentLevel,
  level_5: finalRiftLevel,
};
