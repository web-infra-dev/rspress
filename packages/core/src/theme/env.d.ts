declare module '*.module.scss';
declare module '*.scss';
declare module '*.css';

declare module '*.svg' {
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare const __WEBPACK_PUBLIC_PATH__: string;

declare module '@theme' {
  export * from '#theme';
}
