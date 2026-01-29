/**
 * Executor Module
 * Applies fixes and runs verification commands
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { $ } from 'zx';
import type { FileChange } from './fixer.js';

// Configure zx for quiet mode
$.verbose = false;

export interface VerifyResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * Apply file changes to disk
 */
export async function applyFixes(fixes: FileChange[]): Promise<void> {
  for (const fix of fixes) {
    const absolutePath = path.resolve(process.cwd(), fix.filePath);

    // Ensure directory exists
    const dir = path.dirname(absolutePath);
    await fs.mkdir(dir, { recursive: true });

    // Write the fixed content
    await fs.writeFile(absolutePath, fix.content, 'utf-8');
    console.log(`✓ Applied fix to: ${fix.filePath}`);
  }
}

/**
 * Run a verification command
 */
export async function runVerification(command: string): Promise<VerifyResult> {
  try {
    // Split command into parts
    const parts = command.split(/\s+/);
    const [cmd, ...args] = parts;

    // Run the command
    const result = await $`${cmd} ${args}`;

    return {
      success: true,
      output: result.stdout,
    };
  } catch (error) {
    // Command failed - zx throws ProcessOutput on failure
    const err = error as Record<string, unknown>;
    if (err && typeof err === 'object' && 'stderr' in err) {
      return {
        success: false,
        output: String(err.stdout || ''),
        error: String(err.stderr),
      };
    }

    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Apply fixes and verify
 */
export async function applyAndVerify(
  fixes: FileChange[],
  verifyCommand: string,
): Promise<VerifyResult> {
  // Apply the fixes
  await applyFixes(fixes);

  // Run verification
  console.log(`\n🔍 Running verification: ${verifyCommand}`);
  const result = await runVerification(verifyCommand);

  if (result.success) {
    console.log('✅ Verification passed!');
  } else {
    console.log('❌ Verification failed');
    if (result.error) {
      console.log(`Error: ${result.error}`);
    }
  }

  return result;
}

/**
 * Get list of modified files (for git operations)
 */
export async function getModifiedFiles(): Promise<string[]> {
  try {
    const result = await $`git diff --name-only`;
    return result.stdout.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Revert changes to specific files
 */
export async function revertChanges(files: string[]): Promise<void> {
  if (files.length === 0) return;

  try {
    await $`git checkout -- ${files}`;
    console.log(`↩️ Reverted changes to ${files.length} files`);
  } catch (error) {
    console.warn('Could not revert changes:', error);
  }
}
