export type GauntletStatus = "complete" | "failed" | "running";

export type StageOutcome = "completed" | "failed";

export interface GauntletDefinition {
  id: string;
  stages: readonly string[];
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
