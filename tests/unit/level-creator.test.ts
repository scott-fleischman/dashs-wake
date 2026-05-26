import { describe, expect, it } from "vitest";
import {
  buildCreatedLevelRecord,
  contentForCreatedLevel,
  type CreatorSubmission,
} from "../../src/ui/level-creator";

function submission(): CreatorSubmission {
  return {
    audioFile: new File(["song"], "build-song.ogg", { type: "audio/ogg" }),
    layout: {
      entities: [
        { type: "spike", height: 30, width: 30, x: 300, y: 270 },
        {
          type: "orb",
          id: "created-trigger-1",
          effect: { kind: "impulse", magnitude: 720 },
          height: 30,
          width: 30,
          x: 420,
          y: 205,
        },
      ],
      finishX: 1900,
    },
    name: "My Course",
  };
}

describe("level creator records", () => {
  it("persists authored geometry separately from generated layouts", () => {
    const record = buildCreatedLevelRecord(1, submission(), "audio-key", {
      beats: [0, 600, 1200],
      beatIntensities: ["quiet", "intense", "quiet"],
      durationMs: 10_000,
    });

    expect(record.id).toBe("created-level-1");
    expect(record.source).toBe("creator");
    expect(record.audioBlobKey).toBe("audio-key");
    expect(record.authoredLayout?.entities).toHaveLength(2);
  });

  it("launches saved geometry using the selected finish point", () => {
    const record = buildCreatedLevelRecord(2, submission(), undefined, null);
    const content = contentForCreatedLevel(record);

    expect(content?.finishX).toBe(1900);
    expect(content?.entities).toEqual(submission().layout.entities);
  });

  it("supports saving songless works in progress and editing an existing record in place", () => {
    const draft: CreatorSubmission = {
      layout: {
        entities: [{ type: "block", height: 60, width: 60, x: 500, y: 240 }],
        finishX: 1600,
      },
      name: "Block Draft",
    };
    const initial = buildCreatedLevelRecord(3, draft, undefined, null);
    const revised = buildCreatedLevelRecord(
      99,
      { ...draft, name: "Block Draft Revised" },
      undefined,
      null,
      initial,
    );

    expect(initial.audioFileName).toBeUndefined();
    expect(initial.beatMap.beats.length).toBeGreaterThan(0);
    expect(
      Math.max(...initial.beatMap.beats),
    ).toBeLessThanOrEqual(initial.beatMap.durationMs);
    expect(revised.id).toBe(initial.id);
    expect(revised.name).toBe("Block Draft Revised");
  });
});
