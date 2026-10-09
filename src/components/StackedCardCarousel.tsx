import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Maximize2,
  X,
  ExternalLink,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { usePortfolio } from '../context/PortfolioContext';
import { ReelItem } from '../types';
import { parseVideoUrl, base64ToBlobUrl, isBase64Video, getAutoThumbnail } from '../utils/videoUtils';

export const StackedCardCarousel: React.FC = () => {
  const { reels } = usePortfolio();

  // Active card index in the carousel
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [cinemaReel, setCinemaReel] = useState<ReelItem | null>(null);
  const [isCinemaMuted, setIsCinemaMuted] = useState<boolean>(true);
  const [isCinemaPlaying, setIsCinemaPlaying] = useState<boolean>(true);
  // Per-reel retry counter: on a stream error we reload the muted video instead of falling back
  // to the Google Drive preview iframe (which can't autoplay and shows its own play button).
  const [retryMap, setRetryMap] = useState<Record<string, number>>({});

  // Responsive card spacing for smooth 3D coverflow
  const [cardSpacing, setCardSpacing] = useState<number>(230);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const cinemaVideoRef = useRef<HTMLVideoElement>(null);

  const totalSlides = reels.length;

  const slides = reels.map((r, i) => ({
    id: r.id || `reel-${i}`,
    reel: r,
    displayNumber: String(i + 1).padStart(2, '0'),
  }));

  // Update card spacing on window resize for fluid responsiveness
  useEffect(() => {
    const updateSpacing = () => {
      if (typeof window === 'undefined') return;
      const w = window.innerWidth;
      if (w < 480) {
        setCardSpacing(135);
      } else if (w < 640) {
        setCardSpacing(160);
      } else if (w < 1024) {
        setCardSpacing(200);
      } else {
        setCardSpacing(240);
      }
    };

    updateSpacing();
    window.addEventListener('resize', updateSpacing);
    return () => window.removeEventListener('resize', updateSpacing);
  }, []);

  // Quick Reel Video Diagnostics Logger
  useEffect(() => {
    if (!reels || reels.length === 0) return;
    try {
      console.groupCollapsed(`🎬 [Reel Videos Diagnostics] ${reels.length} Reel(s) Loaded`);
      console.table(
        reels.map((r, i) => {
          const parsed = parseVideoUrl(r.videoUrl);
          return {
            '#': String(i + 1).padStart(2, '0'),
            Title: r.title,
            Client: r.client || 'Personal Project',
            Source: parsed.source,
            Type: parsed.type,
            'Video URL': r.videoUrl,
          };
        })
      );
      console.log('Reels Full Object Array:', reels);
      console.groupEnd();
    } catch {
      console.log('[Reel Videos Loaded]:', reels);
    }
  }, [reels]);

  // Note: no separate detached preloader videos — they doubled every stream and exhausted the
  // browser's per-host connection limit, leaving the visible cards stuck on a black frame.
  // Instead every card stays mounted (see render below) so each video loads once and keeps looping.

  // Tracks which cards were hidden on the previous render so cards re-entering the
  // visible window jump into place instead of sliding across the stage.
  const wasHiddenRef = useRef<Record<string, boolean>>({});

  const safeActiveIndex = totalSlides > 0 ? ((activeIndex % totalSlides) + totalSlides) % totalSlides : 0;

  const handleNext = useCallback(() => {
    if (totalSlides <= 1) return;
    setActiveIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    if (totalSlides <= 1) return;
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Auto-slide to the next reel every 2 seconds unconditionally unless cinema modal is open
  useEffect(() => {
    if (totalSlides <= 1 || cinemaReel) return;

    const autoSlideTimer = window.setInterval(() => {
      setIsDragging(false);
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, 2000);

    return () => window.clearInterval(autoSlideTimer);
  }, [totalSlides, cinemaReel]);

  // Autoplay cinema reel immediately when opened
  useEffect(() => {
    if (cinemaReel && cinemaVideoRef.current) {
      cinemaVideoRef.current.muted = isCinemaMuted;
      const playPromise = cinemaVideoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsCinemaPlaying(true))
          .catch(() => {
            if (cinemaVideoRef.current) {
              cinemaVideoRef.current.muted = true;
              setIsCinemaMuted(true);
              cinemaVideoRef.current.play().then(() => setIsCinemaPlaying(true)).catch(() => {});
            }
          });
      }
    }
  }, [cinemaReel, isCinemaMuted]);

  // Keyboard navigation (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (cinemaReel) {
        if (e.key === 'Escape') setCinemaReel(null);
        return;
      }
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cinemaReel, handleNext, handlePrev]);

  // Ensure ALL carousel cards autoplay simultaneously in continuous loops
  useEffect(() => {
    slides.forEach((slide) => {
      const vid = videoRefs.current[slide.id];
      if (vid) {
        vid.defaultMuted = true;
        vid.muted = true;
        vid.volume = 0;
        if (vid.paused) {
          vid.play().catch(() => {});
        }
      }
    });
  }, [slides, activeIndex]);

  // Global user interaction listener to bypass strict browser autoplay limits
  useEffect(() => {
    const playAllVideos = () => {
      Object.values(videoRefs.current).forEach((vid) => {
        if (vid && vid.paused) {
          vid.defaultMuted = true;
          vid.muted = true;
          vid.volume = 0;
          vid.play().catch(() => {});
        }
      });
    };

    window.addEventListener('pointerdown', playAllVideos, { passive: true });
    window.addEventListener('touchstart', playAllVideos, { passive: true });
    window.addEventListener('scroll', playAllVideos, { passive: true });
    window.addEventListener('click', playAllVideos, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', playAllVideos);
      window.removeEventListener('touchstart', playAllVideos);
      window.removeEventListener('scroll', playAllVideos);
      window.removeEventListener('click', playAllVideos);
    };
  }, []);

  // Remember each card's hidden state after render (read on the next render for instant re-entry)
  useEffect(() => {
    const next: Record<string, boolean> = {};
    slides.forEach((slide, index) => {
      let diff = index - safeActiveIndex;
      while (diff > totalSlides / 2) diff -= totalSlides;
      while (diff < -totalSlides / 2) diff += totalSlides;
      next[slide.id] = Math.abs(diff) > 2.5;
    });
    wasHiddenRef.current = next;
  });

  // Drag Gesture Handling for touch and desktop mouse drag
  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const threshold = 45;
    const velocityThreshold = 180;

    if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      handleNext();
    } else if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      handlePrev();
    }
  };

  if (totalSlides === 0) {
    return null;
  }

  return (
    <div className="w-full py-4 select-none relative">
      {/* 3D Overlapping Reel Deck Stage */}
      <div
        ref={containerRef}
        className="relative w-full max-w-6xl mx-auto h-[540px] sm:h-[620px] md:h-[670px] flex items-center justify-center perspective-[1500px]"
        style={{ perspective: '1500px', transformStyle: 'preserve-3d' }}
      >
        {/* Sleek Floating Navigation Arrow Left */}
        {totalSlides > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Previous reel"
            className="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-zinc-950/80 hover:bg-amber-400 text-zinc-300 hover:text-zinc-950 border border-zinc-800 hover:border-amber-400 backdrop-blur-md shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer group"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:-translate-x-0.5" />
          </button>
        )}

        {/* Sleek Floating Navigation Arrow Right */}
        {totalSlides > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next reel"
            className="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-zinc-950/80 hover:bg-amber-400 text-zinc-300 hover:text-zinc-950 border border-zinc-800 hover:border-amber-400 backdrop-blur-md shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer group"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}

        {/* Render Cards in 3D Vertical Reel Format */}
        {slides.map((slide, index) => {
          // Circular wrap calculation to find the closest relative offset
          let diff = index - safeActiveIndex;
          while (diff > totalSlides / 2) diff -= totalSlides;
          while (diff < -totalSlides / 2) diff += totalSlides;

          const isCenter = diff === 0;
          const absDiff = Math.abs(diff);

          // Cards outside the visible window stay mounted (so their video keeps playing)
          // but are hidden; moves into/out of hidden state are instant to avoid teleport artifacts.
          const isHidden = absDiff > 2.5;
          const wasHidden = wasHiddenRef.current[slide.id] ?? isHidden;
          const instant = isHidden || wasHidden;

          // 3D Coverflow Physics
          const translateX = diff * cardSpacing;
          const rotateY = isCenter ? 0 : diff > 0 ? -16 : 16;
          const scale = isCenter ? 1.0 : Math.max(0.74, 1 - absDiff * 0.13);
          const zIndex = 30 - Math.round(absDiff * 6);
          const opacity = isCenter ? 1 : Math.max(0.25, 1 - absDiff * 0.35);

          const reel = slide.reel;
          const parsed = parseVideoUrl(reel.videoUrl);

          return (
            <motion.div
              key={slide.id}
              drag={isCenter ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              animate={{
                x: translateX,
                scale,
                rotateY,
                opacity: isHidden ? 0 : opacity,
                zIndex: isHidden ? 0 : zIndex,
              }}
              transition={{
                x: { duration: instant ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] },
                scale: { duration: instant ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] },
                rotateY: { duration: instant ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: isHidden ? 0 : 0.28, ease: 'easeInOut' },
                zIndex: { duration: 0.08 },
              }}
              style={{
                transformStyle: 'preserve-3d',
                transformOrigin: 'center center',
                pointerEvents: isHidden ? 'none' : undefined,
              }}
              aria-hidden={isHidden || undefined}
              onClick={() => {
                if (!isCenter && !isDragging) {
                  setActiveIndex(index);
                }
              }}
              /* Pure Reel Format: Strict 9:16 aspect ratio, sleek rounded borders, responsive shadow */
              className={`absolute w-[240px] sm:w-[280px] md:w-[315px] aspect-[9/16] rounded-[34px] sm:rounded-[38px] overflow-hidden border transition-shadow duration-500 ${
                isCenter
                  ? 'border-amber-400/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_35px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/40 pointer-events-auto cursor-grab active:cursor-grabbing z-30'
                  : 'border-zinc-800/80 bg-[#09090d] shadow-2xl pointer-events-auto cursor-pointer hover:border-zinc-600 hover:opacity-90'
              } bg-black flex flex-col group`}
            >
              {/* Card Container (Full Bleed 9:16 Video) */}
              <div className="w-full h-full relative overflow-hidden bg-black pointer-events-auto">
                {/* Smartphone Top Notch / Speaker Slit */}
                <div className="absolute top-3 inset-x-0 z-30 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-1 bg-white/20 rounded-full" />
                </div>

                {/* Center Card Controls / Cinema Badge Overlay */}
                {isCenter && (
                  <div className="absolute top-4 right-4 z-40 flex items-center space-x-2 pointer-events-auto opacity-80 group-hover:opacity-100 transition-opacity">
                    {parsed.source === 'gdrive' && parsed.externalUrl && (
                      <a
                        href={parsed.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full bg-black/70 backdrop-blur-md border border-zinc-700 hover:border-amber-400 text-amber-400 transition-all cursor-pointer shadow-lg"
                        title="Open in Google Drive"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCinemaReel(reel);
                      }}
                      className="p-1.5 rounded-full bg-black/70 backdrop-blur-md border border-zinc-700 hover:border-amber-400 text-white hover:text-amber-400 transition-all cursor-pointer shadow-lg"
                      title="Expand Cinema View"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Full Bleed 9:16 Video Player */}
                <div className="absolute inset-0 w-full h-full bg-black overflow-hidden flex items-center justify-center pointer-events-auto">
                  {(() => {
                    // YouTube embed
                    if (parsed.type === 'embed' && parsed.source === 'youtube') {
                      const cleanEmbedUrl = parsed.backgroundUrl || parsed.embedUrl || '';
                      if (!cleanEmbedUrl) return null;

                      return (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden bg-black pointer-events-auto">
                          <iframe
                            src={cleanEmbedUrl}
                            title={reel.title}
                            referrerPolicy="strict-origin-when-cross-origin"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-full border-0 object-cover pointer-events-auto"
                          />
                        </div>
                      );
                    }

                    // Instagram Reel: Clean cropped viewport
                    if (parsed.source === 'instagram' && parsed.embedUrl) {
                      return (
                        <div className="absolute inset-0 w-full h-full overflow-hidden bg-black flex items-center justify-center pointer-events-auto">
                          <iframe
                            src={parsed.embedUrl}
                            title={reel.title}
                            allow="autoplay; encrypted-media; picture-in-picture"
                            scrolling="no"
                            className="border-0 pointer-events-auto"
                            style={{
                              position: 'absolute',
                              width: '100%',
                              height: 'calc(100% + 155px)',
                              top: '-52px',
                              left: '0',
                            }}
                          />
                        </div>
                      );
                    }

                    // Embed player (YouTube/Instagram or Google Drive fallback)
                    if (parsed.type === 'embed' && parsed.embedUrl && parsed.source !== 'gdrive') {
                      return (
                        <div className="absolute inset-0 w-full h-full overflow-hidden bg-black flex items-center justify-center pointer-events-auto">
                          <iframe
                            src={parsed.embedUrl}
                            title={reel.title}
                            referrerPolicy="strict-origin-when-cross-origin"
                            allow="autoplay; encrypted-media; fullscreen; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-full border-0 pointer-events-auto"
                          />
                        </div>
                      );
                    }

                    // Pure video playback directly through video link / local vault / base64 video upload
                    const isBase64 = isBase64Video(reel.videoUrl) || reel.isBase64;
                    const baseSrc = isBase64 ? base64ToBlobUrl(reel.videoUrl) : (parsed.directUrl || reel.videoUrl);
                    const retry = retryMap[reel.id] || 0;
                    const videoSrc =
                      retry > 0 && baseSrc && !baseSrc.startsWith('blob:') && !baseSrc.startsWith('data:')
                        ? `${baseSrc}${baseSrc.includes('?') ? '&' : '?'}retry=${retry}`
                        : baseSrc;

                    if (!videoSrc) return null;

                    return (
                      <video
                        ref={(el) => {
                          videoRefs.current[reel.id] = el;
                          if (el) {
                            el.defaultMuted = true;
                            el.muted = true;
                            el.volume = 0;
                            if (el.paused) {
                              el.play().catch(() => {});
                            }
                          }
                        }}
                        src={videoSrc || undefined}
                        poster={reel.posterUrl || getAutoThumbnail(reel.videoUrl) || undefined}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        onCanPlay={(e) => {
                          e.currentTarget.muted = true;
                          if (e.currentTarget.paused) {
                            e.currentTarget.play().catch(() => {});
                          }
                        }}
                        onError={() => {
                          const attempts = retryMap[reel.id] || 0;
                          if (attempts < 5) {
                            window.setTimeout(() => {
                              setRetryMap((prev) => ({ ...prev, [reel.id]: attempts + 1 }));
                            }, 1500 * (attempts + 1));
                          }
                        }}
                        className="w-full h-full object-cover transition-transform duration-700 brightness-[0.98] pointer-events-auto"
                      />
                    );
                  })()}
                </div>

                {/* Subtle vignette on non-center cards for deep cinematic staging */}
                {!isCenter && (
                  <div className="absolute inset-0 bg-black/40 transition-opacity duration-300 pointer-events-none" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ================= FULLSCREEN CINEMA REEL MODAL ================= */}
      <AnimatePresence>
        {cinemaReel && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 sm:p-6"
            onClick={() => setCinemaReel(null)}
          >
            {/* Top Toolbar */}
            <div
              className="absolute top-0 inset-x-0 p-4 sm:p-6 flex items-center justify-between z-40 bg-gradient-to-b from-black/80 to-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="font-heading font-bold text-white text-sm sm:text-base tracking-tight uppercase">
                  {cinemaReel.title}
                </span>
                {cinemaReel.client && (
                  <>
                    <span className="text-zinc-600 font-mono text-xs">/</span>
                    <span className="text-zinc-400 font-mono text-xs">{cinemaReel.client}</span>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {parseVideoUrl(cinemaReel.videoUrl).source === 'gdrive' && (
                  <a
                    href={parseVideoUrl(cinemaReel.videoUrl).externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-amber-400 text-xs font-mono transition-all"
                  >
                    <span>OPEN IN DRIVE</span>
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setCinemaReel(null)}
                  className="p-2 rounded-full bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-zinc-300 hover:text-white transition-all cursor-pointer"
                  title="Close (ESC)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Cinema Stage Frame */}
            <div
              className="relative w-full max-w-[420px] aspect-[9/16] max-h-[85vh] rounded-[32px] overflow-hidden border border-zinc-800 shadow-2xl bg-black flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const parsedCinema = parseVideoUrl(cinemaReel.videoUrl);

                if (parsedCinema.type === 'embed' && parsedCinema.embedUrl) {
                  return (
                    <iframe
                      src={parsedCinema.embedUrl}
                      title={cinemaReel.title}
                      referrerPolicy="strict-origin-when-cross-origin"
                      allow="autoplay; encrypted-media; fullscreen; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full border-0 pointer-events-auto"
                    />
                  );
                }

                const isBase64 = isBase64Video(cinemaReel.videoUrl) || cinemaReel.isBase64;
                const cinemaSrc = isBase64 ? base64ToBlobUrl(cinemaReel.videoUrl) : (parsedCinema.directUrl || cinemaReel.videoUrl);

                if (!cinemaSrc) return null;

                return (
                  <div className="relative w-full h-full group/player flex items-center justify-center bg-black">
                    <video
                      ref={cinemaVideoRef}
                      src={cinemaSrc || undefined}
                      poster={cinemaReel.posterUrl || getAutoThumbnail(cinemaReel.videoUrl) || undefined}
                      autoPlay
                      loop
                      playsInline
                      muted={isCinemaMuted}
                      className="w-full h-full object-cover"
                    />

                    {/* Quick Cinema Overlay Controls */}
                    <div className="absolute bottom-4 inset-x-4 flex items-center justify-between p-3 rounded-2xl bg-black/70 backdrop-blur-md border border-zinc-800 opacity-90 group-hover/player:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          if (cinemaVideoRef.current) {
                            if (isCinemaPlaying) {
                              cinemaVideoRef.current.pause();
                            } else {
                              cinemaVideoRef.current.play();
                            }
                            setIsCinemaPlaying(!isCinemaPlaying);
                          }
                        }}
                        className="p-2 rounded-full bg-amber-400 text-zinc-950 hover:bg-amber-300 transition-colors cursor-pointer"
                      >
                        {isCinemaPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (cinemaVideoRef.current) {
                            cinemaVideoRef.current.muted = !isCinemaMuted;
                            setIsCinemaMuted(!isCinemaMuted);
                          }
                        }}
                        className="p-2 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      >
                        {isCinemaMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
