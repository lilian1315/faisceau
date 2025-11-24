import { computed as _computed, signal as _signal, endBatch, setActiveSub, startBatch } from 'alien-signals'

export * from 'alien-signals'

class Signal<T> {
  private signal: ReturnType<typeof _signal<T>>
  constructor(initialValue: T) {
    this.signal = _signal<T>(initialValue)
  }

  get(): T {
    return this.signal()
  }

  peek(): T {
    const previousSub = setActiveSub(undefined)
    const value = this.get()
    setActiveSub(previousSub)
    return value
  }

  set(value: T) {
    this.signal(value)
  }
}

class Computed<T> {
  private computed: ReturnType<typeof _computed<T>>
  constructor(computeFn: () => T) {
    this.computed = _computed<T>(computeFn)
  }

  get(): T {
    return this.computed()
  }

  peek(): T {
    const previousSub = setActiveSub(undefined)
    const value = this.get()
    setActiveSub(previousSub)
    return value
  }
}

export function signal<T>(initialValue: T): Signal<T> {
  return new Signal<T>(initialValue)
}

export function isSignal<T>(obj: any): obj is Signal<T> {
  return obj instanceof Signal
}

export function computed<T>(computeFn: () => T): Computed<T> {
  return new Computed<T>(computeFn)
}

export function isComputed<T>(obj: any): obj is Computed<T> {
  return obj instanceof Computed
}

export function batch(fn: () => void): void {
  startBatch()
  fn()
  endBatch()
}
