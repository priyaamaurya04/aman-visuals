import React, { useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, ImagePlus, Trash2 } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { BrandLogo } from '../types';
import { convertFileToBase64, getBase64Size } from '../utils/imageUtils';

// Logos are shown at most ~180×50px, so they are scaled down before being stored as base64 in RTDB
const LOGO_MAX_WIDTH = 480;
const LOGO_MAX_HEIGHT = 240;
// Upper bound per logo after conversion (SVG / GIF files are stored as-is, unresized)
const MAX_LOGO_BYTES = 300 * 1024;

function base64Bytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  return Math.round(((comma > -1 ? dataUrl.length - comma - 1 : dataUrl.length) * 3) / 4);
}

function errorText(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/permission[_ ]denied/i.test(msg)) return 'The database refused this change (its write rules do not allow it).';
  return msg || 'Something went wrong while saving.';
}

/** Studio panel: upload, rename, reorder and delete the brand logos shown in the marquee. */
export const BrandsManager: React.FC = () => {
  const { brands, addBrand, updateBrand, deleteBrand, moveBrand } = usePortfolio();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setNotice(null);
    const added: string[] = [];
    const problems: string[] = [];

    // Sequentially, so each new logo gets the next order number
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        problems.push(`${file.name}: not an image`);
        continue;
      }
      try {
        const image = await convertFileToBase64(file, {
          maxWidth: LOGO_MAX_WIDTH,
          maxHeight: LOGO_MAX_HEIGHT,
          quality: 0.9,
        });
        if (base64Bytes(image) > MAX_LOGO_BYTES) {
          problems.push(`${file.name}: too large (${getBase64Size(image)}, max 300 KB)`);
          continue;
        }
        const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
        await addBrand({ id: `brand-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, name, image });
        added.push(name);
      } catch (err) {
        problems.push(`${file.name}: ${errorText(err)}`);
      }
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
    if (problems.length > 0) {
      setNotice({
        type: 'error',
        text: `${added.length ? `Added ${added.length}. ` : ''}Not added: ${problems.join('; ')}`,
      });
    } else {
      setNotice({ type: 'success', text: `Added ${added.length} logo${added.length === 1 ? '' : 's'} to the marquee.` });
    }
  };

  const run = async (id: string, action: () => Promise<void>, success?: string) => {
    if (busyId) return;
    setBusyId(id);
    setNotice(null);
    try {
      await action();
      if (success) setNotice({ type: 'success', text: success });
    } catch (err) {
      setNotice({ type: 'error', text: errorText(err) });
    } finally {
      setBusyId(null);
    }
  };

  const handleRename = (brand: BrandLogo, value: string) => {
    const name = value.trim();
    if (name === brand.name) return;
    run(brand.id, () => updateBrand(brand.id, { name }));
  };

  const handleDelete = (brand: BrandLogo) => {
    if (!window.confirm(`Remove “${brand.name || 'this logo'}” from the marquee?`)) return;
    run(brand.id, () => deleteBrand(brand.id), `Removed “${brand.name || 'logo'}”.`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold uppercase disabled:opacity-50"
        >
          <ImagePlus className="w-4 h-4" />
          <span>{uploading ? 'UPLOADING…' : 'UPLOAD LOGOS'}</span>
        </button>
        <span className="text-[11px] font-mono text-zinc-500">
          PNG with a transparent background or SVG looks best. You can select several files at once.
        </span>
        <span className="ml-auto text-[11px] font-mono text-zinc-500">{brands.length} saved</span>
      </div>

      {notice && (
        <p
          className={`flex items-start gap-2 text-xs font-mono ${notice.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{notice.text}</span>
        </p>
      )}

      {brands.length === 0 ? (
        <p className="text-xs font-mono text-zinc-500 border border-dashed border-zinc-800 rounded-xl p-6 text-center">
          No logos yet. The marquee stays hidden on the website until you upload one.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {brands.map((brand, idx) => (
            <div key={brand.id} className="rounded-xl border border-zinc-800 bg-[#09090e] p-3 space-y-3">
              <div className="relative h-24 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-center p-3">
                <span className="absolute top-1.5 left-2 text-[10px] font-mono text-amber-400">#{idx + 1}</span>
                <img src={brand.image} alt={brand.name} className="max-h-14 max-w-full object-contain" />
              </div>
              <input
                type="text"
                defaultValue={brand.name}
                key={`${brand.id}-${brand.name}`}
                maxLength={80}
                placeholder="Brand name"
                onBlur={(e) => handleRename(brand, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => run(brand.id, () => moveBrand(brand.id, -1))}
                    disabled={busyId !== null || idx === 0}
                    title="Move earlier"
                    className="p-1.5 rounded-full text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => run(brand.id, () => moveBrand(brand.id, 1))}
                    disabled={busyId !== null || idx === brands.length - 1}
                    title="Move later"
                    className="p-1.5 rounded-full text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(brand)}
                  disabled={busyId !== null}
                  title="Delete"
                  className="p-1.5 rounded-full text-zinc-400 hover:text-red-400 hover:bg-zinc-800 disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
