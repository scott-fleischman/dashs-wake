import "./styles.css";
import { startLobbyBackdrop, type LevelSnapshot } from "./game/lobby-backdrop";
import { mountChestRoom } from "./ui/chest-room";
import { mountCustomizer } from "./ui/customizer";
import { mountFirstWake } from "./ui/first-wake";
import { mountLobby } from "./ui/lobby";
import { mountShop } from "./ui/shop";
import {
  applyCompletionAward,
  applyProgressAward,
  type PlayerProfile,
} from "./core/profile";
import { cosmeticCatalog } from "./core/inventory";
import { loadProfile, saveProfile } from "./persistence/profile-repository";
import {
  getOfficialLevelContent,
  getOfficialLevelMetadata,
  levelKicker,
} from "./content/official-levels";

function requiredElement(id: string): HTMLElement {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing app host: ${id}`);
  }

  return element;
}

function parseLevelIdFromHash(hash: string): string | null {
  if (hash === "#play") {
    return "level_1";
  }
  if (hash.startsWith("#play/")) {
    return hash.slice("#play/".length) || null;
  }
  return null;
}

function equippedIconName(profile: PlayerProfile): string {
  const id = profile.selectedCosmetics["icon"];

  if (!id) {
    return "";
  }

  const item = cosmeticCatalog.find((entry) => entry.id === id);

  return item?.name ?? "";
}

function applyAttemptResult(
  current: PlayerProfile,
  levelId: string,
  snapshot: LevelSnapshot,
): PlayerProfile {
  let next = applyProgressAward(current, {
    levelId,
    percentReached: snapshot.percent,
  }).profile;

  if (snapshot.status === "complete") {
    next = applyCompletionAward(next, { levelId }).profile;
  }

  return next;
}

const root = requiredElement("app");
const backdrop = startLobbyBackdrop(requiredElement("game-background"));
let disposeView = (): void => {};
let profile: PlayerProfile = loadProfile();

function renderRoute(): void {
  disposeView();

  const hash = window.location.hash;
  const profileRef = {
    get current(): PlayerProfile {
      return profile;
    },
  };

  const updateProfile = (next: PlayerProfile): void => {
    profile = next;
    saveProfile(profile);
  };

  if (hash === "#customizer") {
    backdrop.showLobby();
    disposeView = mountCustomizer(root, profileRef, {
      onProfileChange: updateProfile,
      onReturnToLobby: () => {
        window.location.hash = "";
      },
    });
    return;
  }

  if (hash === "#shop") {
    backdrop.showLobby();
    disposeView = mountShop(root, profileRef, {
      onProfileChange: updateProfile,
      onReturnToLobby: () => {
        window.location.hash = "";
      },
    });
    return;
  }

  if (hash === "#chest-room") {
    backdrop.showLobby();
    disposeView = mountChestRoom(root, profileRef, {
      onProfileChange: updateProfile,
      onReturnToLobby: () => {
        window.location.hash = "";
      },
    });
    return;
  }

  const levelId = parseLevelIdFromHash(hash);

  if (levelId) {
    const metadata = getOfficialLevelMetadata(levelId);

    if (!metadata) {
      window.location.hash = "";
      return;
    }

    let content;
    try {
      content = getOfficialLevelContent(levelId);
    } catch {
      window.location.hash = "";
      return;
    }

    backdrop.showLevel(content);
    let attemptHandled = false;

    const resolveAttempt = (snapshot: LevelSnapshot): void => {
      if (
        attemptHandled ||
        (snapshot.status !== "dead" && snapshot.status !== "complete")
      ) {
        return;
      }
      attemptHandled = true;
      profile = applyAttemptResult(profile, levelId, snapshot);
      saveProfile(profile);
    };

    disposeView = mountFirstWake(
      root,
      {
        kicker: levelKicker(levelId),
        name: metadata.name,
        equippedIcon: equippedIconName(profile),
      },
      {
        onJumpHold: (held) => backdrop.setLevelJumpHeld(held),
        onPauseChange: (paused) => backdrop.setLevelPaused(paused),
        onRestart: () => {
          attemptHandled = false;
          backdrop.restartLevel();
        },
        onReturnToLobby: () => {
          window.location.hash = "";
        },
        onSnapshotChange: (uiListener) => {
          if (!uiListener) {
            backdrop.setLevelSnapshotListener(undefined);
            return;
          }
          backdrop.setLevelSnapshotListener((snapshot) => {
            resolveAttempt(snapshot);
            uiListener(snapshot);
          });
        },
      },
    );
    return;
  }

  backdrop.showLobby();
  disposeView = mountLobby(root, profile, (selectedLevelId) => {
    window.location.hash = `#play/${selectedLevelId}`;
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
