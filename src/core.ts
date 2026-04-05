import {
  computed as _computed,
  signal as _signal,
  effect,
  effectScope,
  endBatch,
  setActiveSub,
  startBatch,
  trigger,
} from 'alien-signals'

export type MaybeReactive<T> = T | Reactive<T>

export class Reactive<T> {
  constructor(protected source: ReturnType<typeof _signal<T>> | ReturnType<typeof _computed<T>>) {}

  get(): T {
    return this.source()
  }

  peek(): T {
    return untracked(() => this.source())
  }

  trigger() {
    return trigger(this.source)
  }
}

export class Signal<T> extends Reactive<T> {
  /**
   * Create a new mutable signal.
   *
   * @param initialValue - Initial value stored in the signal.
   */
  constructor(initialValue: T) {
    super(_signal(initialValue))
  }
  /**
   * Update the stored value and notify subscribers.
   *
   * @param value - Next value to store in the signal.
   */
  set(value: T) {
    this.source(value)
  }
}

export class Computed<T> extends Reactive<T> {
  /**
   * Create a read-only derived signal.
   *
   * @param getter - Function that derives the value from dependencies.
   */
  constructor(getter: (previousValue?: T) => T) {
    super(_computed(getter))
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
export function isSignal<T = any>(obj: unknown): obj is Signal<T> {
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
export function isComputed<T = any>(obj: unknown): obj is Computed<T> {
  return obj instanceof Computed
}

/**
 * Type guard that checks whether an object is a `Signal` or a `Computed` instance.
 */
export function isReactive<T = any>(obj: unknown): obj is Reactive<T> {
  return obj instanceof Reactive
}

/**
 * Execute a function inside a `alien-signals` batch to group updates.
 *
 * @param fn - Function whose updates should be batched.
 * @return The value returned by the function.
 */
export function batch<T>(fn: () => T): T {
  startBatch()
  try {
    return fn()
  } finally {
    endBatch()
  }
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

/**
 * Returns a promise that resolves when two values become strictly equal.
 *
 * The values are compared using `unwrap` and strict equality (`===`).
 *
 * @param a First value to compare.
 * @param b Second value to compare.
 *
 * @returns A promise that resolves when both values become strictly equal.
 *
 * @throws {CannotBecomeEqualError} If both values are non-reactive and different,
 * as they can never become equal.
 */
export function whenEqual<T>(a: MaybeReactive<T>, b: MaybeReactive<T>): Promise<void> {
  if (a === b) {
    return Promise.resolve()
  } else if (!isReactive(a) && !isReactive(b)) {
    return Promise.reject(new CannotBecomeEqualError())
  }

  return when(() => unwrap(a) === unwrap(b))
}

export class CannotBecomeEqualError extends Error {
  constructor() {
    super('Both values are not reactive and not equal')
    this.name = 'CannotBecomeEqualError'
  }
}

/**
 * Returns a promise that resolves when the given condition becomes true.
 *
 * The condition run inside an effect, so it will re-evaluate
 * whenever a reactive dependencies used inside it change.
 *
 * @param condition A function returning a boolean condition.
 *
 * @returns A promise that resolves when `condition()` returns `true`.
 * The promise may never resolve if the condition never becomes true.
 */
export function when(condition: () => boolean): Promise<void> {
  let resolve: (value: void) => void

  const promise = new Promise<void>((_resolve) => {
    resolve = _resolve
  })

  const cleanup = effectScope(() => {
    effect(() => {
      if (condition()) resolve()
    })
  })

  return promise.then(cleanup)
}

/**
 * Returns the underlying value of a `Reactive` instance,
 * or the value itself if it is not reactive.
 */
export function unwrap<T>(value: T | Reactive<T>): T {
  return isReactive(value) ? value.get() : value
}
