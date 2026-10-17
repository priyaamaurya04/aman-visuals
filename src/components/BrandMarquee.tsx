import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';

// Seconds one logo takes to travel its own slot; keeps the speed the same however many logos there are
const SECONDS_PER_LOGO = 3;
// Minimum logos per half of the track so the strip is always wider than the screen
const MIN_PER_HALF = 12;

/**
 * Strip of brand logos (base64 images from portfolio/brands) scrolling left to right, shown above
 * the Editing Timeline. Renders nothing until at least one logo has been added in the Studio.
 */
export const BrandMarquee: React.FC = () => {
  const { brands } = usePortfolio();
  if (brands.length === 0) return null;

  // The track holds the list twice and slides by exactly one half, so the loop has no visible seam
  const repeat = Math.ceil(MIN_PER_HALF / brands.length);
  const half = Array.from({ length: repeat }, () => brands).flat();
  const duration = half.length * SECONDS_PER_LOGO;

  return (
    <section
      aria-label="Brands I have worked with"
      className="py-10 bg-[#08080c] border-t border-zinc-900 overflow-hidden"
    >
      <div className="brand-marquee relative [mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent)]">
        <div className="brand-marquee-track flex w-max" style={{ animationDuration: `${duration}s` }}>
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1 || undefined}>
              {half.map((brand, i) => (
                <li key={`${brand.id}-${i}`} className="px-6 sm:px-10 flex items-center">
                  <img
                    src={brand.image}
                    alt={copy === 0 && i < brands.length ? brand.name : ''}
                    title={brand.name}
                    loading="lazy"
                    draggable={false}
                    className="h-28 sm:h-40 w-auto max-w-[260px] sm:max-w-[400px] object-contain select-none"
                  />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
};
