export const RUN_SPEED_OPTIONS = [
  { value: 1, label: "Slow (1.00x)", shortLabel: "1x" },
  { value: 1.5, label: "Normal (1.50x)", shortLabel: "1.5x" },
  { value: 2, label: "Fast (2.00x)", shortLabel: "2x" },
  { value: 3, label: "Extreme (3.00x)", shortLabel: "3x" },
] as const;

export type RunSpeedMultiplier = (typeof RUN_SPEED_OPTIONS)[number]["value"];

export function isRunSpeedMultiplier(value: number): value is RunSpeedMultiplier {
  return RUN_SPEED_OPTIONS.some((choice) => choice.value === value);
}
