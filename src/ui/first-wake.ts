import type { LevelSnapshot } from "../game/lobby-backdrop";

export interface LevelRunMetadata {
  kicker: string;
  name: string;
}

interface LevelRunActions {
  onJumpHold: (held: boolean) => boolean;
  onPauseChange: (paused: boolean) => void;
  onRestart: () => void;
  onReturnToLobby: () => void;
  onSnapshotChange: (
    listener: ((snapshot: LevelSnapshot) => void) | undefined,
  ) => void;
}

const JUMP_KEYS = new Set(["Space", "ArrowUp"]);

interface ModeCue {
  hint: string;
  label: string;
}

const MODE_CUES: Record<LevelSnapshot["mode"], ModeCue> = {
  cube: { label: "Cube", hint: "Tap to jump" },
  ship: { label: "Ship", hint: "Hold to rise" },
};

export function mountFirstWake(
  root: HTMLElement,
  metadata: LevelRunMetadata,
  actions: LevelRunActions,
): () => void {
  root.innerHTML = `
    <main class="first-wake">
      <header class="first-wake-header">
        <p class="kicker"></p>
        <h1></h1>
        <p class="run-status" role="status">Running</p>
      </header>

      <section class="run-hud" aria-label="Attempt status">
        <p class="hud-label">Progress</p>
        <strong class="hud-value" data-testid="run-progress">0%</strong>
        <p class="attempt-count" data-testid="attempt-count">Attempt 1</p>
        <p class="run-mode" data-testid="run-mode">Cube</p>
        <p class="run-cue" data-testid="run-cue">Tap to jump</p>
      </section>

      <section class="input-deck" aria-label="First Wake controls">
        <button class="pulse-pad" type="button" data-action="pulse" disabled>
          <span>Jump</span>
          <small>Space / Click</small>
        </button>
        <p class="input-feedback" aria-live="polite">Input ready</p>
      </section>

      <div class="run-controls">
        <button class="utility-button" type="button" data-action="pause">Pause</button>
        <span><kbd>Esc</kbd> pause</span>
        <span><kbd>R</kbd> restart</span>
      </div>

      <section class="pause-overlay" role="dialog" aria-label="Paused" hidden>
        <p class="kicker">Run Interrupted</p>
        <h2>Paused</h2>
        <div class="overlay-actions">
          <button class="primary-button" type="button" data-action="resume">Resume</button>
          <button class="utility-button" type="button" data-action="lobby">Return to Lobby</button>
        </div>
      </section>

      <section class="pause-overlay result-overlay" role="dialog" aria-label="Run failed" hidden>
        <p class="kicker">Attempt Ended</p>
        <h2>Crash</h2>
        <p class="result-message">Hazard collision. Restart from 0%.</p>
        <div class="overlay-actions">
          <button class="primary-button" type="button" data-action="restart">Restart</button>
          <button class="utility-button" type="button" data-action="failed-lobby">Return to Lobby</button>
        </div>
      </section>

      <section class="pause-overlay result-overlay" role="dialog" aria-label="Level complete" hidden>
        <p class="kicker">Course Cleared</p>
        <h2>Complete</h2>
        <p class="result-message">First Wake cleared at 100%.</p>
        <div class="overlay-actions">
          <button class="primary-button" type="button" data-action="replay">Replay</button>
          <button class="utility-button" type="button" data-action="complete-lobby">Return to Lobby</button>
        </div>
      </section>
    </main>
  `;

  const kickerEl = root.querySelector<HTMLElement>(".first-wake-header .kicker");
  const headingEl = root.querySelector<HTMLElement>(".first-wake-header h1");
  if (kickerEl) kickerEl.textContent = metadata.kicker;
  if (headingEl) headingEl.textContent = metadata.name;

  const status = root.querySelector<HTMLElement>(".run-status");
  const feedback = root.querySelector<HTMLElement>(".input-feedback");
  const progress = root.querySelector<HTMLElement>("[data-testid='run-progress']");
  const attempts = root.querySelector<HTMLElement>("[data-testid='attempt-count']");
  const modeReadout = root.querySelector<HTMLElement>("[data-testid='run-mode']");
  const cueReadout = root.querySelector<HTMLElement>("[data-testid='run-cue']");
  const pulseButton = root.querySelector<HTMLButtonElement>("[data-action='pulse']");
  const pauseButton = root.querySelector<HTMLButtonElement>("[data-action='pause']");
  const resumeButton = root.querySelector<HTMLButtonElement>("[data-action='resume']");
  const lobbyButton = root.querySelector<HTMLButtonElement>("[data-action='lobby']");
  const overlay = root.querySelector<HTMLElement>("[aria-label='Paused']");
  const failedOverlay = root.querySelector<HTMLElement>("[aria-label='Run failed']");
  const completeOverlay = root.querySelector<HTMLElement>("[aria-label='Level complete']");
  const restartButton = root.querySelector<HTMLButtonElement>("[data-action='restart']");
  const replayButton = root.querySelector<HTMLButtonElement>("[data-action='replay']");
  const failedLobbyButton = root.querySelector<HTMLButtonElement>("[data-action='failed-lobby']");
  const completeLobbyButton = root.querySelector<HTMLButtonElement>(
    "[data-action='complete-lobby']",
  );

  if (
    !status ||
    !feedback ||
    !progress ||
    !attempts ||
    !modeReadout ||
    !cueReadout ||
    !pulseButton ||
    !pauseButton ||
    !resumeButton ||
    !lobbyButton ||
    !overlay ||
    !failedOverlay ||
    !completeOverlay ||
    !restartButton ||
    !replayButton ||
    !failedLobbyButton ||
    !completeLobbyButton
  ) {
    throw new Error("First Wake controls did not mount correctly.");
  }

  let paused = false;
  let feedbackTimer: number | undefined;
  let runStatus: LevelSnapshot["status"] = "running";

  const setPaused = (nextPaused: boolean): void => {
    if (runStatus !== "running") {
      return;
    }

    paused = nextPaused;
    status.textContent = paused ? "Paused" : "Running";
    overlay.hidden = !paused;
    root.classList.toggle("first-wake-paused", paused);
    actions.onPauseChange(paused);

    if (paused) {
      resumeButton.focus();
    }
  };

  const registerHold = (): void => {
    if (paused) {
      return;
    }

    const accepted = actions.onJumpHold(true);

    if (!accepted) {
      feedback.textContent = "Airborne - jump ignored";
      return;
    }

    pulseButton.classList.add("active");
    feedback.textContent = "Jump registered";
    window.clearTimeout(feedbackTimer);
    feedbackTimer = window.setTimeout(() => {
      pulseButton.classList.remove("active");
      feedback.textContent = "Input ready";
    }, 280);
  };

  const releaseHold = (): void => {
    actions.onJumpHold(false);
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      setPaused(!paused);
      return;
    }

    if (event.code === "KeyR" && !event.repeat) {
      event.preventDefault();
      restart();
      return;
    }

    if (JUMP_KEYS.has(event.code) && !event.repeat) {
      event.preventDefault();
      registerHold();
    }
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    if (JUMP_KEYS.has(event.code)) {
      event.preventDefault();
      releaseHold();
    }
  };

  const restart = (): void => {
    paused = false;
    overlay.hidden = true;
    root.classList.remove("first-wake-paused");
    actions.onPauseChange(false);
    actions.onRestart();
    feedback.textContent = "Restarted - 0%";
  };

  const renderSnapshot = (snapshot: LevelSnapshot): void => {
    runStatus = snapshot.status;
    progress.textContent = `${snapshot.percent}%`;
    attempts.textContent = `Attempt ${snapshot.attempt}`;
    const cue = MODE_CUES[snapshot.mode];
    modeReadout.textContent = cue.label;
    cueReadout.textContent = cue.hint;
    failedOverlay.hidden = snapshot.status !== "dead";
    completeOverlay.hidden = snapshot.status !== "complete";
    pulseButton.disabled = snapshot.status !== "running";

    if (!paused) {
      status.textContent =
        snapshot.status === "dead"
          ? "Crashed"
          : snapshot.status === "complete"
            ? "Complete"
            : "Running";
    }

    if (snapshot.status === "dead") {
      feedback.textContent =
        snapshot.deathCause === "fall"
          ? "Fell - restart from 0%"
          : "Crash - restart from 0%";
      restartButton.focus();
    }

    if (snapshot.status === "complete") {
      feedback.textContent = "Course complete";
    }
  };

  actions.onSnapshotChange(renderSnapshot);
  pulseButton.addEventListener("pointerdown", registerHold);
  pulseButton.addEventListener("pointerup", releaseHold);
  pulseButton.addEventListener("pointerleave", releaseHold);
  pulseButton.addEventListener("pointercancel", releaseHold);
  pauseButton.addEventListener("click", () => setPaused(true));
  resumeButton.addEventListener("click", () => setPaused(false));
  lobbyButton.addEventListener("click", actions.onReturnToLobby);
  failedLobbyButton.addEventListener("click", actions.onReturnToLobby);
  completeLobbyButton.addEventListener("click", actions.onReturnToLobby);
  restartButton.addEventListener("click", restart);
  replayButton.addEventListener("click", restart);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return () => {
    window.clearTimeout(feedbackTimer);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    releaseHold();
    actions.onSnapshotChange(undefined);
    root.classList.remove("first-wake-paused");
    actions.onPauseChange(false);
  };
}
