import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, Sparkles, Layers, Sliders, Music, Film, Check, ExternalLink } from 'lucide-react';
import { Project } from '../types';
import { parseVideoUrl } from '../utils/videoUtils';

interface CaseStudyModalProps {
  project: Project | null;
  onClose: () => void;
}

export const CaseStudyModal: React.FC<CaseStudyModalProps> = ({ project, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [gradeSliderPos, setGradeSliderPos] = useState(50); // percentage for Log vs Rec.709
  const [activeStem, setActiveStem] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-play immediately when project case study opens
  useEffect(() => {
    if (project && videoRef.current) {
      videoRef.current.muted = isMuted;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            }
          });
      }
    }
  }, [project]);

  if (!project) return null;

  const parsedVideo = parseVideoUrl(project.videoUrl);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-xl flex flex-col items-center justify-start animate-in fade-in duration-300"
    >
      {/* Top Floating Control Bar */}
      <div className="sticky top-0 z-40 w-full bg-[#070709]/90 backdrop-blur-md border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="font-mono text-xs px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
            {project.number}
          </span>
          <div>
            <h2 className="font-heading font-bold text-base md:text-lg text-white tracking-wider">
              {project.title}
            </h2>
            <p className="text-[11px] font-mono text-zinc-400">
              {project.client} • {project.year} • {project.category}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          id="close-casestudy-btn"
          className="group flex items-center space-x-2 px-3 py-1.5 rounded-full border border-zinc-700 hover:border-amber-400 bg-zinc-900/80 hover:bg-amber-400 text-zinc-300 hover:text-zinc-950 transition-all text-xs font-mono tracking-wider"
        >
          <span>CLOSE [ESC]</span>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Case Study Scroll Content */}
      <div className="w-full max-w-6xl px-6 md:px-12 py-10 space-y-20">
        {/* Header Metadata Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 p-6 rounded-xl border border-zinc-800 bg-[#0d0d11]">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 block mb-1 uppercase">PROJECT</span>
            <span className="text-sm font-semibold text-zinc-100 block">{project.title}</span>
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 block mb-1 uppercase">CLIENT</span>
            <span className="text-sm font-semibold text-zinc-100 block">{project.client}</span>
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 block mb-1 uppercase">YEAR</span>
            <span className="text-sm font-semibold text-amber-400 block">{project.year}</span>
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 block mb-1 uppercase">ROLE</span>
            <span className="text-sm font-semibold text-zinc-100 block">{project.role}</span>
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 block mb-1 uppercase">TOOLS</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {project.tools.map((tool) => (
                <span key={tool} className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* 1. FULL VIDEO PLAYER */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Film className="w-4 h-4 text-amber-400" />
              <h3 className="font-mono text-xs tracking-[0.2em] text-zinc-400 uppercase">
                01 // FULL VIDEO PLAYBACK
              </h3>
            </div>
            <div className="flex items-center space-x-3">
              {parsedVideo.source === 'gdrive' && parsedVideo.externalUrl && (
                <a
                  href={parsedVideo.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-amber-400 text-xs font-mono transition-all"
                  title="Open video in Google Drive"
                >
                  <span>Open in Drive</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <span className="text-xs font-mono text-zinc-500">ASPECT: {project.aspect}</span>
            </div>
          </div>

          <div className="relative group rounded-xl overflow-hidden border border-zinc-800 bg-black aspect-video shadow-2xl">
            {parsedVideo.source === 'instagram' && parsedVideo.embedUrl ? (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <div className="relative w-[320px] max-w-full aspect-[9/16] overflow-hidden rounded-lg">
                  <iframe
                    src={parsedVideo.embedUrl}
                    title={project.title}
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
                title={project.title}
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (parsedVideo.directUrl || project.videoUrl) ? (
              <>
                <video
                  ref={videoRef}
                  src={parsedVideo.directUrl || project.videoUrl || undefined}
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
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={togglePlay}
                />

                  {/* Custom Cinema Controls Bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 flex items-center justify-between opacity-90 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={togglePlay}
                        className="p-2 rounded-full bg-amber-400 text-zinc-950 hover:bg-amber-300 transition-colors"
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>
                      <button
                        onClick={toggleMute}
                        className="p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 transition-colors border border-zinc-700"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <span className="font-mono text-xs text-zinc-300">
                        {project.duration} // MASTER CUT
                      </span>
                    </div>

                    <button
                      onClick={handleFullscreen}
                      className="p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 transition-colors border border-zinc-700"
                      title="Fullscreen"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-950">
                  <Film className="w-8 h-8 text-zinc-700 mb-2" />
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                    No Video Stream Configured
                  </span>
                </div>
              )}
            </div>
        </section>

        {/* 2. CREATIVE DIRECTION & EDITING PROCESS */}
        <section className="grid md:grid-cols-2 gap-8">
          {/* Creative Direction */}
          <div className="p-8 rounded-xl border border-zinc-800 bg-[#0c0c10] space-y-4">
            <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs tracking-widest">
              <Sparkles className="w-4 h-4" />
              <span>02 // CREATIVE DIRECTION</span>
            </div>
            <h4 className="font-heading text-xl font-bold text-white tracking-tight uppercase">
              The Narrative Architecture
            </h4>
            <p className="font-sans text-zinc-300 leading-relaxed text-sm">
              {project.caseStudy.creativeDirection}
            </p>
          </div>

          {/* Editing Process */}
          <div className="p-8 rounded-xl border border-zinc-800 bg-[#0c0c10] space-y-4">
            <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs tracking-widest">
              <Layers className="w-4 h-4" />
              <span>03 // EDITING PROCESS</span>
            </div>
            <h4 className="font-heading text-xl font-bold text-white tracking-tight uppercase">
              Pacing, Cadence & Rhythmic Cuts
            </h4>
            <p className="font-sans text-zinc-300 leading-relaxed text-sm">
              {project.caseStudy.editingProcess}
            </p>
          </div>
        </section>

        {/* 3. MOTION DESIGN */}
        <section className="p-8 rounded-xl border border-zinc-800 bg-[#0c0c10] space-y-4">
          <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs tracking-widest">
            <Sliders className="w-4 h-4" />
            <span>04 // MOTION DESIGN & VFX</span>
          </div>
          <h4 className="font-heading text-xl font-bold text-white tracking-tight uppercase">
            Kinetic Typography & Optical Integration
          </h4>
          <p className="font-sans text-zinc-300 leading-relaxed text-sm max-w-3xl">
            {project.caseStudy.motionDesign}
          </p>
        </section>

        {/* 4. COLOR GRADING (INTERACTIVE LOG VS REC.709 SLIDER!) */}
        {project.caseStudy.colorGrading.rec709Image && project.caseStudy.colorGrading.logImage && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs tracking-widest">
              <Film className="w-4 h-4" />
              <span>05 // COLOR GRADING COMPARISON</span>
            </div>
            <div className="text-xs font-mono text-zinc-400 flex items-center space-x-4">
              <span>DRAG SLIDER: <span className="text-zinc-400">LOG (LEFT)</span> vs <span className="text-amber-400">REC.709 (RIGHT)</span></span>
            </div>
          </div>

          {/* Interactive Split Slider Container */}
          <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 aspect-[16/9] select-none group">
            {/* Base: Graded Rec.709 Image */}
            <img
              src={project.caseStudy.colorGrading.rec709Image}
              alt="Graded Rec.709 Master"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 bg-zinc-950/80 backdrop-blur border border-amber-500/40 text-amber-400 px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-widest">
              FINAL REC.709 GRADE
            </div>

            {/* Top Layer: Raw Log Image clipped by slider position */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${gradeSliderPos}%` }}
            >
              <img
                src={project.caseStudy.colorGrading.logImage}
                alt="Camera Raw Flat Log"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: '100%', height: '100%' }}
              />
              <div className="absolute top-4 left-4 bg-zinc-950/80 backdrop-blur border border-zinc-700 text-zinc-300 px-2.5 py-1 rounded text-[10px] font-mono tracking-widest">
                CAMERA RAW FLAT LOG
              </div>
            </div>

            {/* Slider Dividing Bar & Handle */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)] cursor-ew-resize flex items-center justify-center"
              style={{ left: `${gradeSliderPos}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-zinc-900 border-2 border-amber-400 text-amber-400 flex items-center justify-center text-[10px] font-mono font-bold shadow-lg">
                ⇄
              </div>
            </div>

            {/* Range Input on Top for Smooth Dragging */}
            <input
              type="range"
              min="0"
              max="100"
              value={gradeSliderPos ?? 50}
              onChange={(e) => setGradeSliderPos(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
              aria-label="Color grade comparison slider"
            />
          </div>

          <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono">
            <div>
              <span className="text-zinc-500 mr-2">LUT / PRINT PROFILE:</span>
              <span className="text-amber-400">{project.caseStudy.colorGrading.lutName}</span>
            </div>
            <p className="text-zinc-400 max-w-lg text-[11px] leading-relaxed">
              {project.caseStudy.colorGrading.notes}
            </p>
          </div>
        </section>
        )}

        {/* 5. SOUND DESIGN & AUDIO STEMS */}
        <section className="p-8 rounded-xl border border-zinc-800 bg-[#0c0c10] space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs tracking-widest">
              <Music className="w-4 h-4" />
              <span>06 // SOUND DESIGN & AUDIO STEMS</span>
            </div>
            <span className="text-xs font-mono text-zinc-500">48kHz / 24-BIT MASTER</span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {project.caseStudy.soundDesign.stems.map((stem, idx) => (
              <div
                key={stem.name}
                onClick={() => setActiveStem(activeStem === idx ? null : idx)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  activeStem === idx
                    ? 'border-amber-400 bg-amber-500/10 text-white shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {stem.type}
                  </span>
                  <span className="text-[11px] font-mono text-amber-400 font-bold">
                    {stem.gain}
                  </span>
                </div>
                <h5 className="font-heading text-sm font-semibold mb-3">{stem.name}</h5>

                {/* Animated Stem Audio Waveform Simulation */}
                <div className="flex items-end space-x-1 h-8">
                  {[40, 75, 55, 90, 60, 30, 85, 45, 95, 70, 50, 80].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        activeStem === idx ? 'bg-amber-400' : 'bg-zinc-700'
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs font-mono text-zinc-400 leading-relaxed pt-2 border-t border-zinc-800/80">
            <span className="text-zinc-500 mr-2">ACOUSTIC DIRECTIVE:</span>
            {project.caseStudy.soundDesign.notes}
          </p>
        </section>

        {/* 6. FINAL CUT SPECS */}
        <section className="p-8 rounded-xl border border-zinc-800 bg-[#0c0c10] space-y-6">
          <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs tracking-widest">
            <Film className="w-4 h-4" />
            <span>07 // FINAL CUT DELIVERY SPECIFICATIONS</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-lg bg-zinc-950/80 border border-zinc-800">
              <span className="text-[10px] font-mono text-zinc-500 block mb-1">RESOLUTION</span>
              <span className="text-xs md:text-sm font-mono font-bold text-white">
                {project.caseStudy.finalCutSpecs.resolution}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-zinc-950/80 border border-zinc-800">
              <span className="text-[10px] font-mono text-zinc-500 block mb-1">FRAME RATE</span>
              <span className="text-xs md:text-sm font-mono font-bold text-amber-400">
                {project.caseStudy.finalCutSpecs.fps}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-zinc-950/80 border border-zinc-800">
              <span className="text-[10px] font-mono text-zinc-500 block mb-1">CODEC PROFILE</span>
              <span className="text-xs md:text-sm font-mono font-bold text-white">
                {project.caseStudy.finalCutSpecs.codec}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-zinc-950/80 border border-zinc-800">
              <span className="text-[10px] font-mono text-zinc-500 block mb-1">RUNTIME</span>
              <span className="text-xs md:text-sm font-mono font-bold text-white">
                {project.caseStudy.finalCutSpecs.runtime}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-zinc-950/80 border border-zinc-800">
              <span className="text-[10px] font-mono text-zinc-500 block mb-1">ASPECT RATIO</span>
              <span className="text-xs md:text-sm font-mono font-bold text-amber-400">
                {project.caseStudy.finalCutSpecs.aspectRatio}
              </span>
            </div>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="pt-6 pb-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800">
          <p className="text-xs font-mono text-zinc-500">
            AMAN GUPTA // VIDEO EDITOR & VISUAL STORYTELLER
          </p>
          <div className="flex items-center space-x-4">
            <a
              href="#contact"
              onClick={onClose}
              className="px-6 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-mono font-bold tracking-wider transition-all"
            >
              COMMISSION SIMILAR EDIT →
            </a>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-full border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-xs font-mono tracking-wider transition-all"
            >
              BACK TO PORTFOLIO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
