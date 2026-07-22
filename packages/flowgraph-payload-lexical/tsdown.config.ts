import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/client.tsx'],
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
  external: [
    '@payloadcms/richtext-lexical',
    '@payloadcms/ui',
    'flowgraph-core',
    'payload',
    'react',
    'react/jsx-runtime',
  ],
})
