import {
  applyReward,
  isUnlockMet,
  type PlayerProfile,
  type Reward,
  type UnlockRequirement,
} from "./profile";

export type GauntletStatus = "complete" | "failed" | "running";

export type StageOutcome = "completed" | "failed";

export interface GauntletDefinition {
  id: string;
  stages: readonly string[];
}

export interface GauntletEntry extends GauntletDefinition {
  name: string;
  reward: Reward;
  unlockRequirement: UnlockRequirement;
}

export interface GauntletRunState {
  currentStageIndex: number;
  gauntletId: string;
  stages: readonly string[];
  status: GauntletStatus;
}

// Gauntlet runs use a between-stage checkpoint: dying inside stage N
// freezes the run at that stage and a restart resumes from stage N.
// Main-level runs (see resetRunState in run-simulation) deliberately
// have no checkpoint of any kind so a death resets the whole run.
export const GAUNTLET_CHECKPOINT_POLICY = {
  preservesStageProgressOnRestart: true,
} as const;

export function startGauntletRun(
  definition: GauntletDefinition,
): GauntletRunState {
  return {
    currentStageIndex: 0,
    gauntletId: definition.id,
    stages: definition.stages,
    status: "running",
  };
}

export function applyStageOutcome(
  state: GauntletRunState,
  outcome: StageOutcome,
): GauntletRunState {
  if (state.status !== "running") {
    return state;
  }

  if (outcome === "failed") {
    return { ...state, status: "failed" };
  }

  const nextIndex = state.currentStageIndex + 1;

  if (nextIndex >= state.stages.length) {
    return { ...state, status: "complete" };
  }

  return { ...state, currentStageIndex: nextIndex };
}

export function restartGauntletAtActiveStage(
  state: GauntletRunState,
): GauntletRunState {
  if (state.status === "complete") {
    return state;
  }

  return { ...state, status: "running" };
}

export function decideGauntletEntryState(
  current: GauntletRunState | null,
  definition: GauntletDefinition,
): GauntletRunState {
  if (!current || current.gauntletId !== definition.id) {
    return startGauntletRun(definition);
  }

  if (current.status === "complete") {
    return startGauntletRun(definition);
  }

  if (current.status === "failed") {
    return restartGauntletAtActiveStage(current);
  }

  return current;
}

export const gauntletCatalog: readonly GauntletEntry[] = [
  {
    id: "electric-wake",
    name: "Electric Wake Gauntlet",
    stages: ["electric-wake-1", "electric-wake-2", "electric-wake-3"],
    unlockRequirement: {
      requiredCompletedLevels: ["level_1", "level_2"],
    },
    reward: {
      coinsAwarded: 150,
      keysAwarded: { hard: 1 },
    },
  },
  {
    id: "skyline-trial",
    name: "Skyline Trial Gauntlet",
    stages: ["skyline-trial-1", "skyline-trial-2", "skyline-trial-3"],
    unlockRequirement: {
      requiredCompletedLevels: ["level_4"],
    },
    reward: {
      coinsAwarded: 225,
      keysAwarded: { insane: 1 },
    },
  },
  {
    id: "void-circuit",
    name: "Void Circuit Gauntlet",
    stages: ["void-circuit-1", "void-circuit-2", "void-circuit-3"],
    unlockRequirement: {
      requiredCompletedLevels: ["level_7"],
    },
    reward: {
      coinsAwarded: 320,
      keysAwarded: { insane: 1 },
    },
  },
];

function findGauntlet(gauntletId: string): GauntletEntry | undefined {
  return gauntletCatalog.find((entry) => entry.id === gauntletId);
}

export function isGauntletUnlocked(
  profile: PlayerProfile,
  gauntletId: string,
): boolean {
  const gauntlet = findGauntlet(gauntletId);

  if (!gauntlet) {
    return false;
  }

  return isUnlockMet(profile, gauntlet.unlockRequirement);
}

export interface GauntletCompletionResult {
  granted: Reward;
  profile: PlayerProfile;
}

export function applyGauntletCompletion(
  profile: PlayerProfile,
  gauntletId: string,
): GauntletCompletionResult {
  const gauntlet = findGauntlet(gauntletId);

  if (!gauntlet || profile.completedGauntletIds.includes(gauntletId)) {
    return { granted: {}, profile };
  }

  const rewarded = applyReward(profile, gauntlet.reward);

  return {
    granted: gauntlet.reward,
    profile: {
      ...rewarded,
      completedGauntletIds: [...rewarded.completedGauntletIds, gauntlet.id],
    },
  };
}
