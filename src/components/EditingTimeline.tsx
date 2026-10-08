import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Scissors,
  Move,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Mic,
  Magnet,
  SkipBack,
  SkipForward,
  Repeat,
  Layers,
  Sparkles,
  ArrowRight,
  Sliders,
  Maximize2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { usePortfolio } from '../context/PortfolioContext';

// Classic Adobe Premiere Pro tool types
type PremiereTool = 'selection' | 'trackSelect' | 'ripple' | 'razor' | 'slip' | 'pen' | 'hand' | 'type';

export const EditingTimeline: React.FC = () => {
  const { timelineStages } = usePortfolio();
  const [activeStageIndex, setActiveStageIndex] = useState(1); // Default to Stage 02: CUT
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPercent, setPlayheadPercent] = useState(32); // percentage 0 - 100
  const [activeTool, setActiveTool] = useState<PremiereTool>('selection');
  const [isSnapEnabled, setIsSnapEnabled] = useState(true);
  const [isLooping, setIsLooping] = useState(true);

  // Track state toggles (Premiere Pro track patching)
  const [trackVisibility, setTrackVisibility] = useState<{ [key: string]: boolean }>({
    V3: true,
    V2: true,
    V1: true,
  });
  const [trackLocks, setTrackLocks] = useState<{ [key: string]: boolean }>({
    V3: false,
    V2: false,
    V1: false,
    A1: false,
    A2: false,
    A3: false,
  });
  const [audioMutes, setAudioMutes] = useState<{ [key: string]: boolean }>({
    A1: false,
    A2: false,
    A3: false,
  });
  const [audioSolos, setAudioSolos] = useState<{ [key: string]: boolean }>({
    A1: false,
    A2: false,
    A3: false,
  });

  // VU Meter state simulation
  const [vuLeft, setVuLeft] = useState(65);
  const [vuRight, setVuRight] = useState(62);

  const rulerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  const currentStage = timelineStages[activeStageIndex] || timelineStages[0];

  // Stage change handler
  const handleStageSelect = (index: number) => {
    setActiveStageIndex(index);
    // Move playhead to the key focal area of that stage
    const newPos = 12 + index * 12;
    setPlayheadPercent(Math.min(newPos, 90));
  };

  // Playback Loop Animation
  useEffect(() => {
    if (isPlaying) {
      let lastTime = performance.now();
      const step = (currentTime: number) => {
        const delta = currentTime - lastTime;
        lastTime = currentTime;

        // Advance playhead (~6 seconds for full loop or 24fps rate)
        setPlayheadPercent((prev) => {
          const next = prev + (delta / 1000) * 8.5;
          if (next >= 96) {
            return isLooping ? 4 : 96;
          }
          return next;
        });

        // Modulate audio VU meters
        const bounceL = 40 + Math.random() * 45;
        const bounceR = 40 + Math.random() * 45;
        setVuLeft(bounceL);
        setVuRight(bounceR);

        animationRef.current = requestAnimationFrame(step);
      };

      animationRef.current = requestAnimationFrame(step);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setVuLeft(10);
      setVuRight(10);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isLooping]);

  // Handle Scrubbing
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    setPlayheadPercent(pct);
  };

  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    handleRulerClick(e);
    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const moveX = moveEvent.clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (moveX / rect.width) * 100));
      setPlayheadPercent(pct);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Convert percentage to SMPTE timecode (at 23.976 fps, 01:30 sequence)
  const totalFrames = Math.floor((playheadPercent / 100) * 2160); // 90 seconds = 2160 frames
  const minutes = Math.floor(totalFrames / 1440);
  const seconds = Math.floor((totalFrames % 1440) / 24);
  const frames = Math.floor(totalFrames % 24);
  const timecodeString = `00;0${minutes};${String(seconds).padStart(2, '0')};${String(frames).padStart(2, '0')}`;

  // Premiere Pro classic clip colors mapper
  const getPremiereClipColor = (track: string, fallbackColor: string, index: number) => {
    if (track === 'V3') return { bg: '#8b5cf6', border: '#7c3aed', text: '#ffffff' }; // Iris / Violet
    if (track === 'V2') return { bg: '#ec4899', border: '#db2777', text: '#ffffff' }; // Magenta / Rose
    if (track === 'V1') {
      const v1Palette = [
        { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' }, // Cerulean
        { bg: '#f59e0b', border: '#d97706', text: '#000000' }, // Mango
        { bg: '#6366f1', border: '#4f46e5', text: '#ffffff' }, // Iris
        { bg: '#10b981', border: '#059669', text: '#ffffff' }, // Forest
      ];
      return v1Palette[index % v1Palette.length];
    }
    if (track === 'A1') return { bg: '#0d9488', border: '#0f766e', text: '#ffffff' }; // Caribbean / Seafoam
    if (track === 'A2') return { bg: '#84cc16', border: '#65a30d', text: '#000000' }; // Lime / Foliage
    if (track === 'A3') return { bg: '#0284c7', border: '#0369a1', text: '#ffffff' }; // Deep Blue / Score
    return { bg: fallbackColor, border: fallbackColor, text: '#ffffff' };
  };

  return (
    <section id="editing-timeline" className="py-24 px-4 sm:px-6 md:px-12 bg-[#08080c] relative overflow-hidden border-t border-zinc-900">
      {/* Background Subtle NLE Grid Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#15151e_1px,transparent_1px),linear-gradient(to_bottom,#15151e_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="border-b border-zinc-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <div className="flex items-center space-x-2 text-blue-400 font-mono text-xs tracking-[0.2em] uppercase mb-2">
              <span className="w-4 h-4 rounded bg-[#00005b] text-[#9999ff] flex items-center justify-center font-bold text-[10px]">
                Pr
              </span>
              <span>ADOBE PREMIERE PRO ARCHITECTURE</span>
            </div>
            <h2 className="font-heading font-bold text-4xl sm:text-5xl text-white tracking-tight uppercase">
              EDITING TIMELINE
            </h2>
          </div>

          <p className="text-zinc-400 font-sans text-xs md:text-sm max-w-lg leading-relaxed">
            The heart of professional editorial workflow. Explore the 7 non-linear cutting phases inside an authentic Adobe Premiere Pro multi-track sequence.
          </p>
        </motion.div>

        {/* Stage Selection Ribbon (7 NLE Pipeline Phases) */}
        <div className="flex items-center justify-between overflow-x-auto pb-3 gap-2 no-scrollbar border-b border-zinc-800/80">
          {timelineStages.map((stage, idx) => {
            const isActive = activeStageIndex === idx;
            return (
              <button
                key={stage.id}
                onClick={() => handleStageSelect(idx)}
                className={`flex-1 min-w-[125px] p-3 rounded-lg border transition-all text-left group relative overflow-hidden ${
                  isActive
                    ? 'border-blue-500 bg-[#162035] shadow-[0_0_20px_rgba(20,115,230,0.25)]'
                    : 'border-zinc-800/90 bg-[#0f0f15] hover:border-zinc-700 hover:bg-[#13131c]'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 shadow-[0_0_10px_#1473e6]" />
                )}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-blue-400' : 'text-zinc-500'}`}>
                    STAGE {stage.order}
                  </span>
                  {idx < timelineStages.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
                  )}
                </div>
                <div className={`text-xs font-mono font-bold tracking-wider ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                  {stage.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* ================= AUTHENTIC ADOBE PREMIERE PRO NLE TIMELINE ================= */}
        <div className="rounded-xl border border-[#2b2b36] bg-[#1a1a22] overflow-hidden shadow-2xl flex flex-col select-none">
          {/* 1. Premiere Pro Workspace Tabs & Control Header */}
          <div className="bg-[#1f1f28] border-b border-[#2d2d38] px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-300">
            {/* Active Sequence Tab */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-t bg-[#282834] border-t-2 border-t-blue-500 border-x border-[#383848] text-white shadow-sm">
                <span className="w-3.5 h-3.5 rounded bg-[#00005b] text-[#9999ff] font-bold text-[9px] flex items-center justify-center">
                  Pr
                </span>
                <span className="font-bold text-[11px] tracking-wide">
                  AMAN_MASTER_CUT_{currentStage.name}.prseq
                </span>
                <span className="text-zinc-500 hover:text-white text-xs cursor-pointer ml-1">×</span>
              </div>

              <div className="hidden sm:flex items-center space-x-1 px-2 py-1 rounded text-zinc-400 hover:text-zinc-200 text-[11px]">
                <span>STRINGOUT_BROLL.prseq</span>
              </div>
            </div>

            {/* Premiere Pro Transport Controls & Current Timecode */}
            <div className="flex items-center space-x-4">
              {/* Playback Controls */}
              <div className="flex items-center space-x-1 bg-[#14141c] p-1 rounded-md border border-[#2d2d38]">
                <button
                  onClick={() => setPlayheadPercent(4)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                  title="Return to In Point [Home]"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-3 py-1 rounded font-bold text-xs flex items-center space-x-1.5 transition-all ${
                    isPlaying
                      ? 'bg-amber-400 text-zinc-950 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_12px_rgba(20,115,230,0.4)]'
                  }`}
                  title="Play / Pause Sequence [Spacebar]"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span className="hidden sm:inline text-[10px]">PAUSE</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      <span className="hidden sm:inline text-[10px]">PLAY [SPACE]</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setPlayheadPercent(94)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                  title="Jump to Out Point [End]"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`p-1.5 rounded transition-colors ${
                    isLooping ? 'text-blue-400 bg-blue-500/15' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title="Loop Playback"
                >
                  <Repeat className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Snap Toggle Button */}
              <button
                onClick={() => setIsSnapEnabled(!isSnapEnabled)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-mono border transition-all ${
                  isSnapEnabled
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-[0_0_10px_rgba(20,115,230,0.2)]'
                    : 'bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                }`}
                title="Snap to Clips in Timeline [S]"
              >
                <Magnet className="w-3.5 h-3.5" />
                <span className="hidden md:inline">SNAP [S]</span>
              </button>

              {/* Iconic Premiere Pro Cyan Blue Digital Timecode Readout */}
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded bg-[#0f0f16] border border-[#2d2d3c]">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="font-mono text-sm font-bold text-blue-400 tracking-wider">
                  {timecodeString}
                </span>
                <span className="text-[10px] text-zinc-500 hidden lg:inline">23.976 FPS</span>
              </div>
            </div>
          </div>

          {/* 2. Main Timeline Staging Area (Toolbox + Tracks + VU Meter) */}
          <div className="flex flex-1 overflow-hidden bg-[#16161f]">
            {/* Premiere Pro Vertical Tools Palette */}
            <div className="w-10 bg-[#1e1e27] border-r border-[#2d2d38] py-3 flex flex-col items-center space-y-2 shrink-0">
              {[
                { id: 'selection', icon: Move, key: 'V', title: 'Selection Tool [V]' },
                { id: 'trackSelect', icon: Layers, key: 'A', title: 'Track Select Forward [A]' },
                { id: 'ripple', icon: Sliders, key: 'B', title: 'Ripple Edit Tool [B]' },
                { id: 'razor', icon: Scissors, key: 'C', title: 'Razor Tool [C]' },
                { id: 'slip', icon: Maximize2, key: 'Y', title: 'Slip Tool [Y]' },
                { id: 'type', icon: Sparkles, key: 'T', title: 'Type Tool [T]' },
              ].map((tool) => {
                const Icon = tool.icon;
                const isSelected = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id as PremiereTool)}
                    className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(20,115,230,0.6)]'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#2c2c38]'
                    }`}
                    title={tool.title}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>

            {/* Center: Ruler, Tracks, and Playhead */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Premiere Pro Time Ruler Header with Tick Marks */}
              <div
                ref={rulerRef}
                onMouseDown={handleRulerMouseDown}
                className="relative h-7 bg-[#20202a] border-b border-[#2d2d3a] flex items-center cursor-pointer select-none pl-36 pr-4 group"
              >
                {/* Time Ruler Labels & Graduations */}
                <div className="w-full flex justify-between text-[9px] font-mono text-zinc-400 pointer-events-none">
                  <span>00;00;00;00</span>
                  <span className="hidden sm:inline">00;00;15;00</span>
                  <span>00;00;30;00</span>
                  <span className="hidden sm:inline">00;00;45;00</span>
                  <span>00;01;00;00</span>
                  <span className="hidden sm:inline">00;01;15;00</span>
                  <span>00;01;30;00</span>
                </div>

                {/* Subtle ruler graduation tick lines */}
                <div className="absolute inset-x-36 bottom-0 h-1 flex justify-between opacity-30 pointer-events-none">
                  {[...Array(24)].map((_, i) => (
                    <div key={i} className="w-[1px] h-full bg-zinc-400" />
                  ))}
                </div>

                {/* Premiere Pro Blue CTI (Current Time Indicator) Playhead Needle */}
                <div
                  className="absolute top-0 bottom-0 z-40 pointer-events-none transition-none"
                  style={{ left: `calc(144px + (100% - 160px) * ${playheadPercent / 100})` }}
                >
                  {/* Premiere Pro Blue Triangular Head with Center Dot */}
                  <div className="relative -ml-[7px] w-3.5 h-3.5 bg-blue-500 rounded-b-sm flex items-center justify-center shadow-[0_0_8px_#1473e6]">
                    <div className="w-1 h-1 rounded-full bg-white" />
                  </div>
                  {/* Thin Blue Laser Guideline across all video and audio tracks */}
                  <div className="w-[1.5px] h-[340px] bg-blue-400 shadow-[0_0_8px_rgba(20,115,230,0.9)]" />
                </div>
              </div>

              {/* Tracks Container */}
              <div className="p-2 space-y-1.5 overflow-x-hidden relative bg-[#171720]">
                {/* VIDEO TRACK 3 (Graphics / VFX / Titles) */}
                <div className="flex items-center space-x-2">
                  {/* V3 Header Panel */}
                  <div className="w-32 shrink-0 h-9 bg-[#22222d] border border-[#2f2f3d] rounded flex items-center justify-between px-2 text-[10px] font-mono text-zinc-300">
                    <div className="flex items-center space-x-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400">
                        V3
                      </span>
                      <button
                        onClick={() =>
                          setTrackVisibility((p) => ({ ...p, V3: !p.V3 }))
                        }
                        className="text-zinc-400 hover:text-white"
                        title="Toggle Track Output"
                      >
                        {trackVisibility.V3 ? (
                          <Eye className="w-3 h-3 text-blue-400" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-zinc-600" />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => setTrackLocks((p) => ({ ...p, V3: !p.V3 }))}
                      className="text-zinc-500 hover:text-zinc-300"
                      title="Lock Track"
                    >
                      {trackLocks.V3 ? (
                        <Lock className="w-3 h-3 text-red-400" />
                      ) : (
                        <Unlock className="w-3 h-3 text-zinc-500" />
                      )}
                    </button>
                  </div>

                  {/* V3 Track Body */}
                  <div
                    className={`flex-1 h-9 rounded border border-[#272734] bg-[#12121a] relative overflow-hidden flex items-center transition-opacity ${
                      trackVisibility.V3 ? 'opacity-100' : 'opacity-25'
                    }`}
                  >
                    {currentStage.nleClips
                      .filter((c) => c.track === 'V3')
                      .map((clip, i) => {
                        const style = getPremiereClipColor('V3', clip.color, i);
                        return (
                          <div
                            key={i}
                            className="absolute top-1 bottom-1 rounded px-2 flex items-center justify-between text-[10px] font-mono font-bold truncate transition-all shadow-md group cursor-pointer"
                            style={{
                              left: `${clip.start}%`,
                              width: `${clip.width}%`,
                              backgroundColor: style.bg,
                              borderColor: style.border,
                              color: style.text,
                            }}
                          >
                            <span className="truncate">{clip.label}</span>
                            <span className="text-[8px] px-1 rounded bg-black/40 text-amber-300 font-sans uppercase font-bold shrink-0 ml-1">
                              fx
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* VIDEO TRACK 2 (Overlays / B-Roll / Speed Ramps) */}
                <div className="flex items-center space-x-2">
                  {/* V2 Header Panel */}
                  <div className="w-32 shrink-0 h-9 bg-[#22222d] border border-[#2f2f3d] rounded flex items-center justify-between px-2 text-[10px] font-mono text-zinc-300">
                    <div className="flex items-center space-x-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400">
                        V2
                      </span>
                      <button
                        onClick={() =>
                          setTrackVisibility((p) => ({ ...p, V2: !p.V2 }))
                        }
                        className="text-zinc-400 hover:text-white"
                        title="Toggle Track Output"
                      >
                        {trackVisibility.V2 ? (
                          <Eye className="w-3 h-3 text-blue-400" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-zinc-600" />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => setTrackLocks((p) => ({ ...p, V2: !p.V2 }))}
                      className="text-zinc-500 hover:text-zinc-300"
                      title="Lock Track"
                    >
                      {trackLocks.V2 ? (
                        <Lock className="w-3 h-3 text-red-400" />
                      ) : (
                        <Unlock className="w-3 h-3 text-zinc-500" />
                      )}
                    </button>
                  </div>

                  {/* V2 Track Body */}
                  <div
                    className={`flex-1 h-9 rounded border border-[#272734] bg-[#12121a] relative overflow-hidden flex items-center transition-opacity ${
                      trackVisibility.V2 ? 'opacity-100' : 'opacity-25'
                    }`}
                  >
                    {currentStage.nleClips
                      .filter((c) => c.track === 'V2')
                      .map((clip, i) => {
                        const style = getPremiereClipColor('V2', clip.color, i);
                        return (
                          <div
                            key={i}
                            className="absolute top-1 bottom-1 rounded px-2 flex items-center justify-between text-[10px] font-mono font-bold truncate transition-all shadow-md group cursor-pointer"
                            style={{
                              left: `${clip.start}%`,
                              width: `${clip.width}%`,
                              backgroundColor: style.bg,
                              borderColor: style.border,
                              color: style.text,
                            }}
                          >
                            <span className="truncate">{clip.label}</span>
                            <span className="text-[8px] px-1 rounded bg-black/40 text-amber-300 font-sans uppercase font-bold shrink-0 ml-1">
                              fx
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* VIDEO TRACK 1 (A-Roll / Principal Narrative Rushes) */}
                <div className="flex items-center space-x-2">
                  {/* V1 Header Panel (Premiere Pro Blue Source Patch Active) */}
                  <div className="w-32 shrink-0 h-11 bg-[#22222d] border border-blue-500/50 rounded flex items-center justify-between px-2 text-[10px] font-mono text-zinc-300 shadow-[0_0_10px_rgba(20,115,230,0.15)]">
                    <div className="flex items-center space-x-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white shadow-sm">
                        V1
                      </span>
                      <button
                        onClick={() =>
                          setTrackVisibility((p) => ({ ...p, V1: !p.V1 }))
                        }
                        className="text-zinc-400 hover:text-white"
                        title="Toggle Track Output"
                      >
                        {trackVisibility.V1 ? (
                          <Eye className="w-3 h-3 text-blue-400" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-zinc-600" />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => setTrackLocks((p) => ({ ...p, V1: !p.V1 }))}
                      className="text-zinc-500 hover:text-zinc-300"
                      title="Lock Track"
                    >
                      {trackLocks.V1 ? (
                        <Lock className="w-3 h-3 text-red-400" />
                      ) : (
                        <Unlock className="w-3 h-3 text-zinc-500" />
                      )}
                    </button>
                  </div>

                  {/* V1 Track Body */}
                  <div
                    className={`flex-1 h-11 rounded border border-blue-500/30 bg-[#12121a] relative overflow-hidden flex items-center transition-opacity ${
                      trackVisibility.V1 ? 'opacity-100' : 'opacity-25'
                    }`}
                  >
                    {currentStage.nleClips
                      .filter((c) => c.track === 'V1')
                      .map((clip, i) => {
                        const style = getPremiereClipColor('V1', clip.color, i);
                        return (
                          <div
                            key={i}
                            className="absolute top-1 bottom-1 rounded px-2.5 flex items-center justify-between text-[11px] font-mono font-bold truncate transition-all shadow-md group cursor-pointer border"
                            style={{
                              left: `${clip.start}%`,
                              width: `${clip.width}%`,
                              backgroundColor: style.bg,
                              borderColor: style.border,
                              color: style.text,
                            }}
                          >
                            <span className="truncate">{clip.label}</span>
                            <span className="text-[8px] px-1 rounded bg-black/40 text-amber-300 font-sans uppercase font-bold shrink-0 ml-1">
                              fx
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Adobe Premiere Pro Center Track Zero Line Divider */}
                <div className="h-[2px] bg-[#2d2d3c] my-2 relative">
                  <div className="absolute left-1/2 -translate-x-1/2 -top-1 px-3 py-0.2 bg-[#1a1a24] text-[8px] font-mono text-zinc-500 uppercase tracking-widest rounded">
                    AUDIO / VIDEO ZERO BAR
                  </div>
                </div>

                {/* AUDIO TRACK 1 (Dialogue / Clean Boom & Lav) */}
                <div className="flex items-center space-x-2">
                  {/* A1 Header Panel (Premiere Pro Blue Source Patch Active) */}
                  <div className="w-32 shrink-0 h-10 bg-[#22222d] border border-teal-500/40 rounded flex items-center justify-between px-2 text-[10px] font-mono text-zinc-300">
                    <div className="flex items-center space-x-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-600 text-white">
                        A1
                      </span>
                      <button
                        onClick={() =>
                          setAudioMutes((p) => ({ ...p, A1: !p.A1 }))
                        }
                        className={`px-1 py-0.5 rounded text-[9px] font-bold font-mono transition-colors ${
                          audioMutes.A1 ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                        title="Mute Track [M]"
                      >
                        M
                      </button>
                      <button
                        onClick={() =>
                          setAudioSolos((p) => ({ ...p, A1: !p.A1 }))
                        }
                        className={`px-1 py-0.5 rounded text-[9px] font-bold font-mono transition-colors ${
                          audioSolos.A1 ? 'bg-yellow-400 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                        title="Solo Track [S]"
                      >
                        S
                      </button>
                    </div>
                    <button title="Voiceover Record" className="text-zinc-500 hover:text-red-400 cursor-pointer">
                      <Mic className="w-3 h-3" />
                    </button>
                  </div>

                  {/* A1 Track Body with Audio Waveform */}
                  <div
                    className={`flex-1 h-10 rounded border border-[#272734] bg-[#0e1716] relative overflow-hidden flex items-center ${
                      audioMutes.A1 ? 'opacity-30' : 'opacity-100'
                    }`}
                  >
                    {currentStage.nleClips
                      .filter((c) => c.track === 'A1')
                      .map((clip, i) => (
                        <div
                          key={i}
                          className="absolute top-1 bottom-1 rounded px-2 bg-teal-900/80 border border-teal-500/60 text-teal-200 flex flex-col justify-between overflow-hidden shadow-md cursor-pointer"
                          style={{
                            left: `${clip.start}%`,
                            width: `${clip.width}%`,
                          }}
                        >
                          <div className="flex items-center justify-between text-[9px] font-mono font-bold truncate">
                            <span>♫ {clip.label}</span>
                            <span className="text-[8px] px-1 rounded bg-black/40 text-teal-300">fx</span>
                          </div>

                          {/* Authentic Waveform SVG representation */}
                          <div className="w-full h-3.5 flex items-center space-x-[2px] opacity-70">
                            {[...Array(32)].map((_, wIdx) => {
                              const barH = 20 + Math.sin((wIdx + i * 5) * 0.6) * 18 + ((wIdx % 3) * 6);
                              return (
                                <div
                                  key={wIdx}
                                  className="flex-1 bg-teal-400 rounded-xs"
                                  style={{ height: `${Math.min(100, barH)}%` }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* AUDIO TRACK 2 (SFX & Foley Risers) */}
                <div className="flex items-center space-x-2">
                  {/* A2 Header Panel */}
                  <div className="w-32 shrink-0 h-9 bg-[#22222d] border border-[#2f2f3d] rounded flex items-center justify-between px-2 text-[10px] font-mono text-zinc-300">
                    <div className="flex items-center space-x-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400">
                        A2
                      </span>
                      <button
                        onClick={() =>
                          setAudioMutes((p) => ({ ...p, A2: !p.A2 }))
                        }
                        className={`px-1 py-0.5 rounded text-[9px] font-bold font-mono ${
                          audioMutes.A2 ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        M
                      </button>
                      <button
                        onClick={() =>
                          setAudioSolos((p) => ({ ...p, A2: !p.A2 }))
                        }
                        className={`px-1 py-0.5 rounded text-[9px] font-bold font-mono ${
                          audioSolos.A2 ? 'bg-yellow-400 text-black' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        S
                      </button>
                    </div>
                    <Mic className="w-3 h-3 text-zinc-600" />
                  </div>

                  {/* A2 Track Body with Waveforms */}
                  <div
                    className={`flex-1 h-9 rounded border border-[#272734] bg-[#12160e] relative overflow-hidden flex items-center ${
                      audioMutes.A2 ? 'opacity-30' : 'opacity-100'
                    }`}
                  >
                    {currentStage.nleClips
                      .filter((c) => c.track === 'A2')
                      .map((clip, i) => (
                        <div
                          key={i}
                          className="absolute top-1 bottom-1 rounded px-2 bg-lime-950 border border-lime-500/50 text-lime-300 flex flex-col justify-between overflow-hidden shadow-md cursor-pointer"
                          style={{
                            left: `${clip.start}%`,
                            width: `${clip.width}%`,
                          }}
                        >
                          <span className="text-[9px] font-mono font-bold truncate">⚡ {clip.label}</span>
                          <div className="w-full h-3 flex items-center space-x-[2px] opacity-70">
                            {[...Array(24)].map((_, wIdx) => {
                              const barH = 15 + Math.cos((wIdx + 2) * 0.8) * 15 + ((wIdx % 4) * 8);
                              return (
                                <div
                                  key={wIdx}
                                  className="flex-1 bg-lime-400 rounded-xs"
                                  style={{ height: `${Math.min(100, barH)}%` }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* AUDIO TRACK 3 (Orchestral Score Stems) */}
                <div className="flex items-center space-x-2">
                  {/* A3 Header Panel */}
                  <div className="w-32 shrink-0 h-9 bg-[#22222d] border border-[#2f2f3d] rounded flex items-center justify-between px-2 text-[10px] font-mono text-zinc-300">
                    <div className="flex items-center space-x-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400">
                        A3
                      </span>
                      <button
                        onClick={() =>
                          setAudioMutes((p) => ({ ...p, A3: !p.A3 }))
                        }
                        className={`px-1 py-0.5 rounded text-[9px] font-bold font-mono ${
                          audioMutes.A3 ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        M
                      </button>
                      <button
                        onClick={() =>
                          setAudioSolos((p) => ({ ...p, A3: !p.A3 }))
                        }
                        className={`px-1 py-0.5 rounded text-[9px] font-bold font-mono ${
                          audioSolos.A3 ? 'bg-yellow-400 text-black' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        S
                      </button>
                    </div>
                    <Mic className="w-3 h-3 text-zinc-600" />
                  </div>

                  {/* A3 Track Body with Waveforms */}
                  <div
                    className={`flex-1 h-9 rounded border border-[#272734] bg-[#0e141c] relative overflow-hidden flex items-center ${
                      audioMutes.A3 ? 'opacity-30' : 'opacity-100'
                    }`}
                  >
                    {currentStage.nleClips
                      .filter((c) => c.track === 'A3')
                      .map((clip, i) => (
                        <div
                          key={i}
                          className="absolute top-1 bottom-1 rounded px-2 bg-sky-950 border border-sky-500/50 text-sky-300 flex flex-col justify-between overflow-hidden shadow-md cursor-pointer"
                          style={{
                            left: `${clip.start}%`,
                            width: `${clip.width}%`,
                          }}
                        >
                          <span className="text-[9px] font-mono font-bold truncate">🎻 {clip.label}</span>
                          <div className="w-full h-3 flex items-center space-x-[2px] opacity-70">
                            {[...Array(24)].map((_, wIdx) => {
                              const barH = 25 + Math.sin(wIdx * 0.5) * 20;
                              return (
                                <div
                                  key={wIdx}
                                  className="flex-1 bg-sky-400 rounded-xs"
                                  style={{ height: `${Math.min(100, barH)}%` }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Premiere Pro Stereo Master VU Meter (Right Column) */}
            <div className="w-12 bg-[#1b1b24] border-l border-[#2d2d38] p-1.5 flex flex-col justify-between items-center text-[8px] font-mono text-zinc-500 shrink-0 select-none">
              <span>0dB</span>
              {/* Dual VU Meter Bars (Left & Right) */}
              <div className="w-full flex-1 flex justify-center space-x-1.5 py-1">
                {/* Left Channel */}
                <div className="w-2 h-full bg-[#101016] rounded-xs relative flex flex-col justify-end overflow-hidden">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-500 via-yellow-400 to-red-500 transition-all duration-75"
                    style={{ height: `${isPlaying ? vuLeft : 8}%` }}
                  />
                </div>
                {/* Right Channel */}
                <div className="w-2 h-full bg-[#101016] rounded-xs relative flex flex-col justify-end overflow-hidden">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-500 via-yellow-400 to-red-500 transition-all duration-75"
                    style={{ height: `${isPlaying ? vuRight : 8}%` }}
                  />
                </div>
              </div>
              <div className="flex space-x-1 text-[8px] text-zinc-400 font-bold">
                <span>L</span>
                <span>R</span>
              </div>
            </div>
          </div>

          {/* 3. Premiere Pro Bottom Sequence Navigator / Zoom Slider Bar */}
          <div className="bg-[#1b1b24] border-t border-[#2d2d38] px-4 py-2 flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <div className="flex items-center space-x-4">
              <span className="text-zinc-300 font-bold">PRORES 422 HQ</span>
              <span>48.000 kHz - 24-bit</span>
              <span className="hidden sm:inline">DROP FRAME TIMECODE</span>
            </div>

            {/* Simulated Zoom Slider */}
            <div className="flex items-center space-x-2 w-48 sm:w-64">
              <div className="w-3 h-3 rounded-full bg-zinc-700 cursor-pointer" />
              <div className="flex-1 h-1.5 bg-[#121218] rounded-full relative overflow-hidden">
                <div className="absolute left-[15%] right-[20%] top-0 bottom-0 bg-blue-500/60 rounded-full" />
              </div>
              <div className="w-3 h-3 rounded-full bg-zinc-700 cursor-pointer" />
            </div>

            <span className="text-blue-400 font-bold hidden md:inline">
              SEQUENCE DURATION: 00;01;30;00
            </span>
          </div>
        </div>

        {/* Selected Stage Detail Insight Card */}
        <div className="p-8 rounded-xl border border-zinc-800 bg-[#0d0d14] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                STAGE {currentStage.order} // {currentStage.name}
              </span>
              <h3 className="font-heading text-xl font-bold text-white uppercase tracking-tight">
                {currentStage.title}
              </h3>
            </div>
            <p className="font-sans text-zinc-300 text-sm leading-relaxed">
              {currentStage.description}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-xs max-w-md w-full shadow-inner">
            <span className="font-mono text-blue-400 font-bold block mb-1 text-[11px] tracking-wider">
              PREMIERE PRO WORKFLOW INSIGHT:
            </span>
            <p className="font-sans text-zinc-400 leading-relaxed text-xs">
              &ldquo;{currentStage.workflowTip}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
