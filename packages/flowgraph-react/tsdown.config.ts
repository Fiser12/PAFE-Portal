import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: { resolve: true },
  sourcemap: true,
  clean: true,
  treeshake: true,
  outDir: 'dist',
  tsconfig: './tsconfig.json',
  inputOptions: {
    transform: {
      jsx: { runtime: 'automatic' },
    },
  },
  external: ['flowgraph-core', 'flowgraph-session', 'react', 'react-dom'],
})
