/**
 * Helpers for YouTube Shorts reels in the vertical carousel.
 * Only the video ID and metadata are stored; playback always goes through YouTube's official embed.
 */

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com']);

/** Returns the 11-character video ID for Shorts, youtu.be, watch, embed and live URLs, or null. */
export function extractYouTubeId(input: string | undefined | null): string | null {
  if (!input) return null;
  let raw = input.trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split('/').filter(Boolean);
  let id: string | null | undefined = null;

  if (host === 'youtu.be' || host === 'www.youtu.be') {
    id = segments[0];
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (segments[0] === 'watch') {
      id = url.searchParams.get('v');
    } else if (['shorts', 'embed', 'live', 'v'].includes(segments[0])) {
      id = segments[1];
    }
  }

  return id && YOUTUBE_ID.test(id) ? id : null;
}

export function youtubeShortsUrl(id: string): string {
  return `https://www.youtube.com/shorts/${id}`;
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youtubeThumbnailUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Official embed URL. `enablejsapi` + `origin` let the page receive the player's onError events
 * (private / deleted / embedding disabled); `loop` needs `playlist` set to the same ID.
 */
export function youtubeEmbedUrl(id: string, opts: { autoplay?: boolean; mute?: boolean; controls?: boolean; loop?: boolean } = {}): string {
  const params = new URLSearchParams({
    autoplay: opts.autoplay ? '1' : '0',
    mute: opts.mute ? '1' : '0',
    controls: opts.controls ? '1' : '0',
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3', // no annotations / cards
    cc_load_policy: '0', // captions off unless the viewer turns them on
    enablejsapi: '1',
  });
  if (opts.loop) {
    params.set('loop', '1');
    params.set('playlist', id);
  }
  if (typeof window !== 'undefined') params.set('origin', window.location.origin);
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

/** Human-readable reason for a YouTube player onError code. */
export function youtubeErrorMessage(code: number | undefined): string {
  switch (code) {
    case 100:
      return 'This video was removed or is private.';
    case 101:
    case 150:
      return 'This video can’t be played on this site.';
    case 2:
      return 'This YouTube link is invalid.';
    default:
      return 'This video is unavailable right now.';
  }
}
