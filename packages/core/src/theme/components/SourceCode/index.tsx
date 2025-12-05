import { useI18n } from '@rspress/core/runtime';
import { IconGithub, IconGitlab, SvgWrapper } from '@theme';
import './index.scss';

interface SourceCodeProps {
  href: string;
  platform?: 'github' | 'gitlab';
}

export function SourceCode(props: SourceCodeProps) {
  const { href, platform = 'github' } = props;
  const t = useI18n();
  return (
    <div className="rp-not-doc rp-source-code">
      <a href={href} target="_blank" className="rp-source-code__link">
        <span className="rp-source-code__icon">
          {
            <SvgWrapper
              icon={platform === 'gitlab' ? IconGitlab : IconGithub}
            />
          }
        </span>
        <span className="rp-source-code__text">{t('sourceCodeText')}</span>
      </a>
    </div>
  );
}
