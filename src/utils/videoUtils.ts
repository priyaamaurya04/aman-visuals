/**
 * Video utility helper for handling direct MP4/WebM videos,
 * base64 encoded videos, YouTube video embeds, Vimeo embeds,
 * Instagram Reels/Posts, TikTok embeds, Loom, Dropbox direct streaming,
 * and Google Drive links.
 */

export interface ParsedVideo {
  type: 'embed' | 'direct';
  embedUrl?: string;
  backgroundUrl?: string;
  directUrl?: string;
  source: 'youtube' | 'vimeo' | 'instagram' | 'tiktok' | 'loom' | 'gdrive' | 'dropbox' | 'direct' | 'other';
  videoId?: string;
  externalUrl?: string;
  isSocialPlatform?: boolean;
  isBase64?: boolean;
}

// In-memory cache for Blob URLs converted from base64 data to avoid memory leaks & re-decoding
const base64BlobCache = new Map<string, string>();

/**
 * Checks if a string is a base64 encoded video (Data URI or raw base64)
 */
export function isBase64Video(url: string | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:video/')) return true;
  if (trimmed.startsWith('data:application/octet-stream;base64,')) return true;
  // If string does not start with http/https/blob/relative path and is long with valid base64 chars
  if (
    trimmed.length > 300 &&
    !trimmed.startsWith('http://') &&
    !trimmed.startsWith('https://') &&
    !trimmed.startsWith('blob:') &&
    !trimmed.startsWith('/') &&
    !trimmed.startsWith('./')
  ) {
    return /^[A-Za-z0-9+/=]+$/.test(trimmed.slice(0, 100));
  }
  return false;
}

/**
 * Converts a base64 string or data URI to a playable Blob URL.
 * If input is already an HTTP(S) or Blob URL, returns it directly.
 */
export function base64ToBlobUrl(base64OrDataUri: string | undefined): string {
  if (!base64OrDataUri || typeof base64OrDataUri !== 'string') return '';
  const trimmed = base64OrDataUri.trim();

  // If already an HTTP/HTTPS or Blob URL, return directly
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }

  // Check cache first
  const cached = base64BlobCache.get(trimmed);
  if (cached) return cached;

  try {
    let mimeType = 'video/mp4';
    let base64Data = trimmed;

    if (trimmed.startsWith('data:')) {
      const match = trimmed.match(/^data:([^;]+);base64,/);
      if (match) {
        mimeType = match[1];
        base64Data = trimmed.slice(match[0].length);
      }
    }

    // Decode base64 to binary byte array
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const blob = new Blob([byteNumbers], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    base64BlobCache.set(trimmed, blobUrl);
    return blobUrl;
  } catch (err) {
    console.warn('Failed to convert base64 to Blob URL, returning raw source:', err);
    return trimmed;
  }
}

/**
 * Reads a File object and converts it to a base64 Data URI string.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as base64 string'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Parses any video URL (YouTube, Vimeo, Instagram, base64, Dropbox, direct MP4)
 * and returns normalized metadata with direct playable stream or embed URLs.
 */
export function parseVideoUrl(url: string | undefined): ParsedVideo {
  if (!url || typeof url !== 'string') {
    return { type: 'direct', directUrl: '', source: 'direct' };
  }

  const trimmed = url.trim();

  // 0. Base64 Video Data Check
  if (isBase64Video(trimmed)) {
    const playableUrl = base64ToBlobUrl(trimmed);
    return {
      type: 'direct',
      directUrl: playableUrl,
      externalUrl: '',
      source: 'direct',
      isBase64: true,
    };
  }

  // 1. YouTube formats:
  const youtubeMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  if (youtubeMatch && youtubeMatch[1]) {
    const videoId = youtubeMatch[1];
    return {
      type: 'embed',
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&controls=1&rel=0&modestbranding=1`,
      backgroundUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&loop=1&playlist=${videoId}&controls=0&rel=0&modestbranding=1`,
      externalUrl: `https://www.youtube.com/watch?v=${videoId}`,
      source: 'youtube',
    };
  }

  // 2. Vimeo formats:
  const vimeoMatch = trimmed.match(
    /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/
  );
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      type: 'embed',
      videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&playsinline=1&title=0&byline=0&portrait=0`,
      backgroundUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&background=1&controls=0`,
      externalUrl: `https://vimeo.com/${videoId}`,
      source: 'vimeo',
    };
  }

  // 3. Instagram Reels & Posts:
  const instagramMatch = trimmed.match(
    /(?:instagram\.com\/(?:reel|reels|p|tv)\/)([a-zA-Z0-9_-]+)/
  );
  if (instagramMatch && instagramMatch[1]) {
    const shortcode = instagramMatch[1];
    const isReel = trimmed.includes('/reel');
    const pathType = isReel ? 'reel' : 'p';
    return {
      type: 'embed',
      videoId: shortcode,
      embedUrl: `https://www.instagram.com/${pathType}/${shortcode}/embed/`,
      backgroundUrl: `https://www.instagram.com/${pathType}/${shortcode}/embed/`,
      directUrl: trimmed,
      externalUrl: `https://www.instagram.com/${pathType}/${shortcode}/`,
      source: 'instagram',
      isSocialPlatform: true,
    };
  }

  // 4. TikTok formats:
  const tiktokMatch = trimmed.match(
    /(?:tiktok\.com\/@[\w.-]+\/video\/)(\d+)/
  );
  if (tiktokMatch && tiktokMatch[1]) {
    const videoId = tiktokMatch[1];
    return {
      type: 'embed',
      videoId,
      embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
      externalUrl: trimmed,
      source: 'tiktok',
      isSocialPlatform: true,
    };
  }

  // 5. Loom formats:
  const loomMatch = trimmed.match(
    /loom\.com\/share\/([a-zA-Z0-9_-]+)/
  );
  if (loomMatch && loomMatch[1]) {
    const videoId = loomMatch[1];
    return {
      type: 'embed',
      videoId,
      embedUrl: `https://www.loom.com/embed/${videoId}?autoplay=1&muted=1`,
      backgroundUrl: `https://www.loom.com/embed/${videoId}?autoplay=1&muted=1&hide_owner=true&hide_share=true`,
      externalUrl: `https://www.loom.com/share/${videoId}`,
      source: 'loom',
    };
  }

  // 6. Dropbox share links:
  if (trimmed.includes('dropbox.com')) {
    let directDropboxUrl = trimmed;
    if (directDropboxUrl.includes('dl=0')) {
      directDropboxUrl = directDropboxUrl.replace('dl=0', 'raw=1');
    } else if (directDropboxUrl.includes('dl=1')) {
      directDropboxUrl = directDropboxUrl.replace('dl=1', 'raw=1');
    } else if (!directDropboxUrl.includes('raw=1')) {
      directDropboxUrl += (directDropboxUrl.includes('?') ? '&' : '?') + 'raw=1';
    }
    return {
      type: 'direct',
      directUrl: directDropboxUrl,
      externalUrl: trimmed,
      source: 'dropbox',
    };
  }

  // 7. Google Drive links (supports /file/d/ID, open?id=ID, uc?id=ID, and docs.google.com)
  const gdriveMatch = trimmed.match(
    /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^&]+&)*id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/i
  );
  if (gdriveMatch && gdriveMatch[1]) {
    const fileId = gdriveMatch[1];
    const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    const proxyStreamUrl = `/api/video-proxy?id=${fileId}`;
    return {
      type: 'direct',
      videoId: fileId,
      embedUrl: previewUrl,
      backgroundUrl: previewUrl,
      externalUrl: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
      directUrl: proxyStreamUrl,
      source: 'gdrive',
    };
  }

  // 8. Direct video file (mp4, webm, mov, or standard streaming URL)
  return {
    type: 'direct',
    directUrl: trimmed,
    externalUrl: trimmed,
    source: 'direct',
  };
}

export function getAutoThumbnail(url: string | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const youtubeMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  if (youtubeMatch && youtubeMatch[1]) {
    return `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`;
  }

  const gdriveMatch = trimmed.match(
    /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^&]+&)*id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/i
  );
  if (gdriveMatch && gdriveMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w1280`;
  }

  return null;
}
