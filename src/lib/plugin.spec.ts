import {join} from 'path';
import {rollup} from 'rollup';
import {createErrorThrowingCtx} from '../../test/error-throwing-ctx';
import {FIXTURES_DIR} from '../../test/fixtures-dir';
import {expect} from '../../test/promise-chai';
import {RollupWebWorkerPlugin} from './runtime';

describe('createPlugin', () => {

  it('Should throw if ChunkNameResolver throws', () => {
    const build = rollup({
      input: join(FIXTURES_DIR, 'index.js'),
      plugins: [
        new RollupWebWorkerPlugin({name: ''}).createPlugin()
      ]
    });

    return expect(build).to.eventually.be
      .rejectedWith('Chunk name resolve function can\'t be an empty string');
  });

  it('Should throw if input is a web worker url', () => {
    const plugin = new RollupWebWorkerPlugin().createPlugin();
    const call = () => {
      return plugin.resolveId!.call(createErrorThrowingCtx(), 'web-worker-url:./foo.js', undefined, {} as any);
    };

    return expect(call()).to.eventually.rejectedWith('web-worker-url cannot point to a build entrypoint');
  });

  it('Should create web worker url module', async () => {
    const build = await rollup({
      input: join(FIXTURES_DIR, 'basic', 'index.js'),
      plugins: [
        new RollupWebWorkerPlugin().createPlugin()
      ]
    });

    const reg = /^export default "♥web-worker-loader:([a-zA-Z0-9]+)♥"$/;
    const found = build.cache!.modules
      .some(({id, code}) => id.startsWith('web-worker-url:') && reg.test(code));

    expect(found).to.eq(true);
  });
});
