import { type Application, DeclarationReflection } from 'typedoc';
import type { MarkdownTheme } from 'typedoc-plugin-markdown';
import { MarkdownPageEvent } from 'typedoc-plugin-markdown';

export function pluginDescription(app: Application) {
  app.renderer.on(MarkdownPageEvent.BEGIN, page => {
    if (!(page.model instanceof DeclarationReflection)) return;

    const event = page as MarkdownPageEvent<DeclarationReflection>;
    const context = (app.renderer.theme as MarkdownTheme).getRenderContext(
      event,
    );
    const comment = event.model.comment || event.model.signatures?.[0]?.comment;
    if (comment) {
      event.frontmatter = {
        ...(event.frontmatter || {}),
        description: context.helpers
          .getDescriptionForComment(comment)
          ?.replaceAll(/\[([^\]]+)]\([^)]+\)/g, '$1'), // Remove markdown links
      };
    }
  });
}
