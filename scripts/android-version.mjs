// Writes android/version.properties from package.json: versionName = "x.y.z",
// versionCode = x*10000 + y*100 + z (always increasing, as Google Play requires).
import fs from 'node:fs';
const { version } = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const [x, y, z] = version.split('.').map((n) => parseInt(n, 10));
if ([x, y, z].some((n) => !Number.isInteger(n) || n < 0 || n > 99 && n !== x)) throw new Error(`version invalide : ${version}`);
const code = x * 10000 + y * 100 + z;
fs.writeFileSync('android/version.properties', `versionName=${version}\nversionCode=${code}\n`);
console.log(`Android ${version} (versionCode ${code})`);
