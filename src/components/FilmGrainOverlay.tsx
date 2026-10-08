import React from 'react';

interface FilmGrainOverlayProps {
  showGrain?: boolean;
}

export const FilmGrainOverlay: React.FC<FilmGrainOverlayProps> = ({ showGrain = true }) => {
  if (!showGrain) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {/* 35mm Film Grain SVG Texture */}
      <div className="absolute inset-0 opacity-[0.035] mix-blend-screen film-grain" />

      {/* Subtle Anamorphic Edge Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.85)_100%)] pointer-events-none" />

      {/* Subtle Top & Bottom Film Edge Border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
    </div>
  );
};
