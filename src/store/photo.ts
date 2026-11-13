import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { idbStorage } from './storage';

/**
 * v0.37 (Youssef, « correctif authentification gratuite à 0 € », 2026-10-22): the personal profile photo stays on
 * this device (no Cloud Storage, which needs the paid Blaze plan, and no image in Firestore). It is kept per user
 * (scoped key `u:<scope>:css-photo`), is never synchronised, and is therefore not restored on another device.
 * The image is already cropped, resized and re-encoded (no EXIF, no location) by `src/domain/photo.ts`.
 */
interface PhotoState {
  /** data URL of the square image (JPEG or WebP, PHOTO_SIZE px), or null */
  photo: string | null;
  updatedAt: string | null;
  setPhoto: (dataUrl: string) => void;
  clear: () => void;
}

export const usePhoto = create<PhotoState>()(
  persist(
    (set) => ({
      photo: null,
      updatedAt: null,
      setPhoto: (photo) => set({ photo, updatedAt: new Date().toISOString() }),
      clear: () => set({ photo: null, updatedAt: new Date().toISOString() }),
    }),
    { name: 'css-photo', storage: createJSONStorage(() => idbStorage), partialize: (s) => ({ photo: s.photo, updatedAt: s.updatedAt }) },
  ),
);
