import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

/** Replace /avatars/*.png strings with base64 data URIs so the page needs no image files. */
function inlinePublicAvatars(): Plugin {
  const directory = resolve('public/avatars');
  const replacements = new Map<string, string>();
  for (const file of readdirSync(directory)) {
    if (!file.toLowerCase().endsWith('.png')) continue;
    const bytes = readFileSync(resolve(directory, file));
    replacements.set(`/avatars/${file}`, `data:image/png;base64,${bytes.toString('base64')}`);
  }

  return {
    name: 'inline-public-avatars',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('node_modules')) return null;
      if (!/\.(tsx?|jsx?|json)$/.test(id)) return null;
      let next = code;
      let changed = false;
      for (const [from, to] of replacements) {
        if (!next.includes(from)) continue;
        next = next.split(from).join(to);
        changed = true;
      }
      return changed ? { code: next, map: null } : null;
    },
  };
}

export default defineConfig({
  plugins: [inlinePublicAvatars(), react(), viteSingleFile({ removeViteModuleLoader: true })],
  // public/avatars are inlined above. Do not copy them next to the HTML file.
  publicDir: false,
  build: {
    outDir: 'dist-single',
    emptyOutDir: true,
    modulePreload: false,
    cssCodeSplit: false,
    assetsInlineLimit: Number.POSITIVE_INFINITY,
  },
});
