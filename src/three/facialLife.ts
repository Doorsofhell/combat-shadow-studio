import { MathUtils, Object3D, SkinnedMesh } from 'three';

/** Additive, conservative facial animation. Never modifies geometry or rest pose.
 * Models without named facial morph targets remain untouched.
 */
const CHANNELS = {
  blink: ['eyeBlinkLeft', 'eyeBlinkRight', 'blink', 'Blink', 'eyesClosed'],
  focus: ['browDownLeft', 'browDownRight', 'browInnerUp'],
  effort: ['jawOpen', 'mouthPressLeft', 'mouthPressRight', 'mouthFrownLeft', 'mouthFrownRight'],
  smile: ['mouthSmileLeft', 'mouthSmileRight'],
} as const;
type Channel = keyof typeof CHANNELS;
type Target = { mesh: SkinnedMesh; index: number; base: number; channel: Channel; name: string };
const normalize = (name: string) => name.replace(/[^a-z0-9]/gi, '').toLowerCase();
const names = new Map<string, Channel>();
for (const [channel, aliases] of Object.entries(CHANNELS) as [Channel, readonly string[]][])
  for (const alias of aliases) names.set(normalize(alias), channel);

export class FacialLife {
  private targets: Target[] = [];
  private elapsed = 0;
  private nextBlink = 2.3;
  private blinkStart = -10;
  private seed: number;
  private personality: number;
  private blinkDuration = 0.19;

  constructor(root: Object3D, identity = 'coach') {
    this.seed = [...identity].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 19);
    this.personality = this.seed % 3;
    this.nextBlink += this.random() * 2;
    root.traverse((object) => {
      const mesh = object as SkinnedMesh;
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;
      // Only explicitly named facial targets; never animate generic unnamed morphs.
      for (const [name, index] of Object.entries(mesh.morphTargetDictionary)) {
        const channel = names.get(normalize(name));
        if (!channel || index >= mesh.morphTargetInfluences.length) continue;
        this.targets.push({ mesh, index, base: mesh.morphTargetInfluences[index] ?? 0, channel, name: normalize(name) });
      }
    });
  }

  private random() {
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  update(dt: number, activity = 0) {
    this.elapsed += Math.min(Math.max(dt, 0), 0.05);
    if (this.elapsed >= this.nextBlink) {
      this.blinkStart = this.elapsed;
      this.blinkDuration = 0.14 + this.random() * 0.09;
      this.nextBlink = this.elapsed + 2.2 + this.random() * 4.6;
    }
    const blinkPhase = (this.elapsed - this.blinkStart) / this.blinkDuration;
    const blink = blinkPhase >= 0 && blinkPhase <= 1 ? Math.sin(Math.PI * blinkPhase) ** 2 : 0;
    const breath = (Math.sin(this.elapsed * 1.7) + 1) / 2;
    const concentration = (this.personality === 0 ? 0.045 : 0.025) + 0.012 * Math.sin(this.elapsed * 0.47);
    const effort = MathUtils.clamp(activity, 0, 1);
    for (const target of this.targets) {
      const values = target.mesh.morphTargetInfluences!;
      let amount = 0;
      switch (target.channel) {
        case 'blink': amount = blink * 0.85; break;
        case 'focus': amount = concentration + effort * 0.08; break;
        case 'effort': amount = target.name.includes('jawopen') ? 0.012 + breath * 0.025 + effort * 0.08 : effort * 0.09; break;
        case 'smile': amount = (this.personality === 1 ? 0.024 : 0.008) + 0.007 * Math.sin(this.elapsed * 0.35); break;
      }
      // Preserve the original facial expression and keep all contributions subtle.
      values[target.index] = MathUtils.clamp(target.base + amount * (1 - target.base), 0, 1);
    }
  }

  dispose() {
    for (const target of this.targets)
      if (target.mesh.morphTargetInfluences) target.mesh.morphTargetInfluences[target.index] = target.base;
  }

  get supportedTargets() { return this.targets.length; }
}
