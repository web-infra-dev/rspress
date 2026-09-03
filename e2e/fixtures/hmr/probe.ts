import fs from 'node:fs';
import path from 'node:path';

const dir = import.meta.dirname;
const LOG = path.join(dir, 'probe.log');
const TARGETS = [
  'doc/guide/test.mdx',
  'doc/guide/_mdx-fragment.mdx',
  'doc/_nav.json',
  'doc/guide/_meta.json',
].map(p => path.resolve(dir, p));

const norm = (p: string) => p.replace(/\\/g, '/').toLowerCase();
const spell = (p: string) => {
  const s = p.includes('/');
  const b = p.includes('\\');
  return s && b ? 'mixed' : b ? 'native' : 'slash';
};
const countSpellings = (list: string[]) => {
  const counts = { native: 0, slash: 0, mixed: 0 };
  for (const f of list) counts[spell(f)]++;
  return JSON.stringify(counts);
};
const hits = (list: string[]) =>
  JSON.stringify(list.filter(f => TARGETS.some(t => norm(t) === norm(f))));
const log = (msg: string) =>
  fs.appendFileSync(LOG, `${new Date().toISOString()} ${msg}\n`);

export class ProbePlugin {
  apply(compiler: any) {
    const name = compiler.name ?? 'default';
    const force = process.env.PROBE_FORCE || 'none';
    let buildIndex = 0;
    let wrapped = false;

    log(
      `[${name}] init force=${force} platform=${process.platform} rspack=${compiler.rspackVersion} nativeWatcher=${compiler.options.experiments?.nativeWatcher} cache=${JSON.stringify(compiler.options.cache)} expCache=${JSON.stringify(compiler.options.experiments?.cache)} context=${compiler.options.context}`,
    );

    compiler.hooks.thisCompilation.tap('probe', (compilation: any) => {
      if (buildIndex === 0 && force !== 'none') {
        for (const t of TARGETS) {
          const p = force === 'slash' ? t.replace(/\\/g, '/') : t;
          compilation.fileDependencies.add(p);
          log(`[${name}] forced fileDependencies.add ${p}`);
        }
      }
    });

    compiler.hooks.watchRun.tap('probe', () => {
      if (wrapped) return;
      wrapped = true;
      const wfs = compiler.watchFileSystem;
      const orig = wfs.watch.bind(wfs);
      log(`[${name}] watchFileSystem=${wfs.constructor.name}`);
      wfs.watch = (
        files: Iterable<string>,
        dirs: Iterable<string>,
        missing: Iterable<string>,
        startTime: number,
        options: any,
        callback: any,
        callbackUndelayed: any,
      ) => {
        const fl = Array.from(files);
        const dl = Array.from(dirs);
        log(
          `[${name}] watch registered files=${fl.length} ${countSpellings(fl)} targets=${hits(fl)} dirs=${dl.length} ${countSpellings(dl)} dirsSample=${JSON.stringify(dl.slice(0, 4))}`,
        );
        return orig(
          files,
          dirs,
          missing,
          startTime,
          options,
          (
            err: any,
            fileTimeInfo: any,
            ctxTimeInfo: any,
            changed: Set<string>,
            removed: Set<string>,
          ) => {
            log(
              `[${name}] watch callback err=${err} changed=${JSON.stringify(Array.from(changed || []))} removed=${JSON.stringify(Array.from(removed || []))}`,
            );
            callback(err, fileTimeInfo, ctxTimeInfo, changed, removed);
          },
          (fileName: string, changeTime: number) => {
            log(`[${name}] watch undelayed ${fileName} ${changeTime}`);
            callbackUndelayed?.(fileName, changeTime);
          },
        );
      };
    });

    compiler.hooks.done.tap('probe', (stats: any) => {
      const c = stats.compilation;
      const fl = Array.from(c.fileDependencies) as string[];
      const ctx = Array.from(c.contextDependencies) as string[];
      log(
        `[${name}] done#${buildIndex} fileDeps=${fl.length} ${countSpellings(fl)} targets=${hits(fl)} ctxDeps=${ctx.length} ${countSpellings(ctx)} modified=${JSON.stringify(Array.from(compiler.modifiedFiles || []))} errors=${c.errors.length}`,
      );
      buildIndex++;
    });
  }
}
