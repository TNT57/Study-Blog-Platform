// One server error → one log line, as JSON, so the hosting logs can be searched and grouped.
// Used by src/instrumentation.ts (Next.js calls onRequestError for every error on the server).

/** What Next.js tells us about the request that failed (a small part of it). */
export type FailedRequest = {
  path: string;
  method: string;
  headers: Record<string, string | string[] | undefined>;
};

/** Where in Next.js it failed: a page render, a Server Action, a route handler or the proxy. */
export type FailureContext = {
  routePath: string;
  routeType: string;
  renderSource?: string;
};

export type ErrorReport = {
  level: "error";
  message: string;
  /** The same short code the user sees on the error page: it links the two together. */
  digest?: string;
  path: string;
  method: string;
  route: string;
  type: string;
  source?: string;
};

/** The digest of an error: a short code Next.js gives each server error, or undefined. */
export function errorDigest(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "digest" in error
    ? String(error.digest)
    : undefined;
}

/**
 * Builds the log line. On purpose it NEVER copies the request headers: they contain the
 * login cookie, and logs are read by more people (and tools) than the database is.
 */
export function toErrorReport(
  error: unknown,
  request: FailedRequest,
  context: FailureContext,
): ErrorReport {
  return {
    level: "error",
    message: error instanceof Error ? error.message : String(error),
    digest: errorDigest(error),
    // Without the ?query: it can hold personal data, like an email address.
    path: request.path.split("?")[0],
    method: request.method,
    route: context.routePath,
    type: context.routeType,
    source: context.renderSource,
  };
}
