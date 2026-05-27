/** Fixed simulation timestep (matches Phaser lobby level scene). */
export const SIMULATION_STEP_MS = 1000 / 60;

const MAX_WALL_DELTA_MS = 100;

/**
 * Converts wall-clock frame time into a number of fixed simulation ticks.
 * Higher `runSpeedMultiplier` advances gameplay faster without changing rules.
 */
export function consumeSimulationTicks(
  accumulator: number,
  wallDeltaMs: number,
  runSpeedMultiplier: number,
): { accumulator: number; tickCount: number } {
  let next =
    accumulator +
    Math.min(wallDeltaMs, MAX_WALL_DELTA_MS) * runSpeedMultiplier;
  let tickCount = 0;
  while (next >= SIMULATION_STEP_MS) {
    next -= SIMULATION_STEP_MS;
    tickCount += 1;
  }
  return { accumulator: next, tickCount };
}
