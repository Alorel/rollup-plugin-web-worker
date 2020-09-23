import {expect} from 'chai';
import {ImportFormatter} from './ImportFormatter';

describe('ImportFormatter', function () {
  describe('isWebWorkerUrl', () => {
    it('Should return true for a matching pattern', () => {
      expect(ImportFormatter.isWebWorkerUrl('web-worker-url:x')).to.eq(true);
    });

    it('Should return false for a mismatching pattern', () => {
      expect(ImportFormatter.isWebWorkerUrl(' web-worker-url:x')).to.eq(false);
    });
  });

  describe('match', () => {
    it('Should return url match for a matching pattern', () => {
      const path = Math.random().toString();
      expect(ImportFormatter.match(`web-worker-url:${path}`)).to.eq(path);
    });

    it('Should return null for a mismatching pattern', () => {
      expect(ImportFormatter.match(' web-worker-url:x')).to.eq(null);
    });
  });

  describe('toWebWorkerUrl', () => {
    it('Should format the given path', () => {
      const path = Math.random().toString();
      expect(ImportFormatter.toWebWorkerUrl(path)).to.eq(`web-worker-url:${path}`);
    });
  });
});
