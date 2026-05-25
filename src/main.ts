import "./styles.css";
import { startLobbyBackdrop, type FirstWakeSnapshot } from "./game/lobby-backdrop";
import { mountLobby } from "./ui/lobby";
import { mountFirstWake } from "./ui/first-wake";
import {
  applyCompletionAward,
  applyProgressAward,
  type PlayerProfile,
} from "./core/profile";
import { loadProfile, saveProfile } from "./persistence/profile-repository";

const FIRST_WAKE_ROUTE = "#play";
const FIRST_WAKE_LEVEL_ID = "level_1";

function requiredElement(id: string): HTMLElement {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing app host: ${id}`);
  }

  return element;
}

function applyAttemptResult(
  current: PlayerProfile,
  snapshot: FirstWakeSnapshot,
): PlayerProfile {
  let next = applyProgressAward(current, {
    levelId: FIRST_WAKE_LEVEL_ID,
    percentReached: snapshot.percent,
  }).profile;

  if (snapshot.status === "complete") {
    next = applyCompletionAward(next, { levelId: FIRST_WAKE_LEVEL_ID }).profile;
  }

  return next;
}

const root = requiredElement("app");
const backdrop = startLobbyBackdrop(requiredElement("game-background"));
let disposeView = (): void => {};
let profile: PlayerProfile = loadProfile();

function renderRoute(): void {
  disposeView();

  if (window.location.hash === FIRST_WAKE_ROUTE) {
    backdrop.showFirstWake();
    let attemptHandled = false;

    const resolveAttempt = (snapshot: FirstWakeSnapshot): void => {
      if (
        attemptHandled ||
        (snapshot.status !== "dead" && snapshot.status !== "complete")
      ) {
        return;
      }
      attemptHandled = true;
      profile = applyAttemptResult(profile, snapshot);
      saveProfile(profile);
    };

    disposeView = mountFirstWake(root, {
      onInput: () => backdrop.jumpFirstWake(),
      onPauseChange: (paused) => backdrop.setFirstWakePaused(paused),
      onRestart: () => {
        attemptHandled = false;
        backdrop.restartFirstWake();
      },
      onReturnToLobby: () => {
        window.location.hash = "";
      },
      onSnapshotChange: (uiListener) => {
        if (!uiListener) {
          backdrop.setFirstWakeSnapshotListener(undefined);
          return;
        }
        backdrop.setFirstWakeSnapshotListener((snapshot) => {
          resolveAttempt(snapshot);
          uiListener(snapshot);
        });
      },
    });
    return;
  }

  backdrop.showLobby();
  disposeView = mountLobby(root, profile, () => {
    window.location.hash = FIRST_WAKE_ROUTE;
  });
}

window.addEventListener("hashchange", renderRoute);
renderRoute();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener("hashchange", renderRoute);
    disposeView();
    backdrop.destroy(true);
  });
}
