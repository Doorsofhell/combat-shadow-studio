// Writes android/version.properties from package.json: versionName = "x.y.z",
// versionCode = x*10000 + y*100 + z (always increasing, as Google Play requires).
// 2.3.3: package.json is the ONLY source of the version; this formula is also used by the build
// (public file version.json, tools/build/releaseInfo.ts) and by docs/ETAT.md (src/domain/projectFacts.ts).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

/** versionName and versionCode of a "x.y.z" version (throws on an invalid one) */
export function androidVersion(version) {
  const [x, y, z] = String(version).split('.').map((n) => parseInt(n, 10));
  if (!/^\d+\.\d+\.\d+$/.test(String(version)) || [x, y, z].some((n) => !Number.isInteger(n) || n < 0 || n > 99 && n !== x)) throw new Error(`version invalide : ${version}`);
  const code = x * 10000 + y * 100 + z;
  return { versionName: version, versionCode: code };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  const { version } = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const { versionName, versionCode } = androidVersion(version);
  fs.writeFileSync('android/version.properties', `versionName=${versionName}\nversionCode=${versionCode}\n`);
  console.log(`Android ${versionName} (versionCode ${versionCode})`);
}
