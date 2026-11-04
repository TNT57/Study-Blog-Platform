// Commit messages must follow Conventional Commits, e.g. "feat: add post list".
// See docs/learn/00-setup.md for the list of types.
const config = {
  extends: ["@commitlint/config-conventional"],
  // Dependabot writes long lines (links to release notes) in its commit body,
  // which would break the 100-character rule. So we skip its commits. Their first
  // line is still Conventional, because of "commit-message" in .github/dependabot.yml.
  ignores: [(message) => message.includes("Signed-off-by: dependabot[bot]")],
};

export default config;
