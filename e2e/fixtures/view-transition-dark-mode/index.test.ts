import { expect, test } from '@e2e/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

type ProbeWindow = typeof window & {
  appearanceProbe: {
    mode:
      | 'pause'
      | 'run'
      | 'skip'
      | 'start-error'
      | 'update-error'
      | 'delayed-skip';
    starts: number;
    jsAnimations: number;
    initialClip: string;
    animation?: Animation;
    transition?: ViewTransition;
    releaseUpdate?: () => void;
    errors: string[];
  };
};

// Observe the real CSS transition animation and retain it after cleanup.
// Pausing lets assertions inspect the boundary frames without timing races.
function installProbe(theme: 'light' | 'dark') {
  localStorage.setItem('rspress-theme-appearance', theme);
  const probe: ProbeWindow['appearanceProbe'] = {
    mode: 'pause',
    starts: 0,
    jsAnimations: 0,
    initialClip: '',
    errors: [],
  };
  (window as ProbeWindow).appearanceProbe = probe;
  window.addEventListener('unhandledrejection', event => {
    probe.errors.push(String(event.reason));
  });
  const start = document.startViewTransition.bind(document);
  document.startViewTransition = update => {
    probe.starts++;
    if (probe.mode === 'start-error') {
      throw new Error('startViewTransition failed');
    }
    const transition = start(async () => {
      if (probe.mode === 'delayed-skip') {
        await new Promise<void>(resolve => {
          probe.releaseUpdate = resolve;
        });
      }
      if (typeof update === 'function') {
        await update();
      }
      if (probe.mode === 'update-error') {
        throw new Error('theme update failed');
      }
    });
    probe.transition = transition;
    transition.ready.then(
      () => {
        const animation = document
          .getAnimations()
          .find(
            animation =>
              animation instanceof CSSAnimation &&
              animation.animationName === 'rp-appearance',
          );
        probe.animation = animation;
        if (animation && probe.mode === 'pause') {
          animation.pause();
          animation.currentTime = 0;
          probe.initialClip = getComputedStyle(
            document.documentElement,
            (animation.effect as KeyframeEffect).pseudoElement!,
          ).clipPath;
        }
      },
      () => {},
    );
    if (probe.mode === 'skip' || probe.mode === 'delayed-skip') {
      transition.skipTransition();
    }
    return transition;
  };
  const animate = Element.prototype.animate;
  Element.prototype.animate = function (keyframes, options) {
    if (typeof options === 'object' && options?.pseudoElement) {
      probe.jsAnimations++;
      throw new Error('Appearance animations must be CSS-driven');
    }
    return animate.call(this, keyframes, options);
  };
}

test.describe('appearance view transition', () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runPreviewCommand>>;

  test.beforeAll(async () => {
    appPort = await getPort();
    await runBuildCommand(import.meta.dirname);
    app = await runPreviewCommand(import.meta.dirname, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  for (const theme of ['dark', 'light'] as const) {
    test(`${theme}: clips the boundary frames and releases its animation`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.addInitScript(installProbe, theme);
      await page.goto(`http://localhost:${appPort}`);
      await expect(page.locator('.coordinate-readout')).toBeVisible();
      const root = page.locator('html');
      await expect(root).toHaveClass(theme === 'dark' ? /dark/ : /^(?!.*dark)/);
      // Keep another root animation running after the circle finishes.
      await page.addStyleTag({
        content: '::view-transition-group(root) { animation-duration: 20s; }',
      });
      await page.locator('.rp-switch-appearance:visible').first().click();
      await page.waitForFunction(
        () => (window as ProbeWindow).appearanceProbe.animation,
      );
      const boundary = await page.evaluate(() => {
        const probe = (window as ProbeWindow).appearanceProbe;
        const effect = probe.animation!.effect as KeyframeEffect;
        return {
          initialClip: probe.initialClip,
          frames: effect.getKeyframes().map(frame => frame.clipPath),
          fill: effect.getTiming().fill,
          direction: effect.getTiming().direction,
          pseudoElement: effect.pseudoElement,
          jsAnimations: probe.jsAnimations,
        };
      });
      expect(boundary.fill).toBe('both');
      expect(boundary.direction).toBe(theme === 'dark' ? 'normal' : 'reverse');
      expect(boundary.jsAnimations).toBe(0);
      expect(boundary.pseudoElement).toBe(
        theme === 'dark'
          ? '::view-transition-new(root)'
          : '::view-transition-old(root)',
      );
      expect(boundary.initialClip).toBe(
        boundary.frames[theme === 'dark' ? 0 : 1],
      );
      expect(boundary.frames[0]).toMatch(/^circle\(0% at /);
      // A second switch must not abort the paused transition.
      await page.locator('.rp-switch-appearance').evaluateAll(switches => {
        switches.forEach(element =>
          element.dispatchEvent(new MouseEvent('click', { bubbles: true })),
        );
      });
      expect(
        await page.evaluate(
          () => (window as ProbeWindow).appearanceProbe.starts,
        ),
      ).toBe(1);
      await page.evaluate(() =>
        (window as ProbeWindow).appearanceProbe.animation!.finish(),
      );
      await expect(root).toHaveClass(/rp-appearance-transition/);
      expect(
        await page.evaluate(
          () => (window as ProbeWindow).appearanceProbe.animation!.playState,
        ),
      ).toBe('finished');
      await page.evaluate(() => {
        document.getAnimations().forEach(animation => {
          if (
            (animation.effect as KeyframeEffect)?.pseudoElement ===
            '::view-transition-group(root)'
          ) {
            animation.finish();
          }
        });
      });
      await expect(root).not.toHaveClass(/rp-appearance-transition/);
      const cleanup = await page.evaluate(() => {
        const probe = (window as ProbeWindow).appearanceProbe;
        return {
          state: probe.animation!.playState,
          clips: ['--rp-vt-clip-start', '--rp-vt-clip-end'].map(property =>
            document.documentElement.style.getPropertyValue(property),
          ),
          errors: probe.errors,
          animations: document
            .getAnimations()
            .filter(animation =>
              (animation.effect as KeyframeEffect)?.pseudoElement?.includes(
                'view-transition',
              ),
            ).length,
        };
      });
      expect(cleanup).toEqual({
        state: 'idle',
        clips: ['', ''],
        errors: [],
        animations: 0,
      });
    });
  }

  for (const mode of ['skip', 'start-error', 'update-error'] as const) {
    test(`${mode}: cleans up and allows a subsequent switch`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.addInitScript(installProbe, 'dark' as const);
      await page.goto(`http://localhost:${appPort}`);
      await expect(page.locator('.coordinate-readout')).toBeVisible();
      await page.evaluate(mode => {
        (window as ProbeWindow).appearanceProbe.mode = mode;
      }, mode);
      const appearance = page.locator('.rp-switch-appearance:visible').first();
      await appearance.click();
      await expect(page.locator('html')).not.toHaveClass(/dark/);
      await expect(page.locator('html')).not.toHaveClass(
        /rp-appearance-transition/,
      );
      expect(
        await page.evaluate(() =>
          ['--rp-vt-clip-start', '--rp-vt-clip-end'].map(property =>
            document.documentElement.style.getPropertyValue(property),
          ),
        ),
      ).toEqual(['', '']);
      await page.evaluate(() => {
        (window as ProbeWindow).appearanceProbe.mode = 'skip';
      });
      await appearance.click();
      await expect(page.locator('html')).toHaveClass(/dark/);
      await expect(page.locator('html')).not.toHaveClass(
        /rp-appearance-transition/,
      );
      expect(
        await page.evaluate(() => {
          const { starts, errors } = (window as ProbeWindow).appearanceProbe;
          return { starts, errors };
        }),
      ).toEqual({ starts: 2, errors: [] });
    });
  }

  test('skipping waits for a delayed update before allowing another switch', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(installProbe, 'dark' as const);
    await page.goto(`http://localhost:${appPort}`);
    await expect(page.locator('.coordinate-readout')).toBeVisible();
    await page.evaluate(() => {
      (window as ProbeWindow).appearanceProbe.mode = 'delayed-skip';
    });
    const appearance = page.locator('.rp-switch-appearance:visible').first();
    await appearance.click();
    await page.waitForFunction(
      () => (window as ProbeWindow).appearanceProbe.releaseUpdate,
    );
    await appearance.click();
    expect(
      await page.evaluate(() => (window as ProbeWindow).appearanceProbe.starts),
    ).toBe(1);
    await expect(page.locator('html')).toHaveClass(/rp-appearance-transition/);
    await page.evaluate(() => {
      const probe = (window as ProbeWindow).appearanceProbe;
      probe.mode = 'skip';
      probe.releaseUpdate!();
    });
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await expect(page.locator('html')).not.toHaveClass(
      /rp-appearance-transition/,
    );
    await appearance.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('html')).not.toHaveClass(
      /rp-appearance-transition/,
    );
    expect(
      await page.evaluate(() => {
        const { starts, errors } = (window as ProbeWindow).appearanceProbe;
        return { starts, errors };
      }),
    ).toEqual({ starts: 2, errors: [] });
  });

  test('reduced motion updates the theme without starting a transition', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(installProbe, 'dark' as const);
    await page.goto(`http://localhost:${appPort}`);
    await expect(page.locator('.coordinate-readout')).toBeVisible();
    await page.locator('.rp-switch-appearance:visible').first().click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    expect(
      await page.evaluate(() => (window as ProbeWindow).appearanceProbe.starts),
    ).toBe(0);
  });

  for (const layout of ['desktop', 'mobile'] as const) {
    test(`${layout}: repeated switches finish without retained CSS animations`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.addInitScript(installProbe, 'dark' as const);
      if (layout === 'mobile') {
        await page.setViewportSize({ width: 390, height: 844 });
      }
      await page.goto(`http://localhost:${appPort}`);
      await expect(page.locator('.coordinate-readout')).toBeVisible();
      if (layout === 'mobile') {
        await page.locator('.rp-nav-hamburger:visible').click();
      }
      await page.evaluate(() => {
        (window as ProbeWindow).appearanceProbe.mode = 'run';
      });
      const root = page.locator('html');
      const appearance = page.locator('.rp-switch-appearance:visible').first();
      for (let i = 0; i < 4; i++) {
        await appearance.click();
        if (i % 2 === 0) {
          await expect(root).not.toHaveClass(/dark/);
        } else {
          await expect(root).toHaveClass(/dark/);
        }
        await expect(root).not.toHaveClass(/rp-appearance-transition/);
      }
      expect(
        await page.evaluate(() => {
          const probe = (window as ProbeWindow).appearanceProbe;
          return {
            starts: probe.starts,
            jsAnimations: probe.jsAnimations,
            errors: probe.errors,
            clips: ['--rp-vt-clip-start', '--rp-vt-clip-end'].map(property =>
              document.documentElement.style.getPropertyValue(property),
            ),
            animations: document
              .getAnimations()
              .filter(animation =>
                (animation.effect as KeyframeEffect)?.pseudoElement?.includes(
                  'view-transition',
                ),
              ).length,
          };
        }),
      ).toEqual({
        starts: 4,
        jsAnimations: 0,
        errors: [],
        clips: ['', ''],
        animations: 0,
      });
    });
  }

  test('other view transitions do not run the appearance animation', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(installProbe, 'dark' as const);
    await page.goto(`http://localhost:${appPort}`);
    await expect(page.locator('.coordinate-readout')).toBeVisible();
    const animations = await page.evaluate(async () => {
      const transition = document.startViewTransition(() => {
        document.body.dataset.transition = 'other';
      });
      await transition.ready;
      const names = document
        .getAnimations()
        .filter(
          animation =>
            animation instanceof CSSAnimation &&
            animation.animationName === 'rp-appearance',
        ).length;
      await transition.finished;
      return names;
    });
    expect(animations).toBe(0);
  });
});
