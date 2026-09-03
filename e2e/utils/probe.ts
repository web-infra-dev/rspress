import fs from 'node:fs';
import path from 'node:path';

type Source = { source: string; spelling: string; detail: string };

const isWin = process.platform === 'win32';
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
// On Windows every `/` in an absolute path is a non-native spelling (slash or mixed).
const isNonNative = (p: unknown): p is string =>
  isWin && typeof p === 'string' && p.includes('/');
const isSlashAbsolute = (p: unknown): p is string =>
  typeof p === 'string' && /^[A-Za-z]:\//.test(p);

const shortStack = () =>
  (new Error().stack ?? '')
    .split('\n')
    .slice(1)
    .map(l => l.trim().replace(/^at /, ''))
    .filter(l => !/utils[\\/]probe\.ts/.test(l))
    .slice(0, 6)
    .join(' <- ');

/**
 * Diagnostic plugin: attributes every non-native (`/`) Windows path that reaches rspack from JS
 * to the API and call site that supplied it, and records what rspack hands to watchpack and
 * what watchpack delivers back. Writes to `<dir>/probe.log`.
 *
 * PROBE_FORCE=slash|native interns the target paths with that spelling before `make`.
 */
export class ProbePlugin {
  #dir: string;
  #targets: string[];
  #log: string;
  #sources = new Map<string, Source[]>();

  constructor(dir: string, targets: string[]) {
    this.#dir = dir;
    this.#targets = targets.map(p => path.resolve(dir, p));
    this.#log = path.join(dir, 'probe.log');
  }

  #record(source: string, spelling: string, detail: string) {
    const key = norm(spelling);
    const list = this.#sources.get(key) ?? [];
    if (list.some(s => s.source === source && s.spelling === spelling)) return;
    if (list.length < 6) list.push({ source, spelling, detail });
    this.#sources.set(key, list);
  }

  apply(compiler: any) {
    const name = `${path.basename(this.#dir)}:${compiler.name ?? 'default'}`;
    const envForce = process.env.PROBE_FORCE ?? 'none';
    const force = ['slash', 'native'].includes(envForce) ? envForce : 'none';
    const targets = this.#targets;
    const isTarget = (p: string) => targets.some(t => norm(t) === norm(p));
    const hits = (list: string[]) => JSON.stringify(list.filter(isTarget));
    const log = (msg: string) =>
      fs.appendFileSync(this.#log, `${new Date().toISOString()} [${name}] ${msg}\n`);
    const record = (source: string, spelling: string, detail: string) => {
      if (!isNonNative(spelling)) return;
      this.#record(source, spelling, detail);
      if (isTarget(spelling)) log(`SOURCE ${source} ${spelling} :: ${detail}`);
    };
    let buildIndex = 0;
    let wrapped = false;

    log(
      `init force=${force} platform=${process.platform} nativeWatcher=${compiler.options.experiments?.nativeWatcher} context=${compiler.options.context}`,
    );

    // 1. Options that carry `/` absolute Windows paths (entries, aliases, cache, snapshot...).
    const walk = (value: unknown, trail: string, seen: Set<unknown>) => {
      if (isSlashAbsolute(value)) record(`options.${trail}`, value, '');
      if (!value || typeof value !== 'object' || seen.has(value)) return;
      seen.add(value);
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (typeof v === 'function') continue;
        walk(v, trail ? `${trail}.${k}` : k, seen);
      }
    };
    walk(compiler.options, '', new Set());

    compiler.hooks.thisCompilation.tap('probe', (compilation: any) => {
      // 2. compilation.*Dependencies.add from plugins.
      for (const k of [
        'fileDependencies',
        'contextDependencies',
        'missingDependencies',
        'buildDependencies',
      ]) {
        const set = compilation[k];
        const add = set.add.bind(set);
        set.add = (dep: string) => {
          record(`compilation.${k}.add`, dep, `stack=${shortStack()}`);
          return add(dep);
        };
      }

      // 3. Loader context APIs: addDependency & friends, resolve/getResolve.
      compiler.webpack.NormalModule.getCompilationHooks(compilation).loader.tap(
        'probe',
        (loaderContext: any) => {
          const resource = loaderContext.resourcePath;
          for (const fn of [
            'addDependency',
            'addContextDependency',
            'addMissingDependency',
            'addBuildDependency',
          ]) {
            const orig = loaderContext[fn];
            if (typeof orig !== 'function') continue;
            loaderContext[fn] = (dep: string) => {
              record(`loader.${fn}`, dep, `resource=${resource} stack=${shortStack()}`);
              return orig.call(loaderContext, dep);
            };
          }
          const wrapResolver = (label: string, resolver: any) =>
            function (this: any, context: string, request: string, cb?: any) {
              record(`${label}.context`, context, `request=${request} resource=${resource}`);
              if (typeof cb === 'function') {
                return resolver.call(this, context, request, (err: any, result: any) => {
                  if (typeof result === 'string')
                    record(`${label}.result`, result, `request=${request} context=${context}`);
                  cb(err, result);
                });
              }
              const ret = resolver.call(this, context, request);
              if (ret && typeof ret.then === 'function') {
                ret.then((result: any) => {
                  if (typeof result === 'string')
                    record(`${label}.result`, result, `request=${request} context=${context}`);
                }, () => {});
              }
              return ret;
            };
          if (typeof loaderContext.resolve === 'function') {
            loaderContext.resolve = wrapResolver('loader.resolve', loaderContext.resolve);
          }
          if (typeof loaderContext.getResolve === 'function') {
            const getResolve = loaderContext.getResolve;
            loaderContext.getResolve = (options: any) =>
              wrapResolver('loader.getResolve', getResolve.call(loaderContext, options));
          }
        },
      );

      // 3b. Build order of the modules that matter: pages (targets) vs the virtual modules that
      //     register page paths, to see whose spelling reaches the dependency maps first.
      const interesting = (m: any) => {
        const r = typeof m?.resource === 'string' ? m.resource : '';
        return isTarget(r) || /virtual-(page-data|routes)\.js$/.test(r) ? r : '';
      };
      compilation.hooks.buildModule.tap('probe', (m: any) => {
        const r = interesting(m);
        if (r) log(`MODULE build-start ${r}`);
      });
      compilation.hooks.succeedModule.tap('probe', (m: any) => {
        const r = interesting(m);
        if (r) log(`MODULE build-end ${r}`);
      });

      if (buildIndex === 0 && force !== 'none') {
        for (const t of targets) {
          const p = force === 'slash' ? t.replace(/\\/g, '/') : t;
          compilation.fileDependencies.add(p);
          log(`forced fileDependencies.add ${p}`);
        }
      }
    });

    // 4. (removed) per-resolve nmf taps: every earlier run showed the resolver returning the
    //    native spelling for `D:/...` requests; the taps only add a JS round trip per module.

    // 5. What rspack registers with watchpack and what watchpack delivers back.
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

    // 6. Per build: spellings in the dependency sets, and who supplied every non-native one.
    compiler.hooks.done.tap('probe', (stats: any) => {
      const c = stats.compilation;
      const fl = Array.from(c.fileDependencies) as string[];
      const ctx = Array.from(c.contextDependencies) as string[];
      const missing = Array.from(c.missingDependencies) as string[];
      log(
        `done#${buildIndex} fileDeps=${fl.length} ${countSpellings(fl)} targets=${hits(fl)} ctxDeps=${ctx.length} ${countSpellings(ctx)} missing=${missing.length} ${countSpellings(missing)} modified=${JSON.stringify(Array.from(compiler.modifiedFiles || []))} errors=${c.errors.length}`,
      );
      for (const [label, list] of [
        ['fileDependencies', fl],
        ['contextDependencies', ctx],
        ['missingDependencies', missing],
      ] as const) {
        for (const p of list) {
          if (!isNonNative(p)) continue;
          const sources = this.#sources.get(norm(p)) ?? [];
          log(
            `NON-NATIVE in ${label}: ${p} <= ${sources.length ? sources.map(s => `${s.source}(${s.spelling}) ${s.detail}`).join(' || ') : 'no JS source recorded'}`,
          );
        }
      }
      if (buildIndex === 0) {
        const bySource = new Map<string, string[]>();
        for (const list of this.#sources.values()) {
          for (const s of list) {
            const l = bySource.get(s.source) ?? [];
            l.push(s.spelling);
            bySource.set(s.source, l);
          }
        }
        for (const [source, list] of bySource) {
          log(
            `SUPPLIERS ${source}: ${list.length} non-native path(s), e.g. ${JSON.stringify(list.slice(0, 3))}`,
          );
        }
      }
      buildIndex++;
    });
  }
}
