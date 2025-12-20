import { defineConfig } from 'tsdown'

export default defineConfig({
  exports: true,
  entry: 'index.ts',
  platform: 'neutral',
  dts: true,
  unbundle: true,
})
