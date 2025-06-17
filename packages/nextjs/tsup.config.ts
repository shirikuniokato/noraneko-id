import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'server/index': 'src/server/index.ts',
    'client/index': 'src/client/index.ts', 
    'api/index': 'src/api/index.ts',
    'middleware/index': 'src/middleware/index.ts'
  },
  format: ['esm'], // ESMのみ（シンプル）
  splitting: false, // 分割無効（server/client競合回避）
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node18',
  external: [
    'react',
    'react-dom', 
    'next',
    'next/server',
    'next/headers',
    'next/navigation',
    'server-only',
    'client-only'
  ]
})