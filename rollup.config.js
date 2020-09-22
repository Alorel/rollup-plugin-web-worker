import {join} from 'path';
import {cleanPlugin} from '@alorel/rollup-plugin-clean';
import {copyPkgJsonPlugin} from '@alorel/rollup-plugin-copy-pkg-json';
import {copyPlugin} from '@alorel/rollup-plugin-copy';
import nodeResolve from '@rollup/plugin-node-resolve';
import {promises as fs} from 'fs';
import {threadedTerserPlugin} from '@alorel/rollup-plugin-threaded-terser';
import {dtsPlugin} from '@alorel/rollup-plugin-dts';
import * as pkgJson from './package.json';
import typescript from 'rollup-plugin-typescript2';

const umdName = 'MyLibrary';
const umdGlobals = {};

const distDir = join(__dirname, 'dist');
const srcDir = join(__dirname, 'src');
const bundleDir = join(distDir, 'bundle');

const clean$ = cleanPlugin({dir: distDir});
const banner$ = fs.readFile(join(__dirname, 'LICENSE'), 'utf8')
  .then(f => `/*\n${f.trim()}\n*/\n`);

function mkNodeResolve() {
  return nodeResolve({
    extensions: ['.js', '.ts'],
    mainFields: [
      'fesm5',
      'esm5',
      'module',
      'browser',
      'main'
    ]
  });
}

const baseInput = join(srcDir, 'index.ts');

const baseSettings = {
  external: Array.from(
    new Set(
      Object.keys(Object.keys(pkgJson.dependencies || {}))
        .concat(Object.keys(pkgJson.peerDependencies || {}))
        .filter(p => !p.startsWith('@types/'))
    )
  ),
  input: join(srcDir, 'index.ts'),
  preserveModules: true,
  watch: {
    exclude: 'node_modules/*'
  }
};

const baseOutput = {
  assetFileNames: '[name][extname]',
  entryFileNames: '[name].js',
  sourcemap: false
};

export default function ({watch}) { // eslint-disable-line max-lines-per-function,@typescript-eslint/explicit-module-boundary-types
  const cjs = {
    ...baseSettings,
    input: baseInput,
    output: {
      ...baseOutput,
      dir: distDir,
      format: 'cjs',
      plugins: watch ?
        [] :
        [
          copyPkgJsonPlugin({
            unsetPaths: ['devDependencies', 'scripts']
          }),
          dtsPlugin({
            cliArgs: ['--rootDir', 'src']
          })
        ]
    },
    plugins: [
      clean$,
      !watch && copyPlugin({
        copy: ['LICENSE', 'CHANGELOG.md', 'README.md'],
        defaultOpts: {
          emitNameKind: 'fileName',
          glob: {
            cwd: __dirname
          }
        }
      }),
      mkNodeResolve(),
      typescript()
    ].filter(Boolean)
  };

  if (watch) {
    return cjs;
  }

  return [
    cjs,
    {
      ...baseSettings,
      input: baseInput,
      output: {
        ...baseOutput,
        dir: join(distDir, 'esm2015'),
        format: 'es'
      },
      plugins: [mkNodeResolve(), typescript()]
    },
    {
      ...baseSettings,
      input: baseInput,
      output: {
        ...baseOutput,
        dir: join(distDir, 'esm5'),
        format: 'es'
      },
      plugins: [
        mkNodeResolve(),
        typescript({
          tsconfigOverride: {
            compilerOptions: {
              target: 'es5'
            }
          }
        })
      ]
    },
    {
      ...baseSettings,
      output: [
        {
          ...baseOutput,
          banner: () => banner$,
          dir: bundleDir,
          entryFileNames: 'fesm5.js',
          format: 'es'
        }
      ],
      plugins: [
        mkNodeResolve(),
        typescript({
          tsconfigOverride: {
            compilerOptions: {
              target: 'es5'
            }
          }
        })
      ],
      preserveModules: false
    },
    {
      ...baseSettings,
      output: [
        {
          ...baseOutput,
          banner: () => banner$,
          dir: bundleDir,
          entryFileNames: 'fesm2015.js',
          format: 'es'
        }
      ],
      plugins: [mkNodeResolve(), typescript()],
      preserveModules: false
    },
    {
      ...baseSettings,
      output: (() => {
        const base = {
          ...baseOutput,
          banner: () => banner$,
          dir: bundleDir,
          format: 'umd',
          globals: umdGlobals,
          name: umdName
        };

        return [
          {
            ...base,
            entryFileNames: 'umd.js'
          },
          {
            ...base,
            entryFileNames: 'umd.min.js',
            plugins: [
              threadedTerserPlugin({
                terserOpts: {
                  compress: {
                    drop_console: true,
                    ecma: 5,
                    keep_infinity: true,
                    typeofs: false
                  },
                  ecma: 5,
                  ie8: true,
                  mangle: {
                    safari10: true
                  },
                  output: {
                    comments: false,
                    ie8: true,
                    safari10: true
                  },
                  safari10: true,
                  sourceMap: false
                }
              })
            ]
          }
        ];
      })(),
      plugins: [
        mkNodeResolve(),
        typescript({
          tsconfigOverride: {
            compilerOptions: {
              target: 'es5'
            }
          }
        })
      ],
      preserveModules: false
    }
  ].filter(Boolean);
}
