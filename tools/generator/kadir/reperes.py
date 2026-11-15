"""Kadir 1.46 — points de repère (pixels) entre les rendus de Kadir et les planches de Youssef, relevés à la main sur
des grilles. Vues (rendu.py) :
  PROFIL : az 270, el 0, centre (0, -0.04, 1.66), demi-largeur 0.16, 765 px  <-> planche 4 (765 x 1024)
  DESSUS : az 0, el 62, centre (0, -0.04, 1.72), demi-largeur 0.15, 765 px   <-> planche 3 (765 x 1024)
  FACE   : az 0, el 0, centre (0, -0.05, 1.65), demi-largeur 0.12, 540 px    <-> planche 5, première tête (1024 x 572)"""
VUE_PROFIL = dict(az=270, el=0, center=(0, -0.04, 1.66), half=0.16, size=765)
VUE_PROFIL_D = dict(az=90, el=0, center=(0, -0.04, 1.66), half=0.16, size=765)
VUE_DESSUS = dict(az=0, el=62, center=(0, -0.04, 1.72), half=0.15, size=765)
VUE_FACE = dict(az=0, el=0, center=(0, -0.05, 1.65), half=0.12, size=540)
PROFIL = [  # (Kadir), (planche 4)
    ((120, 418), (95, 455)),    # pointe du nez
    ((172, 435), (170, 470)),   # aile du nez
    ((196, 306), (152, 348)),   # racine du nez
    ((176, 266), (140, 302)),   # arcade
    ((228, 322), (225, 362)),   # coin de l'oeil
    ((160, 483), (130, 520)),   # lèvre supérieure
    ((195, 495), (175, 545)),   # coin de la bouche
    ((162, 510), (135, 555)),   # lèvre inférieure
    ((165, 575), (145, 612)),   # menton
    ((205, 615), (178, 672)),   # dessous du menton
    ((290, 600), (320, 655)),   # bord de la mâchoire
    ((410, 300), (478, 335)),   # haut de l'oreille
    ((440, 340), (510, 385)),   # bord arrière de l'oreille
    ((380, 455), (440, 500)),   # lobe
    ((350, 375), (405, 430)),   # tragus
    ((300, 700), (300, 770)),   # gorge
    ((430, 45), (385, 62)),     # sommet du crâne
    ((675, 300), (645, 280)),   # arrière du crâne
    ((600, 560), (590, 560)),   # nuque
    ((230, 110), (190, 150)),   # front, haut
    ((560, 120), (560, 120)),   # crâne, arrière haut
]
DESSUS = [  # (Kadir), (planche 3)
    ((385, 98), (380, 58)),     # sommet (bord)
    ((172, 300), (125, 330)),   # côté gauche de l'image
    ((595, 300), (640, 340)),   # côté droit
    ((160, 330), (108, 395)),   # oreille gauche (haut)
    ((612, 330), (660, 395)),   # oreille droite (haut)
    ((290, 562), (290, 636)),   # sourcil gauche
    ((480, 562), (495, 630)),   # sourcil droit
    ((290, 582), (295, 672)),   # oeil gauche
    ((480, 582), (482, 668)),   # oeil droit
    ((385, 600), (388, 690)),   # entre les yeux
    ((380, 700), (395, 790)),   # pointe du nez
    ((385, 718), (395, 840)),   # bouche
    ((385, 760), (395, 885)),   # menton
    ((245, 640), (212, 700)),   # joue gauche (bord)
    ((520, 640), (562, 690)),   # joue droite (bord)
    ((290, 725), (285, 840)),   # mâchoire gauche
    ((480, 725), (520, 830)),   # mâchoire droite
    ((385, 300), (380, 300)),   # milieu du crâne
]
FACE = [  # (Kadir), (planche 5)
    ((190, 187), (84.5, 156.3)), ((345, 187), (123, 155.8)),     # yeux
    ((190, 150), (83.8, 150)), ((345, 150), (125, 149.5)),        # sourcils
    ((268, 290), (103.8, 183.8)),                                 # dessous du nez
    ((268, 352), (104.5, 197.5)), ((215, 352), (90.5, 197.5)), ((322, 352), (118, 197)),  # bouche
    ((268, 470), (102.5, 236)),                                   # menton (bas)
    ((100, 170), (68.8, 157.5)), ((440, 170), (145, 152.5)),      # tempes
    ((68, 200), (51, 165)), ((468, 200), (156, 165)),             # oreilles
    ((120, 350), (68.8, 200)), ((420, 350), (140, 200)),          # mâchoire
    ((165, 440), (80, 220)), ((370, 440), (132.5, 220)),          # bas de la mâchoire
    ((268, 8), (102.5, 82.5)),                                    # sommet
]
VUE_DOS = dict(az=180, el=0, center=(0, 0.0, 1.67), half=0.15, size=540)
DOS = [  # (Kadir), (planche 5, quatrième tête)
    ((270, 32), (520, 83.8)), ((120, 180), (472.5, 132.5)), ((420, 180), (570, 132.5)),
    ((110, 230), (470, 155)), ((430, 230), (575, 155)), ((130, 330), (477.5, 190)), ((410, 330), (566, 190)),
    ((270, 415), (522.5, 200)), ((180, 370), (490, 195)), ((360, 370), (555, 195)),
    ((160, 470), (486, 220)), ((380, 470), (555, 220)), ((270, 200), (521, 140)),
]
