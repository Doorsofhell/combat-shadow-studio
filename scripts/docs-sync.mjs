// 2.3.3: rewrites the generated blocks of README.md and docs/ETAT.md from the real catalogues of the app
// (src/domain/projectFacts.ts), then checks the version is the same everywhere (src/domain/version-sync.test.ts).
import { spawnSync } from 'node:child_process';
const r = spawnSync('npx', ['vitest', 'run', 'src/domain/version-sync.test.ts'], { stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, SYNC_DOCS: '1' } });
process.exit(r.status ?? 1);
