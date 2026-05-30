// Author tooling: print a solver-clearability + difficulty + variety report for
// every pre-built level (official courses and gauntlet stages).
//
// Run with:  npx vite-node tools/level-report.ts
//
// This is the "level tester" used to find and tune interesting levels: it shows
// whether the conservative AI can clear each course, how the difficulty model
// rates it, and the variety / verticality / lighting / interestingness scores.
import { validateLevelReachability, type LevelContent } from "../src/content/first-wake";
import {
  getOfficialLevelContent,
  officialLevelCatalog,
} from "../src/content/official-levels";
import { gauntletCatalog } from "../src/core/gauntlet";
import { getGauntletStageContent } from "../src/content/electric-wake-stages";
import { analyzeLevelProfile } from "../src/core/level-analysis";
import {
  recordConservativeDemo,
  simulateConservativeRun,
} from "../src/core/level-solver";

function pad(value: string | number, width: number): string {
  return String(value).padEnd(width);
}

export function reportLevel(label: string, content: LevelContent): boolean {
  const validation = validateLevelReachability(content);
  const run = simulateConservativeRun(content);
  const demo = recordConservativeDemo(content);
  const profile = analyzeLevelProfile(content, demo.success ? demo : null);
  const v = profile.vectors;

  const status = run.reachedFinish
    ? "CLEAR"
    : `DEAD@${run.stoppedX}(${run.deathCause ?? "stuck"})`;

  console.log(
    [
      pad(label, 22),
      pad(status, 22),
      pad(`finish ${content.finishX}`, 12),
      pad(`diff ${Math.round(profile.difficulty.estimatedDifficulty)}/${profile.difficulty.estimatedLabel}`, 18),
      pad(`var ${v.obstacleVarietyScore}`, 8),
      pad(`vert ${v.verticalityScore}`, 9),
      pad(`light ${v.lightingVarietyScore}`, 10),
      pad(`ship ${Math.round(v.shipFlightRatio * 100)}%`, 9),
      pad(`fun ${profile.interestingnessScore}`, 8),
    ].join(" "),
  );

  if (!validation.ok) {
    for (const issue of validation.issues) {
      console.log(`    ! ${issue}`);
    }
  }
  return run.reachedFinish && validation.ok;
}

function main(): void {
  let allOk = true;

  console.log("\n=== Official Levels ===");
  for (const level of officialLevelCatalog) {
    const ok = reportLevel(
      `${level.id} ${level.name}`,
      getOfficialLevelContent(level.id),
    );
    allOk = allOk && ok;
  }

  console.log("\n=== Gauntlet Stages ===");
  for (const gauntlet of gauntletCatalog) {
    for (const stageId of gauntlet.stages) {
      const content = getGauntletStageContent(stageId);
      if (!content) {
        console.log(`${stageId}: MISSING`);
        allOk = false;
        continue;
      }
      const ok = reportLevel(stageId, content);
      allOk = allOk && ok;
    }
  }

  console.log(`\n${allOk ? "ALL CLEAR" : "SOME LEVELS FAILED"}\n`);
  if (!allOk) {
    process.exitCode = 1;
  }
}

main();
