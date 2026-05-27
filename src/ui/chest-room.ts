import {
  applyOpenChest,
  chestCatalog,
  type ChestDefinition,
  type ChestReward,
} from "../core/chests";
import { describeKeySource } from "../core/key-sources";
import type { PlayerProfile } from "../core/profile";
import { formatRewardSummary } from "../core/reward-summary";
import { buildRoomRow, buildRoomShell, safeTestId } from "./room-shell";

interface ChestRoomActions {
  onProfileChange: (next: PlayerProfile) => void;
  onReturnToLobby: () => void;
}

export function chestRewardSummary(reward: ChestReward): string {
  return formatRewardSummary({
    coinsAwarded: reward.coinsAwarded,
    cosmeticsAwarded: reward.cosmeticAwarded
      ? [reward.cosmeticAwarded]
      : undefined,
    keysAwarded: reward.keysAwarded,
  });
}

function capitalize(text: string): string {
  if (text.length === 0) return text;
  return text[0]!.toUpperCase() + text.slice(1);
}

function playChestOpenSound(): void {
  const AudioContextClass =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const gain = context.createGain();
  const first = context.createOscillator();
  const second = context.createOscillator();
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.13, context.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.3);
  first.frequency.setValueAtTime(420, context.currentTime);
  first.frequency.exponentialRampToValueAtTime(690, context.currentTime + 0.15);
  second.frequency.setValueAtTime(640, context.currentTime + 0.08);
  first.connect(gain);
  second.connect(gain);
  gain.connect(context.destination);
  first.start();
  first.stop(context.currentTime + 0.2);
  second.start(context.currentTime + 0.08);
  second.stop(context.currentTime + 0.3);
  window.setTimeout(() => void context.close(), 360);
}

function rewardDialog(
  chest: ChestDefinition,
  reward: ChestReward,
  onClose: () => void,
): HTMLElement {
  const dialog = document.createElement("section");
  dialog.className = "pause-overlay result-overlay chest-result";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-label", "Chest opened");
  dialog.setAttribute("data-testid", "chest-reward-reveal");
  dialog.innerHTML = `
    <p class="kicker">Chest Opened</p>
    <span class="chest-visual tier-${chest.keyType} opened" aria-hidden="true"></span>
    <h2>${chest.name}</h2>
    <p class="result-message" data-testid="chest-reward-text">You got: ${chestRewardSummary(reward)}</p>
  `;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "primary-button";
  button.textContent = "Continue";
  button.addEventListener("click", onClose);
  dialog.appendChild(button);
  return dialog;
}

export function mountChestRoom(
  root: HTMLElement,
  profileRef: { current: PlayerProfile },
  actions: ChestRoomActions,
): () => void {
  let lastOpened: { chest: ChestDefinition; reward: ChestReward } | undefined;

  function render(): void {
    const profile = profileRef.current;
    root.replaceChildren();
    const { list, main } = buildRoomShell("Chest Room", actions.onReturnToLobby);
    main.classList.add("chests-room");
    root.appendChild(main);

    for (const chest of chestCatalog) {
      const opened = profile.openedChestIds.includes(chest.id);
      const keyCount = profile.keys[chest.keyType] ?? 0;
      const testId = safeTestId(chest.id);
      const hintText = describeKeySource(chest.keyType);
      const row = buildRoomRow({
        actionDisabled: opened || keyCount < 1,
        actionLabel: "Open",
        actionTestId: `chest-${testId}-open`,
        detail: `1 ${capitalize(chest.keyType)} Key - Random Reward`,
        hintTestId: `chest-${testId}-key-hint`,
        hintText,
        hintVisible: !opened && keyCount < 1 && hintText.length > 0,
        name: chest.name,
        onAction: () => {
          const result = applyOpenChest(profileRef.current, chest.id);
          if (result.profile !== profileRef.current) {
            lastOpened = { chest, reward: result.granted };
            playChestOpenSound();
            actions.onProfileChange(result.profile);
            render();
          }
        },
        rowExtraClass: opened ? "row-complete" : undefined,
        statusLabel: "Opened",
        statusTestId: `chest-${testId}-opened`,
        statusVisible: opened,
      });
      const visual = document.createElement("span");
      visual.className = `chest-visual tier-${chest.keyType}${opened ? " opened" : ""}`;
      visual.setAttribute("aria-hidden", "true");
      row.prepend(visual);
      list.appendChild(row);
    }

    if (lastOpened) {
      main.appendChild(
        rewardDialog(lastOpened.chest, lastOpened.reward, () => {
          lastOpened = undefined;
          render();
        }),
      );
    }
  }

  render();
  return () => root.replaceChildren();
}
