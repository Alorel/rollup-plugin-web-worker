import MagicString from 'magic-string';
import type {OutputPlugin, PluginContext} from 'rollup';
import {RollupWebWorkerPluginOutputOpts as OutputOpts} from '../index';
import {ImportFormatter} from './ImportFormatter';
import {ImportScriptResolver} from './ImportScriptResolver';
import {matchAll} from './matchAll';
import {OutputGenerator} from './OutputGenerator';
import {Strings} from '../types/Strings';

function createFakePlugin(error: Error): OutputPlugin {
  return {
    name: Strings.OUTPUT_PLUGIN_NAME,
    outputOptions(this: PluginContext) {
      this.error(error);
    }
  };
}

/** @internal */
export function createOutputPlugin(opts: OutputOpts): OutputPlugin { // eslint-disable-line max-lines-per-function
  if (!opts) {
    return createFakePlugin(new Error('Web worker plugin output options missing'));
  }

  const {
    moduleLoader,
    publicPath = '/'
  } = opts;

  let importResolver: ImportScriptResolver;
  try {
    importResolver = new ImportScriptResolver(publicPath, moduleLoader);
  } catch (e) {
    return createFakePlugin(e);
  }

  return {
    generateBundle({sourcemap}, bundle) {
      const bundleValues = Object.values(bundle);
      const importScript = importResolver.resolve(bundleValues);
      const gen = new OutputGenerator(this, importScript, sourcemap, publicPath);

      for (const chunk of bundleValues) {
        if (!gen.matches(chunk)) {
          continue;
        }

        const ms = gen.generateContent(chunk);

        chunk.source = gen.generateSourceMap(ms, chunk).toString();
      }
    },
    name: Strings.OUTPUT_PLUGIN_NAME,
    renderChunk(this: PluginContext, code, chunk, {sourcemap}) {
      if (!Object.keys(chunk.modules).some(ImportFormatter.isWebWorkerUrl, ImportFormatter)) {
        // Chunk doesn't import any web workers
        return null;
      }

      const importMatches = matchAll(/♥web-worker-loader:([a-zA-Z0-9]+)♥/, code);
      if (!importMatches) {
        this.error(`Chunk ${chunk.name} has a web worker url module in its dependency tree, but an associated import can't be found.`);
      }

      const ms = new MagicString(code);

      for (let i = importMatches!.length - 1; i > -1; i--) {
        const match = importMatches[i];
        const url: string = publicPath + this.getFileName(match[1]);

        ms.overwrite(match.index, match.index + match[0].length, url);
      }

      return sourcemap ?
        {code: ms.toString(), map: ms.generateMap({hires: true})} :
        {code: ms.toString(), map: {mappings: ''}};
    },
    renderStart(this: PluginContext, {format}) {
      if (format !== 'system') {
        this.error('Only systemjs output format supported');
      }
    }
  };
}
