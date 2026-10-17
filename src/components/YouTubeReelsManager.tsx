import React, { useState } from 'react';
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle2, ExternalLink, Pencil, Plus, Save, Trash2, X, Youtube } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { ReelItem } from '../types';
import { extractYouTubeId, youtubeShortsUrl, youtubeThumbnailUrl } from '../utils/youtubeReels';

const MAX_TITLE = 120;
// RTDB keeps unacknowledged writes pending (e.g. while offline) instead of failing them
const WRITE_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      window.setTimeout(
        () => reject(new Error('The database did not confirm the change. Check your connection and try again.')),
        WRITE_TIMEOUT_MS
      )
    ),
  ]);
}

function errorText(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/permission[_ ]denied/i.test(msg)) return 'The database refused this change (its write rules do not allow it).';
  return msg || 'Something went wrong while saving.';
}

/** The fields to store for a pasted YouTube link. */
function parseReelLink(input: string): Partial<ReelItem> | null {
  const youtubeId = extractYouTubeId(input);
  return youtubeId ? { sourceType: 'youtube', youtubeId, videoUrl: youtubeShortsUrl(youtubeId) } : null;
}

const isLinkedReel = (r: ReelItem) => r.sourceType === 'youtube' && !!r.youtubeId;

const reelKey = (r: Partial<ReelItem>) => `yt:${r.youtubeId}`;

const reelLink = (r: ReelItem) => r.sourceUrl || youtubeShortsUrl(r.youtubeId!);

/** Small 9:16 tile for a saved reel. */
const ReelTile: React.FC<{ reel: ReelItem }> = ({ reel }) => (
  <img
    src={youtubeThumbnailUrl(reel.youtubeId!)}
    alt=""
    className="w-10 aspect-[9/16] rounded-md object-cover bg-black border border-zinc-800 shrink-0"
  />
);

/** Studio portal panel: add, edit and delete YouTube Shorts (metadata in portfolio/reels). */
export const YouTubeReelsManager: React.FC = () => {
  const { reels, addReel, updateReel, deleteReel, moveReel } = usePortfolio();
  const linkedReels = reels.filter(isLinkedReel);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setUrl('');
    setTitle('');
    setFormError(null);
  };

  const startEdit = (reel: ReelItem) => {
    setEditingId(reel.id);
    setUrl(reelLink(reel));
    setTitle(reel.title);
    setFormError(null);
    setNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setNotice(null);

    const link = parseReelLink(url);
    const cleanTitle = title.trim();
    if (!link) {
      setFormError(
        'Enter a valid YouTube link, e.g. https://www.youtube.com/shorts/VIDEO_ID.'
      );
      return;
    }
    if (!cleanTitle) {
      setFormError('Enter a title for the reel.');
      return;
    }
    if (cleanTitle.length > MAX_TITLE) {
      setFormError(`Keep the title under ${MAX_TITLE} characters.`);
      return;
    }
    if (linkedReels.some((r) => reelKey(r) === reelKey(link) && r.id !== editingId)) {
      setFormError('This video is already in the reels list.');
      return;
    }

    setFormError(null);
    setSubmitting(true);
    const fields: Partial<ReelItem> = { ...link, title: cleanTitle, sourceUrl: url.trim() };
    try {
      if (editingId) {
        await withTimeout(updateReel(editingId, fields));
        setNotice({ type: 'success', text: `Updated “${cleanTitle}”.` });
      } else {
        const nextOrder = linkedReels.reduce((max, r) => Math.max(max, r.order ?? 0), 0) + 1;
        await withTimeout(
          addReel({
            id: `yt-${Date.now().toString(36)}`,
            number: '',
            aspect: '9:16',
            order: nextOrder,
            title: cleanTitle,
            videoUrl: link.videoUrl!,
            ...fields,
          })
        );
        setNotice({ type: 'success', text: `Added “${cleanTitle}” to the carousel.` });
      }
      resetForm();
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reel: ReelItem) => {
    if (busyId) return;
    if (!window.confirm(`Remove “${reel.title}” from the reels carousel?`)) return;
    setBusyId(reel.id);
    setNotice(null);
    try {
      await withTimeout(deleteReel(reel.id));
      if (editingId === reel.id) resetForm();
      setNotice({ type: 'success', text: `Removed “${reel.title}”.` });
    } catch (err) {
      setNotice({ type: 'error', text: errorText(err) });
    } finally {
      setBusyId(null);
    }
  };

  // Move a reel one place up (-1) or down (+1)
  const handleMove = async (index: number, step: -1 | 1) => {
    if (busyId) return;
    setBusyId(linkedReels[index].id);
    setNotice(null);
    try {
      await withTimeout(moveReel(linkedReels[index].id, step));
    } catch (err) {
      setNotice({ type: 'error', text: errorText(err) });
    } finally {
      setBusyId(null);
    }
  };

  const preview = parseReelLink(url);

  return (
    <div className="space-y-5 rounded-2xl border border-zinc-800 bg-[#09090f] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs tracking-wider uppercase mb-1">
            <Youtube className="w-4 h-4" />
            <span>YOUTUBE SHORTS</span>
          </div>
          <p className="text-xs font-mono text-zinc-400">
            Paste a YouTube Shorts link and a title, then press Add Reel. Use the arrows to set the order (#01 plays first).
          </p>
        </div>
        <span className="text-[11px] font-mono text-zinc-500 shrink-0">{linkedReels.length} saved</span>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-[11px] font-mono text-zinc-400 uppercase">YouTube Shorts URL</span>
            <input
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/shorts/…"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-lg px-3 py-2 text-sm text-white outline-none"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-mono text-zinc-400 uppercase">Title</span>
            <input
              type="text"
              value={title}
              maxLength={MAX_TITLE}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brand launch reel"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-lg px-3 py-2 text-sm text-white outline-none"
            />
          </label>

          {formError && (
            <p className="flex items-start gap-2 text-xs font-mono text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{formError}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold uppercase disabled:opacity-50"
            >
              {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{submitting ? 'SAVING…' : editingId ? 'SAVE CHANGES' : 'ADD REEL'}</span>
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                <span>CANCEL</span>
              </button>
            )}
          </div>
        </div>

        {/* Preview of the pasted link */}
        <div className="relative w-28 sm:w-32 aspect-[9/16] rounded-xl overflow-hidden border border-zinc-800 bg-black justify-self-start md:justify-self-end">
          {preview?.sourceType === 'youtube' ? (
            <img src={youtubeThumbnailUrl(preview.youtubeId!)} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Youtube className="w-5 h-5 text-zinc-700" />
            </div>
          )}
        </div>
      </form>

      {notice && (
        <p
          className={`flex items-center gap-2 text-xs font-mono ${notice.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}
        >
          {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
          <span>{notice.text}</span>
        </p>
      )}

      {linkedReels.length > 0 && (
        <ul className="divide-y divide-zinc-800/80 border-t border-zinc-800/80">
          {linkedReels.map((reel, index) => (
            <li key={reel.id} className="flex items-center gap-3 py-3">
              <ReelTile reel={reel} />
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-heading font-bold text-white uppercase truncate">
                  <span className="text-amber-400 font-mono mr-2">#{reel.number}</span>
                  {reel.title}
                </span>
                <a
                  href={reelLink(reel)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-amber-400 truncate"
                >
                  {`YouTube · ${reel.youtubeId}`}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleMove(index, -1)}
                  disabled={busyId !== null || index === 0}
                  title="Move up"
                  className="p-2 rounded-full text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 disabled:opacity-30"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, 1)}
                  disabled={busyId !== null || index === linkedReels.length - 1}
                  title="Move down"
                  className="p-2 rounded-full text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 disabled:opacity-30"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(reel)}
                  disabled={submitting || busyId === reel.id}
                  title="Edit"
                  className="p-2 rounded-full text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 disabled:opacity-40"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(reel)}
                  disabled={busyId !== null}
                  title="Delete"
                  className="p-2 rounded-full text-zinc-400 hover:text-red-400 hover:bg-zinc-800 disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
