import React, { useState } from 'react';
import { ChevronRight, Film, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { usePortfolio } from '../context/PortfolioContext';

export const ProcessSection: React.FC = () => {
  const { processSteps } = usePortfolio();
  const [activeStepIndex, setActiveStepIndex] = useState(2); // default to 03 EDIT

  return (
    <section id="process" className="py-28 px-6 md:px-12 bg-[#050508] relative border-t border-zinc-900 overflow-hidden">
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
              <Film className="w-4 h-4 text-amber-400" />
              <span>THE FIVE PHASES</span>
            </div>
            <h2 className="font-heading font-bold text-4xl sm:text-5xl text-white tracking-tight uppercase">
              CREATIVE PROCESS
            </h2>
          </div>

          <p className="text-zinc-400 font-sans text-xs md:text-sm max-w-md leading-relaxed">
            From initial rushes to final theatrical DCP. A disciplined horizontal pipeline delivering flawless picture locks on schedule.
          </p>
        </motion.div>

        {/* Cinematic Horizontal Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {processSteps.map((step, idx) => {
            const isActive = activeStepIndex === idx;

            return (
              <div
                key={step.number}
                onClick={() => setActiveStepIndex(idx)}
                className={`p-6 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[280px] group ${
                  isActive
                    ? 'border-amber-400 bg-[#0e0e15] shadow-[0_0_30px_rgba(245,158,11,0.15)] -translate-y-2'
                    : 'border-zinc-800/80 bg-[#08080b] hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`text-sm font-mono font-bold tracking-wider ${
                        isActive ? 'text-amber-400' : 'text-zinc-600 group-hover:text-zinc-400'
                      }`}
                    >
                      {step.number}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1 tracking-wider">
                      <Clock className="w-3 h-3 text-zinc-600" />
                      {step.duration}
                    </span>
                  </div>

                  <h3
                    className={`font-heading font-bold text-2xl uppercase tracking-tight mb-2 transition-colors ${
                      isActive ? 'text-white' : 'text-zinc-300 group-hover:text-white'
                    }`}
                  >
                    {step.title}
                  </h3>

                  <p className="text-xs font-mono text-amber-400/90 mb-3 tracking-wider uppercase">
                    {step.phase}
                  </p>

                  <p className="font-sans text-xs text-zinc-400 leading-relaxed">
                    {step.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 mt-4">
                  <span className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase block mb-1.5">
                    DELIVERABLES:
                  </span>
                  <ul className="space-y-1">
                    {step.deliverables.map((item, i) => (
                      <li key={i} className="text-[11px] font-mono text-zinc-300 flex items-center space-x-1.5 truncate">
                        <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                        <span className="truncate">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Film Strip Progress Bar */}
        <div className="h-6 w-full bg-zinc-950 border border-zinc-800 rounded-lg flex items-center px-4 justify-between text-[10px] font-mono text-zinc-500">
          <div className="flex space-x-3">
            {[...Array(16)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-2 rounded-xs transition-colors duration-300 ${
                  i / 16 <= (activeStepIndex + 1) / 5 ? 'bg-amber-400/80' : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
          <span className="text-amber-400 font-bold">
            PHASE {processSteps[activeStepIndex]?.number || '01'} OF {String(processSteps.length).padStart(2, '0')} ACTIVE
          </span>
        </div>
      </div>
    </section>
  );
};
