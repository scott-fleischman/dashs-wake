import "./styles.css";
import { startLobbyBackdrop } from "./game/lobby-backdrop";
import { mountLobby } from "./ui/lobby";
import { mountFirstWake } from "./ui/first-wake";

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

function renderRoute(): void {
  disposeView();

  if (window.location.hash === FIRST_WAKE_ROUTE) {
    backdrop.showFirstWake();
    disposeView = mountFirstWake(root, {
      onInput: () => backdrop.jumpFirstWake(),
      onPauseChange: (paused) => backdrop.setFirstWakePaused(paused),
      onRestart: () => backdrop.restartFirstWake(),
      onReturnToLobby: () => {
        window.location.hash = "";
      },
      onSnapshotChange: (listener) =>
        backdrop.setFirstWakeSnapshotListener(listener),
    });
    return;
  }

  backdrop.showLobby();
  disposeView = mountLobby(root, () => {
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
