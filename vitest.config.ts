import { defineConfig } from "vitest/config";

import projects from "./vitest.workspace.js";

export default defineConfig({
  root: import.meta.dirname,
  test: {
    projects,
    coverage: {
      provider: "v8",
      include: ["packages/flowgraph-*/src/**/*.{ts,tsx}"],
      exclude: ["**/*.d.ts"],
      reporter: ["text", "json-summary", "html"],
      thresholds: {
        statements: 95,
        branches: 90,
        functions: 90,
        lines: 95,
      },
    },
  },
});
