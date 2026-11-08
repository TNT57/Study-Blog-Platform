// Reads ids from the URL. Everything in a URL is text that anyone can change,
// so we check it before it gets anywhere near the database.

/** A positive whole number from a URL part, or null. "12" → 12, "abc", "-3", "1.5", "12abc" → null. */
export function parseId(value: string | string[] | undefined): number | null {
  if (typeof value !== "string" || !/^[1-9]\d{0,9}$/.test(value)) return null;
  const id = Number(value);
  // Postgres "integer" stops at 2 147 483 647. A bigger number can't be an id.
  return id <= 2_147_483_647 ? id : null;
}
