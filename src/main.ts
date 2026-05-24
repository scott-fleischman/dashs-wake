import "./styles.css";
import { startLobbyBackdrop } from "./game/lobby-backdrop";
import { mountLobby } from "./ui/lobby";
import { mountPracticeLane } from "./ui/practice-lane";

const PRACTICE_ROUTE = "#play";

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

  if (window.location.hash === PRACTICE_ROUTE) {
    backdrop.showPractice();
    disposeView = mountPracticeLane(root, {
      onInput: () => backdrop.pulsePlayer(),
      onPauseChange: (paused) => backdrop.setPracticePaused(paused),
      onReturnToLobby: () => {
        window.location.hash = "";
      },
    });
    return;
  }

  backdrop.showLobby();
  disposeView = mountLobby(root, () => {
    window.location.hash = PRACTICE_ROUTE;
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
