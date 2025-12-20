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

import { computed as _computed, signal as _signal, endBatch, setActiveSub, startBatch } from 'alien-signals'

export * from 'alien-signals'

class Signal<T> {
  private signal: ReturnType<typeof _signal<T>>

  /**
   * Create a new mutable signal.
   *
   * @param initialValue - Initial value stored in the signal.
   */
  constructor(initialValue: T) {
    this.signal = _signal<T>(initialValue)
  }

  /**
   * Read the current value while subscribing the caller.
   */
  get(): T {
    return this.signal()
  }

  /**
   * Read the current value without registering a subscription.
   */
  peek(): T {
    const previousSub = setActiveSub(undefined)
    const value = this.get()
    setActiveSub(previousSub)
    return value
  }

  /**
   * Update the stored value and notify subscribers.
   *
   * @param value - Next value to store in the signal.
   */
  set(value: T) {
    this.signal(value)
  }
}

class Computed<T> {
  private computed: ReturnType<typeof _computed<T>>

  /**
   * Create a read-only derived signal.
   *
   * @param getter - Function that derives the value from dependencies.
   */
  constructor(getter: (previousValue?: T) => T) {
    this.computed = _computed<T>(getter)
  }

  /**
   * Read the derived value while subscribing the caller.
   */
  get(): T {
    return this.computed()
  }

  /**
   * Read the derived value without registering a subscription.
   */
  peek(): T {
    const previousSub = setActiveSub(undefined)
    const value = this.get()
    setActiveSub(previousSub)
    return value
  }
}

export type { Computed, Signal }

/**
 * Factory that creates a mutable `Signal` instance.
 *
 * @param initialValue - Initial value stored in the signal.
 */
export function signal<T>(initialValue: T): Signal<T> {
  return new Signal<T>(initialValue)
}

/**
 * Type guard that checks whether an object is a `Signal` instance.
 */
export function isSignal<T>(obj: any): obj is Signal<T> {
  return obj instanceof Signal
}

/**
 * Factory that creates a read-only `Computed` instance.
 *
 * @param getter - Function that derives the value from dependencies.
 */
export function computed<T>(getter: (previousValue?: T) => T): Computed<T> {
  return new Computed<T>(getter)
}

/**
 * Type guard that checks whether an object is a `Computed` instance.
 */
export function isComputed<T>(obj: any): obj is Computed<T> {
  return obj instanceof Computed
}

/**
 * Execute a function inside a `alien-signals` batch to group updates.
 *
 * @param fn - Function whose updates should be batched.
 */
export function batch(fn: () => void): void {
  startBatch()
  fn()
  endBatch()
}

/**
 * Temporarily clears the active subscriber while running `fn`, so reads
 * performed inside the callback do not become dependencies of the currently
 * active subscriber. Effects created inside the callback are not parented to
 * the active subscriber.
 *
 * @param fn Callback function to run.
 * @returns Value returned by the callback.
 */
export function untracked<T>(fn: () => T): T {
  const prevSub = setActiveSub(undefined)
  try {
    return fn()
  } finally {
    setActiveSub(prevSub)
  }
}
