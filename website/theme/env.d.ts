declare module '*.module.scss';
declare module '*.scss';
declare module '*.css';
declare module '*.jpg' {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly SSG_MD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
