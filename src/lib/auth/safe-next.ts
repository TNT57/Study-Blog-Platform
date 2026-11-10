// After login we send people back to the page they wanted: /login?next=/posts/new.
// But anyone can put anything in a URL. Without a check, a link like
// /login?next=https://evil.example would send a freshly logged-in user to another site
// (an "open redirect"), which phishers love. So we only accept paths on THIS site.

/** A safe path to go to after login, or "/" if the value isn't one. */
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string") return "/";
  // Must start with exactly one "/". "//evil.example" means "another site" to a browser,
  // and browsers treat "\" like "/", so "/\evil.example" is just as dangerous.
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return "/";
  }
  // No control characters (like a hidden line break) anywhere in it.
  if (/[\u0000-\u001f\u007f]/.test(value)) return "/";
  return value;
}
