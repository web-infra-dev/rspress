import { HomeBackground, HomeFeature, HomeFooter, HomeHero } from '@theme';

export interface HomeLayoutProps {
  beforeHero?: React.ReactNode;
  afterHero?: React.ReactNode;
  beforeHeroActions?: React.ReactNode;
  afterHeroActions?: React.ReactNode;
  beforeFeatures?: React.ReactNode;
  afterFeatures?: React.ReactNode;
}

export function HomeLayout(props: HomeLayoutProps) {
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
