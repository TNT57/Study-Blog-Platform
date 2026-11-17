// INSTRUMENTATION: Next.js runs this file once when the server starts, and calls onRequestError
// whenever something throws on the server (a page, a Server Action, the proxy).
//
// We print one JSON line per error. Vercel keeps those lines in the project's logs, where they
// can be searched by route or by digest (the short code the user sees on the error page).
// A bigger app would send the same report to an error tracker such as Sentry.
import type { Instrumentation } from "next";

import { toErrorReport } from "@/lib/error-report";

export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  console.error(JSON.stringify(toErrorReport(error, request, context)));
};
