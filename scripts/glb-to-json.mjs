// Wraps each GLB of a build in a JSON file ({ "glb": base64 }) for hosts that do not serve .glb files.
// usage: node scripts/glb-to-json.mjs dist-artifact/models
import fs from 'node:fs';
import path from 'node:path';
const dir = process.argv[2];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.glb'))) {
  const b64 = fs.readFileSync(path.join(dir, f)).toString('base64');
  fs.writeFileSync(path.join(dir, f.replace(/\.glb$/, '.json')), JSON.stringify({ glb: b64 }));
  fs.unlinkSync(path.join(dir, f));
}
