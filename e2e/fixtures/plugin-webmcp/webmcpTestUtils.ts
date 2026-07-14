import type { Page } from '@playwright/test';

export interface TestingTool {
  name: string;
  description: string;
  inputSchema?: string;
}

type ModelContextTool = TestingTool;

interface ProducerModelContext {
  getTools(): Promise<ModelContextTool[]>;
  executeTool(tool: ModelContextTool, input: string): Promise<string | null>;
}

interface TestingModelContext {
  listTools(): TestingTool[];
  executeTool(name: string, input: string): Promise<string | null>;
}

export async function listTools(page: Page): Promise<TestingTool[]> {
  return page.evaluate(async () => {
    const testing = (
      navigator as Navigator & {
        modelContextTesting?: TestingModelContext;
      }
    ).modelContextTesting;
    if (testing) {
      return testing.listTools();
    }
    const modelContext = (
      document as Document & { modelContext?: ProducerModelContext }
    ).modelContext;
    if (modelContext?.getTools) {
      return (await modelContext.getTools()).map(
        ({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema,
        }),
      );
    }
    throw new Error('WebMCP tool discovery is unavailable');
  });
}

export async function listToolNames(page: Page): Promise<string[]> {
  return (await listTools(page)).map(tool => tool.name);
}

export async function findTool(page: Page, name: string) {
  return (await listTools(page)).find(tool => tool.name === name);
}

export async function executeTool(
  page: Page,
  name: string,
  input: Record<string, unknown>,
) {
  const raw = await page.evaluate(
    async ({ name, input }) => {
      const inputJson = JSON.stringify(input);
      const testing = (
        navigator as Navigator & {
          modelContextTesting?: TestingModelContext;
        }
      ).modelContextTesting;
      if (testing) {
        return testing.executeTool(name, inputJson);
      }
      const modelContext = (
        document as Document & { modelContext?: ProducerModelContext }
      ).modelContext;
      if (modelContext?.getTools && modelContext.executeTool) {
        const tool = (await modelContext.getTools()).find(
          candidate => candidate.name === name,
        );
        if (!tool) {
          throw new Error(`Unknown WebMCP tool: ${name}`);
        }
        return modelContext.executeTool(tool, inputJson);
      }
      throw new Error('WebMCP tool execution is unavailable');
    },
    { name, input },
  );
  if (raw === null) {
    return null;
  }
  return JSON.parse(raw) as {
    structuredContent?: unknown;
    content: { type: string; text: string }[];
  };
}
