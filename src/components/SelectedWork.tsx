import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpRight, Clock, Film, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { CaseStudyModal } from './CaseStudyModal';
import { YouTubeBackground } from './YouTubeBackground';
import { usePortfolio } from '../context/PortfolioContext';
import { parseVideoUrl } from '../utils/videoUtils';

export const SelectedWork: React.FC = () => {
  const { projects } = usePortfolio();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  // Autoplay all project videos continuously on mount and when projects update
  useEffect(() => {
    Object.values(videoRefs.current).forEach((video) => {
      if (video) {
        video.muted = true;
        video.play().catch(() => {});
      }
    });
  }, [projects]);

  const handleMouseEnter = (id: string) => {
    setHoveredProjectId(id);
    const video = videoRefs.current[id];
    if (video) {
      video.muted = true;
      video.play().catch(() => {});
    }
  };

  const handleMouseLeave = (_id: string) => {
    setHoveredProjectId(null);
  };

  if (projects.length === 0) {
    return null;
  }

  return (
    <section id="selected-work" className="py-28 px-4 sm:px-6 md:px-12 bg-[#070709] relative overflow-hidden">
      {/* Section Header with Upward Animated Reveal */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-7xl mx-auto mb-14"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800/80 pb-6 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs tracking-[0.2em] uppercase mb-2">
              <Film className="w-3.5 h-3.5" />
              <span>PORTFOLIO ARCHIVE // 2023 - 2025</span>
            </div>
            <h2 className="font-heading font-bold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight uppercase">
              SELECTED WORK
            </h2>
          </div>
          <p className="text-zinc-400 font-sans text-xs sm:text-sm max-w-md leading-relaxed">
            Long-form narrative films, commercials, and festival cinema edited with surgical timing, master color grades, and multi-stem audio design.
          </p>
        </div>
      </motion.div>

      {/* Cinematic Media Project Cards List */}
      <div className="max-w-7xl mx-auto space-y-16">
        {projects.map((project) => {
          const isHovered = hoveredProjectId === project.id;
          const parsedVideo = parseVideoUrl(project.videoUrl);

          return (
            <div
              key={project.id}
              onClick={() => setActiveProjectId(project.id)}
              onMouseEnter={() => handleMouseEnter(project.id)}
              onMouseLeave={() => handleMouseLeave(project.id)}
              className="group relative w-full rounded-2xl overflow-hidden border border-zinc-800 hover:border-amber-400/50 bg-[#0c0c10] transition-all duration-500 cursor-pointer shadow-[0_10px_35px_rgba(0,0,0,0.6)] hover:shadow-[0_20px_50px_rgba(245,158,11,0.12)]"
            >
              {/* Film Sprocket Strip Border Aesthetic on Top */}
              <div className="h-4 w-full bg-zinc-950/80 border-b border-zinc-800/60 flex items-center justify-between px-4 overflow-hidden pointer-events-none">
                <div className="flex space-x-3">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-2.5 h-1.5 rounded-xs bg-zinc-800/80" />
                  ))}
                </div>
                <span className="text-[9px] font-mono tracking-widest text-zinc-400">
                  {project.number} // 23.98FPS // {project.aspect}
                </span>
                <div className="flex space-x-3">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-2.5 h-1.5 rounded-xs bg-zinc-800/80" />
                  ))}
                </div>
              </div>

              {/* Massive Cinematic Media Container */}
              <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden bg-zinc-950">
                {parsedVideo.source === 'instagram' && parsedVideo.embedUrl ? (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black pointer-events-none">
                    <div className="relative w-[340px] max-w-full aspect-[9/16] overflow-hidden">
                      <iframe
                        src={parsedVideo.embedUrl}
                        title={project.title}
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
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
                ) : parsedVideo.source === 'youtube' && parsedVideo.videoId ? (
                  <YouTubeBackground videoId={parsedVideo.videoId} title={project.title} />
                ) : parsedVideo.type === 'embed' && parsedVideo.embedUrl ? (
                  <div className="absolute inset-0 w-full h-full pointer-events-none">
                    <iframe
                      src={parsedVideo.backgroundUrl || parsedVideo.embedUrl}
                      title={project.title}
                      referrerPolicy="strict-origin-when-cross-origin"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      className="w-full h-full border-0 scale-105 opacity-90 object-cover pointer-events-none"
                    />
                  </div>
                ) : (parsedVideo.directUrl || project.videoUrl) ? (
                  <video
                    ref={(el) => {
                      videoRefs.current[project.id] = el;
                      if (el) {
                        el.defaultMuted = true;
                        el.muted = true;
                        el.volume = 0;
                        if (el.paused) {
                          el.play().catch(() => {});
                        }
                      }
                    }}
                    src={parsedVideo.directUrl || project.videoUrl || undefined}
                    autoPlay
                    muted
                    loop
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
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 filter brightness-[0.88] group-hover:brightness-[1.02] contrast-[1.12]"
                  />
                ) : null}

                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c10] via-transparent to-black/25 pointer-events-none" />

                {/* Case Study Hover Overlay Badge (No static play button required to play) */}
                <div
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-none ${
                    isHovered
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-90'
                  }`}
                >
                  <div className="flex items-center space-x-2 px-6 py-3 rounded-full bg-amber-400 text-zinc-950 font-mono font-bold text-xs tracking-wider uppercase shadow-[0_0_35px_rgba(245,158,11,0.6)]">
                    <span>EXPLORE CASE STUDY</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Top Badges */}
                <div className="absolute top-6 left-6 flex items-center space-x-3">
                  <span className="px-3 py-1 rounded bg-zinc-950/80 backdrop-blur border border-zinc-700 text-zinc-300 text-xs font-mono tracking-widest uppercase">
                    {project.category}
                  </span>
                  <span className="px-2.5 py-1 rounded bg-amber-500/20 backdrop-blur border border-amber-500/40 text-amber-400 text-xs font-mono font-bold tracking-widest">
                    {project.year}
                  </span>
                  <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono tracking-widest uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block mr-1" />
                    AUTOPLAYING
                  </span>
                </div>

                <div className="absolute top-6 right-6 flex items-center space-x-1.5 px-2.5 py-1 rounded bg-zinc-950/80 backdrop-blur border border-zinc-700 text-zinc-300 text-xs font-mono">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{project.duration}</span>
                </div>
              </div>

              {/* Lower Info Bar */}
              <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0c0c10]">
                <div>
                  <div className="flex items-center space-x-3 mb-1.5">
                    <span className="font-mono text-xs font-bold text-amber-400 tracking-wider inline-flex items-center gap-1 group-hover:text-amber-300 transition-colors">
                      <span className="text-zinc-600 font-normal">[</span>
                      {project.number}
                      <span className="text-zinc-600 font-normal">]</span>
                      <span className="text-zinc-600">—</span>
                    </span>
                    <h3 className="font-heading font-bold text-2xl md:text-3xl text-white tracking-tight uppercase group-hover:text-amber-300 transition-colors">
                      {project.title}
                    </h3>
                  </div>
                  <p className="text-xs font-sans text-zinc-400">
                    CLIENT: <span className="text-zinc-200 font-medium">{project.client}</span> • ROLE: <span className="text-amber-400 font-medium">{project.role}</span>
                  </p>
                  <p className="text-sm font-sans text-zinc-300 mt-2 max-w-2xl line-clamp-2 leading-relaxed">
                    {project.tagline}
                  </p>
                </div>

                <div className="flex items-center space-x-4 self-start md:self-center">
                  <div className="hidden sm:flex flex-wrap gap-1.5">
                    {project.tools.slice(0, 2).map((tool) => (
                      <span key={tool} className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 tracking-wider">
                        {tool}
                      </span>
                    ))}
                  </div>

                  <div className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-zinc-900 border border-zinc-700 group-hover:border-amber-400 group-hover:bg-amber-400 text-zinc-300 group-hover:text-zinc-950 transition-all font-sans text-xs tracking-wider font-semibold uppercase">
                    <span>VIEW CASE STUDY</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Case Study Full Modal */}
      {activeProject && (
        <CaseStudyModal
          project={activeProject}
          onClose={() => setActiveProjectId(null)}
        />
      )}
    </section>
  );
};
