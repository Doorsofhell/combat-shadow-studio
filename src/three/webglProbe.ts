/**
 * v0.29: can the page draw in 3D right now? A tiny test canvas asks for a WebGL context and gives it back at
 * once. After graphics resets Chrome answers no for a while, with its reason (« Web page caused context loss
 * and was blocked »): the stage then waits and asks again instead of failing for good. No three.js here.
 */
export interface ProbeResult {
  ok: boolean;
  /** the browser's reason when it refuses */
  reason?: string;
}

export function probeWebgl(): ProbeResult {
  if (typeof document === 'undefined') return { ok: false, reason: 'pas de document' };
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  let reason = '';
  const onError = (e: Event) => {
    reason = (e as WebGLContextEvent).statusMessage || reason;
  };
  c.addEventListener('webglcontextcreationerror', onError);
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  try {
    gl = c.getContext('webgl2') ?? c.getContext('webgl');
  } catch (e) {
    reason = String((e as Error)?.message ?? e);
  }
  c.removeEventListener('webglcontextcreationerror', onError);
  if (!gl) return { ok: false, reason: reason || 'contexte WebGL refusé' };
  const lost = gl.isContextLost();
  // give the context back now rather than when the canvas is collected
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return lost ? { ok: false, reason: 'contexte WebGL perdu dès sa création' } : { ok: true };
}

/** errors thrown while creating or using the graphics context (as opposed to a model or a React error) */
export function isGraphicsError(e: unknown) {
  const m = String((e as Error)?.message ?? e);
  return /WebGL|context|contexte|precision|getShaderPrecisionFormat|GPU/i.test(m);
}
