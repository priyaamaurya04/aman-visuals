
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';
import { Readable, pipeline } from 'stream';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Google Drive video proxy.
 * Available only in the Vite development server.
 * GitHub Pages cannot run this server middleware.
 */
function videoProxyPlugin(): Plugin {
  return {
    name: 'video-proxy-plugin',

    configureServer(server) {
      server.middlewares.use('/api/video-proxy', async (req, res) => {
        try {
          const urlObj = new URL(
            req.url || '',
            'http://localhost:3000'
          );

          const fileId = urlObj.searchParams.get('id');
          const rawUrl = urlObj.searchParams.get('url');

          const targetUrl = fileId
            ? `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`
            : rawUrl;

          if (!targetUrl) {
            res.statusCode = 400;
            res.end('Missing url or id parameter');
            return;
          }

          // Avoid turning the development proxy into an open proxy.
          const parsedTarget = new URL(targetUrl);

          if (
            parsedTarget.protocol !== 'https:' ||
            !['drive.google.com', 'drive.usercontent.google.com'].includes(
              parsedTarget.hostname
            )
          ) {
            res.statusCode = 400;
            res.end('Unsupported video URL');
            return;
          }

          const fetchHeaders: Record<string, string> = {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          };

          if (req.headers.range) {
            fetchHeaders['Range'] = req.headers.range;
          }

          let response = await fetch(targetUrl, {
            headers: fetchHeaders,
            redirect: 'follow',
          });

          if (!response.ok && fileId) {
            const altUrl =
              `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}&confirm=t`;

            const altResponse = await fetch(altUrl, {
              headers: fetchHeaders,
              redirect: 'follow',
            });

            if (altResponse.ok) {
              response = altResponse;
            }
          }

          res.statusCode = response.status;

          response.headers.forEach((value, key) => {
            const lower = key.toLowerCase();

            if (
              [
                'content-type',
                'content-length',
                'content-range',
                'accept-ranges',
                'cache-control',
              ].includes(lower)
            ) {
              res.setHeader(key, value);
            }
          });

          res.setHeader('Access-Control-Allow-Origin', '*');

          if (!response.body) {
            res.end();
            return;
          }

          const nodeStream = Readable.fromWeb(response.body as any);

          nodeStream.on('error', () => {
            if (!res.writableEnded) {
              res.end();
            }
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

/**
 * Finds local video files in public/videos.
 * The file list is generated during the Vite build,
 * so it also works with GitHub Pages.
 */
const LOCAL_VIDEO_DIR = path.resolve(
  __dirname,
  'public',
  'videos'
);

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
            })
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

    configureServer(server) {
      server.watcher.add(LOCAL_VIDEO_DIR);

      const onChange = (file: string) => {
        const resolvedFile = path.resolve(file);

        if (
          path.dirname(resolvedFile) !== LOCAL_VIDEO_DIR ||
          !LOCAL_VIDEO_EXT.test(file)
        ) {
          return;
        }

        const mod =
          server.moduleGraph.getModuleById(resolvedId);

        if (mod) {
          server.moduleGraph.invalidateModule(mod);
        }

        server.ws.send({ type: 'full-reload' });
      };

      server.watcher.on('add', onChange);
      server.watcher.on('unlink', onChange);
    },
  };
}

export default defineConfig(({ command }) => ({
  // For https://USERNAME.github.io/aman-visuals/
  // Change to '/' if using aman-visuals.in as the custom domain.
  base: command === 'build' ? '/aman-visuals/' : '/',

  plugins: [
    react(),
    tailwindcss(),

    // Server middleware is only available during development.
    ...(command === 'serve' ? [videoProxyPlugin()] : []),

    localVideosPlugin(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },

  server: {
    // Preserve your existing development settings.
    hmr: process.env.DISABLE_HMR !== 'true',

    watch:
      process.env.DISABLE_HMR === 'true'
        ? null
        : {},
  },
}));
