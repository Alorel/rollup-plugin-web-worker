import {expect} from 'chai';
import {EmittedFile} from 'rollup';
import {SinonSpy, spy} from 'sinon';
import {RefPair} from '../types/RefPair';
import {createRefPair} from './createRefPair';

describe('createRefPair', function () {
  let emitFile: SinonSpy<[EmittedFile], string>;
  let response: RefPair;

  before('Run', () => {
    emitFile = spy((file: EmittedFile): string => `ci:formatted:${file.name}`);
    response = createRefPair({emitFile}, 'ci:rawId', 'ci:chunkName');
  });

  it('Should return the correct loaderRef', () => {
    expect(response.loaderRef).to.eq('ci:formatted:ci:chunkName-loader.js');
  });

  it('Should return the correct chunkRef', () => {
    expect(response.chunkRef).to.eq('ci:formatted:ci:chunkName');
  });

  it('Should have emitted a correct loaderRef', () => {
    expect(emitFile.lastCall.lastArg).to.deep.eq({
      name: 'ci:chunkName-loader.js',
      source: '♥web-worker-loader-chunkRef:ci:formatted:ci:chunkName',
      type: 'asset'
    });
  });

  it('Should have emitted a correct chunkRef', () => {
    expect(emitFile.firstCall.lastArg).to.deep.eq({
      id: 'ci:rawId',
      name: 'ci:chunkName',
      type: 'chunk'
    });
  });
});
