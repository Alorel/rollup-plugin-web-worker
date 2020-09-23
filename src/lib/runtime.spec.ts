import {join} from 'path';
import {rollup} from 'rollup';
import {FIXTURES_DIR} from '../../test/fixtures-dir';
import {expect} from '../../test/promise-chai';
import {RollupWebWorkerPlugin} from './runtime';

describe('RollupWebWorkerPlugin', () => {
  describe('createPlugin', () => {
    it('Should throw if called twice', () => {
      const plugin = new RollupWebWorkerPlugin();
      const build = rollup({
        input: join(FIXTURES_DIR, 'index.js'),
        plugins: [
          plugin.createPlugin(),
          plugin.createPlugin()
        ]
      });

      return expect(build).to.eventually.be
        .rejectedWith('createPlugin() can only be called once per instance of RollupWebWorkerPlugin');
    });
  });
});
