import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  target: 'node24',
  platform: 'node',
  sourcemap: true,
  dts: true,
  clean: true,
  skipNodeModulesBundle: true,
});
