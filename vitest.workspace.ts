import { defineProject } from "vitest/config";

const nodeProject = (name: string, directory: string) =>
  defineProject({
    root: `${import.meta.dirname}/packages/${directory}`,
    test: {
      name,
      include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
      sequence: { shuffle: false },
    },
  });

export default [
  defineProject({
    root: `${import.meta.dirname}/packages/flowgraph-core`,
    test: {
      name: "core",
      include: ["test/**/*.test.ts"],
      setupFiles: ["./test/setup.ts"],
      sequence: { shuffle: false },
    },
  }),
  nodeProject("session", "flowgraph-session"),
  defineProject({
    root: `${import.meta.dirname}/packages/flowgraph-react`,
    test: {
      name: "react",
      environment: "jsdom",
      include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
      setupFiles: ["./test/setup.ts"],
      sequence: { shuffle: false },
    },
  }),
  defineProject({
    root: `${import.meta.dirname}/packages/flowgraph-question-text`,
    test: {
      name: "question-text",
      environment: "jsdom",
      include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
      sequence: { shuffle: false },
    },
  }),
  defineProject({
    root: `${import.meta.dirname}/packages/flowgraph-question-number`,
    test: {
      name: "question-number",
      environment: "jsdom",
      include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
      sequence: { shuffle: false },
    },
  }),
  defineProject({
    root: `${import.meta.dirname}/packages/flowgraph-question-select`,
    test: {
      name: "question-select",
      environment: "jsdom",
      include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
      sequence: { shuffle: false },
    },
  }),
];
