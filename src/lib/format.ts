// Small helpers that turn data into text for the pages. Pure functions: easy to test.

export const EXCERPT_LENGTH = 160;

/**
 * The first part of a post, for the post list: about 160 characters, on one line,
 * cut at a space and ending with "…" when it was shortened.
 */
export function makeExcerpt(
  content: string,
  maxLength = EXCERPT_LENGTH,
): string {
  const oneLine = content.replace(/\s+/g, " ").trim();
  if (oneLine.length <= maxLength) return oneLine;

  const cut = oneLine.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  // Cut at the last space, unless that would throw away most of the text (one very long word).
  const end = lastSpace > maxLength * 0.6 ? lastSpace : maxLength;
  return `${cut.slice(0, end).trimEnd()}…`;
}

// Until M3 we don't know the reader, so every date is shown in one fixed time zone.
// (In M5 each user gets their own time zone for the study stats.)
const dateFormat = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "3 Nov 2026" */
export function formatPostDate(date: Date): string {
  return dateFormat.format(date);
}

/** true when the post was changed more than 1 minute after it was written. */
export function wasEdited(createdAt: Date, updatedAt: Date): boolean {
  return updatedAt.getTime() - createdAt.getTime() > 60_000;
}

/** The first letter of a name, for the round avatar: "trung" → "T". */
export function initialOf(name: string): string {
  return name.charAt(0).toUpperCase();
}

/** Splits plain text into paragraphs at empty lines. Single line breaks stay inside a paragraph. */
export function toParagraphs(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/** Focus time for the stats: 0 → "0 min", 50 → "50 min", 250 → "4 h 10 m", 120 → "2 h". */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} m`;
}

const weekdayFormat = new Intl.DateTimeFormat("en-AU", {
  weekday: "short",
  timeZone: "UTC",
});

/**
 * The short weekday of a calendar day: "2026-11-12" → "Thu".
 * The day is already the user's own day, so we read it in UTC: no time zone can shift it.
 */
export function weekdayOf(day: string): string {
  return weekdayFormat.format(new Date(`${day}T00:00:00Z`));
}
