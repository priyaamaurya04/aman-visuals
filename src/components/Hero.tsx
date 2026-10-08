import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Play, Film, Sliders, CornerDownRight } from 'lucide-react';
import { motion } from 'motion/react';
import { HERO_SHOWREEL_POSTER } from '../data/portfolioData';
import { usePortfolio } from '../context/PortfolioContext';
import { parseVideoUrl } from '../utils/videoUtils';
import { AvatarHero3D } from './AvatarHero3D';

interface HeroProps {
  onOpenShowreel: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenShowreel }) => {
  const { showreelUrl, heroContent, projects } = usePortfolio();
  const activeVideoUrl = heroContent.videoUrl || showreelUrl;
  const activePosterUrl = heroContent.posterUrl || HERO_SHOWREEL_POSTER;
  const parsedVideo = parseVideoUrl(activeVideoUrl);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);

  const nameParts = (heroContent.name || 'AMAN VISUALS').trim().split(/\s+/);
  const firstName = nameParts[0] || 'AMAN';
  const lastName = nameParts.slice(1).join(' ') || 'VISUALS';

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 15;
      const y = (e.clientY / innerHeight - 0.5) * 15;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Ensure hero video autoplays without pause
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [activeVideoUrl]);

  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050507]">
      {/* Background Cinematic Video Layer with Parallax */}
      <motion.div
        className="absolute inset-0 w-full h-full pointer-events-none scale-105"
        animate={{
          x: mousePos.x * -1,
          y: mousePos.y * -1,
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 60 }}
      >
        {parsedVideo.type === 'embed' && parsedVideo.source !== 'instagram' && (parsedVideo.backgroundUrl || parsedVideo.embedUrl) ? (
          <iframe
            src={parsedVideo.backgroundUrl || parsedVideo.embedUrl}
            title="Aman Gupta Showreel Background"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            className="w-full h-full object-cover opacity-35 filter brightness-[0.7] contrast-[1.15] pointer-events-none scale-125 border-0"
          />
        ) : (parsedVideo.directUrl || activeVideoUrl) ? (
          <video
            ref={(el) => {
              (videoRef as any).current = el;
              if (el) {
                el.muted = true;
                el.volume = 0;
              }
            }}
            src={parsedVideo.directUrl || activeVideoUrl || undefined}
            poster={activePosterUrl || undefined}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onCanPlay={(e) => {
              e.currentTarget.muted = true;
              e.currentTarget.play().catch(() => {});
            }}
            onError={(e) => {
              const target = e.currentTarget;
              if (parsedVideo.source === 'gdrive' && parsedVideo.videoId) {
                const proxyUrl = `/api/video-proxy?id=${parsedVideo.videoId}`;
                if (target.src !== proxyUrl) {
                  target.src = proxyUrl;
                  target.play().catch(() => {});
                }
              }
            }}
            className="w-full h-full object-cover opacity-35 filter brightness-[0.7] contrast-[1.15] saturate-[0.85]"
          />
        ) : null}

        {/* Cinematic Film Grading & Lighting Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/60 to-[#070709]/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(7,7,9,0.9)_90%)]" />
        
        {/* Subtle Anamorphic Warm Lens Streak Accent */}
        <div className="absolute top-1/3 -left-1/4 w-[150%] h-48 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent blur-3xl transform -rotate-6 pointer-events-none" />
      </motion.div>

      {/* Film Viewfinder Camera Overlay Frame Elements */}
      <div className="absolute inset-6 md:inset-12 pointer-events-none border border-zinc-800/40 z-10 flex flex-col justify-end">
        {/* Center Crosshair Marker */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center opacity-30">
          <div className="w-8 h-[1px] bg-zinc-400" />
          <div className="h-8 w-[1px] bg-zinc-400 -ml-4" />
          <div className="w-3 h-3 rounded-full border border-zinc-400 absolute" />
        </div>

        {/* Viewfinder Corners */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-zinc-600" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-zinc-600" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-zinc-600" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-zinc-600" />

        {/* Bottom Viewfinder Metadata */}
        <div className="flex items-center justify-between p-4 text-[10px] font-mono tracking-widest text-zinc-300">
          <div className="flex items-center space-x-2">
            <Film className="w-3 h-3 text-amber-400" />
            <span>ASPECT: 2.39:1 CINEMASCOPE</span>
          </div>
          <div className="hidden sm:block text-zinc-300">
            AUDIO: 48kHz 24-BIT MASTER
          </div>
        </div>
      </div>

      {/* 3D AVATAR MODEL (ANCHORED TO LEFT, SHIFTED LEFT & BIT TOP, REAL-TIME 2.5D CURSOR-FOLLOWING HEAD & EYES) */}
      <div
        className="absolute -left-[6vw] sm:-left-[5vw] md:-left-[4vw] lg:-left-[3.5vw] xl:-left-[2.5vw] bottom-[7vh] sm:bottom-[9vh] md:bottom-[11vh] lg:bottom-[13vh] xl:bottom-[14vh] z-[15] pointer-events-none flex items-end justify-center
                   h-[48vh] sm:h-[58vh] md:h-[70vh] lg:h-[78vh] xl:h-[82vh] max-h-[880px] aspect-square
                   opacity-90 sm:opacity-95 md:opacity-100 lg:opacity-100 transition-all duration-500"
      >
        <AvatarHero3D className="w-full h-full" />
      </div>

      {/* Main Hero Typography Content */}
      <div className="relative z-20 max-w-5xl 2xl:max-w-6xl mx-auto px-6 pt-24 pb-16 text-center flex flex-col items-center lg:ml-[23vw] xl:ml-[25vw] 2xl:ml-[22vw] lg:mr-6 transition-all duration-300">
        {/* Small Eyebrow / Profession Identifier */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full border border-amber-500/30 bg-zinc-950/60 backdrop-blur-md mb-6 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <p className="text-[11px] md:text-xs font-mono font-medium tracking-[0.25em] text-zinc-300 uppercase">
            {heroContent.badge || 'VIDEO EDITOR / MOTION DESIGNER'}
          </p>
        </motion.div>

        {/* Hero Title: Bebas Neue, Large, Bold, Condensed, High-contrast with Masked Character Stagger Animation */}
        <h1 className="font-hero text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] xl:text-[11.5rem] 2xl:text-[13rem] leading-[0.82] tracking-[-0.02em] text-white select-none mb-6">
          {/* First line */}
          <div className="overflow-hidden flex justify-center space-x-1 sm:space-x-2">
            {firstName.split('').map((char, index) => (
              <span key={`first-${index}`} className="inline-block overflow-hidden py-1">
                <motion.span
                  initial={{ y: '110%', filter: 'blur(12px)', opacity: 0 }}
                  animate={{ y: '0%', filter: 'blur(0px)', opacity: 1 }}
                  transition={{
                    duration: 0.85,
                    delay: 0.25 + index * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="inline-block hover:text-amber-400 transition-colors duration-300"
                >
                  {char}
                </motion.span>
              </span>
            ))}
          </div>

          {/* Last line */}
          <div className="overflow-hidden flex justify-center space-x-1 sm:space-x-2 mt-1">
            {lastName.split('').map((char, index) => (
              <span key={`last-${index}`} className="inline-block overflow-hidden py-1">
                <motion.span
                  initial={{ y: '110%', filter: 'blur(12px)', opacity: 0 }}
                  animate={{ y: '0%', filter: 'blur(0px)', opacity: 1 }}
                  transition={{
                    duration: 0.85,
                    delay: 0.55 + index * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-400 hover:to-amber-300 transition-all duration-300"
                >
                  {char}
                </motion.span>
              </span>
            ))}
          </div>
        </h1>

        {/* Major Hero Statement: Bebas Neue Uppercase Display */}
        <div className="overflow-hidden mb-10 max-w-3xl">
          <motion.p
            initial={{ y: '100%', opacity: 0, filter: 'blur(8px)' }}
            animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
            className="font-hero text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] text-zinc-200 tracking-wide uppercase leading-tight"
          >
            &ldquo;{heroContent.headline || 'I EDIT STORIES THAT DESERVE TO BE REMEMBERED.'}&rdquo;
          </motion.p>
        </div>

        {/* Action Buttons: Inter font for clean high readability */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.15 }}
          className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 font-sans"
        >
          {/* WATCH SHOWREEL → Primary Call to Action */}
          <button
            onClick={onOpenShowreel}
            id="hero-watch-showreel-btn"
            className="group relative inline-flex items-center space-x-3 px-8 py-4 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-sans font-bold text-xs md:text-sm tracking-wider uppercase transition-all duration-300 shadow-[0_0_35px_rgba(245,158,11,0.35)] hover:shadow-[0_0_50px_rgba(245,158,11,0.6)] hover:scale-105"
          >
            <span className="w-6 h-6 rounded-full bg-zinc-950 text-amber-400 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <Play className="w-3 h-3 fill-current ml-0.5" />
            </span>
            <span>{heroContent.ctaReelText || 'PLAY 2025 SHOWREEL'}</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>

          {/* Explore Projects Secondary Button */}
          <a
            href="#selected-work"
            className="inline-flex items-center space-x-2 px-6 py-4 rounded-full border border-zinc-800 hover:border-zinc-600 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 hover:text-white font-sans font-medium text-xs md:text-sm tracking-wide transition-all duration-300"
          >
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            <span>{heroContent.ctaWorkText || 'EXPLORE WORK'}</span>
            <span className="font-mono text-xs text-amber-400 font-bold ml-0.5">({String(projects.length).padStart(2, '0')})</span>
          </a>
        </motion.div>

        {/* Scroll Indicator Cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-16 flex flex-col items-center space-y-2 text-zinc-500 hover:text-zinc-400 transition-colors cursor-pointer"
          onClick={() => {
            const el = document.getElementById('selected-work');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase">SCROLL TO EDIT</span>
          <div className="w-[1px] h-8 bg-gradient-to-b from-amber-400/80 via-zinc-700 to-transparent animate-pulse" />
        </motion.div>
      </div>
    </section>
  );
};
