import type { DemoInfo } from './types';

interface VirtualModulesPlugin {
  writeModule(filePath: string, contents: string): void;
}

export class VirtualModuleStore {
  contents: Map<string, string> = new Map();
  demos: DemoInfo = {};
  isDirty = false;
  mainVMP: VirtualModulesPlugin | null = null;
  iframeVMP: VirtualModulesPlugin | null = null;

  writeModule(absolutePath: string, content: string): void {
    // Skip if content unchanged to prevent HMR loops
    if (this.contents.get(absolutePath) === content) {
      return;
    }
    this.contents.set(absolutePath, content);
    this.mainVMP!.writeModule(absolutePath, content);
    this.iframeVMP!.writeModule(absolutePath, content);
  }

  getAllModules(): Record<string, string> {
    return Object.fromEntries(this.contents);
  }
}
