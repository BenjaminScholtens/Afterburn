import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const crowdyRoot = resolve(root, '../CrowdyJS');
const crowdyDist = resolve(crowdyRoot, 'dist/index.js');

if (!existsSync(crowdyDist)) {
  if (!existsSync(resolve(crowdyRoot, 'package.json'))) {
    console.error(
      'CrowdyJS not found at ../CrowdyJS. Clone the monorepo or check out CrowdyJS as a sibling directory.',
    );
    process.exit(1);
  }
  console.log('Building CrowdyJS (file:../CrowdyJS dependency)...');
  execSync('npm run build', { cwd: crowdyRoot, stdio: 'inherit' });
}
