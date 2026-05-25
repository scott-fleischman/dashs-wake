import "./styles.css";
import { startLobbyBackdrop, type LevelSnapshot } from "./game/lobby-backdrop";
import { mountChestRoom } from "./ui/chest-room";
import { mountCustomizer } from "./ui/customizer";
import { mountFirstWake } from "./ui/first-wake";
import { mountGauntletsRoom } from "./ui/gauntlets-room";
import { mountLobby } from "./ui/lobby";
import { mountShop } from "./ui/shop";
import {
  applyCompletionAward,
  applyProgressAward,
  type PlayerProfile,
} from "./core/profile";
import { cosmeticCatalog } from "./core/inventory";
import {
  applyGauntletCompletion,
  applyStageOutcome,
  gauntletCatalog,
  startGauntletRun,
  type GauntletRunState,
} from "./core/gauntlet";
import { loadProfile, saveProfile } from "./persistence/profile-repository";
import {
  getOfficialLevelContent,
  getOfficialLevelMetadata,
  levelKicker,
} from "./content/official-levels";
import { getGauntletStageContent } from "./content/electric-wake-stages";

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
let activeGauntletRun: GauntletRunState | null = null;
let pendingGauntletCompletion: string | null = null;

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

  if (hash === "#gauntlets") {
    backdrop.showLobby();
    const completionFlag = pendingGauntletCompletion;
    pendingGauntletCompletion = null;
    disposeView = mountGauntletsRoom(
      root,
      profileRef,
      {
        onReturnToLobby: () => {
          window.location.hash = "";
        },
        onStartGauntlet: (id) => {
          activeGauntletRun = null;
          window.location.hash = `#gauntlet/${id}`;
        },
      },
      { completedGauntletId: completionFlag },
    );
    return;
  }

  if (hash.startsWith("#gauntlet/")) {
    const gauntletId = hash.slice("#gauntlet/".length);
    const gauntlet = gauntletCatalog.find((entry) => entry.id === gauntletId);

    if (!gauntlet) {
      window.location.hash = "#gauntlets";
      return;
    }

    if (
      !activeGauntletRun ||
      activeGauntletRun.gauntletId !== gauntletId ||
      activeGauntletRun.status === "complete"
    ) {
      activeGauntletRun = startGauntletRun(gauntlet);
    }

    const stageId = activeGauntletRun.stages[activeGauntletRun.currentStageIndex];
    const stageContent = stageId ? getGauntletStageContent(stageId) : undefined;

    if (!stageContent) {
      activeGauntletRun = null;
      window.location.hash = "#gauntlets";
      return;
    }

    const totalStages = activeGauntletRun.stages.length;
    const stageNumber = activeGauntletRun.currentStageIndex + 1;
    backdrop.showLevel(stageContent);
    let stageOutcomeHandled = false;

    const handleStageOutcome = (snapshot: LevelSnapshot): void => {
      if (
        stageOutcomeHandled ||
        !activeGauntletRun ||
        (snapshot.status !== "complete" && snapshot.status !== "dead")
      ) {
        return;
      }
      stageOutcomeHandled = true;

      const outcome = snapshot.status === "complete" ? "completed" : "failed";
      activeGauntletRun = applyStageOutcome(activeGauntletRun, outcome);

      if (activeGauntletRun.status === "complete") {
        const grant = applyGauntletCompletion(profile, gauntletId);
        profile = grant.profile;
        saveProfile(profile);
        pendingGauntletCompletion = gauntletId;
        activeGauntletRun = null;
        setTimeout(() => {
          window.location.hash = "#gauntlets";
        }, 0);
      } else if (activeGauntletRun.status === "running") {
        setTimeout(() => {
          renderRoute();
        }, 0);
      }
    };

    disposeView = mountFirstWake(
      root,
      {
        kicker: `${gauntlet.name} - Stage ${stageNumber} of ${totalStages}`,
        name: gauntlet.name,
        equippedIcon: equippedIconName(profile),
      },
      {
        onJumpHold: (held) => backdrop.setLevelJumpHeld(held),
        onPauseChange: (paused) => backdrop.setLevelPaused(paused),
        onRestart: () => {
          stageOutcomeHandled = false;
          backdrop.restartLevel();
        },
        onReturnToLobby: () => {
          activeGauntletRun = null;
          window.location.hash = "#gauntlets";
        },
        onSnapshotChange: (uiListener) => {
          if (!uiListener) {
            backdrop.setLevelSnapshotListener(undefined);
            return;
          }
          backdrop.setLevelSnapshotListener((snapshot) => {
            handleStageOutcome(snapshot);
            uiListener(snapshot);
          });
        },
      },
    );
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
