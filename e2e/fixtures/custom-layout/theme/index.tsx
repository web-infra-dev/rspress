import {
  type LayoutProps,
  Layout as OriginalLayout,
} from '@rspress/core/theme-original';

export * from '@rspress/core/theme-original';

export function Layout(props: LayoutProps) {
  return (
    <OriginalLayout
      {...props}
      beforeOutline={
        <div data-testid="before-outline">Before custom outline content</div>
      }
      afterOutline={
        <div data-testid="after-outline">After custom outline content</div>
      }
    />
  );
}
