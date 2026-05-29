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
  buildGeneratedLevelRecord,
  generatePlayableTunedLevel,
} from "./core/generated-level-build";
import {
  generatorInputFromRecord,
  generatorThemeToLevelColor,
  generatorTuningFromRecord,
} from "./core/generator-tuning";
import type { GeneratorTuning } from "./core/generator-tuning";
import { SOLVER_TICK_MS } from "./core/level-solver";
import {
  deleteRecordingsForLevel,
  getLatestRecording,
  hasRecording,
  saveLevelRecording,
} from "./persistence/level-recordings";
import {
  applyCompletionAward,
  applyProgressAward,
  previewLevelCompletionReward,
  type GeneratedLevelRecord,
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
  getOfficialLevelDemo,
  getOfficialLevelMetadata,
  levelKicker,
} from "./content/official-levels";
import type { LevelDemo } from "./core/level-solver";
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

function parseLevelsFocusFromHash(hash: string): string | null {
  if (!hash.startsWith("#levels/")) {
    return null;
  }
  return hash.slice("#levels/".length) || null;
}

interface PlaybackRoute {
  id: string;
  kind: "generated" | "official";
}

function parsePlaybackRoute(
  hash: string,
  prefix: "#demo/" | "#replay/",
): PlaybackRoute | null {
  if (!hash.startsWith(prefix)) {
    return null;
  }

  const path = hash.slice(prefix.length);
  if (!path) {
    return null;
  }

  if (path.startsWith("generated/")) {
    return { kind: "generated", id: path.slice("generated/".length) };
  }

  return { kind: "official", id: path };
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
    if (snapshot.runRecording && snapshot.runRecording.length > 0) {
      saveLevelRecording(levelId, "personal", {
        frames: snapshot.runRecording,
        success: true,
        tickMs: SOLVER_TICK_MS,
      });
    }

    next = applyCompletionAward(next, { levelId }).profile;
  }

  return next;
}

function contentForGeneratedRecord(record: GeneratedLevelRecord): LevelContent {
  const tuning = generatorTuningFromRecord(record);
  return generateLevel(generatorInputFromRecord(record, tuning));
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

function applyActiveRunSpeed(speedMultiplier: number): void {
  profile = {
    ...profile,
    settings: { ...profile.settings, speedMultiplier },
  };
  saveProfile(profile);
  backdrop.setLevelRunSpeed(speedMultiplier);
  if (activeAudioPlayback) {
    activeAudioPlayback.audio.playbackRate = speedMultiplier;
  }
}

const MIN_PLAYABLE_AUDIO_BYTES = 1024;

async function startAudioPlayback(
  blobKey: string,
  playbackRate: number,
): Promise<void> {
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
  audio.playbackRate = playbackRate;
  audio.setAttribute("data-testid", "level-audio");
  audio.hidden = true;
  document.body.appendChild(audio);
  activeAudioPlayback = { audio, objectUrl };
  audio.play().catch(() => undefined);
}

function startOfficialAudioPlayback(
  sourcePath: string,
  playbackRate: number,
): void {
  const audio = new Audio(sourcePath);
  audio.loop = true;
  audio.playbackRate = playbackRate;
  audio.setAttribute("data-testid", "official-level-audio");
  audio.hidden = true;
  document.body.appendChild(audio);
  activeAudioPlayback = { audio };
  audio.play().catch(() => undefined);
}

function startPreviewAudioPlayback(
  file: File | undefined,
  playbackRate: number,
): void {
  if (!file) return;
  const objectUrl = URL.createObjectURL(file);
  const audio = new Audio(objectUrl);
  audio.loop = true;
  audio.playbackRate = playbackRate;
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
  options?: {
    demoPlayback?: LevelDemo;
    levelColor?: import("./core/profile").LevelColorTheme;
    recordRun?: boolean;
  },
): () => void {
  const demoPlayback = options?.demoPlayback;
  backdrop.showLevel(
    content,
    selectedAppearance(profile),
    options?.levelColor ?? profile.settings.levelColor,
    profile.settings.speedMultiplier,
    demoPlayback,
    options?.recordRun ?? !demoPlayback,
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

  return mountFirstWake(root, {
    ...metadata,
    personalReplayAvailable:
      metadata.levelId !== undefined &&
      hasRecording(metadata.levelId, "personal"),
    onWatchPersonalReplay:
      metadata.levelId !== undefined
        ? () => {
            const isGenerated = profile.generatedLevels.some(
              (entry) => entry.id === metadata.levelId,
            );
            window.location.hash = isGenerated
              ? `#replay/generated/${metadata.levelId}`
              : `#replay/${metadata.levelId}`;
          }
        : undefined,
  }, {
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
    onSpeedChange: applyActiveRunSpeed,
    speedMultiplier: profile.settings.speedMultiplier,
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

function launchDemoRun(
  playRoute: PlaybackRoute,
  content: LevelContent,
  metadata: LevelRunMetadata,
  demo: LevelDemo,
  returnHash: string,
  playbackKind: "personal" | "reference" = "reference",
  levelColor = profile.settings.levelColor,
): () => void {
  const playHash =
    playRoute.kind === "generated"
      ? `#generated/${playRoute.id}`
      : `#play/${playRoute.id}`;

  backdrop.showLevel(
    content,
    selectedAppearance(profile),
    levelColor,
    profile.settings.speedMultiplier,
    demo,
    false,
  );

  return mountFirstWake(root, metadata, {
    demoPlayback: true,
    playbackKind,
    onExitDemo: () => {
      window.location.hash = returnHash;
    },
    onStartPlay: () => {
      window.location.hash = playHash;
    },
    onJumpHold: () => false,
    onPauseChange: (paused) => {
      backdrop.setLevelPaused(paused);
      setAudioPlaybackPaused(paused);
    },
    onRestart: () => backdrop.restartLevel(),
    onReturnToLobby: () => {
      window.location.hash = "#levels";
    },
    onSpeedChange: applyActiveRunSpeed,
    speedMultiplier: profile.settings.speedMultiplier,
    onSnapshotChange: (uiListener) => {
      if (!uiListener) {
        backdrop.setLevelSnapshotListener(undefined);
        return;
      }
      backdrop.setLevelSnapshotListener(uiListener);
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

  if (hash === "#levels" || hash === "" || hash.startsWith("#levels/")) {
    backdrop.showLobby();
    disposeView = mountOfficialLevelsRoom(
      root,
      profile,
      {
        onPlay: (levelId) => {
          window.location.hash = `#play/${levelId}`;
        },
        onWatchDemo: (levelId) => {
          window.location.hash = `#demo/${levelId}`;
        },
        onWatchReplay: (levelId) => {
          window.location.hash = `#replay/${levelId}`;
        },
        onOpenLobby: () => {
          window.location.hash = "#lobby";
        },
      },
      parseLevelsFocusFromHash(hash) ?? undefined,
    );
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
        deleteRecordingsForLevel(recordId);
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
      onGenerate: (tuning) => {
        const nextIndex =
          profile.generatedLevels.filter(
            (entry) => entry.audioFileName === undefined,
          ).length + 1;
        let record = buildGeneratedLevelRecord(nextIndex, tuning);
        const built = generatePlayableTunedLevel(record, tuning);
        record = { ...record, seed: built.seed };

        updateProfile({
          ...profile,
          generatedLevels: [...profile.generatedLevels, record],
        });

        if (built.demo.success) {
          saveLevelRecording(record.id, "reference", built.demo);
          window.location.hash = `#demo/generated/${record.id}`;
        } else {
          renderRoute();
        }
      },
      onWatchDemo: (recordId) => {
        window.location.hash = `#demo/generated/${recordId}`;
      },
      onWatchReplay: (recordId) => {
        window.location.hash = `#replay/generated/${recordId}`;
      },
      onImportAudio: (file, tuning) => {
        const finalize = (
          audioBlobKey: string | undefined,
          analyzed: AnalyzedAudio | null,
        ): void => {
          const nextIndex =
            profile.generatedLevels.filter(
              (entry) => entry.audioFileName !== undefined,
            ).length + 1;
          let record = buildAudioDerivedLevel(
            nextIndex,
            file.name,
            audioBlobKey,
            analyzed,
            tuning,
          );
          const built = generatePlayableTunedLevel(record, tuning);
          record = { ...record, seed: built.seed };
          updateProfile({
            ...profile,
            generatedLevels: [...profile.generatedLevels, record],
          });
          if (built.demo.success) {
            saveLevelRecording(record.id, "reference", built.demo);
            window.location.hash = `#demo/generated/${record.id}`;
          } else if (window.location.hash === "#generated") {
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
      const rate = profile.settings.speedMultiplier;
      if (submission.audioFile) {
        startPreviewAudioPlayback(submission.audioFile, rate);
      } else if (savedAudioBlobKey) {
        void startAudioPlayback(savedAudioBlobKey, rate);
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
      contentForCreatedLevel(record) ?? contentForGeneratedRecord(record);

    if (record.audioBlobKey) {
      void startAudioPlayback(
        record.audioBlobKey,
        profile.settings.speedMultiplier,
      );
    }

    disposeView = launchLevelRun(
      content,
      {
        ...buildLevelRunMetadata(
          record.source === "creator" ? "Created Level" : `Generated Seed ${record.seed}`,
          record.name,
        ),
        levelId: record.id,
      },
      {
        onAttemptResolved: (snapshot) => {
          profile = applyAttemptResult(profile, recordId, snapshot);
          saveProfile(profile);
        },
        onRestart: () => {
          if (record.audioBlobKey) {
            stopAudioPlayback();
            void startAudioPlayback(
              record.audioBlobKey,
              profile.settings.speedMultiplier,
            );
          }
        },
        onReturnHome: () => {
          window.location.hash = "#generated";
        },
      },
      {
        levelColor: generatorThemeToLevelColor(record.theme ?? "electric"),
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

  const replayRoute = parsePlaybackRoute(hash, "#replay/");
  const demoRoute = parsePlaybackRoute(hash, "#demo/");

  if (replayRoute || demoRoute) {
    const route = replayRoute ?? demoRoute!;
    const isReplay = replayRoute !== null;
    const returnHash =
      route.kind === "generated" ? "#generated" : `#levels/${route.id}`;

    let content: LevelContent;
    let runMetadata: LevelRunMetadata;
    let levelColor = profile.settings.levelColor;
    let audioPath: string | undefined;

    if (route.kind === "official") {
      const officialMeta = getOfficialLevelMetadata(route.id);
      if (!officialMeta) {
        window.location.hash = "#levels";
        return;
      }

      try {
        content = getOfficialLevelContent(route.id);
      } catch {
        window.location.hash = "#levels";
        return;
      }

      runMetadata = {
        ...buildLevelRunMetadata(levelKicker(route.id), officialMeta.name),
        levelId: route.id,
        trackLabel: `${officialMeta.track.title} - ${officialMeta.track.artist}`,
      };
      audioPath = officialMeta.track.audioPath;
    } else {
      const record = profile.generatedLevels.find((entry) => entry.id === route.id);
      if (!record) {
        window.location.hash = "#generated";
        return;
      }

      content = contentForGeneratedRecord(record);
      runMetadata = {
        ...buildLevelRunMetadata("Generated Level", record.name),
        levelId: record.id,
      };
      levelColor = generatorThemeToLevelColor(record.theme ?? "electric");
    }

    const demo = isReplay
      ? getLatestRecording(route.id, "personal")
      : route.kind === "official"
        ? getOfficialLevelDemo(route.id)
        : getLatestRecording(route.id, "reference");

    if (!demo) {
      window.location.hash = returnHash;
      return;
    }

    if (audioPath) {
      startOfficialAudioPlayback(audioPath, profile.settings.speedMultiplier);
    }

    disposeView = launchDemoRun(
      route,
      content,
      runMetadata,
      demo,
      returnHash,
      isReplay ? "personal" : "reference",
      levelColor,
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

    startOfficialAudioPlayback(
      metadata.track.audioPath,
      profile.settings.speedMultiplier,
    );

    disposeView = launchLevelRun(
      content,
      {
        ...buildLevelRunMetadata(levelKicker(levelId), metadata.name),
        completionKeyReward,
        levelId,
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
