import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Crop, DEFAULT_CROP, decodePhoto, photoProblem, renderPhoto } from '../../../domain/photo';
import { usePhoto } from '../../../store/photo';
import { useProfile } from '../../../store/profile';
import { Sheet, toast } from '../../components';
import { AppIcon } from '../../icons';

/**
 * v0.37 « Photo de profil »: take a picture or pick one from the gallery, frame it (zoom and position), preview,
 * save on this device or delete. Nothing is uploaded (see src/store/photo.ts).
 */
export function PhotoSheet({ onClose }: { onClose: () => void }) {
  const current = usePhoto((s) => s.photo);
  const setPhoto = usePhoto((s) => s.setPhoto);
  const clear = usePhoto((s) => s.clear);
  const update = useProfile((s) => s.update);
  const avatar = useProfile((s) => s.profile.avatar);
  const [img, setImg] = useState<ImageBitmap | null>(null);
  const [crop, setCrop] = useState<Crop>(DEFAULT_CROP);
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!img) return setPreview(null);
    try {
      setPreview(renderPhoto(img, crop, 160));
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [img, crop]);

  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setErr(null);
    const pb = photoProblem(f);
    if (pb) return setErr(pb);
    try {
      setImg(await decodePhoto(f));
      setCrop(DEFAULT_CROP);
    } catch (x) {
      setErr((x as Error).message);
    }
  };

  const save = () => {
    if (!img) return;
    try {
      setPhoto(renderPhoto(img, crop));
      update({ avatar: 'photo' });
      toast('Photo enregistrée sur cet appareil.');
      onClose();
    } catch (x) {
      setErr((x as Error).message);
    }
  };

  const remove = () => {
    clear();
    if (avatar === 'photo') update({ avatar: 'fighter' });
    toast('Photo supprimée.');
    onClose();
  };

  const shown = preview ?? current;
  return (
    <Sheet title="Photo de profil" onClose={onClose} center>
      <div className="photo-preview" data-testid="photo-preview">
        {shown ? <img src={shown} alt="Aperçu de ta photo de profil" /> : <AppIcon id="profile" size={40} />}
      </div>
      {img && (
        <div className="photo-crop" role="group" aria-label="Cadrage">
          <label className="small">
            Zoom
            <input type="range" min={1} max={3} step={0.05} value={crop.zoom} onChange={(e) => setCrop({ ...crop, zoom: Number(e.target.value) })} data-testid="photo-zoom" />
          </label>
          <label className="small">
            Gauche / droite
            <input type="range" min={-1} max={1} step={0.05} value={crop.x} onChange={(e) => setCrop({ ...crop, x: Number(e.target.value) })} />
          </label>
          <label className="small">
            Haut / bas
            <input type="range" min={-1} max={1} step={0.05} value={crop.y} onChange={(e) => setCrop({ ...crop, y: Number(e.target.value) })} />
          </label>
        </div>
      )}
      <input ref={gallery} type="file" accept="image/*" hidden onChange={pick} data-testid="photo-file" />
      <input ref={camera} type="file" accept="image/*" capture="user" hidden onChange={pick} />
      <div className="row nowrap" style={{ gap: 8 }}>
        <button type="button" className="btn secondary" style={{ flex: 1 }} onClick={() => camera.current?.click()}>
          <AppIcon id="camera" size={18} /> Prendre une photo
        </button>
        <button type="button" className="btn secondary" style={{ flex: 1 }} onClick={() => gallery.current?.click()} data-testid="photo-gallery">
          <AppIcon id="upload" size={18} /> Galerie
        </button>
      </div>
      <p className="small muted">La photo est recadrée, réduite et enregistrée seulement sur cet appareil, sans sa localisation. Elle n’est pas envoyée en ligne, donc elle n’apparaît pas sur tes autres appareils.</p>
      {err && (
        <div className="note err" role="alert">
          {err}
        </div>
      )}
      <div className="row nowrap" style={{ gap: 8 }}>
        {current && !img ? (
          <button type="button" className="btn danger" style={{ flex: 1 }} onClick={remove} data-testid="photo-delete">
            <AppIcon id="delete" size={18} /> Supprimer la photo
          </button>
        ) : (
          <button type="button" className="btn secondary" style={{ flex: 1 }} onClick={onClose}>
            Annuler
          </button>
        )}
        <button type="button" className="btn primary" style={{ flex: 1 }} disabled={!img} onClick={save} data-testid="photo-save">
          Enregistrer
        </button>
      </div>
    </Sheet>
  );
}
