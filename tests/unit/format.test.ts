import { describe, expect, it } from "vitest";

import {
  formatMinutes,
  formatPostDate,
  initialOf,
  makeExcerpt,
  toParagraphs,
  wasEdited,
  weekdayOf,
} from "@/lib/format";
import { parseId } from "@/lib/search-params";

describe("makeExcerpt", () => {
  it("keeps short text as it is, on one line", () => {
    expect(makeExcerpt("Line one.\n\nLine   two.")).toBe("Line one. Line two.");
  });

  it("cuts long text at a space and adds …", () => {
    const text = "word ".repeat(50); // 250 characters
    const excerpt = makeExcerpt(text);

    expect(excerpt.endsWith("word…")).toBe(true);
    expect(excerpt.length).toBeLessThanOrEqual(161);
  });

  it("still cuts one very long word", () => {
    expect(makeExcerpt("a".repeat(300))).toBe(`${"a".repeat(160)}…`);
  });
});

describe("dates", () => {
  it("formats a date like the design: 3 Nov 2026", () => {
    expect(formatPostDate(new Date("2026-11-03T10:00:00Z"))).toBe("3 Nov 2026");
  });

  it("only counts a post as edited after more than 1 minute", () => {
    const created = new Date("2026-11-03T10:00:00Z");
    expect(wasEdited(created, new Date("2026-11-03T10:00:30Z"))).toBe(false);
    expect(wasEdited(created, new Date("2026-11-03T10:05:00Z"))).toBe(true);
  });
});

describe("small text helpers", () => {
  it("makes the avatar letter", () => {
    expect(initialOf("trung")).toBe("T");
  });

  it("splits text into paragraphs at empty lines", () => {
    expect(toParagraphs("One\nstill one\n\n\nTwo\n \n")).toEqual([
      "One\nstill one",
      "Two",
    ]);
  });
});

describe("parseId", () => {
  it.each([
    ["12", 12],
    ["1", 1],
    ["2147483647", 2147483647],
  ])("reads %j as %j", (value, id) => {
    expect(parseId(value)).toBe(id);
  });

  it.each([
    "0",
    "-3",
    "1.5",
    "12abc",
    "abc",
    "",
    "007",
    "2147483648",
    "0 OR 1=1",
  ])("refuses %j", (value) => {
    expect(parseId(value)).toBeNull();
  });

  it("refuses a missing value or a list (?id=1&id=2)", () => {
    expect(parseId(undefined)).toBeNull();
    expect(parseId(["1", "2"])).toBeNull();
  });
});

describe("formatMinutes", () => {
  it.each([
    [0, "0 min"],
    [50, "50 min"],
    [60, "1 h"],
    [250, "4 h 10 m"],
    [475, "7 h 55 m"],
  ])("shows %i minutes as %s", (minutes, text) => {
    expect(formatMinutes(minutes)).toBe(text);
  });
});

describe("weekdayOf", () => {
  it("names the weekday of a calendar day, in any server time zone", () => {
    expect(weekdayOf("2026-11-12")).toBe("Thu");
    expect(weekdayOf("2026-11-09")).toBe("Mon");
  });
});
