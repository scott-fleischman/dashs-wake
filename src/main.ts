import "./styles.css";
import { startLobbyBackdrop, type LevelSnapshot } from "./game/lobby-backdrop";
import type { LevelContent } from "./content/first-wake";
import { mountChestRoom } from "./ui/chest-room";
import { mountCustomizer } from "./ui/customizer";
import {
  mountFirstWake,
  type LevelRunMetadata,
} from "./ui/first-wake";
import { mountGauntletsRoom } from "./ui/gauntlets-room";
import {
  buildAudioDerivedLevel,
  buildPlaceholderGeneratedLevel,
  mountGeneratedLevelsRoom,
} from "./ui/generated-levels-room";
import { mountLobby } from "./ui/lobby";
import { mountOfficialLevelsRoom } from "./ui/levels-room";
import { mountShop } from "./ui/shop";
import { mountSettings } from "./ui/settings";
import {
  buildCreatedLevelRecord,
  contentForCreatedLevel,
  type CreatorSubmission,
  mountLevelCreator,
} from "./ui/level-creator";
import { generateLevel } from "./core/generator";
import {
  applyCompletionAward,
  applyProgressAward,
  previewLevelCompletionReward,
  type PlayerProfile,
} from "./core/profile";
import { formatRewardSummary } from "./core/reward-summary";
import { cosmeticCatalog, selectedAppearance } from "./core/inventory";
import {
  applyGauntletCompletion,
  applyStageOutcome,
  decideGauntletEntryState,
  gauntletCatalog,
  restartGauntletAtActiveStage,
  type GauntletRunState,
} from "./core/gauntlet";
import { analyzeAudioFile, type AnalyzedAudio } from "./core/audio-decoder";
import {
  deleteAudioBlob,
  getAudioBlob,
  putAudioBlob,
} from "./persistence/audio-storage";
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
let activeAudioPlayback: {
  audio: HTMLAudioElement;
  objectUrl?: string;
} | null = null;
let audioPlaybackToken = 0;
let creatorDraft: {
  recordId?: string;
  submission: CreatorSubmission;
} | null = null;

function stopAudioPlayback(): void {
  if (!activeAudioPlayback) return;
  const { audio, objectUrl } = activeAudioPlayback;
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  audio.remove();
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
  }
  activeAudioPlayback = null;
}

function setAudioPlaybackPaused(paused: boolean): void {
  if (!activeAudioPlayback) return;
  if (paused) {
    activeAudioPlayback.audio.pause();
  } else {
    activeAudioPlayback.audio.play().catch(() => undefined);
  }
}

function restartAudioPlayback(): void {
  if (!activeAudioPlayback) return;
  activeAudioPlayback.audio.currentTime = 0;
  activeAudioPlayback.audio.play().catch(() => undefined);
}

const MIN_PLAYABLE_AUDIO_BYTES = 1024;

async function startAudioPlayback(blobKey: string): Promise<void> {
  const token = ++audioPlaybackToken;
  const blob = await getAudioBlob(blobKey).catch(() => undefined);
  if (token !== audioPlaybackToken) {
    return;
  }
  if (!blob || blob.size < MIN_PLAYABLE_AUDIO_BYTES) {
    return;
  }
  if (
    !window.location.hash.startsWith("#generated/") &&
    window.location.hash !== "#creator-preview"
  ) {
    return;
  }
  if (activeAudioPlayback) {
    return;
  }
  const objectUrl = URL.createObjectURL(blob);
  const audio = new Audio(objectUrl);
  audio.setAttribute("data-testid", "level-audio");
  audio.hidden = true;
  document.body.appendChild(audio);
  activeAudioPlayback = { audio, objectUrl };
  audio.play().catch(() => undefined);
}

function startOfficialAudioPlayback(
  sourcePath: string,
): void {
  const audio = new Audio(sourcePath);
  audio.loop = true;
  audio.setAttribute("data-testid", "official-level-audio");
  audio.hidden = true;
  document.body.appendChild(audio);
  activeAudioPlayback = { audio };
  audio.play().catch(() => undefined);
}

function startPreviewAudioPlayback(file: File | undefined): void {
  if (!file) return;
  const objectUrl = URL.createObjectURL(file);
  const audio = new Audio(objectUrl);
  audio.loop = true;
  audio.setAttribute("data-testid", "level-audio");
  audio.hidden = true;
  document.body.appendChild(audio);
  activeAudioPlayback = { audio, objectUrl };
  audio.play().catch(() => undefined);
}

window.addEventListener("beforeunload", () => {
  stopAudioPlayback();
  backdrop.destroy(true);
});

interface LaunchLevelRunCallbacks {
  onAttemptResolved: (snapshot: LevelSnapshot) => void;
  onRestart?: () => void;
  onReturnHome: () => void;
}

function buildLevelRunMetadata(
  kicker: string,
  name: string,
): LevelRunMetadata {
  return {
    equippedIcon: equippedIconName(profile),
    kicker,
    name,
  };
}

function launchLevelRun(
  content: LevelContent,
  metadata: LevelRunMetadata,
  callbacks: LaunchLevelRunCallbacks,
): () => void {
  const adjustedContent: LevelContent = {
    ...content,
    rules: {
      ...content.rules,
      horizontalSpeed:
        content.rules.horizontalSpeed * profile.settings.speedMultiplier,
    },
  };
  backdrop.showLevel(
    adjustedContent,
    selectedAppearance(profile),
    profile.settings.levelColor,
  );
  let attemptResolved = false;

  const resolveSnapshot = (snapshot: LevelSnapshot): void => {
    if (
      attemptResolved ||
      (snapshot.status !== "dead" && snapshot.status !== "complete")
    ) {
      return;
    }
    attemptResolved = true;
    setAudioPlaybackPaused(true);
    callbacks.onAttemptResolved(snapshot);
  };

  return mountFirstWake(root, metadata, {
    onJumpHold: (held) => backdrop.setLevelJumpHeld(held),
    onPauseChange: (paused) => {
      backdrop.setLevelPaused(paused);
      setAudioPlaybackPaused(paused);
    },
    onRestart: () => {
      attemptResolved = false;
      backdrop.restartLevel();
      callbacks.onRestart?.();
    },
    onReturnToLobby: callbacks.onReturnHome,
    onSnapshotChange: (uiListener) => {
      if (!uiListener) {
        backdrop.setLevelSnapshotListener(undefined);
        return;
      }
      backdrop.setLevelSnapshotListener((snapshot) => {
        resolveSnapshot(snapshot);
        uiListener(snapshot);
      });
    },
  });
}

function renderRoute(): void {
  disposeView();
  stopAudioPlayback();

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
        window.location.hash = "#lobby";
      },
    });
    return;
  }

  if (hash === "#shop") {
    backdrop.showLobby();
    disposeView = mountShop(root, profileRef, {
      onProfileChange: updateProfile,
      onReturnToLobby: () => {
        window.location.hash = "#lobby";
      },
    });
    return;
  }

  if (hash === "#settings") {
    backdrop.showLobby();
    disposeView = mountSettings(root, profileRef, {
      onProfileChange: updateProfile,
      onReturnToLobby: () => {
        window.location.hash = "#lobby";
      },
    });
    return;
  }

  if (hash === "#levels" || hash === "") {
    backdrop.showLobby();
    disposeView = mountOfficialLevelsRoom(root, profile, {
      onPlay: (levelId) => {
        window.location.hash = `#play/${levelId}`;
      },
      onOpenLobby: () => {
        window.location.hash = "#lobby";
      },
    });
    return;
  }

  if (hash === "#chest-room") {
    backdrop.showLobby();
    disposeView = mountChestRoom(root, profileRef, {
      onProfileChange: updateProfile,
      onReturnToLobby: () => {
        window.location.hash = "#lobby";
      },
    });
    return;
  }

  if (hash === "#generated") {
    backdrop.showLobby();
    disposeView = mountGeneratedLevelsRoom(root, profileRef, {
      onCreate: () => {
        creatorDraft = null;
        window.location.hash = "#creator";
      },
      onDelete: (recordId) => {
        const removed = profile.generatedLevels.find(
          (record) => record.id === recordId,
        );
        if (removed?.audioBlobKey) {
          void deleteAudioBlob(removed.audioBlobKey).catch(() => undefined);
        }
        updateProfile({
          ...profile,
          generatedLevels: profile.generatedLevels.filter(
            (record) => record.id !== recordId,
          ),
        });
        renderRoute();
      },
      onEdit: (recordId) => {
        creatorDraft = null;
        window.location.hash = `#creator/${recordId}`;
      },
      onGenerate: (difficulty, subRank, theme) => {
        const nextIndex =
          profile.generatedLevels.filter(
            (entry) => entry.audioFileName === undefined,
          ).length + 1;
        const record = buildPlaceholderGeneratedLevel(
          nextIndex,
          difficulty,
          subRank,
          theme,
        );
        updateProfile({
          ...profile,
          generatedLevels: [...profile.generatedLevels, record],
        });
        renderRoute();
      },
      onImportAudio: (file, difficulty, subRank, theme) => {
        const finalize = (
          audioBlobKey: string | undefined,
          analyzed: AnalyzedAudio | null,
        ): void => {
          const nextIndex =
            profile.generatedLevels.filter(
              (entry) => entry.audioFileName !== undefined,
            ).length + 1;
          const record = buildAudioDerivedLevel(
            nextIndex,
            file.name,
            audioBlobKey,
            analyzed,
            difficulty,
            subRank,
            theme,
          );
          updateProfile({
            ...profile,
            generatedLevels: [...profile.generatedLevels, record],
          });
          if (window.location.hash === "#generated") {
            renderRoute();
          }
        };

        Promise.all([
          putAudioBlob(file).catch(() => undefined),
          analyzeAudioFile(file).catch(() => null),
        ]).then(([audioBlobKey, analyzed]) => finalize(audioBlobKey, analyzed));
      },
      onPlay: (recordId) => {
        window.location.hash = `#generated/${recordId}`;
      },
      onReturnToLobby: () => {
        window.location.hash = "#lobby";
      },
    });
    return;
  }

  if (hash === "#creator" || hash.startsWith("#creator/")) {
    backdrop.showLobby();
    const recordId =
      hash.startsWith("#creator/") ? hash.slice("#creator/".length) : undefined;
    const existing = recordId
      ? profile.generatedLevels.find(
          (record) => record.id === recordId && record.source === "creator",
        )
      : undefined;

    if (recordId && !existing) {
      window.location.hash = "#generated";
      return;
    }

    const initial =
      creatorDraft && creatorDraft.recordId === recordId
        ? creatorDraft.submission
        : existing?.authoredLayout
          ? {
              audioFileName: existing.audioFileName,
              layout: existing.authoredLayout,
              name: existing.name,
            }
          : undefined;

    disposeView = mountLevelCreator(root, {
      initial,
      onPreview: (submission) => {
        creatorDraft = { ...(recordId ? { recordId } : {}), submission };
        window.location.hash = "#creator-preview";
      },
      onReturn: () => {
        creatorDraft = null;
        window.location.hash = "#generated";
      },
      onSave: (submission) => {
        const audioTasks: Promise<[string | undefined, AnalyzedAudio | null]> =
          submission.audioFile
            ? Promise.all([
                putAudioBlob(submission.audioFile).catch(() => undefined),
                analyzeAudioFile(submission.audioFile).catch(() => null),
              ])
            : Promise.resolve([undefined, null]);
        audioTasks.then(([audioBlobKey, analyzed]) => {
          const nextIndex =
            profile.generatedLevels.filter(
              (entry) => entry.source === "creator",
            ).length + 1;
          const record = buildCreatedLevelRecord(
            nextIndex,
            submission,
            audioBlobKey,
            analyzed,
            existing,
          );
          const nextRecords = existing
            ? profile.generatedLevels.map((entry) =>
                entry.id === existing.id ? record : entry,
              )
            : [...profile.generatedLevels, record];
          if (
            existing?.audioBlobKey &&
            audioBlobKey &&
            existing.audioBlobKey !== audioBlobKey
          ) {
            void deleteAudioBlob(existing.audioBlobKey).catch(() => undefined);
          }
          updateProfile({
            ...profile,
            generatedLevels: nextRecords,
          });
          creatorDraft = null;
          if (window.location.hash.startsWith("#creator")) {
            window.location.hash = "#generated";
          }
        });
      },
    });
    return;
  }

  if (hash === "#creator-preview") {
    if (!creatorDraft) {
      window.location.hash = "#generated";
      return;
    }
    const submission = creatorDraft.submission;
    const savedRecord = creatorDraft.recordId
      ? profile.generatedLevels.find(
          (record) => record.id === creatorDraft?.recordId,
        )
      : undefined;
    const previewRecord = buildCreatedLevelRecord(
      0,
      submission,
      undefined,
      null,
      savedRecord,
    );
    const content = contentForCreatedLevel(previewRecord);
    if (!content) {
      window.location.hash = "#generated";
      return;
    }
    const savedAudioBlobKey = savedRecord?.audioBlobKey;
    const startCreatorPreviewAudio = (): void => {
      if (submission.audioFile) {
        startPreviewAudioPlayback(submission.audioFile);
      } else if (savedAudioBlobKey) {
        void startAudioPlayback(savedAudioBlobKey);
      }
    };
    startCreatorPreviewAudio();
    disposeView = launchLevelRun(
      content,
      buildLevelRunMetadata("Creator Playtest", submission.name),
      {
        onAttemptResolved: () => undefined,
        onRestart: () => {
          stopAudioPlayback();
          startCreatorPreviewAudio();
        },
        onReturnHome: () => {
          window.location.hash = creatorDraft?.recordId
            ? `#creator/${creatorDraft.recordId}`
            : "#creator";
        },
      },
    );
    return;
  }

  if (hash.startsWith("#generated/")) {
    const recordId = hash.slice("#generated/".length);
    const record = profile.generatedLevels.find(
      (entry) => entry.id === recordId,
    );

    if (!record) {
      window.location.hash = "#generated";
      return;
    }

    const content =
      contentForCreatedLevel(record) ??
      generateLevel({
        beatIntensities: record.beatIntensities,
        beatMap: record.beatMap,
        difficulty: record.difficulty,
        seed: record.seed,
        subRank: record.subRank,
        theme: record.theme,
      });

    if (record.audioBlobKey) {
      void startAudioPlayback(record.audioBlobKey);
    }

    disposeView = launchLevelRun(
      content,
      buildLevelRunMetadata(
        record.source === "creator" ? "Created Level" : `Generated Seed ${record.seed}`,
        record.name,
      ),
      {
        onAttemptResolved: () => {
          // Generated levels do not yet award progression.
        },
        onRestart: () => {
          if (record.audioBlobKey) {
            stopAudioPlayback();
            void startAudioPlayback(record.audioBlobKey);
          }
        },
        onReturnHome: () => {
          window.location.hash = "#generated";
        },
      },
    );
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
          window.location.hash = "#lobby";
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

    activeGauntletRun = decideGauntletEntryState(activeGauntletRun, gauntlet);

    const stageId = activeGauntletRun.stages[activeGauntletRun.currentStageIndex];
    const stageContent = stageId ? getGauntletStageContent(stageId) : undefined;

    if (!stageContent) {
      activeGauntletRun = null;
      window.location.hash = "#gauntlets";
      return;
    }

    const totalStages = activeGauntletRun.stages.length;
    const stageNumber = activeGauntletRun.currentStageIndex + 1;

    disposeView = launchLevelRun(
      stageContent,
      buildLevelRunMetadata(
        `${gauntlet.name} - Stage ${stageNumber} of ${totalStages}`,
        gauntlet.name,
      ),
      {
        onAttemptResolved: (snapshot) => {
          if (!activeGauntletRun) {
            return;
          }

          const outcome =
            snapshot.status === "complete" ? "completed" : "failed";
          activeGauntletRun = applyStageOutcome(activeGauntletRun, outcome);

          if (activeGauntletRun.status === "complete") {
            const grant = applyGauntletCompletion(profile, gauntletId);
            profile = grant.profile;
            saveProfile(profile);
            pendingGauntletCompletion = gauntletId;
            activeGauntletRun = null;
            setTimeout(() => {
              if (window.location.hash.startsWith("#gauntlet/")) {
                window.location.hash = "#gauntlets";
              }
            }, 0);
          } else if (activeGauntletRun.status === "running") {
            setTimeout(() => {
              if (window.location.hash.startsWith("#gauntlet/")) {
                renderRoute();
              }
            }, 0);
          }
        },
        onRestart: () => {
          if (activeGauntletRun && activeGauntletRun.status === "failed") {
            activeGauntletRun = restartGauntletAtActiveStage(
              activeGauntletRun,
            );
          }
        },
        onReturnHome: () => {
          activeGauntletRun = null;
          window.location.hash = "#gauntlets";
        },
      },
    );
    return;
  }

  const levelId = parseLevelIdFromHash(hash);

  if (levelId) {
    const metadata = getOfficialLevelMetadata(levelId);

    if (!metadata) {
      window.location.hash = "#levels";
      return;
    }

    let content;
    try {
      content = getOfficialLevelContent(levelId);
    } catch {
      window.location.hash = "#levels";
      return;
    }

    const completionKeyReward = previewLevelCompletionReward(profile, levelId);
    delete completionKeyReward.coinsAwarded;
    const previousBestPercent = profile.bestPercents[levelId] ?? 0;

    startOfficialAudioPlayback(metadata.track.audioPath);

    disposeView = launchLevelRun(
      content,
      {
        ...buildLevelRunMetadata(levelKicker(levelId), metadata.name),
        completionKeyReward,
        previousBestPercent,
        trackLabel: `${metadata.track.title} - ${metadata.track.artist}`,
      },
      {
        onAttemptResolved: (snapshot) => {
          profile = applyAttemptResult(profile, levelId, snapshot);
          saveProfile(profile);
        },
        onRestart: restartAudioPlayback,
        onReturnHome: () => {
          window.location.hash = "#levels";
        },
      },
    );
    return;
  }

  if (hash === "#lobby") {
    backdrop.showLobby();
    const removeLobbyView = mountLobby(root, profile, () => {
      window.location.hash = "#levels";
    });
    const handleLobbyKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || event.repeat) return;
      if (event.code === "Escape" || event.code === "Backspace") {
        event.preventDefault();
        window.location.hash = "#levels";
      }
    };
    window.addEventListener("keydown", handleLobbyKeyDown);
    disposeView = () => {
      window.removeEventListener("keydown", handleLobbyKeyDown);
      removeLobbyView();
    };
    return;
  }

  window.location.hash = "#levels";
}

window.addEventListener("hashchange", renderRoute);
renderRoute();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener("hashchange", renderRoute);
    disposeView();
    stopAudioPlayback();
    backdrop.destroy(true);
  });
}
