import { expect, test } from '@e2e/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

type ProbeWindow = typeof window & {
  appearanceProbe: {
    mode: 'pause' | 'skip' | 'start-error' | 'animate-error' | 'update-error';
    starts: number;
    initialClip: string;
    animation?: Animation;
    transition?: ViewTransition;
    errors: string[];
  };
};

// Observe the real browser transition and retain its animation after cleanup.
// Pausing lets assertions inspect the boundary frames without timing races.
function installProbe(theme: 'light' | 'dark') {
  localStorage.setItem('rspress-theme-appearance', theme);
  const probe: ProbeWindow['appearanceProbe'] = {
    mode: 'pause',
    starts: 0,
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
      if (typeof update === 'function') {
        await update();
      }
      if (probe.mode === 'update-error') {
        throw new Error('theme update failed');
      }
    });
    probe.transition = transition;
    if (probe.mode === 'skip') {
      transition.skipTransition();
    }
    return transition;
  };
  const animate = Element.prototype.animate;
  Element.prototype.animate = function (keyframes, options) {
    if (typeof options === 'object' && options?.pseudoElement) {
      probe.initialClip = getComputedStyle(
        this,
        options.pseudoElement,
      ).clipPath;
      if (probe.mode === 'animate-error') {
        throw new Error('pseudo-element animation failed');
      }
      const animation = animate.call(this, keyframes, options);
      probe.animation = animation;
      if (probe.mode === 'pause') {
        animation.pause();
      }
      return animation;
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
          pseudoElement: effect.pseudoElement,
        };
      });
      expect(boundary.fill).toBe('both');
      expect(boundary.pseudoElement).toBe(
        theme === 'dark'
          ? '::view-transition-new(root)'
          : '::view-transition-old(root)',
      );
      if (theme === 'dark') {
        expect(boundary.initialClip).toBe(boundary.frames[0]);
        expect(boundary.initialClip).toMatch(/^circle\(0% at /);
      } else {
        expect(boundary.initialClip).toBe('none');
        expect(boundary.frames[1]).toMatch(/^circle\(0% at /);
      }
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
          clip: document.documentElement.style.getPropertyValue(
            '--rp-vt-clip-initial',
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
        clip: '',
        errors: [],
        animations: 0,
      });
      await expect(root).not.toHaveClass(/rp-transition-dark-to-light/);
    });
  }

  for (const mode of [
    'skip',
    'start-error',
    'animate-error',
    'update-error',
  ] as const) {
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
          document.documentElement.style.getPropertyValue(
            '--rp-vt-clip-initial',
          ),
        ),
      ).toBe('');
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
});
