import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync } from 'node:fs';

// Hash committed build inputs, never node_modules or restored build outputs.
const tree = execFileSync('git', ['ls-tree', '-r', '-z', 'HEAD'], {
  encoding: 'utf8',
})
  .split('\0')
  .filter(entry => {
    const filename = entry.split('\t')[1];
    return (
      filename &&
      (!filename.includes('/') ||
        filename.startsWith('packages/') ||
        filename.startsWith('scripts/'))
    );
  })
  .join('\0');
if (!tree.length) throw new Error('No committed build inputs found');
const fingerprint = createHash('sha256').update(tree).digest('hex');
console.log(`Workspace build fingerprint: ${fingerprint}`);
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `fingerprint=${fingerprint}\n`);
}
