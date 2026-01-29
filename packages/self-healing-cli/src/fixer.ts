/**
 * Fixer Module
 * Uses GitHub Copilot SDK to generate fixes for errors
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { CopilotClient } from '@github/copilot-sdk';

export interface FixResult {
  success: boolean;
  fixes: FileChange[];
  error?: string;
}

export interface FileChange {
  filePath: string;
  content: string;
}

const SYSTEM_PROMPT = `You are a senior TypeScript developer fixing CI errors.
Your goal is to make minimal, targeted fixes that resolve the errors.

Rules:
1. Only fix the specific errors mentioned
2. Preserve existing code style and formatting
3. For lint errors, apply exact fixes (remove unused imports, fix formatting)
4. For type errors, add proper types or fix type mismatches
5. Do not refactor unrelated code
6. Output ONLY the fixed file contents

Output format:
For each file that needs changes, output:
--- FILE: <filepath> ---
<complete file content with fixes applied>
--- END FILE ---

If multiple files need changes, output each one in this format.`;

/**
 * Read file contents for context
 */
async function readFileContents(
  filePaths: string[],
): Promise<Map<string, string>> {
  const contents = new Map<string, string>();

  for (const filePath of filePaths) {
    try {
      const absolutePath = path.resolve(process.cwd(), filePath);
      const content = await fs.readFile(absolutePath, 'utf-8');
      contents.set(filePath, content);
    } catch {
      // File might not exist or be unreadable, skip it
      console.warn(`Could not read file: ${filePath}`);
    }
  }

  return contents;
}

/**
 * Parse the Copilot response to extract file changes
 */
function parseFixes(response: string): FileChange[] {
  const fixes: FileChange[] = [];
  const filePattern = /--- FILE: (.+?) ---\n([\s\S]*?)\n--- END FILE ---/g;

  let match: RegExpExecArray | null;
  while ((match = filePattern.exec(response)) !== null) {
    fixes.push({
      filePath: match[1].trim(),
      content: match[2],
    });
  }

  return fixes;
}

/**
 * Generate fixes using GitHub Copilot SDK
 */
export async function generateFix(
  errorLog: string,
  affectedFiles: string[],
  timeout = 300000, // 5 minutes default
): Promise<FixResult> {
  const client = new CopilotClient();

  try {
    // Start the Copilot CLI server
    await client.start();

    // Read affected file contents for context
    const fileContents = await readFileContents(affectedFiles);

    // Build the prompt
    let prompt = `Fix the following CI error:\n\n${errorLog}\n\n`;

    if (fileContents.size > 0) {
      prompt += 'Current file contents:\n\n';
      for (const [filePath, content] of fileContents) {
        prompt += `--- FILE: ${filePath} ---\n${content}\n--- END FILE ---\n\n`;
      }
    }

    prompt += '\nProvide the fixed file contents in the specified format.';

    // Create session with system prompt
    const session = await client.createSession({
      model: 'gpt-4.1',
      systemMessage: {
        mode: 'append',
        content: SYSTEM_PROMPT,
      },
    });

    // Send prompt and wait for response
    const response = await session.sendAndWait({ prompt }, timeout);

    // Clean up session
    await session.destroy();

    if (!response?.data?.content) {
      return {
        success: false,
        fixes: [],
        error: 'No response received from Copilot',
      };
    }

    const fixes = parseFixes(response.data.content);

    if (fixes.length === 0) {
      return {
        success: false,
        fixes: [],
        error: 'Could not parse fixes from Copilot response',
      };
    }

    return {
      success: true,
      fixes,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      fixes: [],
      error: `Copilot SDK error: ${message}`,
    };
  } finally {
    // Always stop the client
    await client.stop();
  }
}

/**
 * Generate analysis/suggestions for complex errors (no auto-fix)
 */
export async function generateAnalysis(
  errorLog: string,
  timeout = 120000, // 2 minutes default
): Promise<string> {
  const client = new CopilotClient();

  const analysisPrompt = `You are a senior developer analyzing CI errors.
Provide a helpful analysis including:
1. Root cause of the error
2. Suggested fix approach
3. Files that likely need changes
4. Any potential gotchas or related issues

Be concise but thorough.`;

  try {
    await client.start();

    const session = await client.createSession({
      model: 'gpt-4.1',
      systemMessage: {
        mode: 'append',
        content: analysisPrompt,
      },
    });

    const response = await session.sendAndWait(
      { prompt: `Analyze this CI error:\n\n${errorLog}` },
      timeout,
    );

    await session.destroy();

    return response?.data?.content || 'Unable to generate analysis';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `Analysis failed: ${message}`;
  } finally {
    await client.stop();
  }
}
