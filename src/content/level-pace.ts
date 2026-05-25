import type { LevelEntity } from "../core/run-simulation";

export const BASE_HORIZONTAL_SPEED = 190;
export const PLAYER_HORIZONTAL_SPEED = 240;

const HORIZONTAL_PACE_RATIO =
  PLAYER_HORIZONTAL_SPEED / BASE_HORIZONTAL_SPEED;

export function paceAuthoredX(x: number): number {
  return Math.floor(x * HORIZONTAL_PACE_RATIO);
}

export function paceAuthoredEntities(
  entities: readonly LevelEntity[],
): readonly LevelEntity[] {
  return entities.map((entity) => ({ ...entity, x: paceAuthoredX(entity.x) }));
}
