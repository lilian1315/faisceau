/**
 * Faisceau is a tiny opinionated wrapper around [`alien-signals`](https://github.com/stackblitz/alien-signals) that exposes class-based helpers for signals and computed values. It keeps the ergonomics of alien-signals while providing:
 *
 * - `Signal` and `Computed` classes with `get`, `peek`, and `set` helpers.
 * - Type guards (`isSignal`, `isComputed`) for narrowing.
 * - A safe `peek` helper implemented via `setActiveSub` so side reads do not create subscriptions.
 * - A simple `batch` helper that pairs `startBatch`/`endBatch`.
 * - Full re-export of the underlying alien-signals API so you do not lose low-level access.
 *
 * @module
 */

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
