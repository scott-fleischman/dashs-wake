interface PracticeLaneActions {
  onInput: () => boolean;
  onPauseChange: (paused: boolean) => void;
  onReturnToLobby: () => void;
}

const JUMP_KEYS = new Set(["Space", "ArrowUp"]);

export function mountPracticeLane(
  root: HTMLElement,
  actions: PracticeLaneActions,
): () => void {
  root.innerHTML = `
    <main class="practice-lane">
      <header class="practice-header">
        <p class="kicker">Warm-up Course</p>
        <h1>Practice Lane</h1>
        <p class="run-status" role="status">Running</p>
      </header>

      <section class="input-deck" aria-label="Practice controls">
        <button class="pulse-pad" type="button" data-action="pulse">
          <span>Pulse Cube</span>
          <small>Space / Click</small>
        </button>
        <p class="input-feedback" aria-live="polite">Input ready</p>
      </section>

      <div class="run-controls">
        <button class="utility-button" type="button" data-action="pause">Pause</button>
        <span><kbd>Esc</kbd> pause</span>
      </div>

      <section class="pause-overlay" role="dialog" aria-label="Paused" hidden>
        <p class="kicker">Run Interrupted</p>
        <h2>Paused</h2>
        <div class="overlay-actions">
          <button class="primary-button" type="button" data-action="resume">Resume</button>
          <button class="utility-button" type="button" data-action="lobby">Return to Lobby</button>
        </div>
      </section>
    </main>
  `;

  const status = root.querySelector<HTMLElement>(".run-status");
  const feedback = root.querySelector<HTMLElement>(".input-feedback");
  const pulseButton = root.querySelector<HTMLButtonElement>("[data-action='pulse']");
  const pauseButton = root.querySelector<HTMLButtonElement>("[data-action='pause']");
  const resumeButton = root.querySelector<HTMLButtonElement>("[data-action='resume']");
  const lobbyButton = root.querySelector<HTMLButtonElement>("[data-action='lobby']");
  const overlay = root.querySelector<HTMLElement>(".pause-overlay");

  if (
    !status ||
    !feedback ||
    !pulseButton ||
    !pauseButton ||
    !resumeButton ||
    !lobbyButton ||
    !overlay
  ) {
    throw new Error("Practice lane controls did not mount correctly.");
  }

  let paused = false;
  let feedbackTimer: number | undefined;

  const setPaused = (nextPaused: boolean): void => {
    paused = nextPaused;
    status.textContent = paused ? "Paused" : "Running";
    overlay.hidden = !paused;
    root.classList.toggle("practice-paused", paused);
    actions.onPauseChange(paused);

    if (paused) {
      resumeButton.focus();
    }
  };

  const pulse = (): void => {
    if (paused) {
      return;
    }

    if (!actions.onInput()) {
      feedback.textContent = "Airborne - jump ignored";
      return;
    }

    pulseButton.classList.add("active");
    feedback.textContent = "Pulse registered";
    window.clearTimeout(feedbackTimer);
    feedbackTimer = window.setTimeout(() => {
      pulseButton.classList.remove("active");
      feedback.textContent = "Input ready";
    }, 280);
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      setPaused(!paused);
      return;
    }

    if (JUMP_KEYS.has(event.code) && !event.repeat) {
      event.preventDefault();
      pulse();
    }
  };

  pulseButton.addEventListener("click", pulse);
  pauseButton.addEventListener("click", () => setPaused(true));
  resumeButton.addEventListener("click", () => setPaused(false));
  lobbyButton.addEventListener("click", actions.onReturnToLobby);
  window.addEventListener("keydown", onKeyDown);

  return () => {
    window.clearTimeout(feedbackTimer);
    window.removeEventListener("keydown", onKeyDown);
    actions.onPauseChange(false);
  };
}
