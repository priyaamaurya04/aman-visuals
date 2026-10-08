import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Menu, X, Disc } from 'lucide-react';

interface NavbarProps {
  onOpenShowreel: () => void;
  isAudioActive: boolean;
  onToggleAudio: () => void;
  onOpenPortal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenShowreel,
  isAudioActive,
  onToggleAudio,
  onOpenPortal,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    { label: 'REELS', href: '#reels' },
    { label: 'WORK', href: '#selected-work' },
    { label: 'TIMELINE', href: '#editing-timeline' },
    { label: 'SKILLS', href: '#skills' },
    { label: 'SOFTWARE', href: '#software' },
    { label: 'ABOUT', href: '#about' },
    { label: 'PROCESS', href: '#process' },
    { label: 'CONTACT', href: '#contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled
          ? 'bg-[#070709]/90 backdrop-blur-md border-b border-zinc-800/80 py-3.5 shadow-2xl'
          : 'bg-gradient-to-b from-[#070709]/90 via-[#070709]/40 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
        {/* Monogram / Brand */}
        <a
          href="#"
          className="group flex items-center space-x-3 focus:outline-none"
          id="nav-logo"
        >
          <div className="w-8 h-8 rounded border border-zinc-700 bg-zinc-900/80 flex items-center justify-center text-xs font-mono font-bold tracking-tighter text-amber-400 group-hover:border-amber-400/60 transition-colors">
            AG
          </div>
          <div>
            <span className="font-heading font-bold text-sm tracking-tight text-white group-hover:text-amber-300 transition-colors block">
              AMAN GUPTA
            </span>
            <span className="text-[10px] font-mono tracking-wider text-zinc-400 block -mt-0.5">
              VIDEO EDITOR // STORYTELLER
            </span>
          </div>
        </a>

        {/* Desktop Nav Links & Controls */}
        <div className="hidden md:flex items-center space-x-7">
          <nav className="flex items-center space-x-6 text-[13px] font-sans font-medium tracking-wide text-zinc-300">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="hover:text-amber-400 transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-amber-400 hover:after:w-full after:transition-all after:duration-300"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Ambient Audio Toggle */}
          <button
            onClick={onToggleAudio}
            title={isAudioActive ? 'Mute Studio Ambient Tone' : 'Play Studio Ambient Tone'}
            className={`p-2 rounded-full border transition-all ${
              isAudioActive
                ? 'border-amber-500/60 bg-amber-500/10 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 bg-zinc-900/40'
            }`}
          >
            {isAudioActive ? (
              <div className="flex items-center space-x-1 px-1">
                <Volume2 className="w-3.5 h-3.5" />
                <span className="flex space-x-0.5 items-end h-3">
                  <span className="w-0.5 h-2 bg-amber-400 animate-pulse" />
                  <span className="w-0.5 h-3 bg-amber-400 animate-pulse delay-75" />
                  <span className="w-0.5 h-1.5 bg-amber-400 animate-pulse delay-150" />
                </span>
              </div>
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Watch Showreel Pill Button */}
          <button
            onClick={onOpenShowreel}
            id="nav-showreel-btn"
            className="group flex items-center space-x-2 px-4 py-2 rounded-full bg-zinc-100 hover:bg-amber-400 text-zinc-950 text-xs font-sans font-bold tracking-wider transition-all duration-300 hover:scale-105"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>SHOWREEL</span>
          </button>
        </div>

        {/* Mobile Toggle Button */}
        <div className="flex items-center space-x-3 md:hidden">
          <button
            onClick={onToggleAudio}
            className="p-2 text-zinc-300 border border-zinc-800 rounded-full"
            aria-label="Toggle ambient sound"
          >
            {isAudioActive ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-200 hover:text-white focus:outline-none"
            aria-label="Open navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#070709] border-b border-zinc-800 px-6 py-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
          <nav className="flex flex-col space-y-3 text-sm font-sans font-medium tracking-wide text-zinc-300">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-amber-400 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenShowreel();
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-md bg-amber-400 text-zinc-950 font-sans font-bold text-xs tracking-wider cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>WATCH 2025 SHOWREEL</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
