import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, Film, Layers, Monitor, ExternalLink } from 'lucide-react';
import { formatSMPTE } from '../utils/audio';
import { usePortfolio } from '../context/PortfolioContext';
import { parseVideoUrl } from '../utils/videoUtils';

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

  const parsedVideo = parseVideoUrl(showreelUrl);

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
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
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
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300"
    >
      {/* Top Floating Bar */}
      <div className="absolute top-0 inset-x-0 p-6 flex items-center justify-between z-40 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center space-x-3">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="font-heading font-bold text-white text-base tracking-tight uppercase">
            AMAN GUPTA // MASTER SHOWREEL 2025
          </span>
          <span className="text-zinc-500 font-mono text-xs">|</span>
          <span className="text-amber-400 font-mono text-xs font-bold">
            {formatSMPTE(currentTimeMs, 24)}
          </span>
        </div>

        <div className="flex items-center space-x-3">
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

          {/* Aspect Ratio Switcher */}
          <button
            onClick={() => setAspectScope(aspectScope === '2.39' ? '16.9' : '2.39')}
            className="px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-mono tracking-wider transition-all"
            title="Toggle Aspect Ratio"
          >
            {aspectScope === '2.39' ? '2.39:1 SCOPE' : '16:9 FULL'}
          </button>

          {/* Editor Note Toggle */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`px-3 py-1 rounded border text-xs font-mono tracking-wider transition-all ${
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
      <div className="w-full h-full max-w-7xl max-h-[85vh] p-4 sm:p-8 flex items-center justify-center relative">
        <div
          className={`relative w-full rounded-xl overflow-hidden shadow-2xl border border-zinc-800 bg-black transition-all duration-500 flex items-center justify-center ${
            aspectScope === '2.39' ? 'aspect-[2.39/1]' : 'aspect-video'
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
              <div className="absolute top-0 inset-x-0 h-4 bg-black pointer-events-none" />
              <div className="absolute bottom-0 inset-x-0 h-4 bg-black pointer-events-none" />
            </>
          )}

          {/* Live Editor Commentary HUD Overlay */}
          {showNotes && (
            <div className="absolute bottom-16 left-6 max-w-md p-4 rounded-lg bg-black/80 backdrop-blur-md border border-zinc-800 pointer-events-none animate-in fade-in">
              <span className="text-[10px] font-mono text-amber-400 font-bold tracking-widest block mb-1 uppercase">
                EDITOR REEL DIRECTIVE:
              </span>
              <p className="text-xs font-sans text-zinc-300 leading-relaxed">
                Seamless pacing calibrated across 14 commercial, automotive, and narrative master cuts. Graded in DaVinci Resolve ACEScc.
              </p>
            </div>
          )}

          {/* Cinema Bottom Control Bar */}
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlay}
                className="p-2.5 rounded-full bg-amber-400 text-zinc-950 hover:bg-amber-300 transition-all shadow-lg"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <button
                onClick={toggleMute}
                className="p-2.5 rounded-full bg-zinc-900/80 text-zinc-300 hover:text-white border border-zinc-700 transition-all"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="text-xs font-mono text-zinc-300">
                <span className="text-amber-400 font-bold">{formatSMPTE(currentTimeMs, 24)}</span>
                <span className="text-zinc-500"> / 02:48:00</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono text-zinc-400">
              <span className="hidden sm:inline">PRORES 4444 MASTER</span>
              <button
                onClick={handleFullscreen}
                className="p-2 rounded-full bg-zinc-900/80 text-zinc-300 hover:text-white border border-zinc-700 transition-all"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
