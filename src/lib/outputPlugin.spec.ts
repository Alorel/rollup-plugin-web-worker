import {join} from 'path';
import {
  InternalModuleFormat,
  NormalizedOutputOptions,
  OutputAsset,
  OutputChunk,
  rollup,
  RollupBuild,
  RollupOutput
} from 'rollup';
import {SinonStub, stub} from 'sinon';
import {createErrorThrowingCtx} from '../../test/error-throwing-ctx';
import {FIXTURES_DIR} from '../../test/fixtures-dir';
import {expect} from '../../test/promise-chai';
import {ImportFormatter} from './ImportFormatter';
import {RollupWebWorkerPlugin} from './runtime';

describe('createOutputPlugin', () => {
  describe('Should throw when...', () => {
    let plugin: RollupWebWorkerPlugin;
    let build: RollupBuild;

    beforeEach('Build', async () => {
      plugin = new RollupWebWorkerPlugin();
      build = await rollup({
        input: join(FIXTURES_DIR, 'index.js'),
        plugins: [
          plugin.createPlugin()
        ]
      });
    });

    it('Output options not given', () => {
      const bundle$ = build.generate({
        plugins: [plugin.createOutputPlugin(null as any)]
      });

      return expect(bundle$).to.eventually.be
        .rejectedWith('Web worker plugin output options missing');
    });

    it('ImportScriptResolver throws', () => {
      const bundle$ = build.generate({
        plugins: [plugin.createOutputPlugin({moduleLoader: ''})]
      });

      return expect(bundle$).to.eventually
        .rejectedWith('Loader cannot be an empty string');
    });

    // This is only hackable in commonjs mode
    it('Unable to find url module', () => {
      let isWebWorkerUrlStub: SinonStub = null as any;
      try {
        isWebWorkerUrlStub = stub(ImportFormatter, 'isWebWorkerUrl');
        isWebWorkerUrlStub.returns(true);

        const p = plugin.createOutputPlugin({
          moduleLoader: '/foo'
        });
        const ctx = createErrorThrowingCtx();
        const chunk: any = {
          modules: {foo: null},
          name: 'ci:testchunk'
        };
        const run = () => p.renderChunk!.call(ctx, '', chunk, {} as any);

        return expect(run).to
          .throw('Chunk ci:testchunk has a web worker url module in its dependency tree, but an associated import can\'t be found.');
      } finally {
        isWebWorkerUrlStub?.restore();
      }
    });

    describe('Should throw when output format is...', () => {
      const unsupportedFormats: InternalModuleFormat[] = [
        'amd',
        'cjs',
        'es',
        'iife',
        'umd'
      ];

      for (const format of unsupportedFormats) {
        it(format, () => {
          const bundle$ = build.generate({
            format,
            plugins: [plugin.createOutputPlugin({moduleLoader: '/'})]
          });

          return expect(bundle$).to.eventually.be
            .rejectedWith('Only systemjs output format supported');
        });
      }
    });
  });

  describe('Basic shared dependency build', () => {
    let bundle: RollupOutput['output'];

    before('Generate bundle', async () => {
      const plugin = new RollupWebWorkerPlugin();
      const build = await rollup({
        input: join(FIXTURES_DIR, 'basic', 'index.js'),
        plugins: [
          plugin.createPlugin(),
          plugin.createOutputPlugin({
            moduleLoader: '/ci:systemjs',
            publicPath: '/ci/'
          })
        ]
      });
      const entryFileNames = '[name].js';
      const generated = await build.generate({
        assetFileNames: '[name][extname]',
        chunkFileNames: entryFileNames,
        entryFileNames,
        format: 'system'
      });
      bundle = generated.output;
    });

    it('Should have 4 items', () => {
      expect(bundle.length).to.eq(4);
    });

    it('Should have a shared dependency chunk', () => {
      const chunk = bundle.some(c => c.type === 'chunk' && c.fileName === 'shared-dependency.js');
      expect(chunk).to.eq(true);
    });

    describe('Worker chunk', function () {
      let chunk: OutputChunk;

      before('Find entry chunk', () => {
        chunk = bundle.find((c): c is OutputChunk => c.fileName === 'worker.js')!;
      });

      it('Should exist', () => {
        expect(!!chunk).to.eq(true);
      });

      it('Should import shared dependency', () => {
        expect(chunk?.imports).to.contain('shared-dependency.js');
      });
    });

    describe('Loader asset', function () {
      let chunk: OutputAsset;

      before('Find loader chunk', () => {
        chunk = bundle.find((c): c is OutputAsset => c.name === 'worker-loader.js')!;
      });

      it('Should exist', () => {
        expect(!!chunk).eq(true);
      });

      it('Source should match expected', () => {
        expect(chunk?.source).to.eq('importScripts("/ci:systemjs");System.import("/worker.js");');
      });

      it('Should be an asset', () => {
        expect(chunk?.type).to.eq('asset');
      });
    });

    describe('Entry chunk', function () {
      let chunk: OutputChunk;

      before('Find entry chunk', () => {
        chunk = bundle[0];
      });

      it('Should import shared dependency', () => {
        expect(chunk.imports).to.contain('shared-dependency.js');
      });

      it('Should include web worker url', () => {
        expect(chunk.code).to.match(/var webWorkerUrl = "\/ci\/worker-loader\.js";/);
      });
    });
  });

  describe('Source map', () => {
    let build: RollupBuild;
    let bundle: RollupOutput['output'];

    function generate(sourcemap: NormalizedOutputOptions['sourcemap']): () => Promise<void> {
      return async () => {
        const entryFileNames = '[name].js';
        const result = await build.generate({
          assetFileNames: '[name][extname]',
          chunkFileNames: entryFileNames,
          entryFileNames,
          format: 'systemjs',
          sourcemap
        });

        bundle = result.output;
      };
    }

    function expectMapFile(shouldExist: boolean): () => void {
      return () => {
        const match = bundle.find(c => c.type === 'asset' && c.fileName === 'worker-loader.js.map');

        expect(!!match).to.eq(shouldExist);
      };
    }

    function getWorkerLoaderSource(): string {
      return bundle
        .find((c): c is OutputAsset => c.fileName === 'worker-loader.js')!.source as string;
    }

    function expectNoSourceMap(): void {
      expect(getWorkerLoaderSource()).to.not.include('sourceMappingURL');
    }

    before('Build', async () => {
      const plugin = new RollupWebWorkerPlugin();
      build = await rollup({
        input: join(FIXTURES_DIR, 'basic', 'index.js'),
        plugins: [
          plugin.createPlugin(),
          plugin.createOutputPlugin({moduleLoader: '/'})
        ]
      });
    });

    describe('true', () => {
      before(generate(true));
      it('Should have a map file', expectMapFile(true));

      it('Should link to map file', () => {
        expect(getWorkerLoaderSource()).to.match(/\/\/# sourceMappingURL=\/worker-loader\.js\.map$/);
      });
    });

    describe('false', () => {
      before(generate(false));
      it('Should not have a map file', expectMapFile(false));
      it('Should not include source map', expectNoSourceMap);
    });

    describe('inline', () => {
      before(generate('inline'));
      it('Should not have a map file', expectMapFile(false));

      it('Should inline the sourcemap', () => {
        expect(getWorkerLoaderSource()).to
          .match(/\/\/# sourceMappingURL=data:application\/json/);
      });
    });

    describe('hidden', () => {
      before(generate('hidden'));
      it('Should have a map file', expectMapFile(true));
      it('Should not link to source map', expectNoSourceMap);
    });
  });
});
