/**
 * Typed, class-based wrappers and helpers around the underlying `alien-signals` primitives.
 * The module re-exports everything from `alien-signals` while adding ergonomic wrappers and helpers.
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
