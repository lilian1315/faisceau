export * from 'alien-signals'

export type { Signal, Computed, Reactive, MaybeReactive } from './core.ts'

export {
  isSignal,
  isComputed,
  CannotBecomeEqualError,
  batch,
  computed,
  isReactive,
  signal,
  untracked,
  unwrap,
  when,
  whenEqual,
} from './core.ts'
