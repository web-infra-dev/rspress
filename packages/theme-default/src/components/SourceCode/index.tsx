import Github from '@theme-assets/github';
import Gitlab from '@theme-assets/gitlab';
import { useLocaleSiteData } from '../../logic/useLocaleSiteData';
import { SvgWrapper } from '../SvgWrapper';
import * as styles from './index.module.scss';

interface SourceCodeProps {
  href: string;
  platform?: 'github' | 'gitlab';
}

export function SourceCode(props: SourceCodeProps) {
  const { href, platform = 'github' } = props;
  const { sourceCodeText = 'Source' } = useLocaleSiteData();
  return (
    <div
      className={`rp-inline-block rp-rounded rp-border rp-border-solid rp-border-gray-light-3 dark:rp-border-divider rp-text-gray-400 ${styles.sourceCode}`}
    >
      <a
        href={href}
        target="_blank"
        className="rp-flex rp-items-center rp-content-center rp-transition-all rp-duration-300 rp-text-xs rp-px-2 rp-py-1"
      >
        <span className="rp-mr-2 rp-inline-flex rp-w-4 rp-h-4">
          {<SvgWrapper icon={platform === 'gitlab' ? Gitlab : Github} />}
        </span>
        <span>{sourceCodeText}</span>
      </a>
    </div>
  );
}
