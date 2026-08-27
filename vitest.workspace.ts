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
    root: `${import.meta.dirname}/packages/flowgraph-payload-lexical`,
    test: {
      name: "payload-lexical",
      environment: "jsdom",
      include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
      sequence: { shuffle: false },
    },
  }),
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
  defineProject({
    root: `${import.meta.dirname}/apps/web`,
    resolve: {
      alias: { "@": `${import.meta.dirname}/apps/web/src` },
    },
    test: {
      name: "web-unit",
      environment: "node",
      include: ["test/unit/**/*.test.ts"],
      sequence: { shuffle: false },
    },
  }),
  defineProject({
    root: `${import.meta.dirname}/apps/web`,
    resolve: {
      alias: { "@": `${import.meta.dirname}/apps/web/src` },
    },
    test: {
      name: "web-vertical",
      environment: "node",
      include: ["test/vertical/**/*.test.ts"],
      globalSetup: ["./test/vertical/global-setup.ts"],
      pool: "forks",
      maxWorkers: 1,
      isolate: false,
      fileParallelism: false,
      server: { deps: { inline: ["payload-auth"] } },
      hookTimeout: 180_000,
      testTimeout: 60_000,
      sequence: { shuffle: false },
    },
  }),
];
