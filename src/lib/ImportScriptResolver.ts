import type {OutputAsset, OutputChunk} from 'rollup';
import type {RollupWebWorkerPluginModuleLoaderFunction} from '../types/PluginOpts';

/** @internal */
export class ImportScriptResolver {
  public readonly resolve: (bundle: Array<OutputAsset | OutputChunk>) => string;

  private _loader: RollupWebWorkerPluginModuleLoaderFunction;

  public constructor(
    private readonly _publicPath: string,
    loader: string | RollupWebWorkerPluginModuleLoaderFunction
  ) {
    switch (typeof loader) {
      case 'string':
        if (!loader) {
          throw new Error('Loader cannot be an empty string');
        }
        this.resolve = () => loader;
        break;
      case 'function':
        this._loader = loader;
        this.resolve = this.load;
        break;
      default:
        throw new Error('Invalid moduleLoader option');
    }
  }

  private load(bundle: Array<OutputAsset | OutputChunk>): string {
    const found = bundle.find(this._loader);
    if (!found) {
      const err = new Error('moduleLoader did not match any files. See the "bundle" property on this error for a file list.');
      (err as any).bundle = bundle;

      throw err;
    }

    return this._publicPath + found.fileName;
  }
}
