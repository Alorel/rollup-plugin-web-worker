import {expect} from 'chai';
import {OutputAsset} from 'rollup';
import {fake, SinonSpy} from 'sinon';
import {OutputGenerator} from './OutputGenerator';

describe('OutputGenerator', function () {

  describe('matches', () => {
    it('Should return false if regex doesn\'t match', () => {
      const gen = new OutputGenerator({} as any, '/', false, '/');
      const chunk: Pick<OutputAsset, 'type' | 'source'> = {
        source: 'foo',
        type: 'asset'
      };

      expect(gen.matches(chunk as OutputAsset)).to.eq(false);
    });
  });

  describe('generateSourceMap', () => {
    let warn: SinonSpy;
    let resolvedFn: any;
    before(() => {
      warn = fake();
      const ctx: any = {warn};
      resolvedFn = new OutputGenerator(ctx, '/', 'foo' as any, '/').generateSourceMap;
    });

    it('Should resolve to stringifyMs', () => {
      expect(resolvedFn).to.eq(OutputGenerator.stringifyMs);
    });

    it('Should warn', () => {
      expect(warn.callCount).to.not.eq(0, 'Wasn\'t called');
      expect(warn.lastCall?.args[0]).to
        .eq('Unrecognised sourcemap option: foo; skipping source map', 'Message');
    });
  });
});
