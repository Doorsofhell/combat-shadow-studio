# Publication Google Play (depuis la v2.3.1)

Tout ce qu’il faut pour envoyer Combat Shadow Studio sur le Play Store : comment le fichier est fabriqué, ce qui est
contrôlé automatiquement, la fiche, et les réponses aux formulaires de la Play Console. Les étapes que seul le
propriétaire du compte peut faire sont marquées **(Youssef)**.

## 1. Le fichier envoyé : un AAB signé

- Google Play n’accepte que le format **AAB** (Android App Bundle), signé avec la **clé d’importation**.
- Construit par `.github/workflows/android-release.yml` (GitHub Actions, car le SDK Android ne se télécharge pas
  dans l’environnement de développement) à chaque push sur `release/play-store` (ou lancement manuel).
- Produit, dans l’artefact `play-store-signe` du run :
  - `combat-shadow-studio-vX.Y.Z-play.aab` : **le fichier à envoyer à la Play Console** ;
  - `combat-shadow-studio-vX.Y.Z.apk` : le même build en APK signé, pour l’installer directement sur un téléphone ;
  - `SHA256SUMS.txt`, `RAPPORT.md` (contrôles ci-dessous), `apk-cert.txt` (empreinte de la clé).
- Sans les secrets de signature, les fichiers portent `NON-SIGNE` : ils prouvent seulement que tout compile.

### Secrets GitHub de la clé **(Youssef)**

Dépôt › Settings › Secrets and variables › Actions › *New repository secret*, quatre secrets :

| Nom | Valeur |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | le fichier `.jks` encodé en base64 (une seule ligne) |
| `ANDROID_KEYSTORE_PASSWORD` | mot de passe du fichier |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | mot de passe de la clé (identique au précédent pour la clé préparée) |

La clé ne doit jamais être versionnée (`*.jks`, `keystore.properties` sont dans `.gitignore`). Le workflow l’écrit
dans un dossier temporaire du runner et l’efface à la fin. **Garder une copie de sauvegarde de la clé et de son mot
de passe hors du projet** : sans elle, plus aucune mise à jour ne peut être envoyée (sauf demande de
réinitialisation à Google, possible seulement avec Play App Signing).

### Numéro de version

`scripts/android-version.mjs` : `versionName` = version de `package.json`, `versionCode` = x·10000 + y·100 + z
(2.3.1 → 20301). Google refuse un `versionCode` déjà envoyé : chaque envoi demande une nouvelle version.

## 2. Contrôles automatiques (`scripts/android/verify-release.sh`)

Bloquants (le run échoue) : identifiant `fr.combatshadowstudio.app`, `versionCode`/`versionName` attendus,
**SDK cible 36** (Android 16 ; Google exige au moins le niveau de l’année précédente pour les nouvelles
applications et les mises à jour), SDK minimal 24, application non débogable, permissions limitées à `INTERNET` et `VIBRATE`
(+ la permission interne de signature ajoutée par AndroidX), **alignement 16 Ko** (obligatoire pour les applications
qui visent Android 15 et plus), signatures APK (apksigner) et AAB (jarsigner), manifeste de l’AAB lu par bundletool.
Les tests unitaires sont lancés et leur résultat est joint au rapport.

Déjà en place avant la 2.3.1 : sauvegarde cloud désactivée (`allowBackup=false`, `data_extraction_rules.xml`), pas de
débogage de la WebView, aucune bibliothèque native, application entièrement hors ligne (84 Mo de contenu web).

## 3. Fiche du Play Store

Visuels prêts dans `docs/play-store/visuels/` : icône 512×512 (PNG 32 bits), bannière 1024×500, 6 captures de
téléphone 1080×1920 (captures réelles de l’application, coachs Rocketbox MIT).

- **Nom de l’application** (30 car. max) : `Combat Shadow Studio`
- **Description courte** (80 car. max) :
  `Shadow boxing guidé par un coach 3D : boxe, kick, muay-thaï, MMA, BJJ et judo.` (79)
- **Description complète** :

> Entraîne-toi seul, où tu veux, avec un vrai coach en 3D.
>
> Combat Shadow Studio te guide en shadow boxing dans six disciplines : boxe anglaise, kick-boxing, muay-thaï,
> MMA, jiu-jitsu brésilien et judo. Ton coach montre chaque technique en 3D, sous tous les angles, au ralenti
> si tu veux, puis l’enchaîne avec toi pendant la séance.
>
> • Des techniques expliquées pas à pas : position, appuis, trajectoire, erreurs fréquentes.
> • Des séances et des enchaînements adaptés à ton niveau, du débutant à l’expert.
> • Des coachs 3D réalistes, chacun avec son style et sa discipline.
> • Un chrono de rounds et un mode mains libres pour rester concentré.
> • Un coach IA qui répond à tes questions, directement sur ton téléphone.
> • Le suivi de tes progrès : temps actif, séances, techniques travaillées.
> • Une encyclopédie du combat : techniques, équipements, règles et lieux.
>
> Tout fonctionne hors ligne. Aucun compte obligatoire, aucune publicité, aucune donnée envoyée : tes informations
> restent sur ton téléphone.
>
> Conseil de sécurité : échauffe-toi avant chaque séance, entraîne-toi dans un espace dégagé, et demande l’avis
> d’un professionnel de santé en cas de doute.

- **Catégorie** : Santé et remise en forme. **Tags** : boxe, arts martiaux, entraînement.
- **Coordonnées** : adresse e-mail de contact publique `y.benjelloun@gmail.com` (provisoire ; à changer dans
  `src/domain/contact.ts`, `public/confidentialite.html` et la Play Console).
- **Politique de confidentialité** : `https://doorsofhell.github.io/combat-shadow-studio/confidentialite.html`
  (`public/confidentialite.html`, en ligne une fois la branche déployée sur GitHub Pages).

## 4. Formulaires « Contenu de l’application » (Play Console)

| Formulaire | Réponse |
| --- | --- |
| Politique de confidentialité | l’adresse ci-dessus |
| Publicités | Non, l’application ne contient pas de publicité |
| Accès à l’application | Toutes les fonctionnalités sont accessibles sans restriction (aucune connexion) |
| Classification du contenu (IARC) | Catégorie « Autre » (pas un jeu, pas un réseau social). Violence : sports de combat montrés sans adversaire, sans sang ni blessure. Pas de contenu sexuel, de langage grossier, de drogue, de jeu d’argent. Pas d’échange entre utilisateurs, pas de partage de position, pas d’achat numérique. Résultat attendu : tous publics (PEGI 3 ou 7) |
| Public cible | **13 ans et plus** (13-15, 16-17, 18+). Ne pas cocher les moins de 13 ans : cela imposerait le programme Famille |
| Application d’actualités | Non |
| Applications de santé | Cocher « Activité physique et remise en forme » (pas un dispositif médical, aucune donnée de santé collectée) |
| Sécurité des données | Collecte : **aucune**. Partage : **aucun**. Les données (profil, taille, poids, limitations, séances) restent sur l’appareil, ce qui n’est pas une « collecte » au sens de Google. Chiffrement en transit : sans objet. Suppression : « Tout effacer » ou désinstallation. Voir `docs/CONFIDENTIALITE.md` |
| Identifiant publicitaire | Non utilisé |
| Applications gouvernementales / financières | Non |

## 5. Ordre des étapes **(Youssef)**

1. Compte Google Play Console (25 $ une fois) et vérification d’identité.
2. Créer l’application : nom, langue par défaut français (France), application, gratuite.
3. Activer **Play App Signing** (proposé par défaut) : Google garde la clé de l’application, la nôtre sert à
   l’envoi.
4. Remplir la fiche et les formulaires ci-dessus.
5. **Compte personnel créé après le 13 novembre 2023** : Google impose d’abord un **test fermé avec au moins
   12 testeurs inscrits pendant 14 jours d’affilée** avant de pouvoir demander l’accès à la production. Créer une
   piste « Test fermé », y envoyer l’AAB, inviter les testeurs (liste d’e-mails ou groupe Google).
6. Après les 14 jours : « Demander l’accès à la production », puis créer la version de production avec le même AAB
   (ou un plus récent).

## 6. Avant d’envoyer : points à vérifier

- Désinstaller l’ancien APK de test (signé avec une clé de debug) avant d’installer l’APK signé : Android refuse
  d’installer par-dessus une signature différente.
- Tester sur un vrai téléphone : coach 3D, voix, mise en veille, bouton retour, rotation.
- L’écran **Premium** présente une offre qui n’est pas encore en vente (« aucun système d’achat n’est encore
  branché ») : un examinateur Google peut y voir une fonction trompeuse ou non fonctionnelle. Toute vente future
  dans l’application Android devra passer par Google Play Billing.
