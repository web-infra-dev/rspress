const { execSync } = require('node:child_process');

// CI configuration and skip detection changes must also run the tests.
const SKIP_FOLDERS = ['.vscode', 'apps'];

function main() {
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
    changedFiles.every(
      file =>
        file.endsWith('.md') ||
        SKIP_FOLDERS.some(
          folder => file.startsWith(`${folder}/`) || file === folder,
        ),
    );

  console.log(shouldSkipCI ? 'true' : 'false');
}

main();
