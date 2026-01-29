#!/usr/bin/env node

/**
 * Self-Healing CLI
 * Main entry point for the CLI application
 */

import * as fs from 'node:fs/promises';
import { Command } from 'commander';
import { analyzeError, formatAnalysis } from './analyzer.js';
import { applyAndVerify, getModifiedFiles, revertChanges } from './executor.js';
import { generateAnalysis as aiAnalysis, generateFix } from './fixer.js';
import {
  createFixPR,
  isGhCliAvailable,
  isGitRepository,
} from './pr-creator.js';

const VERSION = '0.1.0';

const program = new Command();

program
  .name('self-healing-cli')
  .description('Automated CI error fixing tool using GitHub Copilot')
  .version(VERSION);

program
  .command('fix')
  .description('Analyze and fix CI errors')
  .requiredOption('--log <file>', 'Path to error log file')
  .option(
    '--verify <command>',
    'Verification command to run after fixes',
    'pnpm run lint',
  )
  .option('--max-attempts <n>', 'Maximum fix attempts', '3')
  .option('--timeout <ms>', 'Timeout for Copilot requests in ms', '600000')
  .option('--no-pr', 'Skip PR creation')
  .option('--dry-run', 'Show what would be done without making changes')
  .action(async options => {
    console.log('🔧 Self-Healing CLI v' + VERSION);
    console.log('━'.repeat(40));

    try {
      // Read error log
      const errorLog = await fs.readFile(options.log, 'utf-8');

      if (!errorLog.trim()) {
        console.log('⚠️  Error log is empty, nothing to fix');
        process.exit(0);
      }

      // Analyze error
      console.log('\n📋 Analyzing error log...');
      const analysis = analyzeError(errorLog);
      console.log(formatAnalysis(analysis));

      if (analysis.affectedFiles.length === 0) {
        console.log('\n⚠️  No affected files found in error log');
        console.log('   This might be a configuration or environment issue.');
        process.exit(1);
      }

      if (!analysis.isSimple) {
        // Complex error - only provide analysis
        console.log('\n🔍 Complex error detected. Generating AI analysis...');
        const suggestion = await aiAnalysis(
          errorLog,
          Number.parseInt(options.timeout),
        );
        console.log('\n📋 AI Analysis:');
        console.log('─'.repeat(40));
        console.log(suggestion);
        console.log('─'.repeat(40));
        console.log('\n❌ Manual intervention required.');
        process.exit(1);
      }

      // Simple error - attempt auto-fix
      console.log('\n✨ Simple error detected. Attempting auto-fix...');

      if (options.dryRun) {
        console.log('\n🔍 Dry run mode - no changes will be made');
        console.log('Would attempt to fix files:', analysis.affectedFiles);
        process.exit(0);
      }

      const maxAttempts = Number.parseInt(options.maxAttempts);
      const timeout = Number.parseInt(options.timeout);
      let lastError = errorLog;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`\n🔄 Attempt ${attempt}/${maxAttempts}`);

        // Generate fix
        console.log('   Generating fix with Copilot...');
        const fixResult = await generateFix(
          lastError,
          analysis.affectedFiles,
          timeout,
        );

        if (!fixResult.success) {
          console.log(`   ❌ Fix generation failed: ${fixResult.error}`);
          continue;
        }

        console.log(
          `   📝 Generated fixes for ${fixResult.fixes.length} file(s)`,
        );

        // Track modified files before applying
        const originalModified = await getModifiedFiles();

        // Apply and verify
        const verifyResult = await applyAndVerify(
          fixResult.fixes,
          options.verify,
        );

        if (verifyResult.success) {
          console.log('\n✅ Fix verified successfully!');

          // Create PR if enabled
          if (options.pr) {
            const isRepo = await isGitRepository();
            const hasGh = await isGhCliAvailable();

            if (!isRepo) {
              console.log('⚠️  Not in a git repository, skipping PR creation');
            } else if (!hasGh) {
              console.log('⚠️  gh CLI not available, skipping PR creation');
            } else {
              const originalBranch = process.env.GITHUB_HEAD_REF || 'main';
              const runId = process.env.GITHUB_RUN_ID || Date.now().toString();

              console.log('\n📤 Creating fix PR...');
              const prResult = await createFixPR(originalBranch, runId);

              if (prResult.success) {
                console.log(`✅ PR created: ${prResult.prUrl}`);
              } else {
                console.log(`⚠️  PR creation failed: ${prResult.error}`);
                // Don't fail the overall process if PR creation fails
              }
            }
          }

          process.exit(0);
        }

        // Verification failed
        console.log('   ⚠️  Verification failed, reverting changes...');
        lastError = verifyResult.error || verifyResult.output;

        // Revert changes
        const newModified = await getModifiedFiles();
        const toRevert = newModified.filter(f => !originalModified.includes(f));
        await revertChanges(toRevert);
      }

      console.log(`\n❌ Could not fix after ${maxAttempts} attempts.`);
      process.exit(1);
    } catch (error) {
      console.error(
        '\n💥 Fatal error:',
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Analyze error log without attempting fixes')
  .requiredOption('--log <file>', 'Path to error log file')
  .action(async options => {
    try {
      const errorLog = await fs.readFile(options.log, 'utf-8');

      if (!errorLog.trim()) {
        console.log('Error log is empty');
        process.exit(0);
      }

      const analysis = analyzeError(errorLog);
      console.log(formatAnalysis(analysis));
      process.exit(analysis.isSimple ? 0 : 1);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
