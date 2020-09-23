import {expect} from 'chai';
import {ChunkNameResolver} from './ChunkNameResolver';

describe('ChunkNameResolver', function () {
  describe('constructor', () => {
    it('Should throw if name is an empty string', () => {
      expect(() => new ChunkNameResolver('')).to
        .throw('Chunk name resolve function can\'t be an empty string');
    });

    it('Should throw if name is not a string or function', () => {
      expect(() => new ChunkNameResolver(null as any)).to
        .throw('Invalid name option');
    });
  });

  describe('resolveByFunction', () => {
    it('Should call provided function', () => {
      const fn = (v: string) => v.toUpperCase();
      expect(new ChunkNameResolver(fn).resolve('foo')).to.eq('FOO');
    });
  });

  describe('resolveStringFunction', () => {
    it('Should return filename if input is [name]', () => {
      expect(new ChunkNameResolver('[name]').resolve(__filename)).to.eq('ChunkNameResolver.spec');
    });

    it('Should replace filename', () => {
      expect(new ChunkNameResolver('[name]-foo-[name]').resolve(__filename)).to
        .eq('ChunkNameResolver.spec-foo-ChunkNameResolver.spec');
    });

    it('Should resolve to a constant value', () => {
      const value = Math.random().toString();

      expect(new ChunkNameResolver(value).resolve(__filename)).to.eq(value);
    });
  });
});
