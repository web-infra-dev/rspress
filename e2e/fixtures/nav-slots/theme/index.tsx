import { Layout as BasicLayout, NavList } from '@rspress/core/theme-original';

export * from '@rspress/core/theme-original';

export function Layout() {
  return (
    <BasicLayout
      beforeLeftNavItems={
        <NavList items={[{ text: 'BL', link: '/target', position: 'right' }]} />
      }
      afterLeftNavItems={
        <>
          <NavList items={[]} />
          <NavList items={[{ text: 'AL', link: '/target' }]} />
        </>
      }
      beforeRightNavItems={
        <NavList items={[{ text: 'BR', link: '/target' }]} />
      }
      afterRightNavItems={
        <NavList
          items={[
            { text: 'AR', link: '/target', position: 'left' },
            {
              text: 'More',
              items: [
                {
                  text: 'Nested',
                  items: [{ text: 'Target', link: '/target' }],
                },
              ],
            },
          ]}
        />
      }
    />
  );
}
