import { describe, expect, it } from "vitest";

import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  it("accepts a postgres URL", () => {
    const env = parseEnv({
      DATABASE_URL: "postgres://study:study@localhost:5432/study_blog",
    });

    expect(env.DATABASE_URL).toContain("study_blog");
  });

  it("explains what is wrong when DATABASE_URL is missing", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });

  it("refuses a URL that is not a postgres URL", () => {
    expect(() => parseEnv({ DATABASE_URL: "https://example.com" })).toThrow(
      /postgres:\/\//,
    );
  });
});
