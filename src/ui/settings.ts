import {
  type GameplaySettings,
  type LevelColorTheme,
  type PlayerProfile,
} from "../core/profile";
import { RUN_SPEED_OPTIONS } from "../core/run-speed";
import { buildRoomShell } from "./room-shell";

interface SettingsActions {
  onProfileChange: (next: PlayerProfile) => void;
  onReturnToLobby: () => void;
}

const THEME_CHOICES: readonly {
  color: string;
  id: LevelColorTheme;
  label: string;
}[] = [
  { id: "neon", label: "Neon Tide", color: "#19d9f3" },
  { id: "sunset", label: "Sunset Reactor", color: "#ff7958" },
  { id: "forest", label: "Emerald Circuit", color: "#34e8b3" },
  { id: "void", label: "Void Pulse", color: "#a45bff" },
];

function replaceSettings(
  profile: PlayerProfile,
  settings: GameplaySettings,
): PlayerProfile {
  return { ...profile, settings };
}

export function mountSettings(
  root: HTMLElement,
  profileRef: { current: PlayerProfile },
  actions: SettingsActions,
): () => void {
  const render = (): void => {
    const profile = profileRef.current;
    root.replaceChildren();

    const { main } = buildRoomShell("Settings", actions.onReturnToLobby);
    main.classList.add("settings-room");
    root.appendChild(main);

    const panel = document.createElement("section");
    panel.className = "settings-panel";
    panel.setAttribute("aria-label", "Gameplay settings");
    main.appendChild(panel);

    const speedLabel = document.createElement("label");
    speedLabel.className = "settings-field";
    speedLabel.innerHTML = "<span>Run Speed</span>";
    const speed = document.createElement("select");
    speed.setAttribute("data-testid", "settings-speed");
    for (const choice of RUN_SPEED_OPTIONS) {
      const option = document.createElement("option");
      option.value = String(choice.value);
      option.textContent = choice.label;
      option.selected = choice.value === profile.settings.speedMultiplier;
      speed.appendChild(option);
    }
    speed.addEventListener("change", () => {
      actions.onProfileChange(
        replaceSettings(profileRef.current, {
          ...profileRef.current.settings,
          speedMultiplier: Number(speed.value),
        }),
      );
    });
    speedLabel.appendChild(speed);
    panel.appendChild(speedLabel);

    const heading = document.createElement("p");
    heading.className = "settings-label";
    heading.textContent = "Level Color";
    panel.appendChild(heading);

    const themes = document.createElement("div");
    themes.className = "theme-options";
    for (const choice of THEME_CHOICES) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "theme-choice";
      button.classList.toggle("selected", choice.id === profile.settings.levelColor);
      button.setAttribute("data-testid", `settings-theme-${choice.id}`);
      button.innerHTML = `<span style="--theme-color: ${choice.color}"></span>${choice.label}`;
      button.addEventListener("click", () => {
        actions.onProfileChange(
          replaceSettings(profileRef.current, {
            ...profileRef.current.settings,
            levelColor: choice.id,
          }),
        );
        render();
      });
      themes.appendChild(button);
    }
    panel.appendChild(themes);

    const note = document.createElement("p");
    note.className = "settings-note";
    note.textContent =
      "Slow matches the original pace. Faster settings advance the run and music in sync without changing jump distance or level geometry.";
    panel.appendChild(note);
  };

  render();

  return () => {
    root.replaceChildren();
  };
}
