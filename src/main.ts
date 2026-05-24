import "./styles.css";
import { startLobbyBackdrop } from "./game/lobby-backdrop";
import { mountLobby } from "./ui/lobby";

function requiredElement(id: string): HTMLElement {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing app host: ${id}`);
  }

  return element;
}

const backdrop = startLobbyBackdrop(requiredElement("game-background"));
mountLobby(requiredElement("app"));

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    backdrop.destroy(true);
  });
}
