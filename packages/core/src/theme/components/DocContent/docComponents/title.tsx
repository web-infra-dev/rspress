import { useFrontmatter, useSite } from '@rspress/core/runtime';
import { LlmsContainer, LlmsCopyButton, LlmsViewOptions, Tag } from '@theme';
import clsx from 'clsx';
import type React from 'react';

export const H1 = (props: React.ComponentProps<'h1'>) => {
  const { className, children, ...rest } = props;

  const {
    frontmatter: { tag },
  } = useFrontmatter();

  const { site } = useSite();
  const llmsUI = site?.themeConfig?.llmsUI;
  const placement =
    typeof llmsUI === 'object' ? (llmsUI?.placement ?? 'title') : 'title';

  return (
    <>
      <h1 className={clsx('rp-toc-include', className)} {...rest}>
        {children} <Tag tag={tag} />
      </h1>
      {process.env.ENABLE_LLMS_UI && placement === 'title' && (
        <LlmsContainer>
          <LlmsCopyButton />
          <LlmsViewOptions />
        </LlmsContainer>
      )}
    </>
  );
};

export const H2 = (props: React.ComponentProps<'h2'>) => {
  const { className, ...rest } = props;
  return <h2 className={clsx('rp-toc-include', className)} {...rest} />;
};

export const H3 = (props: React.ComponentProps<'h3'>) => {
  const { className, ...rest } = props;
  return <h3 className={clsx('rp-toc-include', className)} {...rest} />;
};

export const H4 = (props: React.ComponentProps<'h4'>) => {
  const { className, ...rest } = props;
  return <h4 className={clsx('rp-toc-include', className)} {...rest} />;
};

export const H5 = (props: React.ComponentProps<'h5'>) => {
  const { className, ...rest } = props;
  return <h5 className={clsx('rp-toc-include', className)} {...rest} />;
};

export const H6 = (props: React.ComponentProps<'h6'>) => {
  const { className, ...rest } = props;
  return <h6 className={clsx('rp-toc-include', className)} {...rest} />;
};
