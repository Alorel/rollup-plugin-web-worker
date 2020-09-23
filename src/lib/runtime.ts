import {OutputPlugin} from 'rollup';
import {ABSOLUTE_PATHS, PLUGIN_OPTS} from './symbols';
import {createOutputPlugin} from './outputPlugin';
import {createErrorPlugin, createPlugin} from './plugin';
import {InputOnlyPlugin} from '../types/InputOnlyPlugin';
import {
  RollupWebWorkerPluginOpts as PluginOpts,
  RollupWebWorkerPluginOutputOpts as OutputOpts
} from '../types/PluginOpts';

/** Main plugin host */
export class RollupWebWorkerPlugin {

  /** @internal */
  public readonly [PLUGIN_OPTS]: Required<PluginOpts>;

  /**
   * key = `web-worker-url:<absolute-path>`
   * value = `<absolute-path>`
   * @internal
   */
  public readonly [ABSOLUTE_PATHS]: Map<string, string>;

  private _pluginCreated: boolean;

  public constructor(pluginOpts?: PluginOpts) {
    Object.defineProperty(this, PLUGIN_OPTS, {
      value: {
        name: '[name]',
        ...pluginOpts
      }
    });
    Object.defineProperty(this, ABSOLUTE_PATHS, {value: new Map()});
  }

  /** Create a plugin for formatting the output */
  public createOutputPlugin(opts: OutputOpts): OutputPlugin { // eslint-disable-line class-methods-use-this
    return createOutputPlugin(opts);
  }

  /** Create a plugin for generating the output */
  public createPlugin(): InputOnlyPlugin {
    if (this._pluginCreated) {
      return createErrorPlugin(
        new Error('createPlugin() can only be called once per instance of RollupWebWorkerPlugin')
      );
    }

    const plugin = createPlugin(this);
    Object.defineProperty(this, '_pluginCreated', {value: true});

    return plugin;
  }
}
