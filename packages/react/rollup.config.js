import typescript from '@rollup/plugin-typescript';
import ts from 'typescript';

export default [
  // ES Module build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true,
      banner: "'use client';"
    },
    plugins: [
      typescript({
        typescript: ts,
        sourceMap: true,
        declaration: true,
        declarationMap: true,
        outDir: 'dist',
        allowImportingTsExtensions: false
      })
    ],
    external: ['react', 'react-dom', 'react/jsx-runtime', '@noraneko/id-sdk']
  },
  
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
      banner: "'use client';"
    },
    plugins: [
      typescript({
        typescript: ts,
        sourceMap: true,
        declaration: false,
        allowImportingTsExtensions: false
      })
    ],
    external: ['react', 'react-dom', 'react/jsx-runtime', '@noraneko/id-sdk']
  }
];