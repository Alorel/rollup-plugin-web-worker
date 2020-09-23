import {LazyGetter} from 'lazy-get-decorator';
import MagicString from 'magic-string';
import {NormalizedOutputOptions, OutputAsset, OutputChunk, PluginContext} from 'rollup';

const sourceRegex = /^♥web-worker-loader-chunkRef:([a-zA-Z0-9]+)$/;
const prefixLength = '♥web-worker-loader-chunkRef:'.length;

/** @internal */
export class OutputGenerator {

  private readonly matchMap: WeakMap<OutputAsset, RegExpExecArray> = new WeakMap();

  public constructor(
    private readonly ctx: PluginContext,
    private readonly importScript: string,
    private readonly sourcemap: NormalizedOutputOptions['sourcemap'],
    private readonly publicPath: string
  ) {
  }

  @LazyGetter()
  public get generateSourceMap(): (ms: MagicString, chunk: OutputAsset) => string {
    switch (this.sourcemap) {
      case 'inline':
        return OutputGenerator.inlineMap;
      case 'hidden':
        return this.generateHiddenMap;
      case true:
        return this.generateTrueMap;
      case false:
        return OutputGenerator.stringifyMs;
      default:
        this.ctx.warn(`Unrecognised sourcemap option: ${this.sourcemap}; skipping source map`);

        return OutputGenerator.stringifyMs;
    }
  }

  public static stringifyMs(ms: MagicString): string {
    return ms.toString();
  }

  private static inlineMap(ms: MagicString): string {
    const map: string = ms.generateMap({hires: true}).toUrl();

    return `${ms.toString()}\n//# sourceMappingURL=${map}`;
  }

  public generateContent(chunk: OutputAsset): MagicString {
    const match = this.matchMap.get(chunk)!;
    const chunkUrl = `/${this.ctx.getFileName(match[1])}`;
    const ms = new MagicString(chunk.source as string);

    return ms.remove(0, prefixLength)
      .overwrite(prefixLength, chunk.source.length, JSON.stringify(chunkUrl))
      .prepend(`importScripts(${JSON.stringify(this.importScript)});System.import(`)
      .append(');');
  }

  public matches(chunk: OutputChunk | OutputAsset): chunk is OutputAsset {
    if (chunk.type !== 'asset' || typeof chunk.source !== 'string') {
      return false;
    }

    const match = sourceRegex.exec(chunk.source);
    if (!match) {
      return false;
    }

    this.matchMap.set(chunk, match);

    return true;
  }

  private emitSourceMapFile(ms: MagicString, chunk: OutputAsset): void {
    const map = ms.generateMap({hires: true});

    this.ctx.emitFile({
      fileName: `${chunk.fileName}.map`,
      source: map.toString(),
      type: 'asset'
    });
  }

  private generateHiddenMap(ms: MagicString, chunk: OutputAsset): string {
    this.emitSourceMapFile(ms, chunk);

    return ms.toString();
  }

  private generateTrueMap(ms: MagicString, chunk: OutputAsset): string {
    this.emitSourceMapFile(ms, chunk);

    return `${ms.toString()}\n//# sourceMappingURL=${this.publicPath}${chunk.fileName}.map`;
  }
}
