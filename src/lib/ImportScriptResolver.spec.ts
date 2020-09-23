import {expect} from 'chai';
import {ImportScriptResolver} from './ImportScriptResolver';

describe('ImportScriptResolver', () => {
  describe('constructor', () => {
    function init(loader: any): (() => ImportScriptResolver) {
      return () => new ImportScriptResolver('.', loader);
    }

    it('Should error if loader is an empty string', () => {
      expect(init('')).to.throw('Loader cannot be an empty string');
    });

    it('Should error if loader is a non-string non-function', () => {
      expect(init(null)).to.throw('Invalid moduleLoader option');
    });
  });

  describe('resolve', () => {
    it('Should resolve to a constant string', () => {
      const random = Math.random().toString();
      const resolver = new ImportScriptResolver('.', random);
      expect(resolver.resolve([])).to.eq(random);
    });

    it('Should throw if function can\'t find a result', () => {
      const resolver = new ImportScriptResolver('.', () => false);
      expect(() => resolver.resolve([])).to
        .throw('moduleLoader did not match any files. See the "bundle" property on this error for a file list.');
    });

    it('Should return chunk found by function', () => {
      const resolver = new ImportScriptResolver('/ci/', () => true);
      const chunk = {fileName: Math.random()};
      expect(resolver.resolve([chunk as any])).to.eq(`/ci/${chunk.fileName}`);
    });
  });
});
