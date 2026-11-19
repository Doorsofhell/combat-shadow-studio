import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import pkg from '../../package.json';

/**
 * v2.3.1 (Youssef 2026-11-19, « APK final … tous les critères pour une publication dans le Play Store ») : ce que la
 * configuration Android doit garder pour rester publiable. Les contrôles sur le fichier compilé sont dans
 * scripts/android/verify-release.sh (GitHub Actions) ; ceux-ci gardent les sources.
 */
const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), 'utf8');

describe('conformité Google Play (sources Android)', () => {
  const manifest = read('android/app/src/main/AndroidManifest.xml');
  const vars = read('android/variables.gradle');

  test('SDK cible et de compilation 36, SDK minimal 24', () => {
    expect(vars).toMatch(/targetSdkVersion = 36/);
    expect(vars).toMatch(/compileSdkVersion = 36/);
    expect(vars).toMatch(/minSdkVersion = 24/);
  });

  test('seules les permissions INTERNET et VIBRATE sont déclarées', () => {
    const perms = [...manifest.matchAll(/<uses-permission[^>]*android:name="([^"]+)"/g)].map((m) => m[1]).sort();
    expect(perms).toEqual(['android.permission.INTERNET', 'android.permission.VIBRATE']);
  });

  test('sauvegarde cloud désactivée et pas de débogage forcé', () => {
    expect(manifest).toMatch(/android:allowBackup="false"/);
    expect(manifest).toMatch(/android:dataExtractionRules="@xml\/data_extraction_rules"/);
    expect(manifest).not.toMatch(/android:debuggable="true"/);
    expect(read('capacitor.config.ts')).toMatch(/webContentsDebuggingEnabled: false/);
  });

  test('la signature de publication lit keystore.properties, jamais une clé versionnée', () => {
    expect(read('android/app/build.gradle')).toMatch(/keystore\.properties/);
    const ignore = read('.gitignore');
    for (const p of ['*.jks', '*.keystore', 'keystore.properties']) expect(ignore).toContain(p);
  });

  test('versionCode croissant tiré de package.json (x*10000 + y*100 + z)', () => {
    const [x, y, z] = pkg.version.split('.').map(Number);
    expect(x * 10000 + y * 100 + z).toBeGreaterThanOrEqual(20301);
    expect(read('scripts/android-version.mjs')).toMatch(/x \* 10000 \+ y \* 100 \+ z/);
  });

  test('politique de confidentialité publique présente, autonome et cohérente avec les permissions', () => {
    const html = read('public/confidentialite.html');
    expect(html).toMatch(/<title>Politique de confidentialité/);
    expect(html).not.toMatch(/<script/i);
    expect(html).toContain('INTERNET');
    expect(html).toContain('VIBRATE');
    expect(html).toMatch(/data-contact/);
  });

  test('le workflow de publication produit un AAB et passe les contrôles', () => {
    const wf = read('.github/workflows/android-release.yml');
    expect(wf).toMatch(/bundleRelease/);
    expect(wf).toMatch(/verify-release\.sh/);
    expect(wf).toMatch(/secrets\.ANDROID_KEYSTORE_BASE64/);
  });
});
