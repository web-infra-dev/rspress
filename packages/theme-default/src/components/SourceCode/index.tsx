import { useLocaleSiteData } from '../../logic';
import Github from '../../assets/github.svg';
import Gitlab from '../../assets/gitlab.svg';
import styles from './index.module.scss';

interface SourceCodeProps {
  href: string;
  platform?: 'github' | 'gitlab';
}

export function SourceCode(props: SourceCodeProps) {
  const { href, platform = 'github' } = props;
  const { sourceCodeText = 'Source' } = useLocaleSiteData();
  return (
    <div
      className={`inline-block rounded border border-solid border-gray-300 text-gray-400 ${styles.sourceCode}`}
    >
      <a
        href={href}
        target="_blank"
        className="flex items-center content-center transition-all duration-300 text-xs block px-2 py-1 "
      >
        <span className="mr-2 inline-flex w-4 h-4">
          {platform === 'gitlab' ? <Gitlab /> : <Github />}
        </span>
        <span>{sourceCodeText}</span>
      </a>
    </div>
  );
}
