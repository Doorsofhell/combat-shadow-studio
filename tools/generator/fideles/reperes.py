"""Repères du visage (MediaPipe Face Landmarker, 478 points) sur une image : rendu de face du modèle ou image de
référence. Outil de fabrication seulement (le modèle .task, Apache 2.0, n'est pas livré avec l'application).
  python3 reperes.py image.png modele.task sortie.npy [x0,y0,x1,y1]"""
import sys, numpy as np
import mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
from PIL import Image


def detect(img, task):
    a = np.ascontiguousarray(np.asarray(img.convert('RGB')))
    det = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=task), num_faces=1, min_face_detection_confidence=0.2))
    r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=a))
    if not r.face_landmarks:
        return None
    h, w = a.shape[:2]
    return np.array([[p.x * w, p.y * h, p.z * w] for p in r.face_landmarks[0]])


if __name__ == '__main__':
    src, task, out = sys.argv[1:4]
    im = Image.open(src)
    off = (0, 0)
    if len(sys.argv) > 4:
        x0, y0, x1, y1 = map(int, sys.argv[4].split(','))
        im = im.crop((x0, y0, x1, y1)); off = (x0, y0)
    L = detect(im, task)
    print('repères', None if L is None else L.shape)
    if L is not None:
        L[:, 0] += off[0]; L[:, 1] += off[1]
        np.save(out, L)
