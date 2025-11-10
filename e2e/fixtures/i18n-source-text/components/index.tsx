import { useI18n } from '@rspress/core/runtime';

export const Foo = () => {
  const t = useI18n<any>();
  return (
    <>
      <div>{t('Foo')}</div>
      <div>{t('config')}</div>
      <div>{t('config-json')}</div>
      <div>{t('config-plugin')}</div>
      <div>{t('shouldFallbackToEn')}</div>
    </>
  );
};
