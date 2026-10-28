import React, { useEffect, useRef, useState } from 'react';
import { youtubeEmbedUrl } from '../utils/youtubeReels';

// YouTube player states (IFrame API)
const YT_ENDED = 0;
const YT_PLAYING = 1;
const YT_PAUSED = 2;

/**
 * A landscape YouTube video used as a silent, always-playing background (Selected Work cards).
 * Muted autoplay without controls; the player is scaled up so YouTube's title bar and logo fall outside
 * the frame, and the thumbnail covers YouTube's play / pause / end overlays until the video is actually
 * playing. A stray pause is resumed and an ended video restarts (YouTube's own loop flashes its end screen).
 */
export const YouTubeBackground: React.FC<{ videoId: string; title: string }> = ({ videoId, title }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playing, setPlaying] = useState(false);
  const [thumb, setThumb] = useState(`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`);

  const command = (func: string, args: unknown[] = []) =>
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');

  useEffect(() => {
    setPlaying(false);
    setThumb(`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`);
  }, [videoId]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow || !/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(e.origin)) return;
      let msg: { event?: string; info?: unknown };
      try {
        msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch {
        return; // not a player message
      }
      const state =
        msg?.event === 'onStateChange'
          ? Number(msg.info)
          : msg?.event === 'infoDelivery' && typeof (msg.info as { playerState?: number })?.playerState === 'number'
          ? (msg.info as { playerState: number }).playerState
          : null;
      if (state === null) return;

      if (state === YT_PLAYING) {
        setPlaying(true);
      } else if (state === YT_PAUSED) {
        command('playVideo');
      } else if (state === YT_ENDED) {
        setPlaying(false);
        command('seekTo', [0, true]);
        command('playVideo');
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Subscribe to player events (same handshake the IFrame API uses)
  const handleLoad = () => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: videoId, channel: 'widget' }), '*');
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black pointer-events-none">
      {/* 16:9 player covering the frame, enlarged so the title bar (top) and logo (bottom) are clipped */}
      <iframe
        ref={iframeRef}
        src={youtubeEmbedUrl(videoId, { autoplay: true, mute: true, loop: false, controls: false })}
        title={title}
        referrerPolicy="strict-origin-when-cross-origin"
        allow="autoplay; encrypted-media; picture-in-picture"
        onLoad={handleLoad}
        // The frame is 16:9 or wider, so a full-width 16:9 player always covers it
        className="absolute top-1/2 left-1/2 w-full aspect-video border-0 -translate-x-1/2 -translate-y-1/2 scale-[1.35] pointer-events-none"
      />
      <img
        src={thumb}
        alt={title}
        loading="lazy"
        onError={() => setThumb(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${playing ? 'opacity-0' : 'opacity-100'}`}
      />
    </div>
  );
};
