import { test as baseTest, type Page } from '@e2e/test';

export const test = baseTest.extend({
  playwright: async ({ task }, use) => {
    await use({
      launchOptions: {
        // Windows CI has a recent Chrome; other platforms use bundled Chromium.
        ...(process.env.CI && process.platform === 'win32'
          ? { channel: 'chrome' }
          : {}),
        args: ['--enable-features=WebMCP'],
      },
      contextOptions: { viewport: { width: 1440, height: 900 } },
      trace: process.env.CI ? (task.retryCount === 1 ? 'on' : 'off') : 'on',
    });
  },
});

export async function listTools(page: Page) {
  return (await page.webmcp.tools()).map(tool => tool.name).sort();
}

// Observe registration options and churn without replacing native registration.
export async function trackToolRegistrations(page: Page) {
  await page.addInitScript(() => {
    const context = (
      document as Document & {
        modelContext: { registerTool(...args: unknown[]): unknown };
      }
    ).modelContext;
    const register = context.registerTool.bind(context);
    window.webMcpRegistrations = [];
    context.registerTool = (tool, options) => {
      window.webMcpRegistrations.push({
        name: (tool as Tool).name,
        exposedTo: (options as { exposedTo?: string[] }).exposedTo,
      });
      return register(tool, options);
    };
  });
}

type Tool = {
  name: string;
  execute: (input: unknown, options: { signal?: AbortSignal }) => unknown;
};
declare global {
  interface Window {
    webMcpRegistrations: { name: string; exposedTo?: string[] }[];
    webMcpTest: {
      list(): string[];
      run(name: string, input?: unknown, signal?: AbortSignal): Promise<any>;
    };
  }
}

// Fault injection only: Playwright cannot inject registration failures or pass
// an AbortSignal to callTool, or run two handlers in the same browser task.
// All other cases use the native browser API.
export async function installModelContext(
  page: Page,
  failure?: 'sync' | 'async',
) {
  await page.addInitScript(
    ({ failure }) => {
      const tools = new Map<string, Tool>();
      Object.defineProperty(document, 'modelContext', {
        configurable: true,
        value: {
          registerTool(
            tool: Tool,
            options: { signal: AbortSignal; exposedTo?: string[] },
          ) {
            if (failure === 'sync') throw new Error('registration denied');
            if (failure === 'async')
              return Promise.reject(new Error('registration denied'));
            if (options.signal.aborted) return;
            if (tools.has(tool.name))
              throw new Error(`Duplicate tool: ${tool.name}`);
            tools.set(tool.name, tool);
            options.signal.addEventListener(
              'abort',
              () => tools.delete(tool.name),
              { once: true },
            );
          },
        },
      });
      window.webMcpTest = {
        list: () => [...tools.keys()].sort(),
        async run(name, input = {}, signal) {
          const tool = tools.get(`rspress_${name}`);
          if (!tool) throw new Error(`Missing tool: ${name}`);
          return tool.execute(input, { signal });
        },
      };
    },
    { failure },
  );
}
