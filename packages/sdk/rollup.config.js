import typescript from '@rollup/plugin-typescript';

export default [
  // ES Module build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      typescript({
        sourceMap: true,
        declaration: true,
        declarationMap: true,
        outDir: 'dist',
        allowImportingTsExtensions: false
      })
    ],
    external: []
  },
  
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      typescript({
        sourceMap: true,
        declaration: false,
        allowImportingTsExtensions: false
      })
    ],
    external: []
  },
  
  // UMD build for CDN
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'NoranekoID',
      sourcemap: true
    },
    plugins: [
      typescript({
        sourceMap: true,
        declaration: false,
        allowImportingTsExtensions: false
      })
    ],
    external: []
  }
];