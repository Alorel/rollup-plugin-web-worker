import {promises as fs} from 'fs';
import {isAbsolute} from 'path';
import {PluginContext} from 'rollup';
import type {InputOnlyPlugin} from '../types/InputOnlyPlugin';
import {Strings} from '../types/Strings';
import {ChunkNameResolver} from './ChunkNameResolver';
import {createRefPair} from './createRefPair';
import {ImportFormatter} from './ImportFormatter';
import type {RollupWebWorkerPlugin} from './runtime';
import {ABSOLUTE_PATHS, PLUGIN_OPTS} from './symbols';

/** @internal */
export function createErrorPlugin(error: Error): InputOnlyPlugin {
  return {
    buildStart() {
      this.error(error);
    },
    name: Strings.PLUGIN_NAME
  };
}

/** @internal */
export function createPlugin(runtime: RollupWebWorkerPlugin): InputOnlyPlugin {
  const absolutePaths = runtime[ABSOLUTE_PATHS];
  let chunkNameResolver: ChunkNameResolver;
  try {
    chunkNameResolver = new ChunkNameResolver(runtime[PLUGIN_OPTS].name);
  } catch (e) {
    return createErrorPlugin(e);
  }

  return {
    load(id) {
      const realPath = absolutePaths.get(id);

      return realPath ? fs.readFile(realPath, 'utf8') : null;
    },
    name: Strings.PLUGIN_NAME,
    async resolveId(this: PluginContext, id, importee) {
      const relativePath = ImportFormatter.match(id);

      if (!relativePath) {
        return null;
      } else if (isAbsolute(relativePath)) {
        return relativePath;
      } else if (!importee) {
        this.error('web-worker-url cannot point to a build entrypoint');
      }

      const absolute = (await this.resolve(relativePath, importee))?.id;
      if (!absolute) {
        this.error(`Cannot resolve ${relativePath} from ${importee}`);
      }
      this.addWatchFile(absolute);

      const formatted = ImportFormatter.toWebWorkerUrl(absolute);
      absolutePaths.set(formatted, absolute);

      return formatted;
    },
    transform(_code, rawId) {
      const id = absolutePaths.get(rawId);
      if (!id) {
        return null;
      }

      const chunkName = chunkNameResolver.resolve(id);
      const {loaderRef} = createRefPair(this, rawId, chunkName);

      return {
        code: `export default ${JSON.stringify(`♥web-worker-loader:${loaderRef}♥`)}`,
        map: {mappings: ''}
      };
    }
  };
}
