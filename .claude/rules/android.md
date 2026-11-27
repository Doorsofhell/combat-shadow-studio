---
paths:
  - "android/**"
  - "capacitor.config.ts"
  - "scripts/android/**"
  - "scripts/android-version.mjs"
  - ".github/workflows/android-*.yml"
  - "tools/build/nativeOnly.ts"
---

# Android (Capacitor)

- Gradle est impossible dans le cloud (dl.google.com bloqué) : APK et AAB sont construits par GitHub Actions. Procédure : skill `construire-apk`.
- Chaque envoi au Play Store change la version de `package.json` (le versionCode doit augmenter).
- Une pré-version GitHub ou un envoi au Play Store attend l'accord de Youssef.
- L'écran Premium reste visible sur Android (Youssef, 20/11/2026).
- La construction Android exclut les tenues d'arbitre (`tools/build/nativeOnly.ts`) et tout `_ARCHIVES_HORS_APPLICATION/` (test `archives-hors-build.test.ts`).
