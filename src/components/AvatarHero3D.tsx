import React, { useEffect, useRef } from 'react';
import avatarImg from '../assets/avatar.png';

interface AvatarHero3DProps {
  className?: string;
}

/**
 * AvatarHero3D
 * Displays the original avatar.png with zero eye-moving effects.
 * Includes subtle smooth 3D tilt tracking for depth, or static clean rendering.
 */
export const AvatarHero3D: React.FC<AvatarHero3DProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only enable subtle 3D tilt on devices with a mouse/trackpad
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!isFinePointer) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let animationFrameId = 0; // 0 = loop stopped
    let isMouseActive = false;
    let idleTimer: NodeJS.Timeout | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      if (innerWidth === 0 || innerHeight === 0) return;

      // Normalized coordinates: -0.5 to +0.5
      targetX = e.clientX / innerWidth - 0.5;
      targetY = e.clientY / innerHeight - 0.5;

      isMouseActive = true;
      if (!animationFrameId) animationFrameId = requestAnimationFrame(animate);
      if (idleTimer) clearTimeout(idleTimer);

      idleTimer = setTimeout(() => {
        isMouseActive = false;
      }, 1500);
    };

    const handleMouseLeave = () => {
      isMouseActive = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    const animate = () => {
      if (!isMouseActive) {
        targetX += (0 - targetX) * 0.03;
        targetY += (0 - targetY) * 0.03;
      }

      // Smooth lag interpolation
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      // Subtle, gentle holistic 3D tilt (max 3.5 deg, no independent eye movement)
      const rotY = Math.max(-3.5, Math.min(3.5, currentX * 6.0));
      const rotX = Math.max(-2.5, Math.min(2.5, -currentY * 4.5));
      const transX = Math.max(-4, Math.min(4, currentX * 7.0));
      const transY = Math.max(-3, Math.min(3, currentY * 5.0));

      if (cardRef.current) {
        cardRef.current.style.transform = `
          translate3d(${transX.toFixed(2)}px, ${transY.toFixed(2)}px, 0px)
          rotateY(${rotY.toFixed(2)}deg)
          rotateX(${rotX.toFixed(2)}deg)
        `;
      }

      // Stop once the card has settled back to rest; the next mouse move restarts the loop,
      // so it doesn't run every frame forever (e.g. while a reel is playing)
      const settled =
        !isMouseActive && Math.abs(targetX) < 0.001 && Math.abs(targetY) < 0.001 &&
        Math.abs(currentX) < 0.001 && Math.abs(currentY) < 0.001;
      animationFrameId = settled ? 0 : requestAnimationFrame(animate);
    };

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (idleTimer) clearTimeout(idleTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative select-none pointer-events-none ${className}`}
      style={{ perspective: 1200 }}
      aria-label="Aman Gupta 3D Avatar"
    >
      {/* Grounding Stage Shadows & Warm Ambient Rim Light */}
      <div className="absolute -inset-4 sm:-inset-8 bg-radial from-amber-500/10 via-[#070709]/40 to-transparent blur-2xl pointer-events-none rounded-full transform scale-90 translate-y-6" />
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-12 bg-black/90 blur-xl rounded-full pointer-events-none" />

      {/* Main Avatar Model: Direct clean render of avatar.png with zero eye-moving effects */}
      <div
        ref={cardRef}
        className="relative w-full h-full will-change-transform"
        style={{
          transformStyle: 'preserve-3d',
          transformOrigin: '50% 85%',
        }}
      >
        <img
          src={avatarImg}
          alt="Aman Gupta - Video Editor Avatar"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain object-bottom drop-shadow-[0_20px_50px_rgba(0,0,0,0.85)] filter brightness-[1.0] contrast-[1.02]"
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  );
};
