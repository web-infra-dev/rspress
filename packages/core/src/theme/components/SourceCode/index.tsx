import { useI18n } from '@rspress/core/runtime';
import { SvgWrapper } from '@theme';
import Github from '@theme-assets/github';
import Gitlab from '@theme-assets/gitlab';
import './index.scss';
import { PREFIX } from '../../constant';

interface SourceCodeProps {
  href: string;
  platform?: 'github' | 'gitlab';
}

export function SourceCode(props: SourceCodeProps) {
  const { href, platform = 'github' } = props;
  const t = useI18n();
  return (
    <div className={`${PREFIX}not-doc ${PREFIX}source-code`}>
      <a href={href} target="_blank" className={`${PREFIX}source-code__link`}>
        <span className={`${PREFIX}source-code__icon`}>
          {<SvgWrapper icon={platform === 'gitlab' ? Gitlab : Github} />}
        </span>
        <span className={`${PREFIX}source-code__text`}>
          {t('sourceCodeText')}
        </span>
      </a>
    </div>
  );
}
