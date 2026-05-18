import { defineConfig, type Plugin } from 'vite';
import { resolve, join } from 'node:path';
import {
  mkdirSync,
  rmSync,
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

// Vite emits HTML entries at their source path (e.g. dist/src/popup/index.html)
// and computes asset hrefs relative to that location. The Chrome extension
// manifest expects them at dist/popup/index.html, so move each file and rewrite
// asset hrefs to drop the now-extra "../" segment.
function flattenHtmlOutput(outDir: string): Plugin {
  return {
    name: 'tab-coach-flatten-html',
    apply: 'build',
    closeBundle() {
      const srcRoot = join(outDir, 'src');
      if (!existsSync(srcRoot)) return;
      for (const subdir of readdirSync(srcRoot)) {
        const from = join(srcRoot, subdir, 'index.html');
        if (!existsSync(from)) continue;
        const html = readFileSync(from, 'utf8').replace(
          /(src|href)="\.\.\/\.\.\//g,
          '$1="../',
        );
        const toDir = join(outDir, subdir);
        mkdirSync(toDir, { recursive: true });
        writeFileSync(join(toDir, 'index.html'), html);
      }
      rmSync(srcRoot, { recursive: true, force: true });
    },
  };
}

const outDir = resolve(__dirname, 'dist');

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [flattenHtmlOutput(outDir)],
  build: {
    outDir,
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2022',
    minify: false,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/index.ts'),
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'background') return 'background/index.js';
          if (chunk.name === 'content') return 'content/index.js';
          return '[name]/[name].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
