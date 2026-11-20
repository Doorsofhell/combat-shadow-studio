"""Anatomical relief for the coaches: a height map of the furrows between muscles, evaluated on the baked
position map (Blender rest pose, metres; +X = left side, -Y = front, +Z = up).

Every furrow is placed from the MakeHuman joints and body measurements (nipples, pelvis, knees...), so it
follows the generated body whatever its proportions. The height map is baked into a tangent-space normal
map by build.py (Bump node -> NORMAL bake) and also darkens the skin a little in the furrows.

Returns H in [-1, 0]: 0 = flat skin, -1 = deepest furrow.
"""
import numpy as np


def _g(d, w):
    return np.exp(-((d / w) ** 2))


def _smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def _seg(px, pz, ax, az, bx, bz):
    """distance from (px, pz) to the segment a-b in a 2D plane, and the position t along it"""
    vx, vz = bx - ax, bz - az
    t = np.clip(((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz), 0, 1)
    return np.hypot(px - (ax + t * vx), pz - (az + t * vz)), t


def _limb(P, a, b, front=np.array([0.0, -1.0, 0.0])):
    """coordinates of each texel around the limb a->b: t along the bone (0..1), radial distance, angle
    (0 = front, +90 = lateral/outer side, 180 = back), for the left limb; X is mirrored for the right one"""
    Pm = P.copy()
    Pm[..., 0] = np.abs(Pm[..., 0])
    ax = b - a
    L = np.linalg.norm(ax)
    ax = ax / L
    f = front - ax * np.dot(front, ax)
    f /= np.linalg.norm(f)
    s = np.cross(ax, f)
    if s[0] < 0:  # outer side = +X for the left limb
        s = -s
    v = Pm - a
    t = (v @ ax) / L
    r = v - (v @ ax)[..., None] * ax
    rad = np.linalg.norm(r, axis=-1)
    ang = np.degrees(np.arctan2(r @ s, r @ f))
    return t, rad, ang


def _angd(a, b):
    return np.abs((a - b + 180) % 360 - 180)


def anatomy_height(P, NRM, J, male, K):
    """J: landmarks (numpy, left side for limbs): shoulder, elbow, wrist, hip, knee, ankle, neck, pelvis,
    nip_z, nip_x, sh_x"""
    X, Y, Z = P[..., 0], P[..., 1], P[..., 2]
    AX = np.abs(X)
    NY = NRM[..., 1]
    front = _smooth(-0.1, -0.45, NY)  # facing forward
    back = _smooth(0.1, 0.45, NY)
    on = np.linalg.norm(P, axis=-1) > 1e-5
    H = np.zeros(X.shape, np.float32)
    amp = 1.0 if male else 0.62

    def add(depth, mask):
        nonlocal H
        H = np.minimum(H, -depth * amp * mask)

    zS, zP, zNeck = J["nip_z"], J["pelvis"][2], J["neck"][2]
    sh_x = J["sh_x"]
    torso = (AX < sh_x * 1.02) & (Z > zP - 0.12 * K) & (Z < zNeck)
    # rectus abdominis: from below the pectorals to the pubis; navel about a third of the way up
    zT = zS - 0.055 * K
    zN = zP + 0.3 * (zS - zP)
    wR = 0.05 * K + (Z - (zP - 0.05 * K)) / (zT - zP + 0.05 * K) * 0.032 * K  # rectus half width
    in_abs = (Z < zT + 0.01 * K) & (Z > zP - 0.06 * K)
    w = 0.0055 * K
    # linea alba (deeper above the navel) and sternum line between the pectorals
    alba = _g(AX, w * (1.2 if male else 1.0)) * ((Z > zP - 0.03 * K) & (Z < zS + 0.12 * K))
    alba *= np.where(Z > zN, 1.0, 0.55)
    add(0.9, alba * front * torso)
    # three tendinous intersections ("six pack"), rising a little toward the sides
    if True:
        for k, frac in enumerate((0.0, 0.42, 0.78)):
            zi = zT - (zT - zN) * frac
            curve = zi + 0.35 * AX * (AX / (0.08 * K))
            band = _g(Z - curve, w) * _smooth(0.0, 0.006 * K, AX) * (AX < wR) * in_abs
            add(0.8 if male else 0.45, band * front * torso)
    # linea semilunaris (outer edge of the rectus)
    add(0.7, _g(AX - wR, w * 1.3) * in_abs * front * torso)
    # lower border of the pectorals: from the sternum, curving up to the armpit
    if male:
        zpec = zS - 0.045 * K + 0.11 * K * (AX / sh_x) ** 2.2
        pec = _g(Z - zpec, 0.009 * K) * (AX < sh_x * 0.95) * (AX > 0.004 * K)
        add(1.0, pec * front * torso)
        # shadow under the pectorals, softer and below the line
        add(0.35, _g(Z - (zpec - 0.016 * K), 0.014 * K) * (AX < sh_x * 0.9) * front * torso)
    else:
        zpec = zS - 0.07 * K + 0.12 * K * (AX / sh_x) ** 2.2
        add(0.5, _g(Z - zpec, 0.01 * K) * (AX < sh_x * 0.9) * (AX > 0.03 * K) * front * torso)
    # iliac furrows (the "V" toward the groin)
    d, t = _seg(AX, Z, 0.125 * K, zN - 0.01 * K, 0.04 * K, zP - 0.085 * K)
    add(0.9, _g(d, 0.008 * K) * _smooth(-0.6, -0.1, NY + 0.0) * (Z > zP - 0.1 * K) * torso)
    # serratus: three short slanted furrows on the ribs under the armpit
    side = _smooth(0.35, 0.8, np.abs(NRM[..., 0])) * (NY < 0.25)
    for i in range(3):
        z0 = zS - 0.015 * K - i * 0.033 * K
        d, _ = _seg(Y, Z, 0.02 * K, z0 + 0.02 * K, -0.045 * K, z0 - 0.01 * K)
        add(0.6 if male else 0.3, _g(d, 0.006 * K) * side * (AX > sh_x * 0.6) * torso)
    # back: spine furrow between the erectors, erector edges in the lower back
    add(0.9, _g(AX, 0.007 * K) * back * ((Z > zP + 0.02 * K) & (Z < zNeck - 0.04 * K)))
    add(0.5, _g(AX - 0.045 * K, 0.008 * K) * back * ((Z > zP + 0.02 * K) & (Z < zN + 0.12 * K)))
    # shoulder blades: lower inner border
    sc = _seg(AX, Z, 0.05 * K, zS + 0.09 * K, 0.11 * K, zS - 0.02 * K)[0]
    add(0.55, _g(sc, 0.009 * K) * back)

    # arms (left landmarks, mirrored)
    t, rad, ang = _limb(P, J["shoulder"], J["elbow"])
    arm = (t > -0.15) & (t < 1.02) & (rad < 0.09 * K) & (AX > sh_x * 0.75)
    # deltoid lower border: a V pointing down on the outer side
    dz = t - (0.42 + 0.0028 * _angd(ang, 90))
    add(0.8, _g(dz, 0.05) * (_angd(ang, 90) < 80) * arm)
    # biceps / triceps separation on both sides of the arm
    for a0 in (90, -90):
        add(0.7, _g(_angd(ang, a0), 12) * (t > 0.42) * (t < 0.95) * arm)
    # anterior border of the deltoid, toward the pectoral
    add(0.6, _g(_angd(ang, 25), 10) * (t > -0.1) * (t < 0.4) * arm)
    t2, rad2, ang2 = _limb(P, J["elbow"], J["wrist"])
    fore = (t2 > 0.02) & (t2 < 0.7) & (rad2 < 0.07 * K) & (AX > sh_x * 0.75)
    add(0.5, _g(_angd(ang2, 60), 14) * fore)  # brachioradialis / extensors

    # legs
    t, rad, ang = _limb(P, J["hip"], J["knee"])
    thigh = (t > 0.05) & (t < 1.0) & (rad < 0.13 * K) & (Z < zP + 0.02 * K)
    add(0.75, _g(_angd(ang, 32), 9) * (t > 0.2) * (t < 0.85) * thigh)  # rectus femoris / vastus lateralis
    add(0.6, _g(_angd(ang, -28), 9) * (t > 0.25) * (t < 0.75) * thigh)  # sartorius side
    add(0.55, _g(_angd(ang, 95), 10) * (t > 0.3) * (t < 0.95) * thigh)  # iliotibial band
    # vastus medialis "teardrop" above the inner knee
    # only its lower arc, against the knee: a full ring reads as a scar
    tear = _g(np.hypot((t - 0.84) / 0.07, _angd(ang, -40) / 30) - 1.0, 0.25) * _smooth(0.84, 0.88, t)
    add(0.45, tear * thigh)
    t, rad, ang = _limb(P, J["knee"], J["ankle"])
    shin = (t > 0.03) & (t < 0.9) & (rad < 0.09 * K)
    add(0.7, _g(_angd(ang, 180), 10) * (t > 0.08) * (t < 0.45) * shin)  # split of the calf heads
    add(0.5, _g(_angd(ang, 150), 9) * (t > 0.1) * (t < 0.55) * shin)  # gastrocnemius / soleus
    add(0.25, _g(_angd(ang, 15), 8) * _smooth(0.1, 0.25, t) * (1 - _smooth(0.6, 0.85, t)) * shin)  # tibia edge, faded at both ends

    return np.where(on, H, 0.0).astype(np.float32)
