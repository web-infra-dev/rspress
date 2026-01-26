/**
 * Error Analyzer Module
 * Parses error logs and classifies errors as simple or complex
 */

export interface ErrorAnalysis {
  isSimple: boolean;
  errorType: 'lint' | 'format' | 'type' | 'test' | 'runtime' | 'unknown';
  affectedFiles: string[];
  errorMessages: string[];
  suggestion?: string;
}

// Patterns that indicate simple, auto-fixable errors
const SIMPLE_ERROR_PATTERNS = [
  // Biome lint errors
  /(?:lint|check)\s*[✖✗×]/i,
  /biome\s+check/i,
  /\s+error\[.*?\]:/i,
  // Prettier format errors
  /prettier.*--check/i,
  /Code style issues found/i,
  // ESLint errors (if used)
  /eslint.*error/i,
  // Unused imports/variables
  /is\s+declared\s+but\s+never\s+used/i,
  /no-unused-vars/i,
  // Simple type errors
  /Cannot find module/i,
  /Module not found/i,
  /Property .* does not exist on type/i,
  /Type .* is not assignable to type/i,
];

// Patterns that indicate complex errors requiring manual intervention
const COMPLEX_ERROR_PATTERNS = [
  // Test failures
  /FAIL\s+.*\.test\./i,
  /Expected.*Received/i,
  /AssertionError/i,
  /test\s+failed/i,
  // Runtime errors
  /ReferenceError/i,
  /TypeError:.*undefined/i,
  /SyntaxError/i,
  /RangeError/i,
  // Build logic errors
  /Build failed/i,
  /Compilation failed/i,
  /Fatal error/i,
];

// Extract file paths from error logs
const FILE_PATH_PATTERNS = [
  // Standard file paths with line numbers
  /(?:^|\s)([./]?(?:[\w-]+\/)*[\w.-]+\.[a-z]{2,4}):?\d*/gim,
  // Windows-style paths
  /([A-Z]:\\(?:[\w-]+\\)*[\w.-]+\.[a-z]{2,4})/gi,
  // Paths in error messages
  /(?:in|at|from)\s+['"]?([./]?(?:[\w-]+\/)*[\w.-]+\.[a-z]{2,4})['"]?/gi,
];

// Allowed file extensions for modifications
const ALLOWED_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.mdx',
  '.css',
  '.scss',
  '.less',
];

// Directories that are safe to modify
const ALLOWED_DIRECTORIES = [
  'packages/',
  'e2e/',
  'scripts/',
  'website/',
  'src/',
];

// Files/directories that should never be modified
const BLOCKED_PATHS = [
  '.github/workflows/',
  '.env',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  '.git/',
];

/**
 * Checks if a file path is allowed to be modified
 */
function isAllowedPath(filePath: string): boolean {
  // Block certain paths
  for (const blocked of BLOCKED_PATHS) {
    if (filePath.includes(blocked)) {
      return false;
    }
  }

  // Check if in allowed directory
  const inAllowedDir = ALLOWED_DIRECTORIES.some(
    dir => filePath.includes(dir) || filePath.startsWith(dir),
  );

  // Check extension
  const hasAllowedExt = ALLOWED_EXTENSIONS.some(ext => filePath.endsWith(ext));

  return inAllowedDir && hasAllowedExt;
}

/**
 * Extract file paths from error log
 */
function extractFilePaths(errorLog: string): string[] {
  const paths = new Set<string>();

  for (const pattern of FILE_PATH_PATTERNS) {
    const matches = errorLog.matchAll(pattern);
    for (const match of matches) {
      const filePath = match[1];
      if (filePath && isAllowedPath(filePath)) {
        paths.add(filePath);
      }
    }
  }

  return Array.from(paths);
}

/**
 * Extract error messages from log
 */
function extractErrorMessages(errorLog: string): string[] {
  const lines = errorLog.split('\n');
  const errors: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Look for lines that contain error indicators
    if (
      trimmed.includes('error') ||
      trimmed.includes('Error') ||
      trimmed.includes('✖') ||
      trimmed.includes('✗') ||
      trimmed.includes('×') ||
      trimmed.includes('FAIL')
    ) {
      errors.push(trimmed);
    }
  }

  return errors.slice(0, 20); // Limit to first 20 error messages
}

/**
 * Determine if errors are simple (auto-fixable) or complex
 */
function isSimpleError(errorLog: string): boolean {
  // If any complex pattern matches, it's not simple
  for (const pattern of COMPLEX_ERROR_PATTERNS) {
    if (pattern.test(errorLog)) {
      return false;
    }
  }

  // Check if any simple pattern matches
  for (const pattern of SIMPLE_ERROR_PATTERNS) {
    if (pattern.test(errorLog)) {
      return true;
    }
  }

  return false;
}

/**
 * Determine error type
 */
function getErrorType(errorLog: string): ErrorAnalysis['errorType'] {
  const log = errorLog.toLowerCase();

  if (log.includes('biome') || log.includes('eslint') || log.includes('lint')) {
    return 'lint';
  }
  if (log.includes('prettier') || log.includes('format')) {
    return 'format';
  }
  if (log.includes('type') && (log.includes('error') || log.includes('ts'))) {
    return 'type';
  }
  if (log.includes('test') || log.includes('jest') || log.includes('vitest')) {
    return 'test';
  }
  if (
    log.includes('runtime') ||
    log.includes('referenceerror') ||
    log.includes('typeerror')
  ) {
    return 'runtime';
  }

  return 'unknown';
}

/**
 * Main function to analyze error logs
 */
export function analyzeError(errorLog: string): ErrorAnalysis {
  const affectedFiles = extractFilePaths(errorLog);
  const errorMessages = extractErrorMessages(errorLog);
  const simple = isSimpleError(errorLog);
  const errorType = getErrorType(errorLog);

  let suggestion: string | undefined;

  if (!simple) {
    switch (errorType) {
      case 'test':
        suggestion =
          'Test failures detected. Review test assertions and expected values.';
        break;
      case 'runtime':
        suggestion =
          'Runtime errors detected. Check for undefined variables or incorrect API usage.';
        break;
      default:
        suggestion = 'Complex error detected. Manual review recommended.';
    }
  }

  return {
    isSimple: simple,
    errorType,
    affectedFiles,
    errorMessages,
    suggestion,
  };
}

/**
 * Format analysis for console output
 */
export function formatAnalysis(analysis: ErrorAnalysis): string {
  const lines: string[] = [];

  lines.push(`Error Type: ${analysis.errorType}`);
  lines.push(
    `Complexity: ${analysis.isSimple ? 'Simple (auto-fixable)' : 'Complex (manual review needed)'}`,
  );

  if (analysis.affectedFiles.length > 0) {
    lines.push('\nAffected Files:');
    for (const file of analysis.affectedFiles) {
      lines.push(`  - ${file}`);
    }
  }

  if (analysis.errorMessages.length > 0) {
    lines.push('\nError Messages:');
    for (const msg of analysis.errorMessages.slice(0, 10)) {
      lines.push(`  ${msg}`);
    }
    if (analysis.errorMessages.length > 10) {
      lines.push(`  ... and ${analysis.errorMessages.length - 10} more`);
    }
  }

  if (analysis.suggestion) {
    lines.push(`\nSuggestion: ${analysis.suggestion}`);
  }

  return lines.join('\n');
}
