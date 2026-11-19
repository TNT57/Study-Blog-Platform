// The server's error log line (src/lib/error-report.ts).
import { describe, expect, it } from "vitest";

import { toErrorReport } from "@/lib/error-report";

const request = {
  path: "/posts/12?email=trung@example.com",
  method: "GET",
  headers: { cookie: "__Host-session=secret-token", "user-agent": "Firefox" },
};
const context = {
  routePath: "/posts/[id]",
  routeType: "render",
  renderSource: "server-rendering",
};

describe("toErrorReport", () => {
  it("says what broke, where, and with which digest", () => {
    const error = Object.assign(new Error("connection refused"), {
      digest: "4281973",
    });

    expect(toErrorReport(error, request, context)).toEqual({
      level: "error",
      message: "connection refused",
      digest: "4281973",
      path: "/posts/12",
      method: "GET",
      route: "/posts/[id]",
      type: "render",
      source: "server-rendering",
    });
  });

  it("never copies the login cookie or the ?query into the logs", () => {
    const line = JSON.stringify(
      toErrorReport(new Error("boom"), request, context),
    );

    expect(line).not.toContain("secret-token");
    expect(line).not.toContain("trung@example.com");
  });

  it("copes with things that aren't Error objects", () => {
    expect(toErrorReport("a plain string", request, context)).toMatchObject({
      message: "a plain string",
      digest: undefined,
    });
  });
});
