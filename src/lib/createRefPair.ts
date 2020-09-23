import type {PluginContext} from 'rollup';
import type {RefPair} from '../types/RefPair';

/** @internal */
export function createRefPair(ctx: Pick<PluginContext, 'emitFile'>, rawId: string, chunkName: string): RefPair {
  const chunkRef = ctx.emitFile({
    id: rawId,
    name: chunkName,
    type: 'chunk'
  });

  const loaderRef = ctx.emitFile({
    name: `${chunkName}-loader.js`,
    source: `♥web-worker-loader-chunkRef:${chunkRef}`,
    type: 'asset'
  });

  return {chunkRef, loaderRef};
}
