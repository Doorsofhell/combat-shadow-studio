---
name: construire-apk
description: Construire l'APK de test ou l'AAB signé Play Store de Combat Shadow Studio par GitHub Actions (Gradle est impossible dans le cloud). À utiliser quand Youssef demande un APK, un AAB ou un envoi au Play Store.
---

# Construire un APK ou un AAB

Gradle ne fonctionne pas dans le cloud (dl.google.com est bloqué). Tout passe par GitHub Actions. **Demander l'accord de Youssef avant de créer une pré-version ou une version.**

## APK de test (signé debug)
1. Pousser le commit voulu sur la branche `build/apk` (ou lancer `android-apk.yml` par `workflow_dispatch`).
2. Le workflow crée une pré-version GitHub `vX.Y.Z` avec l'APK.
3. Donner à Youssef le lien de la pré-version. Les hôtes d'artefacts et de blobs sont bloqués depuis le conteneur, donc on ne télécharge pas l'APK ici.

## Version Play Store (AAB et APK signés)
1. Augmenter la version de `package.json` (le versionCode doit croître), puis lancer `npm run docs:sync`.
2. Lancer `android-release.yml` (push sur `release/play-store` ou `workflow_dispatch`). La signature lit les secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` et `ANDROID_KEY_PASSWORD`. Sans eux, les fichiers sont marqués NON-SIGNE.
3. `scripts/android/verify-release.sh` contrôle le résultat. Vérifier l'empreinte du certificat dans le résumé de l'exécution.
4. Donner le lien de l'exécution. L'artefact expire après 30 jours.
5. Ne jamais générer une seconde clé d'importation : la clé existe (copie privée dans les fichiers du projet, `play-store/cle-importation-PRIVEE/`). Détails : `docs/PLAY_STORE.md`.
