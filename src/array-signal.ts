import { batch, Signal } from './core'

export class ArraySignal<T> extends Signal<Array<T>> implements Array<T> {
  [n: number]: T

  constructor(initialValue: Array<T>) {
    super(proxify(initialValue, () => this.trigger()))

    return new Proxy(this, {
      get(target, prop, receiver) {
        return typeof prop === 'string' && prop.match(/^\d+$/)
          ? target.peek()[Number(prop)]
          : Reflect.get(target, prop, receiver)
      },

      set(target, prop, value, receiver) {
        return typeof prop === 'string' && prop.match(/^\d+$/)
          ? (target.peek()[Number(prop)] = value)
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

  get at() {
    return this.get().at.bind(this.get())
  }

  get concat() {
    return this.get().concat.bind(this.get())
  }

  get entries() {
    return this.get().entries.bind(this.get())
  }

  get every() {
    return this.get().every.bind(this.get())
  }

  get filter() {
    return this.get().filter.bind(this.get())
  }

  get find() {
    return this.get().find.bind(this.get())
  }

  get findIndex() {
    return this.get().findIndex.bind(this.get())
  }

  get findLast() {
    return this.get().findLast.bind(this.get())
  }

  get findLastIndex() {
    return this.get().findLastIndex.bind(this.get())
  }

  get flat() {
    return this.get().flat.bind(this.get())
  }

  get flatMap() {
    return this.get().flatMap.bind(this.get())
  }

  get forEach() {
    return this.get().forEach.bind(this.get())
  }

  get includes() {
    return this.get().includes.bind(this.get())
  }

  get indexOf() {
    return this.get().indexOf.bind(this.get())
  }

  get join() {
    return this.get().join.bind(this.get())
  }

  get keys() {
    return this.get().keys.bind(this.get())
  }

  get lastIndexOf() {
    return this.get().lastIndexOf.bind(this.get())
  }

  get map() {
    return this.get().map.bind(this.get())
  }

  get reduce() {
    return this.get().reduce.bind(this.get())
  }

  get reduceRight() {
    return this.get().reduceRight.bind(this.get())
  }

  get slice() {
    return this.get().slice.bind(this.get())
  }

  get some() {
    return this.get().some.bind(this.get())
  }

  get toReversed() {
    return this.get().toReversed.bind(this.get())
  }

  get toSorted() {
    return this.get().toSorted.bind(this.get())
  }

  get toSpliced() {
    return this.get().toSpliced.bind(this.get())
  }

  get toLocaleString() {
    return this.get().toLocaleString.bind(this.get())
  }

  get toString() {
    return this.get().toString.bind(this.get())
  }

  get values() {
    return this.get().values.bind(this.get())
  }

  get with() {
    return this.get().with.bind(this.get())
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
