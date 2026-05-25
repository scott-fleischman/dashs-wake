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
