import fs from 'node:fs';
import path from 'node:path';

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

/**
 * Diagnostic plugin: records the spelling (native `\` vs `/`) of every path rspack hands to
 * watchpack and what watchpack delivers back. Writes to `<dir>/probe.log`.
 *
 * PROBE_FORCE=slash|native interns the target paths with that spelling before `make`
 * (via `compilation.fileDependencies.add`) to make the interning race deterministic.
 */
export class ProbePlugin {
  #dir: string;
  #targets: string[];
  #log: string;

  constructor(dir: string, targets: string[]) {
    this.#dir = dir;
    this.#targets = targets.map(p => path.resolve(dir, p));
    this.#log = path.join(dir, 'probe.log');
  }

  apply(compiler: any) {
    const name = `${path.basename(this.#dir)}:${compiler.name ?? 'default'}`;
    const envForce = process.env.PROBE_FORCE ?? 'none';
    const force = ['slash', 'native'].includes(envForce) ? envForce : 'none';
    const targets = this.#targets;
    const hits = (list: string[]) =>
      JSON.stringify(list.filter(f => targets.some(t => norm(t) === norm(f))));
    const log = (msg: string) =>
      fs.appendFileSync(this.#log, `${new Date().toISOString()} [${name}] ${msg}\n`);
    let buildIndex = 0;
    let wrapped = false;

    log(
      `init force=${force} platform=${process.platform} nativeWatcher=${compiler.options.experiments?.nativeWatcher} context=${compiler.options.context}`,
    );

    compiler.hooks.thisCompilation.tap('probe', (compilation: any) => {
      if (buildIndex === 0 && force !== 'none') {
        for (const t of targets) {
          const p = force === 'slash' ? t.replace(/\\/g, '/') : t;
          compilation.fileDependencies.add(p);
          log(`forced fileDependencies.add ${p}`);
        }
      }
    });

    compiler.hooks.watchRun.tap('probe', () => {
      if (wrapped) return;
      wrapped = true;
      const wfs = compiler.watchFileSystem;
      const orig = wfs.watch.bind(wfs);
      log(`watchFileSystem=${wfs.constructor.name}`);
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
          `watch registered files=${fl.length} ${countSpellings(fl)} targets=${hits(fl)} dirs=${dl.length} ${countSpellings(dl)}`,
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
              `watch callback err=${err} changed=${JSON.stringify(Array.from(changed || []))} removed=${JSON.stringify(Array.from(removed || []).slice(0, 12))}`,
            );
            callback(err, fileTimeInfo, ctxTimeInfo, changed, removed);
          },
          (fileName: string, changeTime: number) => {
            log(`watch undelayed ${fileName} ${changeTime}`);
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
        `done#${buildIndex} fileDeps=${fl.length} ${countSpellings(fl)} targets=${hits(fl)} ctxDeps=${ctx.length} modified=${JSON.stringify(Array.from(compiler.modifiedFiles || []))} errors=${c.errors.length}`,
      );
      buildIndex++;
    });
  }
}
