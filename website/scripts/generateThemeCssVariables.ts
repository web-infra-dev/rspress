import fs from 'node:fs';

const tokenScopes: Record<string, string[]> = {
  '--shiki-token-constant': [
    'constant',
    'constant.numeric',
    'constant.language',
    'constant.character',
    'constant.other',
    'entity.name.constant',
    'variable.other.constant',
    'variable.other.enummember', // cspell:disable-line
    'variable.language',
    'support.constant',
  ],
  '--shiki-token-string': [
    'string',
    'string.quoted',
    'string.template',
    'string.other',
    'punctuation.definition.string',
    'string punctuation.section.embedded source',
    'source.regexp',
    'string.regexp',
  ],
  '--shiki-token-comment': [
    'comment',
    'comment.line',
    'comment.block',
    'punctuation.definition.comment',
    'string.comment',
  ],
  '--shiki-token-keyword': [
    'keyword',
    'keyword.control',
    'keyword.operator',
    'keyword.other',
    'storage',
    'storage.type',
    'storage.modifier',
  ],
  '--shiki-token-parameter': [
    // Generic variable scope first - many themes define this with a distinct color
    'variable',
    'variable.parameter',
    'variable.parameter.function',
    'variable.parameter.function-call',
    'variable.other',
    'meta.parameter',
  ],
  '--shiki-token-function': [
    'entity.name.function',
    'entity.name.method',
    'support.function',
    'variable.function',
    'variable.annotation',
    'meta.function-call',
    'meta.function-call.generic',
  ],
  '--shiki-token-string-expression': [
    // String-related scopes for template expressions
    'string',
    'string variable',
    // Escape characters within strings
    'constant.character.escape',
    'string.regexp constant.character.escape',
    // Template expression content
    'meta.template.expression',
    'meta.embedded',
    // Template expression punctuation (${} markers) - lower priority
    'punctuation.definition.template-expression.begin',
    'punctuation.definition.template-expression.end',
    'punctuation.definition.template-expression',
    'punctuation.section.embedded.begin',
    'punctuation.section.embedded.end',
    'punctuation.section.embedded',
  ],
  '--shiki-token-punctuation': [
    // Generic punctuation scopes - many themes define these
    'punctuation.separator.delimiter',
    'punctuation.terminator.statement',
    'punctuation.accessor',
    'punctuation.separator',
    'punctuation.terminator',
    'punctuation.bracket',
    'punctuation',
    'meta.brace',
    'meta.bracket',
  ],
  '--shiki-token-link': [
    // Prioritize link-specific scopes
    'string.other.link.title',
    'string.other.link.description',
    'string.other.link',
    'markup.underline.link',
    'markup.underline',
    'constant.other.reference.link',
    'markup.inline.raw',
    'textLink.activeForeground',
    'textLink.foreground',
  ],
};

interface TokenColor {
  scope?: string | string[];
  settings?: {
    foreground?: string;
  };
}

function parseScopeString(scope: string): string[] {
  // Handle comma-separated scopes like "comment, punctuation.definition.comment"
  return scope.split(',').map(s => s.trim());
}

function getColorForScope(
  tokenColors: TokenColor[],
  scopes: string[],
): string | undefined {
  let bestMatch: string | undefined;
  let bestMatchScore = -1;

  for (const { scope, settings } of tokenColors) {
    if (!scope || !settings?.foreground) continue;

    // Convert scope to array and handle comma-separated strings
    let scopeArr: string[];
    if (Array.isArray(scope)) {
      scopeArr = scope.flatMap(s => parseScopeString(s));
    } else {
      scopeArr = parseScopeString(scope);
    }

    for (let scopeIndex = 0; scopeIndex < scopes.length; scopeIndex++) {
      const targetScope = scopes[scopeIndex];
      // Higher priority for scopes listed earlier in the array
      const priorityBonus = (scopes.length - scopeIndex) * 1000;

      for (const s of scopeArr) {
        let score = 0;

        // Exact match (highest priority)
        if (s === targetScope) {
          score = priorityBonus + 500 + s.length;
        }
        // Theme scope is more specific (e.g., target "keyword" matches theme "keyword.control.ts")
        // This means the theme has a specific rule that extends our target scope
        // Give higher priority to theme scopes that are closer to the target (fewer extra levels)
        else if (s.startsWith(`${targetScope}.`)) {
          // Count extra scope levels: "keyword.control.ts" - "keyword" = 2 extra levels
          const extraPart = s.slice(targetScope.length + 1);
          const extraLevels = extraPart.split('.').length;
          // Base score 400, minus heavy penalty for extra specificity levels
          // This prevents language-specific scopes from being prioritized
          score = priorityBonus + 400 - extraLevels * 50;
        }
        // Target scope is more specific (e.g., target "keyword.control" matches theme "keyword")
        // The theme defines a general rule that applies to our specific scope
        // This is less preferred because we want specific rules when available
        // Only allow this if the theme scope is a direct parent (not too general)
        else if (targetScope.startsWith(`${s}.`)) {
          // Count how many levels more specific the target is
          const extraPart = targetScope.slice(s.length + 1);
          const extraLevels = extraPart.split('.').length;
          // Only match if not too many levels apart (avoid "string" matching "string.other.link.title")
          if (extraLevels <= 2) {
            score = priorityBonus + 200 + s.length - extraLevels * 20;
          }
        }

        if (score > bestMatchScore) {
          bestMatchScore = score;
          bestMatch = settings.foreground;
        }
      }
    }
  }

  return bestMatch;
}

export function generateShikiCssVars(themePath: string) {
  const theme = JSON.parse(fs.readFileSync(themePath, 'utf-8'));
  const result: [string, string][] = [];

  // Extract foreground and background colors
  const foreground =
    theme.colors?.['editor.foreground'] ||
    theme.colors?.foreground ||
    (theme.type === 'dark' ? '#ffffff' : '#000000');

  const background =
    theme.colors?.['editor.background'] ||
    theme.colors?.background ||
    (theme.type === 'dark' ? '#000000' : '#ffffff');

  result.push(['--shiki-foreground', foreground]);
  result.push(['--shiki-background', background]);

  const tokenColors = theme.tokenColors || theme.settings || [];

  // Add fallback colors for missing tokens based on theme type
  const fallbackColors =
    theme.type === 'dark'
      ? {
          '--shiki-token-constant': '#d2a6ff',
          '--shiki-token-string': '#aad94c',
          '--shiki-token-comment': '#acb6bf8c',
          '--shiki-token-keyword': '#ff8f40',
          '--shiki-token-parameter': '#f29668',
          '--shiki-token-function': '#ffb454',
          '--shiki-token-string-expression': '#95e6cb',
          '--shiki-token-punctuation': '#bfbdb6',
          '--shiki-token-link': '#39bae6',
        }
      : {
          '--shiki-token-constant': '#005cc5',
          '--shiki-token-string': '#032f62',
          '--shiki-token-comment': '#6a737d',
          '--shiki-token-keyword': '#d73a49',
          '--shiki-token-parameter': '#24292e',
          '--shiki-token-function': '#6f42c1',
          '--shiki-token-string-expression': '#005cc5',
          '--shiki-token-punctuation': '#24292e',
          '--shiki-token-link': '#032f62',
        };

  for (const [varName, scopes] of Object.entries(tokenScopes)) {
    const color =
      getColorForScope(tokenColors, scopes) || fallbackColors[varName];
    if (color) result.push([varName, color]);
  }

  return result;
}

const THEMES = [
  'github-light',
  'github-dark',
  'github-light-high-contrast',
  'github-dark-high-contrast',
  'light-plus',
  'dark-plus',
  'one-light',
  'one-dark-pro',
  'nord', // cspell:disable-line
  'material-theme',
  'material-theme-darker',
  'material-theme-ocean',
  'vitesse-light', // cspell:disable-line
  'vitesse-dark', // cspell:disable-line
  'andromeeda', // cspell:disable-line
  'ayu-dark',
] as const;

const output = {};
for (const theme of THEMES) {
  const vars = generateShikiCssVars(
    new URL(`../node_modules/tm-themes/themes/${theme}.json`, import.meta.url)
      .pathname,
  );
  output[theme] = Object.fromEntries(vars);
}

fs.writeFileSync(
  new URL('../docs/components/shikiThemeCssVars.json', import.meta.url)
    .pathname,
  JSON.stringify(output, null, 2),
);
