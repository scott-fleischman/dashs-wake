export interface RunRules {
  gravity: number;
  groundY: number;
  horizontalSpeed: number;
  jumpVelocity: number;
}

export interface RunInput {
  jumpPressed: boolean;
}

export interface PlayerState {
  grounded: boolean;
  velocityY: number;
  x: number;
  y: number;
}

export interface RunState {
  elapsedMs: number;
  player: PlayerState;
}

export function createRunState(rules: RunRules): RunState {
  return {
    elapsedMs: 0,
    player: {
      grounded: true,
      velocityY: 0,
      x: 0,
      y: rules.groundY,
    },
  };
}

export function tickRun(
  state: RunState,
  input: RunInput,
  elapsedMs: number,
  rules: RunRules,
): RunState {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    throw new RangeError("Run tick elapsed time must be a non-negative finite value.");
  }

  const elapsedSeconds = elapsedMs / 1000;
  const launchVelocity =
    input.jumpPressed && state.player.grounded
      ? rules.jumpVelocity
      : state.player.velocityY;
  const velocityY = launchVelocity + rules.gravity * elapsedSeconds;
  const proposedY = state.player.y + velocityY * elapsedSeconds;
  const landed = proposedY >= rules.groundY;

  return {
    elapsedMs: state.elapsedMs + elapsedMs,
    player: {
      grounded: landed,
      velocityY: landed ? 0 : velocityY,
      x: state.player.x + rules.horizontalSpeed * elapsedSeconds,
      y: landed ? rules.groundY : proposedY,
    },
  };
}
