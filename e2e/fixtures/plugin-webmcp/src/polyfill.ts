import '@mcp-b/webmcp-polyfill';

const registrations: {
  name: string;
  exposedTo?: string[];
  signal?: AbortSignal;
}[] = [];
if (typeof document !== 'undefined') {
  const modelContext = document.modelContext;
  const registerTool = modelContext.registerTool.bind(modelContext);
  modelContext.registerTool = (tool, options) => {
    registrations.push({
      name: tool.name,
      exposedTo: options?.exposedTo,
      signal: options?.signal,
    });
    return registerTool(tool, options);
  };
  Object.assign(globalThis, { __webMcpRegistrations: registrations });
}
