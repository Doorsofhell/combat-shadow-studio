import { useMemo, useState } from 'react';
import type { FighterLook, Paint, Tattoo, TattooZone } from '../../../editor/look';
import { recommendedGear } from '../../../editor/look';
import { BODY_HAIR_RANGE, BODY_RANGES, FACE_RANGES, HAIR_LENGTH_RANGE, MAX_TATTOOS, TATTOO_RANGES } from '../../../editor/normalize';
import { EYE_COLORS, HAIR_COLORS, SKIN_TONES } from '../../../editor/random';
import { TATTOO_DESIGNS, tattooPreview } from '../../../editor/tattoos';
import { DISCIPLINES } from '../../../domain/types';
import { Button, OptionGrid, Sheet, Toggle, toast } from '../../components';
import { IconPlus, IconTrash } from '../../icons';
import { ColorField, Group, PaintEditor, Slider, fmt } from './controls';
import { BEARD_OPTS, BOTTOM_OPTS, FEET_OPTS, HAIR_OPTS, HANDS_OPTS, HEAD_OPTS, SHINS_OPTS, SHOES_OPTS, TOP_OPTS, ZONE_LABEL, ZONE_OPTS } from './options';

export interface PanelProps {
  look: FighterLook;
  onChange: (f: (l: FighterLook) => FighterLook) => void;
}

type BodyKey = keyof FighterLook['body'];

const BODY_SHAPE: {
  k: BodyKey;
  label: string;
  format?: (v: number) => string;
  step?: number;
  hint?: string;
}[] = [
  { k: 'height', label: 'Taille', format: fmt.scale, step: 0.005 },
  { k: 'mass', label: 'Corpulence', hint: 'Sec ← → lourd' },
  { k: 'muscle', label: 'Musculature', format: fmt.pct },
  { k: 'shoulders', label: 'Épaules' },
  { k: 'chest', label: 'Poitrine' },
  { k: 'arms', label: 'Bras' },
  { k: 'legs', label: 'Jambes' },
  { k: 'waist', label: 'Taille (tour de taille)' },
  {
    k: 'legLength',
    label: 'Longueur des jambes',
    format: fmt.scale,
    step: 0.005,
  },
  { k: 'neck', label: 'Cou' },
];
const BODY_DEF: { k: BodyKey; label: string }[] = [
  { k: 'defAbs', label: 'Abdos' },
  { k: 'defArms', label: 'Bras' },
  { k: 'defShoulders', label: 'Épaules' },
  { k: 'defLegs', label: 'Jambes' },
];

export function BodyPanel({ look, onChange }: PanelProps) {
  const set = (k: BodyKey, v: number) => onChange((l) => ({ ...l, body: { ...l.body, [k]: v } }));
  return (
    <>
      <Group title="Silhouette">
        {BODY_SHAPE.map((s) => (
          <Slider key={s.k} id={`body-${s.k}`} label={s.label} value={look.body[s.k]} range={BODY_RANGES[s.k]} step={s.step} format={s.format} hint={s.hint} onChange={(v) => set(s.k, v)} />
        ))}
      </Group>
      <Group title="Définition musculaire">
        {BODY_DEF.map((s) => (
          <Slider key={s.k} id={`body-${s.k}`} label={s.label} value={look.body[s.k]} range={BODY_RANGES[s.k]} format={fmt.pct} onChange={(v) => set(s.k, v)} />
        ))}
      </Group>
    </>
  );
}

const FACE: { k: keyof FighterLook['face']; label: string }[] = [
  { k: 'jaw', label: 'Mâchoire' },
  { k: 'cheeks', label: 'Pommettes' },
  { k: 'brow', label: 'Arcades' },
  { k: 'nose', label: 'Nez' },
];

export function FacePanel({ look, onChange }: PanelProps) {
  return (
    <>
      <Group title="Traits">
        {FACE.map((s) => (
          <Slider key={s.k} id={`face-${s.k}`} label={s.label} value={look.face[s.k]} range={FACE_RANGES[s.k]} onChange={(v) => onChange((l) => ({ ...l, face: { ...l.face, [s.k]: v } }))} />
        ))}
      </Group>
      <Group title="Yeux">
        <ColorField label="Couleur des yeux" value={look.eyes} swatches={EYE_COLORS} onChange={(eyes) => onChange((l) => ({ ...l, eyes }))} testId="eyes-custom" />
      </Group>
    </>
  );
}

export function SkinPanel({ look, onChange }: PanelProps) {
  return (
    <>
      <Group title="Teint">
        <ColorField label="Couleur de peau" value={look.skin} swatches={SKIN_TONES} onChange={(skin) => onChange((l) => ({ ...l, skin }))} testId="skin-custom" />
      </Group>
      <Group title="Pilosité">
        <Slider id="bodyHair" label="Pilosité du corps" value={look.bodyHair} range={BODY_HAIR_RANGE} format={fmt.pct} onChange={(bodyHair) => onChange((l) => ({ ...l, bodyHair }))} />
      </Group>
    </>
  );
}

export function HairPanel({ look, onChange }: PanelProps) {
  return (
    <>
      <Group title="Coupe">
        <OptionGrid label="Coupe de cheveux" options={HAIR_OPTS} value={look.hair.style} onChange={(style) => onChange((l) => ({ ...l, hair: { ...l.hair, style } }))} min={96} testPrefix="hair-" />
        <Slider id="hair-length" label="Longueur" value={look.hair.length} range={HAIR_LENGTH_RANGE} format={fmt.pct} onChange={(length) => onChange((l) => ({ ...l, hair: { ...l.hair, length } }))} />
        <ColorField label="Couleur des cheveux" value={look.hair.color} swatches={HAIR_COLORS} onChange={(color) => onChange((l) => ({ ...l, hair: { ...l.hair, color } }))} testId="hair-custom" />
      </Group>
      <Group title="Barbe">
        <OptionGrid label="Style de barbe" options={BEARD_OPTS} value={look.beard.style} onChange={(style) => onChange((l) => ({ ...l, beard: { ...l.beard, style } }))} min={96} testPrefix="beard-" />
        {look.beard.style !== 'aucune' && (
          <>
            <ColorField label="Couleur de la barbe" value={look.beard.color} swatches={HAIR_COLORS} onChange={(color) => onChange((l) => ({ ...l, beard: { ...l.beard, color } }))} />
            <Button
              variant="ghost"
              onClick={() =>
                onChange((l) => ({
                  ...l,
                  beard: { ...l.beard, color: l.hair.color },
                }))
              }
            >
              Même couleur que les cheveux
            </Button>
          </>
        )}
      </Group>
    </>
  );
}

/* ------------------------------------------------------------------ tattoos */

const INKS = ['#1a1a1a', '#3a3a3a', '#7a1010', '#0f3d8a', '#1f5a2a', '#5a2a7a', '#c8a96b', '#f2f2f2'];
export const DESIGN_IDS = TATTOO_DESIGNS.map((d) => d.id);
const designName = (id: string) => TATTOO_DESIGNS.find((d) => d.id === id)?.name ?? id;

const thumbs = new Map<string, string>();
function thumb(id: string) {
  let t = thumbs.get(id);
  if (t === undefined) {
    try {
      t = tattooPreview(id, 96);
    } catch {
      t = '';
    }
    thumbs.set(id, t);
  }
  return t;
}

function DesignThumb({ id }: { id: string }) {
  const src = thumb(id);
  return <span className="cs-thumb">{src && <img src={src} alt="" width={48} height={48} />}</span>;
}

function DesignPicker({ current, onPick, onClose }: { current?: string; onPick: (id: string) => void; onClose: () => void }) {
  return (
    <Sheet title="Choisis un motif" eyebrow="Tatouage" onClose={onClose}>
      <div className="cs-designs" role="radiogroup" aria-label="Motifs de tatouage">
        {TATTOO_DESIGNS.map((d) => (
          <button key={d.id} type="button" role="radio" aria-checked={d.id === current} className="opt cs-design" onClick={() => onPick(d.id)} data-testid={`design-${d.id}`}>
            <DesignThumb id={d.id} />
            <span>{d.name}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

let tattooSeq = 0;
const newTattooId = () => `t-${Date.now().toString(36)}-${(tattooSeq++).toString(36)}`;

export function TattooPanel({ look, onChange, onZone }: PanelProps & { onZone?: (z: TattooZone) => void }) {
  const [selected, setSelected] = useState<string | null>(look.tattoos[0]?.id ?? null);
  const [picker, setPicker] = useState<null | 'add' | 'change'>(null);
  const sel = look.tattoos.find((t) => t.id === selected) ?? null;
  const full = look.tattoos.length >= MAX_TATTOOS;

  const patch = (id: string, p: Partial<Tattoo>) =>
    onChange((l) => ({
      ...l,
      tattoos: l.tattoos.map((t) => (t.id === id ? { ...t, ...p } : t)),
    }));
  const add = (design: string) => {
    const zone: TattooZone = 'bras-gauche';
    const t: Tattoo = {
      id: newTattooId(),
      design,
      zone,
      u: 0,
      v: 0,
      size: 0.12,
      rotation: 0,
      color: '#1a1a1a',
      intensity: 0.9,
    };
    onChange((l) => (l.tattoos.length >= MAX_TATTOOS ? l : { ...l, tattoos: [...l.tattoos, t] }));
    setSelected(t.id);
    onZone?.(zone);
  };
  const remove = (id: string) => {
    onChange((l) => ({ ...l, tattoos: l.tattoos.filter((t) => t.id !== id) }));
    if (selected === id) setSelected(look.tattoos.find((t) => t.id !== id)?.id ?? null);
    toast('Tatouage retiré');
  };

  return (
    <>
      <Group
        title={`Tatouages (${look.tattoos.length}/${MAX_TATTOOS})`}
        action={
          <Button variant="secondary" icon={<IconPlus />} onClick={() => setPicker('add')} disabled={full} data-testid="tattoo-add">
            Ajouter
          </Button>
        }
      >
        {full && <p className="cs-hint">Huit tatouages au maximum : retires-en un pour en ajouter un autre.</p>}
        {look.tattoos.length === 0 ? (
          <p className="muted small">Aucun tatouage pour l’instant. Ajoute un motif, puis place-le sur le corps.</p>
        ) : (
          <ul className="cs-tattoo-list" aria-label="Tes tatouages">
            {look.tattoos.map((t) => (
              <li key={t.id} className={t.id === selected ? 'on' : ''}>
                <button
                  type="button"
                  className="cs-tattoo-item"
                  aria-pressed={t.id === selected}
                  onClick={() => {
                    setSelected(t.id);
                    onZone?.(t.zone);
                  }}
                  data-testid="tattoo-item"
                >
                  <DesignThumb id={t.design} />
                  <span className="grow">
                    <b>{designName(t.design)}</b>
                    <span className="small muted">{ZONE_LABEL[t.zone]}</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="btn icon ghost"
                  aria-label={`Retirer le tatouage ${designName(t.design)} (${ZONE_LABEL[t.zone]})`}
                  onClick={() => remove(t.id)}
                  data-testid="tattoo-remove"
                >
                  <IconTrash />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Group>

      {sel && (
        <Group
          title={`Réglage : ${designName(sel.design)}`}
          action={
            <Button variant="ghost" onClick={() => setPicker('change')}>
              Changer de motif
            </Button>
          }
        >
          <div className="cs-field">
            <label className="cs-label" htmlFor="cs-tattoo-zone">
              Zone du corps
            </label>
            <select
              id="cs-tattoo-zone"
              className="input"
              value={sel.zone}
              onChange={(e) => {
                const zone = e.target.value as TattooZone;
                patch(sel.id, { zone });
                onZone?.(zone);
              }}
              data-testid="tattoo-zone"
            >
              {ZONE_OPTS.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.label}
                </option>
              ))}
            </select>
          </div>
          <Slider id="tattoo-u" label="Position horizontale" value={sel.u} range={TATTOO_RANGES.u} onChange={(u) => patch(sel.id, { u })} />
          <Slider id="tattoo-v" label="Position verticale" value={sel.v} range={TATTOO_RANGES.v} onChange={(v) => patch(sel.id, { v })} />
          <Slider id="tattoo-size" label="Taille" value={sel.size} range={TATTOO_RANGES.size} step={0.005} format={fmt.cm} onChange={(size) => patch(sel.id, { size })} />
          <Slider id="tattoo-rotation" label="Rotation" value={sel.rotation} range={TATTOO_RANGES.rotation} step={1} format={fmt.deg} onChange={(rotation) => patch(sel.id, { rotation })} />
          <Slider id="tattoo-intensity" label="Intensité de l’encre" value={sel.intensity} range={TATTOO_RANGES.intensity} format={fmt.pct} onChange={(intensity) => patch(sel.id, { intensity })} />
          <ColorField label="Couleur de l’encre" value={sel.color} swatches={INKS} onChange={(color) => patch(sel.id, { color })} testId="tattoo-color" />
          <Button variant="danger" icon={<IconTrash />} onClick={() => remove(sel.id)}>
            Retirer ce tatouage
          </Button>
        </Group>
      )}

      {picker && (
        <DesignPicker
          current={picker === 'change' ? sel?.design : undefined}
          onClose={() => setPicker(null)}
          onPick={(id) => {
            if (picker === 'change' && sel) patch(sel.id, { design: id });
            else add(id);
            setPicker(null);
          }}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ outfit and gear */

type OutfitKey = 'bottom' | 'top' | 'shoes';
type GearKey = 'hands' | 'shins' | 'feet' | 'head';

export function OutfitPanel({ look, onChange }: PanelProps) {
  const o = look.outfit;
  const setO = <K extends keyof FighterLook['outfit']>(k: K, v: FighterLook['outfit'][K]) => onChange((l) => ({ ...l, outfit: { ...l.outfit, [k]: v } }));
  const rows: {
    k: OutfitKey;
    title: string;
    options: typeof BOTTOM_OPTS | typeof TOP_OPTS | typeof SHOES_OPTS;
    none: string;
  }[] = [
    { k: 'bottom', title: 'Bas', options: BOTTOM_OPTS, none: 'aucun' },
    { k: 'top', title: 'Haut', options: TOP_OPTS, none: 'aucun' },
    { k: 'shoes', title: 'Chaussures', options: SHOES_OPTS, none: 'pieds-nus' },
  ];
  return (
    <>
      {rows.map((r) => {
        const paintKey = `${r.k}Paint` as const;
        return (
          <Group key={r.k} title={r.title}>
            <OptionGrid label={r.title} options={r.options as { id: string; label: string }[]} value={o[r.k]} onChange={(v) => setO(r.k, v as never)} min={104} testPrefix={`${r.k}-`} />
            {o[r.k] !== r.none && <PaintEditor label={r.title} paint={o[paintKey]} onChange={(p: Paint) => setO(paintKey, p)} testId={`${r.k}-paint`} />}
          </Group>
        );
      })}
    </>
  );
}

export function GearPanel({ look, onChange }: PanelProps) {
  const g = look.gear;
  const setG = <K extends keyof FighterLook['gear']>(k: K, v: FighterLook['gear'][K]) => onChange((l) => ({ ...l, gear: { ...l.gear, [k]: v } }));
  const rows = useMemo(
    () =>
      [
        { k: 'hands', title: 'Mains', options: HANDS_OPTS },
        { k: 'shins', title: 'Tibias', options: SHINS_OPTS },
        { k: 'feet', title: 'Pieds et chevilles', options: FEET_OPTS },
        { k: 'head', title: 'Casque', options: HEAD_OPTS },
      ] as {
        k: GearKey;
        title: string;
        options: { id: string; label: string }[];
      }[],
    [],
  );
  return (
    <>
      <Group title="Tenue conseillée">
        <p className="muted small">Applique le bas, les chaussures et les protections conseillés pour t’entraîner seul dans chaque discipline. Les couleurs ne changent pas.</p>
        <div className="cs-reco">
          {DISCIPLINES.map((d) => (
            <Button
              key={d.id}
              variant="secondary"
              onClick={() => {
                const r = recommendedGear(d.id);
                onChange((l) => ({
                  ...l,
                  outfit: { ...l.outfit, bottom: r.bottom, shoes: r.shoes },
                  gear: {
                    ...l.gear,
                    hands: r.hands,
                    shins: r.shins,
                    feet: r.feet,
                  },
                }));
                toast(`Tenue conseillée : ${d.name}`);
              }}
              data-testid={`reco-${d.id}`}
            >
              {d.short}
            </Button>
          ))}
        </div>
      </Group>
      {rows.map((r) => {
        const paintKey = `${r.k}Paint` as const;
        return (
          <Group key={r.k} title={r.title}>
            <OptionGrid label={r.title} options={r.options} value={g[r.k]} onChange={(v) => setG(r.k, v as never)} min={104} testPrefix={`${r.k}-`} />
            {g[r.k] !== 'aucun' && (
              <PaintEditor label={r.title} paint={g[paintKey]} onChange={(p) => setG(paintKey, p)} testId={`${r.k}-paint`} colorOnly={r.k === 'hands' && g.hands === 'gants-boxe'} />
            )}
          </Group>
        );
      })}
      <Group title="Protections">
        <div className="panel cs-toggles">
          <Toggle label="Protège-dents" on={g.mouthguard} onChange={(v) => setG('mouthguard', v)} />
          <Toggle label="Plastron" hint="Protection du buste" on={g.bodyProtector} onChange={(v) => setG('bodyProtector', v)} />
        </div>
        {g.mouthguard && <PaintEditor label="Protège-dents" paint={g.mouthPaint} onChange={(p) => setG('mouthPaint', p)} colorOnly />}
        {g.bodyProtector && <PaintEditor label="Plastron" paint={g.bodyPaint} onChange={(p) => setG('bodyPaint', p)} testId="body-paint" />}
      </Group>
    </>
  );
}
