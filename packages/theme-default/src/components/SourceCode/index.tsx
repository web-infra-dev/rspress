import Github from '@theme-assets/github';
import Gitlab from '@theme-assets/gitlab';
import { useLocaleSiteData } from '../../logic';
import styles from './index.module.scss';
import { SvgWrapper } from '../SvgWrapper';

interface SourceCodeProps {
  href: string;
  platform?: 'github' | 'gitlab';
}

export function SourceCode(props: SourceCodeProps) {
  const { href, platform = 'github' } = props;
  const { sourceCodeText = 'Source' } = useLocaleSiteData();
  return (
    <div
      className={`inline-block rounded border border-solid border-gray-light-3 dark:border-divider text-gray-400 ${styles.sourceCode}`}
    >
      <a
        href={href}
        target="_blank"
        className="flex items-center content-center transition-all duration-300 text-xs block px-2 py-1 "
      >
        <span className="mr-2 inline-flex w-4 h-4">
          {<SvgWrapper icon={platform === 'gitlab' ? Gitlab : Github} />}
        </span>
        <span>{sourceCodeText}</span>
      </a>
    </div>
  );
}
