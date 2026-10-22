import { createRequire } from 'node:module';
import { readdir, readFile, mkdir, writeFile, mkdtemp } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const yaml = createRequire(require.resolve('@midscene/test'))('js-yaml');

export function mergeAssertions(steps) {
  const output = [];
  let merged = 0;
  for (const step of steps) {
    const previous = output.at(-1);
    if (typeof step.aiAssert !== 'string' || !previous?.aiAct) {
      output.push(structuredClone(step));
      continue;
    }
    const action = previous.aiAct;
    const prompt = typeof action === 'string' ? action : action.prompt;
    if (typeof prompt !== 'string')
      throw new Error('Unsupported action prompt');
    const combined = `${prompt}\n\nAfter completing only the requested actions, check this expected result on the screen:\n${step.aiAssert}\nIf it is not satisfied, report failure. Do not take extra corrective actions to manufacture the expected result.`;
    previous.aiAct =
      typeof action === 'string' ? combined : { ...action, prompt: combined };
    merged++;
  }
  return { steps: output, merged };
}

export async function prepareSpeedCases({
  root,
  merge,
  ids = [],
  probe = false,
}) {
  const parent = path.join(root, '.speed-cases');
  await mkdir(parent, { recursive: true });
  const directory = await mkdtemp(path.join(parent, 'run-'));
  const manifest = [];
  const names = new Set();
  const files = (await readdir(path.join(root, 'cases')))
    .filter(file => file.endsWith('.yaml'))
    .sort();
  for (const file of files) {
    const document = yaml.load(
      await readFile(path.join(root, 'cases', file), 'utf8'),
    );
    if (Object.keys(document).some(key => key !== 'cases'))
      throw new Error(`Cannot split document hooks or variables: ${file}`);
    for (const source of document.cases) {
      const id = source.name.split(' ')[0];
      if (ids.length && !ids.includes(id)) continue;
      if (probe && id !== 'BUNDLE-01') continue;
      if (names.has(source.name))
        throw new Error(`Duplicate case: ${source.name}`);
      names.add(source.name);
      const original = structuredClone(source);
      if (probe) {
        original.name = 'PROBE-01 Impossible module name must fail';
        original.steps = [
          original.steps[0],
          {
            aiAct:
              'In Output Assets List, open small.js to inspect its modules.',
          },
          {
            aiAssert:
              'The Modules of "small.js" panel visibly contains a module named speed-probe-impossible-7c91.js.',
          },
        ];
      }
      const transformed = merge
        ? mergeAssertions(original.steps)
        : { steps: original.steps, merged: 0 };
      const name = `${String(manifest.length + 1).padStart(3, '0')}-${id}.yaml`;
      await writeFile(
        path.join(directory, name),
        yaml.dump(
          { cases: [{ ...original, steps: transformed.steps }] },
          { lineWidth: -1, noRefs: true },
        ),
      );
      manifest.push({
        name: original.name,
        source: `cases/${file}`,
        generated: name,
        originalAssertions: original.steps.filter(
          step => step.aiAssert !== undefined,
        ).length,
        mergedAssertions: transformed.merged,
        remainingAssertions: transformed.steps.filter(
          step => step.aiAssert !== undefined,
        ).length,
      });
    }
  }
  if (!manifest.length) throw new Error('No benchmark cases selected');
  if (
    !probe &&
    ids.some(id => !manifest.some(item => item.name.startsWith(`${id} `)))
  )
    throw new Error('Unknown case ID');
  return { pattern: `${path.relative(root, directory)}/*.yaml`, manifest };
}
