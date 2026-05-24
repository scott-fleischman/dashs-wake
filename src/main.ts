import "./styles.css";
import { startLobbyBackdrop } from "./game/lobby-backdrop";
import { mountLobby } from "./ui/lobby";
import { mountFirstWake } from "./ui/first-wake";
import {
  applyCompletionAward,
  applyProgressAward,
  type PlayerProfile,
} from "./core/profile";
import { loadProfile, saveProfile } from "./persistence/profile-repository";

const FIRST_WAKE_ROUTE = "#play";

function requiredElement(id: string): HTMLElement {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing app host: ${id}`);
  }

  return element;
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
        backdrop.setFirstWakeSnapshotListener(
          uiListener
            ? (snapshot) => {
                if (
                  !attemptHandled &&
                  (snapshot.status === "dead" ||
                    snapshot.status === "complete")
                ) {
                  attemptHandled = true;
                  const progressResult = applyProgressAward(profile, {
                    levelId: "level_1",
                    percentReached: snapshot.percent,
                  });
                  profile = progressResult.profile;

                  if (snapshot.status === "complete") {
                    const completionResult = applyCompletionAward(profile, {
                      levelId: "level_1",
                    });
                    profile = completionResult.profile;
                  }

                  saveProfile(profile);
                }

                uiListener(snapshot);
              }
            : undefined,
        );
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
