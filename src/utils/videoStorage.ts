/**
 * IndexedDB Video Storage Vault
 * Provides high-capacity, permanent local persistence for video files (MP4, MOV, WebM, etc.)
 * bypassing browser localStorage 5MB quotas and network size limits.
 */

import { ReelItem } from '../types';

const DB_NAME = 'aman_portfolio_video_vault';
const STORE_NAME = 'reel_videos';
const DB_VERSION = 1;

// In-memory cache for generated Blob URLs to ensure zero-cost playback and avoid redundant allocations
const blobUrlCache = new Map<string, string>();

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.warn('IndexedDB failed to open:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Stores a video file/blob in IndexedDB keyed by reel ID and returns an active playable Blob URL.
 */
export async function storeVideoBlob(id: string, fileOrBlob: Blob | File): Promise<string> {
  try {
    const db = await getDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(fileOrBlob, id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Create and cache active Blob URL
    if (blobUrlCache.has(id)) {
      try {
        URL.revokeObjectURL(blobUrlCache.get(id)!);
      } catch {
        // ignore
      }
    }

    const blobUrl = URL.createObjectURL(fileOrBlob);
    blobUrlCache.set(id, blobUrl);
    return blobUrl;
  } catch (err) {
    console.warn(`IndexedDB store error for ${id}, using fallback ObjectURL:`, err);
    const blobUrl = URL.createObjectURL(fileOrBlob);
    blobUrlCache.set(id, blobUrl);
    return blobUrl;
  }
}

/**
 * Retrieves a video Blob URL from IndexedDB.
 */
export async function getStoredVideoUrl(id: string): Promise<string | null> {
  if (blobUrlCache.has(id)) {
    return blobUrlCache.get(id)!;
  }

  try {
    const db = await getDb();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      blobUrlCache.set(id, blobUrl);
      return blobUrl;
    }
  } catch (err) {
    console.warn(`Could not retrieve video from IndexedDB for ${id}:`, err);
  }

  return null;
}

/**
 * Deletes a stored video from IndexedDB.
 */
export async function removeStoredVideo(id: string): Promise<void> {
  if (blobUrlCache.has(id)) {
    try {
      URL.revokeObjectURL(blobUrlCache.get(id)!);
    } catch {
      // ignore
    }
    blobUrlCache.delete(id);
  }

  try {
    const db = await getDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`Could not delete video ${id} from IndexedDB:`, err);
  }
}

/**
 * Checks all reels and rehydrates any videos stored in IndexedDB.
 */
export async function rehydrateReelsWithStoredVideos(reels: ReelItem[]): Promise<ReelItem[]> {
  try {
    const updated = await Promise.all(
      reels.map(async (reel) => {
        // If it was tagged with stored blob or doesn't have an external http(s) URL
        const isExternal =
          reel.videoUrl?.startsWith('http://') ||
          reel.videoUrl?.startsWith('https://');

        // Check if IndexedDB has a video for this reel
        const storedUrl = await getStoredVideoUrl(reel.id);
        if (storedUrl) {
          return {
            ...reel,
            videoUrl: storedUrl,
            hasStoredBlob: true,
          };
        }

        // If it's not external and no stored blob, keep existing (or base64)
        return reel;
      })
    );
    return updated;
  } catch (err) {
    console.warn('Failed to rehydrate reel videos from IndexedDB:', err);
    return reels;
  }
}
