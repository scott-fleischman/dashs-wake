import { describe, expect, it } from "vitest";
import { completionResultMessage } from "../../src/ui/first-wake";

describe("completion result message", () => {
  it("includes the level name and the cleared percentage", () => {
    const message = completionResultMessage("Orbital Loop");

    expect(message).toContain("Orbital Loop");
    expect(message).toContain("100%");
  });

  it("uses the provided level name, not a hardcoded one", () => {
    expect(completionResultMessage("First Wake")).not.toBe(
      completionResultMessage("Trap Lane"),
    );
  });
});
