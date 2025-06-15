import typescript from '@rollup/plugin-typescript';
import ts from 'typescript';

// 共通の外部依存関係
const commonExternal = ['react', 'react-dom', 'react/jsx-runtime', '@noraneko/id-sdk'];
const nextjsExternal = [...commonExternal, 'next/server', 'next/headers', 'next/navigation'];

// 共通のTypeScript設定
const createTsPlugin = (declaration = false, outDir = 'dist') => typescript({
  typescript: ts,
  sourceMap: true,
  declaration,
  declarationMap: declaration,
  outDir,
  allowImportingTsExtensions: false
});

// ビルド設定生成ヘルパー
const createBuild = (input, output, external, tsOptions = {}) => ({
  input,
  output,
  plugins: [createTsPlugin(tsOptions.declaration, tsOptions.outDir)],
  external
});

export default [
  // Main package builds
  createBuild('src/index.ts', {
    file: 'dist/index.esm.js',
    format: 'es',
    sourcemap: true,
    banner: "'use client';"
  }, commonExternal, { declaration: true }),

  createBuild('src/index.ts', {
    file: 'dist/index.js',
    format: 'cjs',
    sourcemap: true,
    exports: 'named',
    banner: "'use client';"
  }, commonExternal),

  // Next.js package builds
  createBuild('src/nextjs/index.ts', {
    file: 'dist/nextjs/index.esm.js',
    format: 'es',
    sourcemap: true
  }, nextjsExternal, { declaration: true, outDir: 'dist/nextjs' }),

  createBuild('src/nextjs/index.ts', {
    file: 'dist/nextjs/index.js',
    format: 'cjs',
    sourcemap: true,
    exports: 'named'
  }, nextjsExternal, { outDir: 'dist/nextjs' }),

  // Next.js Client builds
  createBuild('src/nextjs/client/index.ts', {
    file: 'dist/nextjs/client.esm.js',
    format: 'es',
    sourcemap: true,
    banner: "'use client';"
  }, commonExternal, { declaration: true, outDir: 'dist/nextjs' }),

  createBuild('src/nextjs/client/index.ts', {
    file: 'dist/nextjs/client.js',
    format: 'cjs',
    sourcemap: true,
    exports: 'named',
    banner: "'use client';"
  }, commonExternal, { outDir: 'dist/nextjs' }),

  // Next.js Server builds
  createBuild('src/nextjs/server/index.ts', {
    file: 'dist/nextjs/server.esm.js',
    format: 'es',
    sourcemap: true
  }, nextjsExternal, { declaration: true, outDir: 'dist/nextjs' }),

  createBuild('src/nextjs/server/index.ts', {
    file: 'dist/nextjs/server.js',
    format: 'cjs',
    sourcemap: true,
    exports: 'named'
  }, nextjsExternal, { outDir: 'dist/nextjs' })
];