import { useCallback, useEffect, useRef, useState } from 'react';

// YouTube player states (IFrame API)
const YT_PLAYING = 1;
const YT_PAUSED = 2;

// YouTube draws a pause icon and the title over a video for its first ~3s of playback (even with
// controls=0); `revealed` turns true once they have faded, so a thumbnail can cover them until then
const YT_OVERLAY_MS = 4500;

/**
 * Drives an embedded YouTube player (an iframe whose URL has enablejsapi=1) from our own controls,
 * over the same postMessage protocol the IFrame API uses. Pass `onLoad` to the iframe.
 */
export function useYouTubePlayer(iframeRef: React.RefObject<HTMLIFrameElement | null>, initiallyMuted = true) {
  const [playing, setPlaying] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [muted, setMuted] = useState(initiallyMuted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const revealTimerRef = useRef<number | undefined>(undefined);

  const command = useCallback(
    (func: string, args: unknown[] = []) =>
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*'),
    [iframeRef]
  );

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow || !/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(e.origin)) return;
      let msg: { event?: string; info?: unknown };
      try {
        msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch {
        return; // not a player message
      }
      const info = (msg?.info ?? {}) as { playerState?: number; currentTime?: number; duration?: number; muted?: boolean };
      const state =
        msg?.event === 'onStateChange' ? Number(msg.info) : msg?.event === 'infoDelivery' ? info.playerState : undefined;

      if (msg?.event === 'infoDelivery') {
        if (typeof info.currentTime === 'number') setCurrentTime(info.currentTime);
        if (typeof info.duration === 'number' && info.duration > 0) setDuration(info.duration);
        if (typeof info.muted === 'boolean') setMuted(info.muted);
      }
      if (state === YT_PLAYING) {
        setPlaying(true);
        // The player repeats its state several times a second: start the countdown once
        if (revealTimerRef.current === undefined) {
          revealTimerRef.current = window.setTimeout(() => setRevealed(true), YT_OVERLAY_MS);
        }
      } else if (state === YT_PAUSED) {
        setPlaying(false);
      }
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      window.clearTimeout(revealTimerRef.current);
    };
  }, [iframeRef]);

  // Subscribe to player events (same handshake the IFrame API uses)
  const onLoad = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*');
  }, [iframeRef]);

  const togglePlay = useCallback(() => {
    command(playing ? 'pauseVideo' : 'playVideo');
    setPlaying(!playing);
  }, [command, playing]);

  const toggleMute = useCallback(() => {
    if (muted) {
      command('unMute');
      command('setVolume', [100]);
    } else {
      command('mute');
    }
    setMuted(!muted);
  }, [command, muted]);

  return { playing, revealed, muted, currentTime, duration, onLoad, togglePlay, toggleMute };
}
