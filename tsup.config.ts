import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    outDir: 'dist',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    splitting: false,
    external: ['react', 'react-dom', 'vue', '@angular/core', 'rxjs', 'zone.js'],
  },
  {
    entry: { index: 'src/adapters/react/index.ts' },
    outDir: 'dist/react',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    treeshake: true,
    splitting: false,
    external: ['react', 'react-dom', 'safestorage'],
    esbuildOptions(options) {
      options.jsx = 'automatic';
    },
  },
  {
    entry: { index: 'src/adapters/vue/index.ts' },
    outDir: 'dist/vue',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    treeshake: true,
    splitting: false,
    external: ['vue', 'safestorage'],
  },
  {
    entry: { index: 'src/adapters/angular/index.ts' },
    outDir: 'dist/angular',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    treeshake: true,
    splitting: false,
    external: ['@angular/core', 'rxjs', 'zone.js', 'safestorage'],
  },
]);
