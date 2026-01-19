import { useSite } from '@rspress/core/runtime';
import clsx from 'clsx';
import type React from 'react';
import { LlmsContainer, LlmsCopyButton, LlmsViewOptions } from '../../Llms';

export const H1 = (props: React.ComponentProps<'h1'>) => {
  const { className, children, ...rest } = props;
  const { site } = useSite();
  const llmsUI = site?.themeConfig?.llmsUI;
  const enableOnH1 = llmsUI?.enableOnH1;

  if (enableOnH1) {
    return (
      <>
        <h1 className={clsx('rp-toc-include', className)} {...rest}>
          {children}
        </h1>
        <LlmsContainer>
          <LlmsCopyButton />
          <LlmsViewOptions options={llmsUI?.viewOptions} />
        </LlmsContainer>
      </>
    );
  }

  return (
    <h1 className={clsx('rp-toc-include', className)} {...rest}>
      {children}
    </h1>
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
