/// <reference types='@modern-js/module-tools/types' />

declare module 'playground-imports' {
  const getImport: (name: string, getDefault?: boolean) => void;
  export default getImport;
}
