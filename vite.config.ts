import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
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

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), videoProxyPlugin()],
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
