/** bytes of the built JS attributed to each package, from the source maps (LAB_SOURCEMAP=1 builds) */
import { readFileSync, readdirSync } from 'node:fs';
import { SourceMapConsumer } from 'source-map';
const dir = process.argv[2];
const files = process.argv[3] ? process.argv[3].split(',') : readdirSync(dir).filter((f) => f.endsWith('.js'));
const by = {};
for (const f of files) {
  const code = readFileSync(`${dir}/${f}`, 'utf8');
  const map = JSON.parse(readFileSync(`${dir}/${f}.map`, 'utf8'));
  await SourceMapConsumer.with(map, null, (c) => {
    const lines = code.split('\n');
    c.eachMapping((m) => {}, null);
    // attribute each generated segment to the source of its mapping
    let prev = null;
    const segs = [];
    c.eachMapping((m) => segs.push(m));
    segs.sort((a, b) => a.generatedLine - b.generatedLine || a.generatedColumn - b.generatedColumn);
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i], n = segs[i + 1];
      const end = n && n.generatedLine === s.generatedLine ? n.generatedColumn : lines[s.generatedLine - 1].length;
      const src = s.source ?? '?';
      const key = src.includes('node_modules/') ? src.split('node_modules/').pop().split('/').slice(0, src.split('node_modules/').pop().startsWith('@') ? 2 : 1).join('/') : src.includes('/src/') ? (src.includes('/lab/') ? 'lab/src' : 'src (application)') : 'autre';
      by[key] = (by[key] ?? 0) + (end - s.generatedColumn);
    }
  });
}
const tot = Object.values(by).reduce((a, b) => a + b, 0);
for (const [k, v] of Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(k.padEnd(28), (v / 1024).toFixed(0).padStart(6), 'Kio', ((100 * v) / tot).toFixed(1) + ' %');
