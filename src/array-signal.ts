import { batch, Signal } from './core'

export class ArraySignal<T> extends Signal<Array<T>> implements Array<T> {
  [n: number]: T

  constructor(initialValue: Array<T>) {
    super(proxify(initialValue, () => this.trigger()))

    return new Proxy(this, {
      get(target, prop, receiver) {
        return typeof prop === 'string' && prop.match(/^\d+$/)
          ? target.get()[Number(prop)]
          : Reflect.get(target, prop, receiver)
      },

      set(target, prop, value, receiver) {
        return typeof prop === 'string' && prop.match(/^\d+$/)
          ? (target.get()[Number(prop)] = value)
          : Reflect.set(target, prop, value, receiver)
      },
    })
  }

  set(value: Array<T>) {
    return super.set(proxify(value, () => this.trigger()))
  }

  get [Symbol.iterator]() {
    return this.get()[Symbol.iterator]
  }

  get [Symbol.unscopables]() {
    return this.get()[Symbol.unscopables]
  }

  get length() {
    return this.get().length
  }

  set length(value: number) {
    this.get().length = value
  }

  copyWithin(...args: Parameters<Array<T>['copyWithin']>) {
    return batch(() => {
      this.get().copyWithin(...args)
      return this
    })
  }

  fill(...args: Parameters<Array<T>['fill']>) {
    return batch(() => {
      this.get().fill(...args)
      return this
    })
  }

  pop() {
    return batch(() => this.get().pop())
  }

  push(...args: Parameters<Array<T>['push']>) {
    return batch(() => this.get().push(...args))
  }

  reverse() {
    return batch(() => this.get().reverse())
  }

  shift() {
    return batch(() => this.get().shift())
  }

  sort(...args: Parameters<Array<T>['sort']>) {
    return batch(() => {
      this.get().sort(...args)
      return this
    })
  }

  splice(...args: Parameters<Array<T>['splice']>) {
    return batch(() => this.get().splice(...args))
  }

  unshift(...args: Parameters<Array<T>['unshift']>) {
    return batch(() => this.get().unshift(...args))
  }

  at(...args: Parameters<Array<T>['at']>) {
    return this.get().at(...args)
  }

  concat(...args: Parameters<Array<T>['concat']>) {
    return this.get().concat(...args)
  }

  entries() {
    return this.get().entries()
  }

  every<S extends T>(
    predicate: (value: T, index: number, array: T[]) => value is S,
    thisArg?: any,
  ): this is S[]
  every(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): boolean
  every(...args: Parameters<Array<T>['every']>) {
    return this.get().every(...args)
  }

  filter(...args: Parameters<Array<T>['filter']>) {
    return this.get().filter(...args)
  }

  find(...args: Parameters<Array<T>['find']>) {
    return this.get().find(...args)
  }

  findIndex(...args: Parameters<Array<T>['findIndex']>) {
    return this.get().findIndex(...args)
  }

  findLast(...args: Parameters<Array<T>['findLast']>) {
    return this.get().findLast(...args)
  }

  findLastIndex(...args: Parameters<Array<T>['findLastIndex']>) {
    return this.get().findLastIndex(...args)
  }

  flat<A, D extends number = 1>(this: A, depth?: D): FlatArray<A, D>[]
  flat(...args: Parameters<Array<T>['flat']>) {
    return this.get().flat(...args)
  }

  flatMap<U, This = undefined>(
    callback: (this: This, value: T, index: number, array: T[]) => U | ReadonlyArray<U>,
    thisArg?: This,
  ): U[]
  flatMap(...args: Parameters<Array<T>['flatMap']>) {
    return this.get().flatMap(...args)
  }

  forEach(...args: Parameters<Array<T>['forEach']>) {
    return this.get().forEach(...args)
  }

  includes(...args: Parameters<Array<T>['includes']>) {
    return this.get().includes(...args)
  }

  indexOf(...args: Parameters<Array<T>['indexOf']>) {
    return this.get().indexOf(...args)
  }

  join(...args: Parameters<Array<T>['join']>) {
    return this.get().join(...args)
  }

  keys() {
    return this.get().keys()
  }

  lastIndexOf(...args: Parameters<Array<T>['lastIndexOf']>) {
    return this.get().lastIndexOf(...args)
  }

  map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[]
  map(...args: Parameters<Array<T>['map']>) {
    return this.get().map(...args)
  }

  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T): T
  reduce(
    callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
    initialValue: T,
  ): T
  reduce<U>(
    callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U,
    initialValue: U,
  ): U
  reduce(callbackfn: any, initialValue?: any) {
    return this.get().reduce(callbackfn, initialValue)
  }

  reduceRight(
    callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
  ): T
  reduceRight(
    callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
    initialValue: T,
  ): T
  reduceRight<U>(
    callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U,
    initialValue: U,
  ): U
  reduceRight(callbackfn: any, initialValue?: any) {
    return this.get().reduceRight(callbackfn, initialValue)
  }

  slice(...args: Parameters<Array<T>['slice']>) {
    return this.get().slice(...args)
  }

  some(...args: Parameters<Array<T>['some']>) {
    return this.get().some(...args)
  }

  toReversed() {
    return this.get().toReversed()
  }

  toSorted(...args: Parameters<Array<T>['toSorted']>) {
    return this.get().toSorted(...args)
  }

  toSpliced(...args: Parameters<Array<T>['toSpliced']>) {
    return this.get().toSpliced(...args)
  }

  toLocaleString(
    locales: string | string[],
    options?: Intl.NumberFormatOptions & Intl.DateTimeFormatOptions,
  ): string
  toLocaleString(): string
  toLocaleString(locales?: any, options?: any) {
    return locales ? this.get().toLocaleString(locales, options) : this.get().toLocaleString()
  }

  toString() {
    return this.get().toString()
  }

  values() {
    return this.get().values()
  }

  with(...args: Parameters<Array<T>['with']>) {
    return this.get().with(...args)
  }
}

function proxify<T>(value: Array<T>, trigger: () => void) {
  return new Proxy(value, {
    set: (target, prop, value, receiver) => {
      let noTrigger = prop === 'length' && target.length === value
      const res = Reflect.set(target, prop, value, receiver)

      if (!noTrigger) trigger()
      return res
    },
  })
}

/**
 * Factory that creates a mutable `Signal` instance.
 *
 * @param initialValue - Initial value stored in the signal.
 */
export function arraySignal<T>(initialValue: Array<T>): ArraySignal<T> {
  return new ArraySignal(initialValue)
}

/**
 * Type guard that checks whether an object is a `Signal` instance.
 */
export function isArraySignal<T>(obj: unknown): obj is ArraySignal<T> {
  return obj instanceof ArraySignal
}
