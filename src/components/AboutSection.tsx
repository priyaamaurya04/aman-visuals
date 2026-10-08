import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Award, CheckCircle2, Edit3, Film, ArrowRight } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { normalizeImageSrc } from '../utils/imageUtils';

export const AboutSection: React.FC = () => {
  const { aboutContent, updateAboutContent, heroContent } = usePortfolio();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(aboutContent.biography || '');

  useEffect(() => {
    if (!isEditingBio && aboutContent.biography) {
      setBioInput(aboutContent.biography);
    }
  }, [aboutContent.biography, isEditingBio]);

  const handleSaveBio = () => {
    updateAboutContent({ biography: bioInput || '' });
    setIsEditingBio(false);
  };

  const stats = [
    { label: aboutContent.stat1Label || 'Commercials & Films', value: aboutContent.stat1Value || '120+' },
    { label: aboutContent.stat2Label || 'Years of Craft', value: aboutContent.stat2Value || '7+ YRS' },
    { label: aboutContent.stat3Label || 'Global Views', value: aboutContent.stat3Value || '45M+' },
    { label: aboutContent.stat4Label || 'Festival Laurels', value: aboutContent.stat4Value || '14' },
  ];

  return (
    <section id="about" className="py-28 px-6 md:px-12 bg-[#070709] relative border-t border-zinc-900">
      <div className="max-w-7xl mx-auto space-y-20">
        {/* Top Eyebrow & Headline with Upward Animated Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="border-b border-zinc-800/80 pb-8"
        >
          <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs tracking-[0.2em] uppercase mb-2">
            <Film className="w-4 h-4 text-amber-400" />
            <span>DIRECTOR OF EDIT // BIOGRAPHY</span>
          </div>
          <h2 className="font-heading font-bold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight uppercase">
            {aboutContent.headline || 'ABOUT AMAN'}
          </h2>
          <p className="font-sans text-zinc-300 text-base sm:text-lg md:text-xl mt-3 font-normal leading-relaxed">
            &ldquo;{aboutContent.subheadline}&rdquo;
          </p>
        </motion.div>

        {/* Main Grid: Portrait on Left, Bio & Details on Right */}
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Left: Cinematic Portrait Container */}
          <div className="lg:col-span-5 relative group">
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-[#0c0c11] aspect-[4/5] shadow-2xl">
              {normalizeImageSrc(aboutContent.portraitUrl) ? (
                <img
                  src={normalizeImageSrc(aboutContent.portraitUrl)}
                  alt={`${heroContent.name || 'Aman Gupta'} — Video Editor`}
                  className="w-full h-full object-cover filter grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                />
              ) : null}

              {/* Viewfinder HUD Overlays */}
              <div className="absolute inset-4 pointer-events-none border border-zinc-500/20 flex flex-col justify-between p-3">
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                  <span>CONSOLE // SUITE 01</span>
                  <span className="text-amber-400 font-bold">24.00 FPS</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                  <span>ISO 1250 • T2.0</span>
                  <span>ARRI RAW</span>
                </div>
              </div>

              {/* Bottom Gradient Scrim */}
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-xs font-mono text-amber-400 font-bold tracking-widest block uppercase">
                  {heroContent.name || 'AMAN GUPTA'}
                </span>
                <span className="text-[11px] font-sans text-zinc-300">
                  Lead Video Editor & Story Architect
                </span>
              </div>
            </div>

            {/* Location Tag Under Portrait */}
            <div className="mt-4 flex items-center space-x-2 text-xs font-mono text-zinc-400 bg-[#0c0c11] p-3 rounded-lg border border-zinc-800">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{aboutContent.location}</span>
            </div>
          </div>

          {/* Right: Editable Biography & Specializations */}
          <div className="lg:col-span-7 space-y-10">
            {/* Biography with Editable Capability */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono tracking-wider text-zinc-500 uppercase">
                  PHILOSOPHY & EXPERIENCE
                </span>
                <button
                  onClick={() => {
                    if (isEditingBio) {
                      handleSaveBio();
                    } else {
                      setBioInput(aboutContent.biography || '');
                      setIsEditingBio(true);
                    }
                  }}
                  className="flex items-center space-x-1.5 text-xs font-sans font-semibold text-amber-400 hover:text-amber-300 transition-colors px-3 py-1.5 rounded border border-amber-500/30 hover:border-amber-400 uppercase tracking-wider"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditingBio ? 'SAVE BIOGRAPHY' : 'EDIT BIOGRAPHY'}</span>
                </button>
              </div>

              {isEditingBio ? (
                <div className="space-y-3">
                  <textarea
                    value={bioInput ?? ''}
                    onChange={(e) => setBioInput(e.target.value)}
                    rows={8}
                    className="w-full p-4 rounded-xl bg-zinc-950 border border-amber-400 text-zinc-200 font-sans text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <p className="text-[11px] font-mono text-zinc-500">
                    Changes take effect immediately across this session and saved locally.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-zinc-300 text-sm sm:text-base leading-relaxed font-sans font-normal whitespace-pre-line">
                  {aboutContent.biography}
                </div>
              )}
            </div>

            {/* Specializations Tags */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <span className="text-xs font-mono tracking-wider text-zinc-500 uppercase block">
                SPECIALIZED TECHNIQUES
              </span>
              <div className="flex flex-wrap gap-2">
                {aboutContent.specializations.map((spec) => (
                  <span
                    key={spec}
                    className="px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-amber-400/60 text-xs font-sans text-zinc-300 hover:text-amber-300 transition-colors flex items-center space-x-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>{spec}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Animated Statistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl border border-zinc-800 bg-[#0c0c11] hover:border-amber-400/40 transition-colors"
                >
                  <div className="font-heading font-bold text-3xl sm:text-4xl text-white tracking-tight flex items-baseline">
                    <span>{stat.value}</span>
                  </div>
                  <div className="text-[11px] font-sans font-medium tracking-wide text-zinc-400 mt-1 uppercase">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

