import type { IncomingMessage, ServerResponse } from 'http';
import { Readable, pipeline } from 'stream';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const fileId = url.searchParams.get('id');
    const rawUrl = url.searchParams.get('url');

    let targetUrl = fileId
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
      fetchHeaders['Range'] = req.headers.range as string;
    }

    let response = await fetch(targetUrl, {
      headers: fetchHeaders,
      redirect: 'follow',
    });

    // If drive.usercontent fails or redirects, try drive.google.com/uc endpoint
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');

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
}
