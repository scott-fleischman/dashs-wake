import { describe, expect, it } from "vitest";
import {
  applyStageOutcome,
  decideGauntletEntryState,
  GAUNTLET_CHECKPOINT_POLICY,
  restartGauntletAtActiveStage,
  startGauntletRun,
} from "../../src/core/gauntlet";
import { MAIN_LEVEL_CHECKPOINT_POLICY } from "../../src/core/run-simulation";

const SHORT_GAUNTLET = {
  id: "test-gauntlet",
  stages: ["stage-1", "stage-2", "stage-3"],
};

describe("gauntlet state machine", () => {
  it("starts a gauntlet at the first stage", () => {
    const state = startGauntletRun(SHORT_GAUNTLET);

    expect(state.gauntletId).toBe("test-gauntlet");
    expect(state.currentStageIndex).toBe(0);
    expect(state.status).toBe("running");
  });

  it("advances to the next stage when the active stage completes", () => {
    const initial = startGauntletRun(SHORT_GAUNTLET);

    const after = applyStageOutcome(initial, "completed");

    expect(after.currentStageIndex).toBe(1);
    expect(after.status).toBe("running");
  });

  it("marks the gauntlet complete when the last stage completes", () => {
    let state = startGauntletRun(SHORT_GAUNTLET);
    state = applyStageOutcome(state, "completed");
    state = applyStageOutcome(state, "completed");

    const final = applyStageOutcome(state, "completed");

    expect(final.status).toBe("complete");
    expect(final.currentStageIndex).toBe(2);
  });

  it("marks the gauntlet failed without advancing the stage when the active stage fails", () => {
    let state = startGauntletRun(SHORT_GAUNTLET);
    state = applyStageOutcome(state, "completed");

    const failed = applyStageOutcome(state, "failed");

    expect(failed.status).toBe("failed");
    expect(failed.currentStageIndex).toBe(1);
  });

  it("restarts a failed gauntlet at the active stage rather than from the beginning", () => {
    let state = startGauntletRun(SHORT_GAUNTLET);
    state = applyStageOutcome(state, "completed");
    state = applyStageOutcome(state, "failed");

    const resumed = restartGauntletAtActiveStage(state);

    expect(resumed.currentStageIndex).toBe(1);
    expect(resumed.status).toBe("running");
  });

  it("advances normally after a restart following a stage failure", () => {
    let state = startGauntletRun(SHORT_GAUNTLET);
    state = applyStageOutcome(state, "completed");
    state = applyStageOutcome(state, "failed");
    state = restartGauntletAtActiveStage(state);

    state = applyStageOutcome(state, "completed");

    expect(state.currentStageIndex).toBe(2);
    expect(state.status).toBe("running");
  });

  it("ignores stage outcomes after the gauntlet has already completed", () => {
    let state = startGauntletRun({ id: "short", stages: ["only-stage"] });
    state = applyStageOutcome(state, "completed");

    const after = applyStageOutcome(state, "completed");

    expect(after).toBe(state);
  });

  it("declares its checkpoint policy distinctly from the main-level policy", () => {
    expect(GAUNTLET_CHECKPOINT_POLICY.preservesStageProgressOnRestart).toBe(
      true,
    );
    expect(MAIN_LEVEL_CHECKPOINT_POLICY.preservesProgressOnRestart).toBe(false);
  });
});

describe("gauntlet entry-state decision", () => {
  it("starts a fresh run when no active run exists", () => {
    const decided = decideGauntletEntryState(null, SHORT_GAUNTLET);

    expect(decided.gauntletId).toBe(SHORT_GAUNTLET.id);
    expect(decided.currentStageIndex).toBe(0);
    expect(decided.status).toBe("running");
  });

  it("starts a fresh run when the active run is for a different gauntlet", () => {
    const otherRun = startGauntletRun({
      id: "other-gauntlet",
      stages: ["only-stage"],
    });

    const decided = decideGauntletEntryState(otherRun, SHORT_GAUNTLET);

    expect(decided.gauntletId).toBe(SHORT_GAUNTLET.id);
    expect(decided.currentStageIndex).toBe(0);
    expect(decided.status).toBe("running");
  });

  it("starts a fresh run when the active run is already complete", () => {
    let completed = startGauntletRun(SHORT_GAUNTLET);
    completed = applyStageOutcome(completed, "completed");
    completed = applyStageOutcome(completed, "completed");
    completed = applyStageOutcome(completed, "completed");
    expect(completed.status).toBe("complete");

    const decided = decideGauntletEntryState(completed, SHORT_GAUNTLET);

    expect(decided.currentStageIndex).toBe(0);
    expect(decided.status).toBe("running");
  });

  it("preserves an in-progress run unchanged", () => {
    let inProgress = startGauntletRun(SHORT_GAUNTLET);
    inProgress = applyStageOutcome(inProgress, "completed");

    const decided = decideGauntletEntryState(inProgress, SHORT_GAUNTLET);

    expect(decided).toBe(inProgress);
  });

  it("restarts a failed run at its active stage so navigation cannot soft-lock", () => {
    let failed = startGauntletRun(SHORT_GAUNTLET);
    failed = applyStageOutcome(failed, "completed");
    failed = applyStageOutcome(failed, "failed");
    expect(failed.status).toBe("failed");
    expect(failed.currentStageIndex).toBe(1);

    const decided = decideGauntletEntryState(failed, SHORT_GAUNTLET);

    expect(decided.status).toBe("running");
    expect(decided.currentStageIndex).toBe(1);
  });
});
