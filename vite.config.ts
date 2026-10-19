import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LOCAL_VIDEO_DIR = path.resolve(__dirname, 'public', 'videos');
const LOCAL_VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;

function localVideosPlugin(): Plugin {
  const virtualId = 'virtual:local-videos';
  const resolvedId = '\0' + virtualId;

  const listVideos = () =>
    fs.existsSync(LOCAL_VIDEO_DIR)
      ? fs
          .readdirSync(LOCAL_VIDEO_DIR)
          .filter((file) => LOCAL_VIDEO_EXT.test(file))
          .sort((a, b) =>
            a.localeCompare(b, undefined, {
              numeric: true,
              sensitivity: 'base',
            }),
          )
      : [];

  return {
    name: 'local-videos-plugin',

    resolveId(id) {
      if (id === virtualId) {
        return resolvedId;
      }
    },

    load(id) {
      if (id === resolvedId) {
        return `export default ${JSON.stringify(listVideos())};`;
      }
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
