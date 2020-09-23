/** Regex for matching a web worker import */
const regImport = /^web-worker-url:(.+)$/;

/** @internal */
export class ImportFormatter {
  public static isWebWorkerUrl(id: string): boolean {
    return regImport.test(id);
  }

  public static match(id: string): string | null {
    const m = regImport.exec(id);

    return m ? m[1] : null;
  }

  public static toWebWorkerUrl(path: string): string {
    return `web-worker-url:${path}`;
  }
}
