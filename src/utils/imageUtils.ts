/**
 * Image Base64 Utilities
 * Supports encoding files to Base64, resizing for optimal RTDB & web performance,
 * and normalizing raw Base64 strings.
 */

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
}

/**
 * Checks if a string is a Base64 data URL or raw base64 image data
 */
export function isBase64Image(str?: string): boolean {
  if (!str) return false;
  if (str.startsWith('data:image/')) return true;
  // Common raw base64 image prefixes
  if (str.startsWith('/9j/') || str.startsWith('iVBORw0KGgo') || str.startsWith('UklGR') || str.startsWith('R0lGOD')) {
    return true;
  }
  return false;
}

/**
 * Normalizes an image string:
 * If it's a raw base64 string without data: header, prefixes it with data:image/jpeg;base64,
 */
export function normalizeImageSrc(src?: string): string | undefined {
  if (!src || !src.trim()) return undefined;
  const trimmed = src.trim();
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  if (trimmed.startsWith('iVBORw0KGgo')) {
    return `data:image/png;base64,${trimmed}`;
  }
  if (trimmed.startsWith('UklGR')) {
    return `data:image/webp;base64,${trimmed}`;
  }
  if (trimmed.startsWith('R0lGOD')) {
    return `data:image/gif;base64,${trimmed}`;
  }
  // Default to JPEG for raw base64
  if (trimmed.length > 50 && /^[A-Za-z0-9+/=]+$/.test(trimmed.slice(0, 100))) {
    return `data:image/jpeg;base64,${trimmed}`;
  }
  return trimmed;
}

/**
 * Converts an image File to a Base64 data URL with optional Canvas-based resizing/compression.
 * Ensures the resulting Base64 string remains lightweight (~50KB-200KB) for Firebase Realtime Database.
 */
export function convertFileToBase64(file: File, options?: ResizeOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const rawBase64 = e.target?.result as string;
      if (!rawBase64) {
        reject(new Error('Empty file content'));
        return;
      }

      // If SVG or GIF, don't resize on canvas to preserve animation/vector
      if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
        resolve(rawBase64);
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(rawBase64); // fallback to raw base64
      img.onload = () => {
        const maxWidth = options?.maxWidth || 1200;
        const maxHeight = options?.maxHeight || 1500;
        const quality = options?.quality ?? 0.85;

        let width = img.width;
        let height = img.height;

        // Resize down if larger than max bounds while preserving aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawBase64);
          return;
        }

        // Smooth image downscaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const targetFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const compressedBase64 = canvas.toDataURL(targetFormat, quality);
        resolve(compressedBase64);
      };
      img.src = rawBase64;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Returns human-readable size of a Base64 string (e.g. "84 KB")
 */
export function getBase64Size(base64String: string): string {
  if (!base64String) return '';
  const headIdx = base64String.indexOf(',');
  const content = headIdx > -1 ? base64String.slice(headIdx + 1) : base64String;
  const bytes = Math.round((content.length * 3) / 4);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
