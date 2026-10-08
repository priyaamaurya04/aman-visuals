import React, { useState } from 'react';
import { Layers, Keyboard, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { usePortfolio } from '../context/PortfolioContext';

export const SoftwareSection: React.FC = () => {
  const { softwareTools } = usePortfolio();
  const [activeToolIndex, setActiveToolIndex] = useState(0);

  return (
    <section id="software" className="py-24 px-6 md:px-12 bg-[#050508] relative border-t border-zinc-900">
      <div className="max-w-7xl mx-auto space-y-14">
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
              <Layers className="w-4 h-4 text-amber-400" />
              <span>POST-PRODUCTION WEAPONRY</span>
            </div>
            <h2 className="font-heading font-bold text-4xl sm:text-5xl text-white tracking-tight uppercase">
              SOFTWARE ARSENAL
            </h2>
          </div>

          <p className="text-zinc-400 font-sans text-xs md:text-sm max-w-md leading-relaxed">
            Muscle memory built over 7 years across the film industry&apos;s leading non-linear editors, grading engines, and motion suites.
          </p>
        </motion.div>

        {/* Software Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {softwareTools.map((tool, idx) => {
            const isActive = activeToolIndex === idx;

            return (
              <div
                key={tool.name}
                onMouseEnter={() => setActiveToolIndex(idx)}
                className={`group p-8 rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                  isActive
                    ? 'border-zinc-600 bg-[#0e0e14] shadow-[0_10px_30px_rgba(0,0,0,0.8)] -translate-y-1'
                    : 'border-zinc-800/80 bg-[#09090d] hover:border-zinc-700'
                }`}
              >
                {/* Subtle Brand Accent Glow */}
                <div
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40"
                  style={{ backgroundColor: tool.color }}
                />

                <div className="space-y-4">
                  {/* Top Bar: Experience Badge & Icon Accent */}
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border tracking-wider"
                      style={{
                        borderColor: `${tool.color}40`,
                        backgroundColor: `${tool.color}15`,
                        color: tool.color,
                      }}
                    >
                      {tool.experience}
                    </span>

                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tool.color }} />
                  </div>

                  {/* Software Name */}
                  <div>
                    <h3 className="font-heading font-bold text-2xl text-white group-hover:text-amber-200 transition-colors uppercase tracking-tight">
                      {tool.name}
                    </h3>
                    <p className="text-xs font-sans text-zinc-400 mt-1">
                      {tool.role}
                    </p>
                  </div>
                </div>

                {/* Bottom: Keyboard Shortcut / Pro Power-User Tip */}
                <div className="mt-8 pt-4 border-t border-zinc-800/80 flex items-start space-x-3">
                  <Keyboard className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                  <div className="text-xs font-mono">
                    <div className="text-zinc-200 font-bold tracking-wider">
                      KEY: <span className="text-amber-400">{tool.primaryShortcut}</span>
                    </div>
                    <p className="text-[11px] font-sans text-zinc-400 mt-0.5">
                      {tool.shortcutDescription}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
