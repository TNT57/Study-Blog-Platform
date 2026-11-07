import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // shadcn/ui components import cn from the "cn" package. Ours knows our
    // text sizes (see src/lib/utils.ts), so everyone must use ours.
    files: ["src/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"],
    ignores: ["src/lib/utils.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "cn",
              message:
                'Import { cn } from "@/lib/utils" instead. It knows our text sizes.',
            },
          ],
        },
      ],
    },
  },
  {
    // The MVC borders (see docs/architecture.md). Each layer may only use the layers below it:
    // View (app, components) → Controller (controllers) → Model (models) → database (lib/db).
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: ["./src/app", "./src/components"],
              from: [
                "./src/models",
                "./src/lib/db.ts",
                "./src/lib/migrations.ts",
              ],
              message:
                "A view must not touch the database. Ask a controller in src/controllers instead.",
            },
            {
              target: "./src/controllers",
              from: ["./src/app", "./src/components"],
              message: "A controller must not import pages or components.",
            },
            {
              target: "./src/models",
              from: ["./src/controllers", "./src/app", "./src/components"],
              message:
                "A model only talks to the database. It must not know about controllers or pages.",
            },
            {
              target: "./src/lib",
              from: [
                "./src/controllers",
                "./src/app",
                "./src/components",
                "./src/models",
              ],
              message:
                "src/lib is shared helpers. It must not import the layers that use it.",
            },
          ],
        },
      ],
    },
  },
  {
    // Models are plain TypeScript + SQL. Without Next.js imports, we can swap the framework
    // (or reuse the models in scripts and tests) without touching them.
    files: ["src/models/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "cn",
              message:
                'Import { cn } from "@/lib/utils" instead. It knows our text sizes.',
            },
          ],
          patterns: [
            {
              group: ["next", "next/*"],
              message:
                "A model must not depend on Next.js. Keep Next.js in controllers and views.",
            },
          ],
        },
      ],
    },
  },
  // Turn off style rules that Prettier already handles (must be last).
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
