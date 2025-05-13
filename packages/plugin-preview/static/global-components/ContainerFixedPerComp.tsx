import { NoSSR, usePageData, withBase } from '@rspress/core/runtime';

type ContainerProps = {
  children: React.ReactNode[];
  isMobile: 'true' | 'false';
  demoId: string;
};

const ContainerFixedPerComp: React.FC<ContainerProps> = props => {
  const { children, demoId } = props;
  const { page } = usePageData();
  const url = `/~demo/${demoId}`;

  const getPageUrl = () => {
    if (page?.devPort) {
      return `http://localhost:${page.devPort}/${demoId}`;
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${withBase(url)}`;
    }
    // Do nothing in ssr
    return '';
  };

  return (
    <NoSSR>
      <div className="rspress-preview">
        <div className="rspress-preview-wrapper">
          <div
            className="rspress-preview-code"
            onClick={() => {
              const fixedIframe = document.querySelector(
                '.rspress-fixed-iframe',
              );
              fixedIframe?.setAttribute('src', getPageUrl());
            }}
          >
            {children?.[0]}
          </div>
        </div>
      </div>
    </NoSSR>
  );
};

export default ContainerFixedPerComp;
