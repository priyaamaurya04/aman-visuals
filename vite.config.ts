import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LOCAL_VIDEO_DIR = path.resolve(
  __dirname,
  'public',
  'videos',
);

const LOCAL_VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;

function localVideosPlugin(): Plugin {
  const virtualId = 'virtual:local-videos';
  const resolvedId = '\0' + virtualId;

  const listVideos = (): string[] => {
    if (!fs.existsSync(LOCAL_VIDEO_DIR)) {
      return [];
    }

    return fs
      .readdirSync(LOCAL_VIDEO_DIR)
      .filter((file) => LOCAL_VIDEO_EXT.test(file))
      .sort((a, b) =>
        a.localeCompare(b, undefined, {
          numeric: true,
          sensitivity: 'base',
        }),
      );
  };

  return {
    name: 'local-videos-plugin',

    resolveId(id) {
      if (id === virtualId) {
        return resolvedId;
      }

      return undefined;
    },

    load(id) {
      if (id === resolvedId) {
        return `export default ${JSON.stringify(listVideos())};`;
      }

      return undefined;
    },
  };
}

export default defineConfig({
  base: '/aman-visuals/',

  plugins: [
    react(),
    tailwindcss(),
    localVideosPlugin(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
