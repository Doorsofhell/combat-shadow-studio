/**
 * v0.37 profile photo: square crop, resize and re-encoding on the device. Drawing the picture on a canvas and
 * exporting it keeps only the pixels, so EXIF metadata (location, camera) is dropped; the orientation written by
 * the phone is applied first (`imageOrientation: 'from-image'`).
 */
export const PHOTO_SIZE = 320;
/** files bigger than this are refused before decoding */
export const PHOTO_MAX_BYTES = 15 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export interface Crop {
  /** 1 = the largest centred square, up to 3 */
  zoom: number;
  /** -1..1: where the square sits horizontally / vertically within the free room */
  x: number;
  y: number;
}

export const DEFAULT_CROP: Crop = { zoom: 1, x: 0, y: 0 };

/** the source rectangle (in image pixels) of the square to keep */
export function cropRect(w: number, h: number, c: Crop) {
  const zoom = Math.min(3, Math.max(1, c.zoom));
  const side = Math.min(w, h) / zoom;
  const clamp = (v: number) => Math.min(1, Math.max(-1, v));
  const sx = ((w - side) / 2) * (1 + clamp(c.x));
  const sy = ((h - side) / 2) * (1 + clamp(c.y));
  return { sx, sy, side };
}

/** why a file cannot be used, or null */
export function photoProblem(f: { type: string; size: number }): string | null {
  if (f.type && !PHOTO_TYPES.includes(f.type)) return 'Choisis une photo (JPEG, PNG, WebP ou HEIC).';
  if (f.size > PHOTO_MAX_BYTES) return 'Cette photo est trop lourde (15 Mo au plus).';
  return null;
}

export async function decodePhoto(file: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('Cette photo ne peut pas être lue sur cet appareil. Essaie une autre image (JPEG ou PNG).');
  }
}

/** the square, resized and re-encoded image as a data URL (WebP when supported, else JPEG) */
export function renderPhoto(img: CanvasImageSource & { width: number; height: number }, c: Crop, size = PHOTO_SIZE) {
  const { sx, sy, side } = cropRect(img.width, img.height, c);
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const g = cv.getContext('2d');
  if (!g) throw new Error('Impossible de préparer la photo sur cet appareil.');
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, sx, sy, side, side, 0, 0, size, size);
  const webp = cv.toDataURL('image/webp', 0.82);
  return webp.startsWith('data:image/webp') ? webp : cv.toDataURL('image/jpeg', 0.85);
}
