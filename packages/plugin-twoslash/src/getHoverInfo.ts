import fs from 'node:fs';
import path from 'node:path';
import type { NodeHover } from 'twoslash';
import { createTwoslasher } from 'twoslash';

export interface HoverInfoResult {
  /** Hover info for the main identifier */
  main?: NodeHover[];
  /** Hover info for member properties (e.g., Foo.a, Foo.b) */
  members?: Record<string, NodeHover[]>;
  /** All hover info from the file */
  all?: NodeHover[];
}

// entries: Record<identifier, filePath>;
export function getHoverInfo(
  entries?: Record<string, string>,
): Record<string, HoverInfoResult> {
  if (!entries || Object.keys(entries).length === 0) {
    return {};
  }

  const twoslasher = createTwoslasher({
    compilerOptions: {
      strict: true,
    },
  });

  const result: Record<string, HoverInfoResult> = {};

  for (const [identifier, filePath] of Object.entries(entries)) {
    try {
      // Read the file content
      const code = fs.readFileSync(filePath, 'utf-8');
      const ext = path.extname(filePath).slice(1) || 'ts';

      // Run twoslash to get hover information
      const twoslashResult = twoslasher(code, ext, {
        handbookOptions: {
          noStaticSemanticInfo: false,
        },
      });

      const allHovers = twoslashResult.hovers;

      // Get main identifier hovers
      const mainHovers = allHovers.filter(hover => hover.target === identifier);

      // Get member property hovers (e.g., properties of an interface)
      // Look for hovers with text like "(property) Identifier.memberName: type"
      const memberPattern = new RegExp(
        `\\(property\\)\\s+${identifier}\\.([^:]+):`,
      );
      const memberHovers: Record<string, NodeHover[]> = {};

      for (const hover of allHovers) {
        const match = hover.text.match(memberPattern);
        if (match) {
          const memberName = match[1].trim();
          if (!memberHovers[memberName]) {
            memberHovers[memberName] = [];
          }
          memberHovers[memberName].push(hover);
        }
      }

      result[identifier] = {
        main: mainHovers.length > 0 ? mainHovers : undefined,
        members:
          Object.keys(memberHovers).length > 0 ? memberHovers : undefined,
        all: allHovers,
      };
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  }

  return result;
}
