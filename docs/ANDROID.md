# Application Android (Capacitor)

L’APK et l’AAB définitifs ne seront produits qu’après validation explicite de la Web App. Ce document décrit une
compilation reproductible ; rien n’a encore été compilé pour publication.

## Choix technique

- **Capacitor 8** : `dist/` est embarqué dans l’application, qui fonctionne entièrement hors ligne (coach 3D compris).
  Identifiant : `fr.combatshadowstudio.app`. minSdk 24 (Android 7.0), compileSdk et targetSdk 36.
- Plugins : keep-awake (écran allumé pendant la séance), text-to-speech (voix du système Android), filesystem et share
  (export des données), app (bouton retour).
- La Trusted Web Activity (Bubblewrap) reste possible mais dépend d’un hébergement en ligne ; elle n’est pas retenue.

## Prérequis

- JDK 21, Android SDK (plateforme 36, build-tools 36), Node 22.
- `ANDROID_HOME` pointant vers le SDK (ou `android/local.properties` avec `sdk.dir=...`, jamais versionné).

## Numéro de version

`scripts/android-version.mjs` lit `version` dans `package.json` et écrit `android/version.properties` :
`versionName = x.y.z`, `versionCode = x*10000 + y*100 + z` (0.1.0 → 100). Il est lancé par `npm run build:android`.
Pour une nouvelle version : modifier `version` dans `package.json`, puis reconstruire.

## Commandes

| Commande | Résultat |
| --- | --- |
| `npm run build:android` | build web (`CAP_BUILD=1`), numéro de version, `cap sync android` |
| `npm run android:apk-test` | APK de test signé avec la clé de debug (`android/app/build/outputs/apk/debug/`) |
| `npm run android:aab` | AAB de publication (`android/app/build/outputs/bundle/release/`), **après validation seulement** |
| `npm run android:open` | ouvre le projet dans Android Studio |

## Signature de publication

La clé ne doit jamais être versionnée ni envoyée (déjà exclue par `android/.gitignore`).

```sh
keytool -genkeypair -v -keystore combat-shadow-upload.jks -alias upload \
  -keyalg RSA -keysize 4096 -validity 10000
```

Créer `android/keystore.properties` :

```properties
storeFile=../combat-shadow-upload.jks
storePassword=...
keyAlias=upload
keyPassword=...
```

Sans ce fichier, la variante release est produite non signée. Recommandé : activer la signature d’application par
Google Play (Play App Signing) et garder cette clé comme clé d’importation, sauvegardée hors du projet.

## Confidentialité et sécurité déjà configurées

- `allowBackup=false` et `data_extraction_rules.xml` : aucune donnée copiée dans la sauvegarde cloud ni lors d’un
  transfert d’appareil.
- Seule permission : `INTERNET` (accordée à l’installation, sans demande). Aucun accès caméra, micro, localisation.
- Quand la réalité augmentée native (ARCore) ou la reconnaissance vocale hors ligne seront ajoutées, les permissions
  `CAMERA` et `RECORD_AUDIO` seront demandées au moment de l’usage seulement (voir `AR.md` et `COACH_IA.md`).

## Google Play

- Compte développeur : 25 $ une seule fois.
- Fiche « Sécurité des données » : réponses préparées dans `CONFIDENTIALITE.md`.
- Politique de confidentialité : à héberger à une adresse publique avant publication (adresse e-mail de contact à compléter).
- Tests à faire sur un vrai téléphone avant toute publication : fluidité du coach 3D, voix française, mise en veille,
  bouton retour, rotation, tailles de texte système.

## Non vérifié

Aucun APK n’a été installé sur un appareil réel à ce jour.
