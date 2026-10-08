import React from 'react';
import { motion } from 'motion/react';
import { StackedCardCarousel } from './StackedCardCarousel';
import { Smartphone } from 'lucide-react';

export const ReelsShowcase: React.FC = () => {
  return (
    <section id="reels" className="py-24 px-4 sm:px-6 md:px-12 bg-[#050508] border-t border-zinc-900/90 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-amber-500/5 blur-[140px] pointer-events-none rounded-full" />

      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-7xl mx-auto mb-8 text-center"
      >
        <div className="inline-flex items-center space-x-2 text-amber-400 font-mono text-xs tracking-[0.25em] uppercase mb-3 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 backdrop-blur-md">
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>VERTICAL CINEMA // 9:16 REELS</span>
        </div>
        <h2 className="font-heading font-bold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight uppercase">
          REELS SHOWCASE
        </h2>
        <p className="text-sm sm:text-base font-sans text-zinc-400 max-w-xl mx-auto mt-3">
          Kinetic short-form editing, mobile-first pacing, sound-reactive cuts, and high-retention visual rhythm.
        </p>
      </motion.div>

      {/* 3D Auto-Sliding Reels Carousel (Non-clickable, no arrows, pure sliding) */}
      <StackedCardCarousel />
    </section>
  );
};
