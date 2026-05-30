import {
  gauntletCatalog,
  isGauntletUnlocked,
  type GauntletEntry,
} from "../core/gauntlet";
import { formatLevelClearList } from "../content/official-levels";
import type { PlayerProfile } from "../core/profile";
import { formatRewardSummary } from "../core/reward-summary";
import { buildRoomRow, buildRoomShell, safeTestId } from "./room-shell";

function gauntletUnlockHint(gauntlet: GauntletEntry): string {
  return formatLevelClearList(
    gauntlet.unlockRequirement.requiredCompletedLevels,
  );
}

interface GauntletsRoomActions {
  onReturnToLobby: () => void;
  onStartGauntlet: (gauntletId: string) => void;
}

interface GauntletsRoomOptions {
  completedGauntletId: string | null;
}

function completionDialogFor(
  gauntlet: GauntletEntry,
  onAcknowledge: () => void,
): HTMLElement {
  const overlay = document.createElement("section");
  overlay.className = "pause-overlay result-overlay gauntlet-complete";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-label", "Gauntlet complete");

  const kicker = document.createElement("p");
  kicker.className = "kicker";
  kicker.textContent = "Gauntlet Cleared";
  overlay.appendChild(kicker);

  const heading = document.createElement("h2");
  heading.textContent = gauntlet.name;
  overlay.appendChild(heading);

  const message = document.createElement("p");
  message.className = "result-message";
  message.textContent = "All stages cleared.";
  overlay.appendChild(message);

  const rewardSummary = formatRewardSummary(gauntlet.reward);
  if (rewardSummary.length > 0) {
    const earned = document.createElement("p");
    earned.className = "result-message";
    earned.setAttribute("data-testid", "gauntlet-complete-reward");
    earned.textContent = `Earned: ${rewardSummary}`;
    overlay.appendChild(earned);
  }

  const actions = document.createElement("div");
  actions.className = "overlay-actions";
  overlay.appendChild(actions);

  const ackButton = document.createElement("button");
  ackButton.type = "button";
  ackButton.className = "primary-button";
  ackButton.setAttribute("data-testid", "gauntlet-complete-acknowledge");
  ackButton.textContent = "Continue";
  ackButton.addEventListener("click", onAcknowledge);
  actions.appendChild(ackButton);

  return overlay;
}

export function mountGauntletsRoom(
  root: HTMLElement,
  profileRef: { current: PlayerProfile },
  actions: GauntletsRoomActions,
  options: GauntletsRoomOptions,
): () => void {
  function render(showCompletionFor: string | null): void {
    const profile = profileRef.current;

    root.replaceChildren();

    const { list, main } = buildRoomShell("Gauntlets", actions.onReturnToLobby);
    main.classList.add("gauntlets-room");
    root.appendChild(main);

    for (const gauntlet of gauntletCatalog) {
      const unlocked = isGauntletUnlocked(profile, gauntlet.id);
      const completed = profile.completedGauntletIds.includes(gauntlet.id);
      const testId = safeTestId(gauntlet.id);
      const detail = unlocked
        ? `Nightmare - ${gauntlet.stages.length} stages`
        : gauntletUnlockHint(gauntlet);

      list.appendChild(
        buildRoomRow({
          actionDisabled: !unlocked,
          actionLabel: unlocked ? "Start" : "Locked",
          actionTestId: `gauntlet-${testId}-start`,
          detail,
          name: gauntlet.name,
          onAction: () => actions.onStartGauntlet(gauntlet.id),
          rowExtraClass: completed ? "row-complete" : undefined,
          statusLabel: completed ? "Cleared" : "Available",
          statusTestId: `gauntlet-${testId}-status`,
          statusVisible: completed || unlocked,
        }),
      );
    }

    if (showCompletionFor) {
      const gauntlet = gauntletCatalog.find(
        (entry) => entry.id === showCompletionFor,
      );

      if (gauntlet) {
        main.appendChild(
          completionDialogFor(gauntlet, () => render(null)),
        );
      }
    }
  }

  render(options.completedGauntletId);

  return () => {
    root.replaceChildren();
  };
}
