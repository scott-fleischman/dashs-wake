import { describe, expect, it } from "vitest";
import {
  consumeSimulationTicks,
  SIMULATION_STEP_MS,
} from "../../src/core/simulation-pace";

describe("consumeSimulationTicks", () => {
  it("schedules proportionally more ticks when run speed is higher", () => {
    const wall = 1000 / 60;
    const slow = consumeSimulationTicks(0, wall, 1);
    const fast = consumeSimulationTicks(0, wall, 2);
    expect(fast.tickCount).toBe(slow.tickCount * 2);
    expect(slow.accumulator).toBeCloseTo(fast.accumulator, 5);
  });

  it("preserves leftover time in the accumulator across frames", () => {
    const first = consumeSimulationTicks(0, 10, 1);
    expect(first.tickCount).toBe(0);
    const second = consumeSimulationTicks(first.accumulator, 10, 1);
    const combined = consumeSimulationTicks(0, 20, 1);
    expect(first.tickCount + second.tickCount).toBe(combined.tickCount);
    expect(second.accumulator).toBeCloseTo(combined.accumulator, 5);
  });

  it("caps a single wall delta contribution at 100ms before scaling", () => {
    const huge = consumeSimulationTicks(0, 500, 1);
    const capped = consumeSimulationTicks(0, 100, 1);
    expect(huge.tickCount).toBe(capped.tickCount);
  });

  it("keeps tick duration at the fixed simulation step", () => {
    expect(SIMULATION_STEP_MS).toBeCloseTo(1000 / 60, 10);
  });
});
