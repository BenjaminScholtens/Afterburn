import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const crowdyRoot = resolve(root, '../CrowdyJS');
const crowdyDist = resolve(crowdyRoot, 'dist/index.js');

if (!existsSync(crowdyDist)) {
  console.log('CrowdyJS SDK not built — bootstrapping (fork/Netlify layout)...');
  execSync('bash scripts/bootstrap-crowdyjs.sh', { cwd: root, stdio: 'inherit' });
}
