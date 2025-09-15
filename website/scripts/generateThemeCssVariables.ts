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
    'variable.other.enummember',
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
    'string variable',
    'meta.embedded',
    'meta.template.expression',
    'punctuation.definition.template-expression',
    'punctuation.section.embedded',
    'string.regexp constant.character.escape',
  ],
  '--shiki-token-punctuation': [
    'punctuation',
    'punctuation.separator',
    'punctuation.terminator',
    'punctuation.accessor',
    'punctuation.section',
    'meta.brace',
    'meta.bracket',
    'punctuation.definition',
  ],
  '--shiki-token-link': [
    'markup.underline',
    'markup.underline.link',
    'constant.other.reference.link',
    'string.other.link',
    'markup.inline.raw',
    'textLink.activeForeground',
    'textLink.foreground',
  ],
};

function getColorForScope(
  tokenColors: any[],
  scopes: string[],
): string | undefined {
  let bestMatch: string | undefined;
  let bestMatchScore = 0;

  for (const { scope, settings } of tokenColors) {
    if (!scope || !settings?.foreground) continue;
    const scopeArr = Array.isArray(scope) ? scope : [scope];

    // Check for exact matches (highest priority)
    for (const targetScope of scopes) {
      if (scopeArr.includes(targetScope)) {
        return settings.foreground;
      }
    }

    // Check for partial matches and calculate match score
    for (const targetScope of scopes) {
      for (const s of scopeArr) {
        let score = 0;

        // Exact substring match
        if (s.includes(targetScope) || targetScope.includes(s)) {
          score = Math.max(targetScope.length, s.length);
        }
        // Word boundary match (e.g., "constant" matches "constant.numeric")
        else if (
          s.startsWith(targetScope + '.') ||
          targetScope.startsWith(s + '.')
        ) {
          score = Math.min(targetScope.length, s.length) * 1.5;
        }
        // Starts with match
        else if (s.startsWith(targetScope) || targetScope.startsWith(s)) {
          score = Math.min(targetScope.length, s.length);
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
    theme.colors?.['foreground'] ||
    (theme.type === 'dark' ? '#ffffff' : '#000000');

  const background =
    theme.colors?.['editor.background'] ||
    theme.colors?.['background'] ||
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
  'nord',
  'material-theme',
  'material-theme-darker',
  'material-theme-ocean',
  'vitesse-light',
  'vitesse-dark',
  'andromeeda',
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
