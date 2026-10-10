const { execSync } = require('node:child_process');

const SKIP_FOLDERS = [
  '.github',
  '.vscode',
  'apps',
  'scripts/skipCI.js',
  'scripts/skipDocsChange.js',
];

async function main() {
  execSync('git fetch origin main');

  const changedFilesOutput = execSync('git diff origin/main... --name-only', {
    stdio: 'pipe',
  }).toString();
  const changedFiles = changedFilesOutput
    .split('\n')
    .map(file => file?.trim())
    .filter(Boolean);

  // Skip CI only when there is something to skip: every changed file is
  // docs-only or lives in a folder that cannot affect the packages.
  const shouldSkipCI =
    changedFiles.length > 0 &&
    changedFiles.every(file =>
      SKIP_FOLDERS.some(
        folder =>
          file.startsWith(`${folder}/`) ||
          file === folder ||
          file.endsWith('.md'),
      ),
    );

  console.log(shouldSkipCI ? 'true' : 'false');
}

main().catch(err => {
  // Fail open: a broken skip detection must not silently skip or fail
  // the whole test job — running the tests is always the safe answer.
  console.error('Failed to detect CI skip; running the tests anyway', err);
  console.log('false');
});
