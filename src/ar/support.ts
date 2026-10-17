/// <reference types="webxr" />
import { isNative } from '../platform/native';

export type ArSupport =
  | { ok: true }
  | { ok: false; reason: 'native' | 'insecure' | 'no-webxr' | 'no-ar' | 'error'; message: string };

/**
 * Detects real augmented reality support: WebXR with an "immersive-ar" session (ARCore behind
 * Chrome on Android). A camera feed with the model drawn on top is not AR, so nothing else counts.
 * Nothing here touches the camera: isSessionSupported only asks the browser what it can do.
 */
export async function detectAr(): Promise<ArSupport> {
  if (isNative()) {
    return {
      ok: false,
      reason: 'native',
      message:
        'La réalité augmentée n’est pas encore disponible dans l’application Android : la vue web d’Android ne gère pas WebXR et le module ARCore natif est prévu pour une prochaine version. Le mode classique reste disponible.',
    };
  }
  if (!window.isSecureContext) {
    return { ok: false, reason: 'insecure', message: 'La réalité augmentée demande une page sécurisée (https). Le mode classique reste disponible.' };
  }
  const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
  if (!xr) {
    return {
      ok: false,
      reason: 'no-webxr',
      message:
        'Ce navigateur ne prend pas en charge la réalité augmentée (WebXR). Sur Android, ouvre l’application dans Chrome sur un téléphone compatible ARCore. Le mode classique reste disponible.',
    };
  }
  try {
    if (await xr.isSessionSupported('immersive-ar')) return { ok: true };
  } catch {
    return { ok: false, reason: 'error', message: 'Impossible de vérifier la prise en charge de la réalité augmentée. Le mode classique reste disponible.' };
  }
  return {
    ok: false,
    reason: 'no-ar',
    message:
      'Cet appareil ou ce navigateur ne propose pas la réalité augmentée avec suivi du sol. Il faut Chrome sur Android avec les « Services Google Play pour la RA » (ARCore). Le mode classique reste disponible.',
  };
}
