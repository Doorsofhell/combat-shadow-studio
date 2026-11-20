"""Kanya 1.48 — points de repère (pixels) entre les rendus du modèle (copie d'Inaya, chignon bas effacé, forme.py) et
la planche 2 de Youssef (planche2-tete-7vues.jpg, 1024 x 572), relevés à la main sur des grilles.
Vues (tools/generator/kadir/rendu.py, orthographiques) :
  FACE    : az 0,   centre (0, -0.05, 1.62), demi-largeur 0.13, 520 px  <-> première tête (face)
  PROFIL  : az 90,  centre (0, 0, 1.62),     demi-largeur 0.16, 600 px  <-> troisième tête (nez vers la droite)
  DOS     : az 180, centre (0, 0, 1.63),     demi-largeur 0.15, 600 px  <-> quatrième tête (dos, tatouage de nuque)"""
VUE_FACE = dict(az=0, el=0, center=(0, -0.05, 1.62), half=0.13, size=520)
VUE_PROFIL = dict(az=90, el=0, center=(0, 0.0, 1.62), half=0.16, size=600)
VUE_PROFIL_G = dict(az=270, el=0, center=(0, 0.0, 1.62), half=0.16, size=600)
VUE_DOS = dict(az=180, el=0, center=(0, 0.0, 1.63), half=0.15, size=600)
BOX_FACE = (8, 40, 196, 300)
BOX_PROFIL = (300, 40, 470, 300)
BOX_DOS = (432, 40, 612, 300)
FACE = [
    ((197, 275), (75, 146)), ((322, 275), (125, 146)),          # yeux
    ((195, 240), (73, 133)), ((325, 240), (127, 133)),          # sourcils
    ((260, 352), (100, 176.7)),                                 # dessous du nez
    ((260, 405), (100, 195)), ((212, 405), (81, 195.5)), ((306, 405), (119, 195.5)),  # bouche
    ((260, 492), (100, 226.7)),                                 # menton
    ((150, 405), (60, 195)), ((370, 405), (144, 195)),          # mâchoire à hauteur de bouche
    ((185, 460), (71.7, 216.7)), ((335, 460), (130, 216.7)),    # bas de la mâchoire
    ((98, 250), (42, 138)), ((422, 250), (158, 138)),           # tempes (bord des cheveux)
    ((95, 320), (45, 172)), ((425, 320), (153, 172)),           # oreilles
    ((260, 118), (100, 95)),                                    # implantation des cheveux (un peu plus bas que chez Inaya)
    ((260, 32), (100, 52)),                                     # sommet
]
PROFIL = [
    ((437, 385), (450, 173.3)),   # pointe du nez
    ((400, 300), (436.7, 143.3)), # racine du nez
    ((378, 318), (431.7, 148.3)), # oeil
    ((398, 282), (433.3, 135)),   # arcade
    ((406, 425), (441.7, 191.7)), # lèvre supérieure
    ((390, 437), (435, 196.7)),   # coin de la bouche
    ((403, 442), (440, 200)),     # lèvre inférieure
    ((398, 490), (436.7, 215)),   # menton
    ((365, 512), (426.7, 220)),   # dessous du menton
    ((300, 465), (400, 206.7)),   # angle de la mâchoire
    ((205, 305), (370, 143.3)),   # haut de l'oreille
    ((183, 345), (364, 160)),     # bord arrière de l'oreille
    ((228, 395), (378.3, 178.3)), # lobe
    ((238, 352), (381.7, 163.3)), # tragus
    ((330, 560), (420, 236.7)),   # gorge
    ((387, 212), (426.7, 100)),   # implantation (front, un peu plus bas que chez Inaya)
    ((230, 95), (375, 72)),       # sommet du crâne
    ((10, 250), (318, 125)),      # arrière du crâne
    ((60, 370), (325, 165)),      # arrière, milieu
    ((100, 455), (337, 196)),     # nuque
]
DOS = [
    ((300, 110), (522, 85)),      # haut du crâne (sous le chignon)
    ((148, 250), (472.7, 125)), ((452, 250), (576.7, 125)),   # côtés
    ((148, 370), (481, 172)), ((452, 370), (563, 172)),       # oreilles
    ((300, 250), (522, 123)),     # milieu
    ((300, 480), (521.7, 200)),   # implantation de la nuque
    ((200, 570), (497, 232)), ((400, 570), (553, 232)),       # côtés du cou
]
