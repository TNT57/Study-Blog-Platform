// The rules for a finished round sent by the timer (src/lib/validation/study.ts).
import { describe, expect, it } from "vitest";

import { studyRoundSchema } from "@/lib/validation/study";

describe("studyRoundSchema", () => {
  it("trims the topic", () => {
    expect(
      studyRoundSchema.parse({ durationMinutes: 25, topic: "  SQL joins " }),
    ).toEqual({ durationMinutes: 25, topic: "SQL joins" });
  });

  it.each([undefined, "", "   "])("saves no topic (null) for %o", (topic) => {
    expect(studyRoundSchema.parse({ durationMinutes: 25, topic })).toEqual({
      durationMinutes: 25,
      topic: null,
    });
  });

  it.each([
    { durationMinutes: 0 },
    { durationMinutes: 91 },
    { durationMinutes: 25.5 },
    { durationMinutes: "25" },
    { durationMinutes: 25, topic: "a".repeat(41) },
    {},
    null,
  ])("refuses %o", (input) => {
    expect(studyRoundSchema.safeParse(input).success).toBe(false);
  });
});
