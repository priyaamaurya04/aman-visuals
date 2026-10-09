import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';
import { Readable, pipeline } from 'stream';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function videoProxyPlugin(): Plugin {
  return {
    name: 'video-proxy-plugin',
    configureServer(server) {
      server.middlewares.use('/api/video-proxy', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '', 'http://localhost:3000');
          const fileId = urlObj.searchParams.get('id');
          const rawUrl = urlObj.searchParams.get('url');
          const targetUrl = fileId
            ? `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`
            : rawUrl;

          if (!targetUrl) {
            res.statusCode = 400;
            res.end('Missing url or id parameter');
            return;
          }

          const fetchHeaders: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          };
          if (req.headers.range) {
            fetchHeaders['Range'] = req.headers.range;
          }

          let response = await fetch(targetUrl, {
            headers: fetchHeaders,
            redirect: 'follow',
          });

          if (!response.ok && fileId) {
            const altUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
            const altResponse = await fetch(altUrl, {
              headers: fetchHeaders,
              redirect: 'follow',
            });
            if (altResponse.ok) {
              response = altResponse;
            }
          }

          res.statusCode = response.status;
          response.headers.forEach((val, key) => {
            const lower = key.toLowerCase();
            if (['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'].includes(lower)) {
              res.setHeader(key, val);
            }
          });
          res.setHeader('Access-Control-Allow-Origin', '*');

          if (!response.body) {
            res.end();
            return;
          }

          const nodeStream = Readable.fromWeb(response.body as any);
          nodeStream.on('error', () => {
            if (!res.writableEnded) res.end();
          });
          res.on('close', () => {
            nodeStream.destroy();
          });
          pipeline(nodeStream, res, () => {});
        } catch (err: any) {
          if (!res.headersSent) {
            res.statusCode = 500;
          }
          if (!res.writableEnded) {
            res.end(err?.message || 'Error streaming video');
          }
        }
      });
    },
  };
}

// Every video file in public/videos becomes a carousel reel. Exposed as `virtual:local-videos`
// (a sorted list of file names); in dev, adding or removing a file reloads the page.
const LOCAL_VIDEO_DIR = path.resolve(__dirname, 'public', 'videos');
const LOCAL_VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;

function localVideosPlugin(): Plugin {
  const virtualId = 'virtual:local-videos';
  const resolvedId = '\0' + virtualId;
  const listVideos = () =>
    fs.existsSync(LOCAL_VIDEO_DIR)
      ? fs
          .readdirSync(LOCAL_VIDEO_DIR)
          .filter((f) => LOCAL_VIDEO_EXT.test(f))
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      : [];

  return {
    name: 'local-videos-plugin',
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    load(id) {
      if (id === resolvedId) return `export default ${JSON.stringify(listVideos())};`;
    },
    configureServer(server) {
      server.watcher.add(LOCAL_VIDEO_DIR);
      const onChange = (file: string) => {
        if (path.dirname(path.resolve(file)) !== LOCAL_VIDEO_DIR || !LOCAL_VIDEO_EXT.test(file)) return;
        const mod = server.moduleGraph.getModuleById(resolvedId);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', onChange);
      server.watcher.on('unlink', onChange);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), videoProxyPlugin(), localVideosPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
