import type { Feature, Hero } from '@rspress/core';
import { useFrontmatter } from '@rspress/core/runtime';
import { HomeBackground, HomeFeature, HomeFooter, HomeHero } from '@theme';

export interface HomeLayoutProps {
  beforeHero?: React.ReactNode;
  afterHero?: React.ReactNode;
  beforeHeroActions?: React.ReactNode;
  afterHeroActions?: React.ReactNode;
  beforeFeatures?: React.ReactNode;
  afterFeatures?: React.ReactNode;
}

function HomeLayoutMarkdown() {
  const { frontmatter } = useFrontmatter();
  const hero = frontmatter?.hero as Hero | undefined;
  const features = frontmatter?.features as Feature[] | undefined;

  const lines: string[] = [];

  // Render hero section
  if (hero) {
    if (hero.name) {
      lines.push(`# ${hero.name}`);
      lines.push('');
    }
    if (hero.text) {
      lines.push(hero.text);
      lines.push('');
    }
    if (hero.tagline) {
      lines.push(`> ${hero.tagline}`);
      lines.push('');
    }
    if (hero.actions && hero.actions.length > 0) {
      const actionLinks = hero.actions
        .map(action => `[${action.text}](${action.link})`)
        .join(' | ');
      lines.push(actionLinks);
      lines.push('');
    }
  }

  // Render features section
  if (features && features.length > 0) {
    lines.push('## Features');
    lines.push('');
    for (const feature of features) {
      const icon = feature.icon ? `${feature.icon} ` : '';
      const title = feature.link
        ? `[${icon}**${feature.title}**](${feature.link})`
        : `${icon}**${feature.title}**`;
      lines.push(`- ${title}: ${feature.details}`);
    }
    lines.push('');
  }

  return <>{lines.join('\n')}</>;
}

export function HomeLayout(props: HomeLayoutProps) {
  if (process.env.__SSR_MD__) {
    return <HomeLayoutMarkdown />;
  }

  const {
    beforeHero,
    afterHero,
    beforeFeatures,
    afterFeatures,
    beforeHeroActions,
    afterHeroActions,
  } = props;

  return (
    <>
      <HomeBackground />
      {beforeHero}
      <HomeHero
        beforeHeroActions={beforeHeroActions}
        afterHeroActions={afterHeroActions}
      />
      {afterHero}
      {beforeFeatures}
      <HomeFeature />
      {afterFeatures}
      <HomeFooter />
    </>
  );
}
