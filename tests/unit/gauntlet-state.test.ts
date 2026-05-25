import { describe, expect, it } from "vitest";
import {
  applyStageOutcome,
  restartGauntletAtActiveStage,
  startGauntletRun,
} from "../../src/core/gauntlet";

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

  it("ignores stage outcomes after the gauntlet has already completed", () => {
    let state = startGauntletRun({ id: "short", stages: ["only-stage"] });
    state = applyStageOutcome(state, "completed");

    const after = applyStageOutcome(state, "completed");

    expect(after).toBe(state);
  });
});
