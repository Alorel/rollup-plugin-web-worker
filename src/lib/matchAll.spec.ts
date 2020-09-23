import {expect} from 'chai';
import {matchAll} from './matchAll';

describe('matchAll', function () {
  it('Should return null on no match', () => {
    expect(matchAll(/a/, 'b')).to.eq(null);
  });

  describe('valid match array', () => {
    const str = 'bar|foo|qux|foo|baz';
    const extract = (m: RegExpExecArray) => ({
      idx: m.index,
      input: m.input,
      length: m.length,
      one: m[1],
      zero: m[0]
    });
    let first: ReturnType<typeof extract>;
    let second: typeof first;
    let fullResult: RegExpExecArray[];

    before('Run', () => {
      fullResult = matchAll(/f(o{2})/, str)!;
      first = extract(fullResult[0]);
      second = extract(fullResult[1]);
    });

    it('Should have two results', () => {
      expect(fullResult.length).to.eq(2);
    });

    const specs: Array<[string, () => typeof first, number]> = [
      ['First result', () => first, 4],
      ['Second result', () => second, 12]
    ];

    for (const [label, getResult, expectedIndex] of specs) {
      describe(label, () => {
        let result: typeof first;
        before('Get result', () => {
          result = getResult();
        });

        it('Element 0 should be "foo"', () => {
          expect(result.zero).to.eq('foo');
        });

        it('Element 1 should be "oo"', () => {
          expect(result.one).to.eq('oo');
        });

        it(`Input should be ${str}`, () => {
          expect(result.input).to.eq(str);
        });

        it('Length should be 2', () => {
          expect(result.length).to.eq(2);
        });

        it(`Index should be ${expectedIndex}`, () => {
          expect(result.idx).to.eq(expectedIndex);
        });
      });
    }
  });
});
