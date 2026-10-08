import { ref, set, get, remove } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import { base64ToBlobUrl, isBase64Video } from './videoUtils';

const CHUNK_SIZE = 3 * 1024 * 1024; // 3MB chunks for Firebase RTDB write safety

/**
 * Saves a video (Base64 data URI) directly into Firebase Realtime Database Cloud.
 * For videos up to 6MB, writes directly into the reel record.
 * For larger videos (up to 30MB), writes chunked records to portfolio/reelVideos/{reelId}.
 * This ensures videos are stored permanently in the CLOUD, NOT trapped in local storage!
 */
export async function uploadReelVideoToFirebase(
  reelId: string,
  videoDataUri: string
): Promise<{ cloudSynced: boolean; directUrl?: string; error?: string }> {
  if (!videoDataUri) {
    return { cloudSynced: false, error: 'Empty video data' };
  }

  // If it's already an external HTTP/HTTPS URL, no need to chunk
  if (videoDataUri.startsWith('http://') || videoDataUri.startsWith('https://')) {
    return { cloudSynced: true, directUrl: videoDataUri };
  }

  try {
    const isBase64 = isBase64Video(videoDataUri) || videoDataUri.startsWith('data:');
    if (!isBase64) {
      return { cloudSynced: true, directUrl: videoDataUri };
    }

    // Direct single write if small enough for Firebase RTDB node
    if (videoDataUri.length <= 6000000) {
      await set(ref(rtdb, `portfolio/reels/${reelId}/videoUrl`), videoDataUri);
      await set(ref(rtdb, `portfolio/reels/${reelId}/isBase64`), true);
      // Clean up any old chunks if they existed
      await remove(ref(rtdb, `portfolio/reelVideos/${reelId}`)).catch(() => {});
      return { cloudSynced: true, directUrl: videoDataUri };
    }

    // Video is larger than 6MB: split into cloud chunks in Firebase RTDB
    const chunks: string[] = [];
    for (let i = 0; i < videoDataUri.length; i += CHUNK_SIZE) {
      chunks.push(videoDataUri.slice(i, i + CHUNK_SIZE));
    }

    const chunkMap: Record<string, string> = {};
    chunks.forEach((chunk, index) => {
      chunkMap[`c_${index}`] = chunk;
    });

    const chunkPayload = {
      reelId,
      totalChunks: chunks.length,
      totalLength: videoDataUri.length,
      chunks: chunkMap,
      updatedAt: new Date().toISOString(),
    };

    await set(ref(rtdb, `portfolio/reelVideos/${reelId}`), chunkPayload);
    // Tag reel in RTDB as cloud-chunked
    await set(ref(rtdb, `portfolio/reels/${reelId}/videoUrl`), `firebase-chunked://${reelId}`);
    await set(ref(rtdb, `portfolio/reels/${reelId}/isBase64`), true);
    await set(ref(rtdb, `portfolio/reels/${reelId}/isCloudChunked`), true);

    return { cloudSynced: true, directUrl: videoDataUri };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Failed to upload video to Firebase Cloud for reel ${reelId}:`, msg);
    return { cloudSynced: false, error: msg };
  }
}

/**
 * Retrieves a cloud-stored reel video from Firebase Realtime Database.
 * Recombines chunks into a playable Blob URL if stored across chunks.
 */
export async function fetchReelVideoFromFirebase(
  reelId: string,
  currentVideoUrl?: string
): Promise<string | null> {
  // If already an external stream URL or valid base64 data URI
  if (
    currentVideoUrl &&
    (currentVideoUrl.startsWith('http://') ||
      currentVideoUrl.startsWith('https://') ||
      currentVideoUrl.startsWith('data:video/'))
  ) {
    return currentVideoUrl;
  }

  // If marked as firebase-chunked or if we need to check cloud storage
  try {
    const snapshot = await get(ref(rtdb, `portfolio/reelVideos/${reelId}`));
    if (snapshot.exists()) {
      const data = snapshot.val();
      if (data && data.chunks) {
        const total = data.totalChunks || 0;
        let fullBase64 = '';
        for (let i = 0; i < total; i++) {
          const chunk = data.chunks[`c_${i}`];
          if (chunk) {
            fullBase64 += chunk;
          }
        }
        if (fullBase64) {
          return base64ToBlobUrl(fullBase64);
        }
      }
    }
  } catch (err) {
    console.warn(`Error fetching cloud video chunks from Firebase for ${reelId}:`, err);
  }

  return null;
}
