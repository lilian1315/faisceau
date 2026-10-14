import {
  effect,
  effectScope,
  endBatch,
  isReactive,
  MaybeReactive,
  Reactive,
  setActiveSub,
  startBatch,
} from './core'

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
