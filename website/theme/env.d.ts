declare module '*.module.scss';
declare module '*.scss';
declare module '*.css';

interface ImportMetaEnv {
  readonly SSG_MD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
