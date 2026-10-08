import React, { useState } from 'react';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { usePortfolio } from '../context/PortfolioContext';

export const SkillsSection: React.FC = () => {
  const { skills } = usePortfolio();
  const [hoveredSkill, setHoveredSkill] = useState<number | null>(null);

  return (
    <section id="skills" className="py-28 px-6 md:px-12 bg-[#070709] relative border-t border-zinc-900">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header with Upward Animated Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800/80 pb-8 gap-4"
        >
          <div>
            <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs tracking-[0.2em] uppercase mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>SERVICES & DISCIPLINES</span>
            </div>
            <h2 className="font-heading font-bold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight uppercase">
              SERVICES
            </h2>
          </div>

          <p className="text-zinc-400 font-sans text-xs md:text-sm max-w-md leading-relaxed">
            Craft is measured not by software bars, but by rhythmic precision, auditory immersion, and emotional resonance.
          </p>
        </motion.div>

        {/* Animated Kinetic Typography Skill Rows */}
        <div className="divide-y divide-zinc-800/60">
          {skills.map((skill, index) => {
            const isHovered = hoveredSkill === index;

            return (
              <div
                key={skill.name}
                onMouseEnter={() => setHoveredSkill(index)}
                onMouseLeave={() => setHoveredSkill(null)}
                className="group py-7 sm:py-9 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer relative"
              >
                {/* Background Subtle Amber Flash on Hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-transparent -mx-6 px-6 rounded-lg transition-opacity duration-300 pointer-events-none ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                {/* Left: Number & Giant Typography */}
                <div className="flex items-center space-x-6 z-10">
                  <span className="font-mono text-xs text-zinc-600 group-hover:text-amber-400 font-bold tracking-wider transition-colors">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3
                    className={`font-heading font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight uppercase transition-all duration-300 ${
                      isHovered
                        ? 'text-amber-400 translate-x-3'
                        : 'text-zinc-200 group-hover:text-white'
                    }`}
                  >
                    {skill.name}
                  </h3>
                </div>

                {/* Center: Discipline Category & Description */}
                <div className="z-10 md:max-w-md">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-amber-400/90 font-bold">
                      [{skill.category}]
                    </span>
                    <span className="text-zinc-600 font-mono text-xs">•</span>
                    <span className="text-[10px] font-mono tracking-wider text-zinc-400">
                      {skill.cadence}
                    </span>
                  </div>
                  <p className="font-sans text-xs sm:text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors leading-relaxed">
                    {skill.description}
                  </p>
                </div>

                {/* Right: Interactive Indicator */}
                <div className="hidden lg:flex items-center space-x-3 z-10 text-xs font-mono">
                  <span
                    className={`transition-all duration-300 ${
                      isHovered
                        ? 'opacity-100 text-amber-400 font-bold'
                        : 'opacity-0 text-zinc-500'
                    }`}
                  >
                    MASTERED // 24FPS
                  </span>
                  <div
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 ${
                      isHovered
                        ? 'border-amber-400 bg-amber-400 text-zinc-950 rotate-45 scale-110'
                        : 'border-zinc-800 text-zinc-600'
                    }`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cinematic Kinetic Ticker */}
        <div className="py-4 border-y border-zinc-800/80 overflow-hidden relative bg-[#050508]">
          <div className="flex whitespace-nowrap space-x-8 animate-[marquee_25s_linear_infinite] text-xs font-mono tracking-[0.3em] text-zinc-300">
            <span>• FRAME-ACCURATE TIMING</span>
            <span>• MATCH CUT PERFECTION</span>
            <span>• COLOR GRADE SCIENTIFIC RANGE</span>
            <span>• ZERO-LATENCY 5.1 AUDIO PANS</span>
            <span>• 140BPM KINETIC SYNCS</span>
            <span>• NARRATIVE EMOTIONAL ARCS</span>
            <span>• SUNDANCE / CANNES LAURELS</span>
          </div>
        </div>
      </div>
    </section>
  );
};
