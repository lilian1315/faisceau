import { defineConfig } from 'vite-plus'

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  pack: {
    exports: true,
    entry: 'src/index.ts',
    platform: 'neutral',
    dts: true,
    unbundle: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      'no-constant-condition': ['warn', { checkLoops: false }],
    },
  },
  fmt: {
    semi: false,
    singleQuote: true,
  },
  run: {
    cache: true,
  },
})
