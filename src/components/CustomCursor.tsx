import React, { useEffect, useState } from 'react';

export const CustomCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only activate on devices with mouse/pointer (not touch)
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        const isClickable =
          target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.closest('button') !== null ||
          target.closest('a') !== null ||
          target.closest('.cursor-pointer') !== null;
        setIsPointer(isClickable);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="pointer-events-none fixed z-50 transition-transform duration-75 ease-out -translate-x-1/2 -translate-y-1/2 hidden md:block"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
      }}
    >
      {/* Outer Ring / Expanding Reticle */}
      <div
        className={`rounded-full border transition-all duration-300 flex items-center justify-center ${
          isPointer
            ? 'w-12 h-12 border-amber-400 bg-amber-400/10 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
            : 'w-7 h-7 border-zinc-500/50'
        }`}
      >
        {/* Inner Dot / Reticle Crosshair */}
        <div
          className={`rounded-full transition-all duration-200 ${
            isPointer ? 'w-1.5 h-1.5 bg-amber-400' : 'w-1 h-1 bg-zinc-300'
          }`}
        />
      </div>
    </div>
  );
};
