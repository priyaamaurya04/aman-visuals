/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SelectedWork } from './components/SelectedWork';
import { ReelsShowcase } from './components/ReelsShowcase';
import { EditingTimeline } from './components/EditingTimeline';
import { BrandMarquee } from './components/BrandMarquee';
import { SkillsSection } from './components/SkillsSection';
import { SoftwareSection } from './components/SoftwareSection';
import { AboutSection } from './components/AboutSection';
import { ProcessSection } from './components/ProcessSection';
import { ContactSection } from './components/ContactSection';
import { FilmGrainOverlay } from './components/FilmGrainOverlay';
import { ShowreelModal } from './components/ShowreelModal';
import { CustomCursor } from './components/CustomCursor';
import { StudioPortal } from './components/StudioPortal';
import { PortfolioProvider } from './context/PortfolioContext';
import { toggleCinematicAudio } from './utils/audio';

function AppContent() {
  const [isShowreelOpen, setIsShowreelOpen] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isPortalOpen, setIsPortalOpen] = useState(false);

  // Check URL hash and path for portal/login route
  useEffect(() => {
    const checkRoute = () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const isTargetRoute =
        hash.includes('login') ||
        hash.includes('portal') ||
        hash.includes('admin') ||
        hash.includes('studio') ||
        hash.includes('dashboard') ||
        path.includes('/login') ||
        path.includes('/portal') ||
        path.includes('/admin') ||
        path.includes('/dashboard') ||
        search.includes('admin') ||
        search.includes('dashboard');

      setIsPortalOpen(isTargetRoute);
    };

    checkRoute();

    window.addEventListener('hashchange', checkRoute);
    window.addEventListener('popstate', checkRoute);

    // Secret Editor Keyboard Shortcut: Ctrl + Shift + D or Cmd + Shift + D (also L for login)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd' || e.key === 'L' || e.key === 'l')) {
        e.preventDefault();
        setIsPortalOpen((prev) => {
          const next = !prev;
          if (next) {
            window.location.hash = '#/dashboard';
          } else {
            window.location.hash = '';
          }
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', checkRoute);
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleToggleAudio = () => {
    const nextState = !isAudioActive;
    toggleCinematicAudio(nextState);
    setIsAudioActive(nextState);
  };

  const handleExitPortal = () => {
    setIsPortalOpen(false);
    if (window.location.hash.includes('login') || window.location.hash.includes('portal')) {
      window.location.hash = '';
    }
  };

  // Dedicated separate login & link upload portal
  if (isPortalOpen) {
    return (
      <div className="relative min-h-screen bg-[#030306] text-zinc-100 selection:bg-amber-500/30 selection:text-amber-200">
        <FilmGrainOverlay />
        <CustomCursor />
        <div className="relative z-10 pointer-events-auto">
          <StudioPortal onExit={handleExitPortal} />
        </div>
      </div>
    );
  }

  // Public Portfolio Showcase (no login button mentioned)
  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 relative selection:bg-amber-500/30 selection:text-amber-200">
      {/* 35mm Film Grain & Cinematic Lighting Atmosphere */}
      <FilmGrainOverlay />

      {/* Custom Precision Cursor */}
      <CustomCursor />

      {/* Global Cinematic Sticky Navigation */}
      <Navbar
        onOpenShowreel={() => setIsShowreelOpen(true)}
        isAudioActive={isAudioActive}
        onToggleAudio={handleToggleAudio}
        onOpenPortal={() => setIsPortalOpen(true)}
      />

      {/* Main Sections */}
      <main>
        {/* Full-screen Hero with Video Showreel & Camera HUD */}
        <Hero onOpenShowreel={() => setIsShowreelOpen(true)} />

        {/* Vertical Reels 9:16 Auto-Sliding 3D Showcase */}
        <ReelsShowcase />

        {/* Selected Work Cards with Dynamic Firestore Video Links & Case Studies */}
        <SelectedWork />

        {/* Brand logos marquee (managed in the Studio, stored as base64 in RTDB) */}
        <BrandMarquee />

        {/* Interactive NLE Editing Timeline */}
        <EditingTimeline />

        {/* Skills with Kinetic Animated Typography */}
        <SkillsSection />

        {/* Software Arsenal with Pro NLE Shortcuts & Hover States */}
        <SoftwareSection />

        {/* The Editor Behind the Frame (Biography, Stats, Portrait) */}
        <AboutSection />

        {/* 5-Phase Horizontal Editorial Workflow */}
        <ProcessSection />

        {/* Contact & Inquiries */}
        <ContactSection />
      </main>

      {/* Fullscreen Master Showreel Theater Modal */}
      <ShowreelModal
        isOpen={isShowreelOpen}
        onClose={() => setIsShowreelOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <PortfolioProvider>
      <AppContent />
    </PortfolioProvider>
  );
}
