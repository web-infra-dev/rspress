import '@mcp-b/webmcp-polyfill';

interface TestModelContext {
  registerTool(
    tool: { name: string },
    options?: { exposedTo?: string[]; signal?: AbortSignal },
  ): Promise<void>;
}

const modelContext =
  typeof document === 'undefined'
    ? undefined
    : (document as Document & { modelContext?: TestModelContext }).modelContext;

if (modelContext) {
  const registerTool = modelContext.registerTool.bind(modelContext);
  modelContext.registerTool = (tool, options) => {
    const registrations = globalThis as typeof globalThis & {
      __webMcpRegistrationOptions?: Record<string, { exposedTo?: string[] }>;
    };
    registrations.__webMcpRegistrationOptions ??= {};
    registrations.__webMcpRegistrationOptions[tool.name] = {
      exposedTo: options?.exposedTo,
    };
    return registerTool(tool, options);
  };
}
