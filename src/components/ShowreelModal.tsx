import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Film, Layers, Monitor, ExternalLink } from 'lucide-react';
import { formatSMPTE } from '../utils/audio';
import { usePortfolio } from '../context/PortfolioContext';
import { parseVideoUrl } from '../utils/videoUtils';
import { youtubeEmbedUrl } from '../utils/youtubeReels';
import { useYouTubePlayer } from '../hooks/useYouTubePlayer';

interface ShowreelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShowreelModal: React.FC<ShowreelModalProps> = ({ isOpen, onClose }) => {
  const { showreelUrl } = usePortfolio();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [aspectScope, setAspectScope] = useState<'2.39' | '16.9'>('2.39');
  const [showNotes, setShowNotes] = useState(true);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // Native fullscreen where the browser allows it on an element; otherwise (iPhone Safari) the stage
  // is pinned over the whole screen with CSS
  const [isFullscreen, setIsFullscreen] = useState(false);

  const parsedVideo = parseVideoUrl(showreelUrl);
  // A YouTube showreel is played without YouTube's controls and driven by the control bar below
  const youtubeId = parsedVideo.source === 'youtube' ? parsedVideo.videoId : undefined;
  const yt = useYouTubePlayer(iframeRef);

  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    if (!isOpen) setIsFullscreen(false);
  }, [isOpen]);

  // Auto-play immediately when modal opens
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.muted = isMuted;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            // Autoplay fallback: force muted autoplay
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            }
          });
      }
    }
  }, [isOpen, showreelUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ' && isOpen) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPlaying]);

  if (!isOpen) return null;

  const togglePlay = () => {
    if (youtubeId) {
      yt.togglePlay();
    } else if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (youtubeId) {
      yt.toggleMute();
    } else if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTimeMs(videoRef.current.currentTime * 1000);
    }
  };

  const handleFullscreen = () => {
    if (isFullscreen) {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
      return;
    }
    setIsFullscreen(true);
    if (document.fullscreenEnabled && stageRef.current?.requestFullscreen) {
      stageRef.current.requestFullscreen().catch(() => {});
    }
  };

  const playing = youtubeId ? yt.playing : isPlaying;
  const muted = youtubeId ? yt.muted : isMuted;
  const timeMs = youtubeId ? yt.currentTime * 1000 : currentTimeMs;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300"
    >
      {/* Top Floating Bar */}
      <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex items-center justify-between gap-3 z-40 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center space-x-3 min-w-0">
          <span className="w-2 h-2 shrink-0 rounded-full bg-red-500 animate-ping" />
          <span className="font-heading font-bold text-white text-sm sm:text-base tracking-tight uppercase truncate">
            <span className="sm:hidden">SHOWREEL 2025</span>
            <span className="hidden sm:inline">AMAN GUPTA // MASTER SHOWREEL 2025</span>
          </span>
          {/* Phones show the timecode in the control bar only */}
          <span className="hidden sm:inline text-zinc-500 font-mono text-xs">|</span>
          <span className="hidden sm:inline text-amber-400 font-mono text-xs font-bold">
            {formatSMPTE(timeMs, 24)}
          </span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* External Drive Link */}
          {parsedVideo.source === 'gdrive' && parsedVideo.externalUrl && (
            <a
              href={parsedVideo.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 px-3 py-1 rounded bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-amber-400 text-xs font-mono tracking-wider transition-all"
              title="Open video in Google Drive"
            >
              <span>DRIVE</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          )}

          {/* Aspect Ratio Switcher (phones always use 16:9: a 2.39:1 frame is too short on a narrow screen) */}
          <button
            onClick={() => setAspectScope(aspectScope === '2.39' ? '16.9' : '2.39')}
            className="hidden sm:inline-block px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-mono tracking-wider transition-all"
            title="Toggle Aspect Ratio"
          >
            {aspectScope === '2.39' ? '2.39:1 SCOPE' : '16:9 FULL'}
          </button>

          {/* Editor Note Toggle */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`px-2 sm:px-3 py-1 rounded border text-[10px] sm:text-xs font-mono tracking-wider whitespace-nowrap transition-all ${
              showNotes
                ? 'border-amber-400 text-amber-400 bg-amber-500/10'
                : 'border-zinc-800 text-zinc-400 bg-zinc-900'
            }`}
          >
            {showNotes ? 'NOTES: ON' : 'NOTES: OFF'}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:border-amber-400 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Theater Video Stage */}
      <div className="w-full h-full max-w-7xl max-h-[85vh] p-4 sm:p-8 flex flex-col items-center justify-center relative">
        <div
          ref={stageRef}
          className={`overflow-hidden bg-black flex items-center justify-center ${
            isFullscreen
              ? 'fixed inset-0 z-[60] w-full h-full'
              : `relative w-full rounded-xl shadow-2xl border border-zinc-800 transition-all duration-500 ${
                  aspectScope === '2.39' ? 'aspect-video sm:aspect-[2.39/1]' : 'aspect-video'
                }`
          }`}
        >
          {parsedVideo.source === 'instagram' && parsedVideo.embedUrl ? (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <div className="relative w-[340px] max-w-full aspect-[9/16] overflow-hidden rounded-lg">
                <iframe
                  src={parsedVideo.embedUrl}
                  title="Instagram Showreel"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  scrolling="no"
                  className="border-0 pointer-events-none"
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: 'calc(100% + 155px)',
                    top: '-52px',
                    left: '0',
                  }}
                />
              </div>
            </div>
          ) : youtubeId ? (
              <div className="absolute inset-0 w-full h-full">
                <iframe
                  ref={iframeRef}
                  src={youtubeEmbedUrl(youtubeId, { autoplay: true, mute: true, loop: true, controls: false })}
                  title="Master Showreel"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  onLoad={yt.onLoad}
                  className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                />
                {/* Thumbnail covers YouTube's own start overlay (pause icon / title) until it has faded */}
                <img
                  src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
                  alt=""
                  className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-500 ${
                    yt.revealed ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                {/* Tap the picture to play / pause, like the direct-video player */}
                <div className="absolute inset-0 cursor-pointer" onClick={togglePlay} />
              </div>
            ) : parsedVideo.type === 'embed' && parsedVideo.embedUrl ? (
              <iframe
                src={parsedVideo.embedUrl}
                title="Master Showreel"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (parsedVideo.directUrl || showreelUrl) ? (
              <video
                ref={videoRef}
                src={parsedVideo.directUrl || showreelUrl || undefined}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                preload="auto"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onCanPlay={(e) => {
                  e.currentTarget.muted = isMuted;
                  e.currentTarget.play().catch(() => {});
                }}
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                className="w-full h-full object-cover cursor-pointer"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-950">
                <Film className="w-8 h-8 text-zinc-700 mb-2" />
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                  No Showreel Video Configured
                </span>
              </div>
            )}

          {/* Anamorphic Letterbox Bars (if 2.39 mode) */}
          {aspectScope === '2.39' && (
            <>
              <div className="hidden sm:block absolute top-0 inset-x-0 h-4 bg-black pointer-events-none" />
              <div className="hidden sm:block absolute bottom-0 inset-x-0 h-4 bg-black pointer-events-none" />
            </>
          )}

          {/* Live Editor Commentary HUD Overlay */}
          {/* Over the picture from sm up; phones show the notes under the video instead */}
          {showNotes && (
            <div className="hidden sm:block absolute bottom-16 left-6 max-w-md p-4 rounded-lg bg-black/80 backdrop-blur-md border border-zinc-800 pointer-events-none animate-in fade-in">
              <span className="text-[10px] font-mono text-amber-400 font-bold tracking-widest block mb-1 uppercase">
                EDITOR REEL DIRECTIVE:
              </span>
              <p className="text-xs font-sans text-zinc-300 leading-relaxed">
                Seamless pacing calibrated across 14 commercial, automotive, and narrative master cuts. Graded in DaVinci Resolve ACEScc.
              </p>
            </div>
          )}

          {/* Cinema Bottom Control Bar */}
          <div className="absolute bottom-0 inset-x-0 p-2 sm:p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={togglePlay}
                className="p-2.5 rounded-full bg-amber-400 text-zinc-950 hover:bg-amber-300 transition-all shadow-lg"
              >
                {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <button
                onClick={toggleMute}
                className="p-2.5 rounded-full bg-zinc-900/80 text-zinc-300 hover:text-white border border-zinc-700 transition-all"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="text-[10px] sm:text-xs font-mono text-zinc-300 whitespace-nowrap">
                <span className="text-amber-400 font-bold">{formatSMPTE(timeMs, 24)}</span>
                <span className="text-zinc-500"> / {youtubeId && yt.duration ? formatSMPTE(yt.duration * 1000, 24) : '02:48:00'}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono text-zinc-400">
              <span className="hidden sm:inline">PRORES 4444 MASTER</span>
              <button
                onClick={handleFullscreen}
                className="p-2 rounded-full bg-zinc-900/80 text-zinc-300 hover:text-white border border-zinc-700 transition-all"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Phones: editor notes under the video, so they don't cover the picture */}
        {showNotes && !isFullscreen && (
          <div className="sm:hidden w-full mt-4 p-4 rounded-lg bg-zinc-950 border border-zinc-800 animate-in fade-in">
            <span className="text-[10px] font-mono text-amber-400 font-bold tracking-widest block mb-1 uppercase">
              EDITOR REEL DIRECTIVE:
            </span>
            <p className="text-xs font-sans text-zinc-300 leading-relaxed">
              Seamless pacing calibrated across 14 commercial, automotive, and narrative master cuts. Graded in DaVinci Resolve ACEScc.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
