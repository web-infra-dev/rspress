import type { Page } from '@e2e/test';

export type Tool = {
  name: string;
  annotations?: Record<string, boolean>;
  execute: (input: unknown, options: { signal?: AbortSignal }) => unknown;
};
declare global {
  interface Window {
    webMcpTest: {
      list(): string[];
      annotations(name: string): Tool['annotations'];
      run(name: string, input?: unknown, signal?: AbortSignal): Promise<any>;
      registrations: string[][];
      registrationNames: string[];
    };
    navigationResult?: any;
    navigationError?: string;
  }
}

// Only the browser API is substituted. The real runtime, router, network,
// generated Markdown and local search run in the browser without a polyfill.
export async function installModelContext(
  page: Page,
  failure?: 'sync' | 'async',
) {
  await page.addInitScript(
    ({ failure }) => {
      const tools = new Map<string, Tool>();
      const registrations: string[][] = [];
      const registrationNames: string[] = [];
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
            registrations.push(options.exposedTo ?? []);
            registrationNames.push(tool.name);
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
        annotations: name => tools.get(name)?.annotations,
        async run(name, input = {}, signal) {
          const tool = tools.get(`rspress_${name}`);
          if (!tool) throw new Error(`Missing tool: ${name}`);
          return tool.execute(input, { signal });
        },
        registrations,
        registrationNames,
      };
    },
    { failure },
  );
}
