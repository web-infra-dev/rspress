import Github from '@theme-assets/github';
import Gitlab from '@theme-assets/gitlab';
import { SvgWrapper } from '../SvgWrapper';
import './index.scss';
import { useI18n } from '@rspress/runtime';

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
          {<SvgWrapper icon={platform === 'gitlab' ? Gitlab : Github} />}
        </span>
        <span className="rp-source-code__text">{t('sourceCodeText')}</span>
      </a>
    </div>
  );
}
