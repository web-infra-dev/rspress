import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import test from 'node:test';

const inventory = JSON.parse(
  await readFile(new URL('../migration-inventory.json', import.meta.url)),
);
const manifest = JSON.parse(
  await readFile(new URL('../case-manifest.json', import.meta.url)),
);
const ids = new Set(Object.keys(manifest).map(name => name.split(' ')[0]));

test('migration inventory accounts for every original test exactly once', async () => {
  assert.equal(inventory.cases.length, 237);
  assert.equal(inventory.allOriginalAssertionsPreserved, true);
  const originals = new Set();
  for (const entry of inventory.cases) {
    assert(entry.source.startsWith('e2e/fixtures/'));
    assert(!entry.source.includes('..'));
    await access(new URL('../../../' + entry.source, import.meta.url));
    const key = entry.source + ':' + entry.name;
    assert(!originals.has(key), 'Duplicate original test: ' + key);
    originals.add(key);
    assert(entry.reason.trim().length > 0);
    if (entry.decision === 'migrate-visible-behavior') {
      assert(entry.candidateCaseIds.length > 0, 'Missing AI mapping: ' + key);
      for (const id of entry.candidateCaseIds) {
        assert(ids.has(id), 'Unknown AI counterpart: ' + id);
      }
    } else {
      assert.equal(entry.decision, 'retain-deterministic');
      assert.equal(entry.status, 'retained');
      assert.deepEqual(entry.candidateCaseIds, []);
    }
  }
});
