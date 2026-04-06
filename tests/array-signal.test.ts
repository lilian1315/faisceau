import { it, expect, describe, vi } from 'vite-plus/test'
import { arraySignal, effect } from '../src/index.ts'

describe('ArraySignal', () => {
  it('should support "push" behavior and trigger reactivity', () => {
    const s = arraySignal(['a', 'b'])
    const fn = vi.fn(() => s.get())

    effect(fn)

    expect(fn).toHaveBeenCalledTimes(1)
    s.push('c')
    expect(fn).toHaveBeenCalledTimes(2)
    expect(s.get()).toStrictEqual(['a', 'b', 'c'])
    s.push()
    expect(fn).toHaveBeenCalledTimes(2) // no trigger on push without values
    expect(s.get()).toStrictEqual(['a', 'b', 'c'])
  })

  it('should support "pop" behavior and trigger reactivity', () => {
    const s = arraySignal(['a', 'b', 'c'])
    const fn = vi.fn(() => s.get())

    effect(fn)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(s.pop()).toBe('c')
    expect(s.get()).toStrictEqual(['a', 'b'])
    expect(fn).toHaveBeenCalledTimes(2)
    expect(s.pop()).toBe('b')
    expect(s.get()).toStrictEqual(['a'])
    expect(fn).toHaveBeenCalledTimes(3)
    expect(s.pop()).toBe('a')
    expect(s.get()).toStrictEqual([])
    expect(fn).toHaveBeenCalledTimes(4)
    expect(s.pop()).toBeUndefined()
    expect(s.get()).toStrictEqual([])
    expect(fn).toHaveBeenCalledTimes(4) // no trigger on pop from empty array
  })

  it('should support "shift" behavior and trigger reactivity', () => {
    const s = arraySignal(['a', 'b', 'c'])
    const fn = vi.fn(() => s.get())

    effect(fn)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(s.shift()).toBe('a')
    expect(s.get()).toStrictEqual(['b', 'c'])
    expect(fn).toHaveBeenCalledTimes(2)
    expect(s.shift()).toBe('b')
    expect(s.get()).toStrictEqual(['c'])
    expect(fn).toHaveBeenCalledTimes(3)
    expect(s.shift()).toBe('c')
    expect(s.get()).toStrictEqual([])
    expect(fn).toHaveBeenCalledTimes(4)
    expect(s.shift()).toBeUndefined()
    expect(s.get()).toStrictEqual([])
    expect(fn).toHaveBeenCalledTimes(4) // no trigger on shift from empty array
  })

  it('should support "unshift" behavior and trigger reactivity', () => {
    const s = arraySignal(['b', 'c'])
    const fn = vi.fn(() => s.get())

    effect(fn)

    expect(fn).toHaveBeenCalledTimes(1)
    s.unshift('a')
    expect(s.get()).toStrictEqual(['a', 'b', 'c'])
    expect(fn).toHaveBeenCalledTimes(2)
    s.unshift()
    expect(s.get()).toStrictEqual(['a', 'b', 'c'])
    expect(fn).toHaveBeenCalledTimes(2) // no trigger on unshift without values
  })

  it('should support "splice" behavior and trigger reactivity', () => {
    const s = arraySignal(['a', 'b', 'c', 'd'])
    const fn = vi.fn(() => s.get())

    effect(fn)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(s.splice(1, 2, 'x', 'y')).toStrictEqual(['b', 'c'])
    expect(fn).toHaveBeenCalledTimes(2)
    expect(s.get()).toStrictEqual(['a', 'x', 'y', 'd'])
    expect(s.splice(0, 0, 'z')).toStrictEqual([])
    expect(fn).toHaveBeenCalledTimes(3)
    expect(s.get()).toStrictEqual(['z', 'a', 'x', 'y', 'd'])
    expect(s.splice(0, 0)).toStrictEqual([])
    expect(fn).toHaveBeenCalledTimes(3) // no trigger when splice doesn't change array
    expect(s.get()).toStrictEqual(['z', 'a', 'x', 'y', 'd'])
  })

  it('should support "sort" behavior and trigger reactivity', () => {
    const s = arraySignal([3, 1, 2])
    const fn = vi.fn(() => s.get())

    effect(fn)

    expect(fn).toHaveBeenCalledTimes(1)
    s.sort((a, b) => a - b)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(s.get()).toStrictEqual([1, 2, 3])
  })

  it('should support "reverse" behavior and trigger reactivity', () => {
    const s = arraySignal(['a', 'b', 'c'])
    const fn = vi.fn(() => s.get())

    effect(fn)

    expect(fn).toHaveBeenCalledTimes(1)
    s.reverse()
    expect(fn).toHaveBeenCalledTimes(2)
    expect(s.get()).toStrictEqual(['c', 'b', 'a'])

    const s2 = arraySignal<string>([])
    const fn2 = vi.fn(() => arraySignal)

    effect(fn2)

    expect(fn2).toHaveBeenCalledTimes(1)
    s2.reverse()
    expect(fn2).toHaveBeenCalledTimes(1)
  })

  it('should support "fill" behavior and trigger reactivity', () => {
    const s = arraySignal(['a', 'b', 'c', 'd'])
    const fn = vi.fn(() => s.get())

    effect(fn)
    expect(fn).toHaveBeenCalledTimes(1)
    s.fill('x', 1, 3)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(s.get()).toStrictEqual(['a', 'x', 'x', 'd'])
    s.fill('a')
    expect(fn).toHaveBeenCalledTimes(3)
    expect(s.get()).toStrictEqual(['a', 'a', 'a', 'a'])
    s.fill('b', 1)
    expect(fn).toHaveBeenCalledTimes(4)
    expect(s.get()).toStrictEqual(['a', 'b', 'b', 'b'])
    s.fill('c', -1)
    expect(fn).toHaveBeenCalledTimes(5)
    expect(s.get()).toStrictEqual(['a', 'b', 'b', 'c'])
    s.fill('d', undefined, 1)
    expect(fn).toHaveBeenCalledTimes(6)
    expect(s.get()).toStrictEqual(['d', 'b', 'b', 'c'])
    s.fill('e', undefined, -1)
    expect(fn).toHaveBeenCalledTimes(7)
    expect(s.get()).toStrictEqual(['e', 'e', 'e', 'c'])
    s.fill('f', 1, -1)
    expect(fn).toHaveBeenCalledTimes(8)
    expect(s.get()).toStrictEqual(['e', 'f', 'f', 'c'])
    s.fill('g', -3, 3)
    expect(fn).toHaveBeenCalledTimes(9)
    expect(s.get()).toStrictEqual(['e', 'g', 'g', 'c'])
    s.fill('h', -1, 1)
    expect(fn).toHaveBeenCalledTimes(9) // no trigger when fill doesn't change array
    s.fill('i', -1, -1)
    expect(fn).toHaveBeenCalledTimes(9) // no trigger when fill doesn't change array
    s.fill('j', 4)
    expect(fn).toHaveBeenCalledTimes(9) // no trigger when fill doesn't change array
    s.fill('l', undefined, 0)
    expect(fn).toHaveBeenCalledTimes(9) // no trigger when fill doesn't change array
    s.fill('m', undefined, -4)
    expect(fn).toHaveBeenCalledTimes(9) // no trigger when fill doesn't change array
    s.fill('n', 3, -1)
    expect(fn).toHaveBeenCalledTimes(9) // no trigger when fill doesn't change array
    expect(s.get()).toStrictEqual(['e', 'g', 'g', 'c'])

    const s2 = arraySignal<string>([])
    const fn2 = vi.fn(() => s.get())

    effect(fn2)
    expect(fn2).toHaveBeenCalledTimes(1)

    s2.fill('a')
    expect(fn2).toHaveBeenCalledTimes(1) // no trigger when fill doesn't change array
    s2.fill('b', 1)
    expect(fn2).toHaveBeenCalledTimes(1) // no trigger when fill doesn't change array
    s2.fill('c', -1)
    expect(fn2).toHaveBeenCalledTimes(1) // no trigger when fill doesn't change array
    s2.fill('d', undefined, 1)
    expect(fn2).toHaveBeenCalledTimes(1) // no trigger when fill doesn't change array
    s2.fill('e', undefined, -1)
    expect(fn2).toHaveBeenCalledTimes(1) // no trigger when fill doesn't change array
    s2.fill('f', -1, 1)
    expect(fn2).toHaveBeenCalledTimes(1) // no trigger when fill doesn't change array
    s2.fill('g', 1, -1)
    expect(fn2).toHaveBeenCalledTimes(1) // no trigger when fill doesn't change array
    s2.fill('h', -1, -1)
    expect(fn2).toHaveBeenCalledTimes(1) // no trigger when fill doesn't change array
    expect(s2.get()).toStrictEqual([])
  })

  it('should support "copyWithin" behavior and trigger reactivity', () => {
    const s = arraySignal(['a', 'b', 'c', 'd'])
    const fn = vi.fn(() => s.get())

    effect(fn)
    expect(fn).toHaveBeenCalledTimes(1)
    s.copyWithin(0, 2)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(s.get()).toStrictEqual(['c', 'd', 'c', 'd'])
    s.copyWithin(0, 0, 0)
    expect(fn).toHaveBeenCalledTimes(2) // no trigger when copyWithin doesn't change array
    expect(s.get()).toStrictEqual(['c', 'd', 'c', 'd'])
  })

  it('should support non-mutating methods and return the same results as Array', () => {
    const s = arraySignal([1, 2, 3])

    expect(s.map((x) => x * 2)).toStrictEqual([2, 4, 6])
    expect(s.filter((x) => x > 1)).toStrictEqual([2, 3])
    expect(s.find((x) => x > 2)).toBe(3)
    expect(s.includes(2)).toBe(true)
    expect(s.join(',')).toBe('1,2,3')
    expect(s.slice(1, 2)).toStrictEqual([2])
  })

  it('should not trigger reactivity on non-mutating methods', () => {
    const s = arraySignal([1, 2, 3])
    const fn = vi.fn(() => s.get())

    effect(fn)

    expect(fn).toHaveBeenCalledTimes(1)
    s.map((x) => x * 2)
    s.filter((x) => x > 1)
    s.find((x) => x > 2)
    s.includes(2)
    s.join(',')
    s.slice(1, 2)
    s.concat([4])
    s.indexOf(1)
    s.lastIndexOf(3)
    s.every((x) => x > 0)
    s.some((x) => x === 2)
    s.findIndex((x) => x === 2)
    s.toString()
    s.toLocaleString()
    s.flat()
    s.flatMap((x) => [x])
    s.forEach(() => {})
    s.reduce((a, b) => a + b, 0)
    s.reduceRight((a, b) => a + b, 0)
    s.at(1)
    s.at(-1)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should support length getter and trigger reactivity', () => {
    const s = arraySignal(['a', 'b', 'c'])
    const fn = vi.fn(() => s.length)

    effect(fn)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(s.length).toBe(3)
    s.push('d')
    expect(fn).toHaveBeenCalledTimes(2)
    expect(s.length).toBe(4)
  })

  it('should support length setter and trigger reactivity', () => {
    const s = arraySignal(['a', 'b', 'c', 'd'])
    const fn = vi.fn(() => s.get())

    effect(fn)
    expect(fn).toHaveBeenCalledTimes(1)
    s.length = 2
    expect(fn).toHaveBeenCalledTimes(2)
    expect(s.get()).toStrictEqual(['a', 'b'])
  })

  it('should proxy numeric index access correctly', () => {
    const s = arraySignal(['a', 'b', 'c'])

    expect(s[0]).toBe('a')
    expect(s[1]).toBe('b')
    expect(s[2]).toBe('c')
  })

  it('should ensure that effects and computeds subscribe to the ArraySignal source when accessing by numeric index', () => {
    const s = arraySignal(['a', 'b', 'c'])
    const fn = vi.fn(() => s[1])

    effect(fn)

    expect(fn).toHaveBeenCalledTimes(1)
    s.trigger()
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should allow to set arbitrary value to the source array by numeric index', () => {
    const s = arraySignal(['a', 'b', 'd'])

    s[2] = 'c'
    expect(s.get()).toStrictEqual(['a', 'b', 'c'])
    s[4] = 'e'
    // oxlint-disable-next-line no-sparse-arrays
    expect(s.get()).toStrictEqual(['a', 'b', 'c', , 'e'])
  })

  it('should trigger reactivity when setting by numeric index', () => {
    const s = arraySignal(['a', 'b', 'd'])
    const fn = vi.fn(() => s.get())

    effect(fn)

    expect(fn).toHaveBeenCalledTimes(1)
    s[2] = 'c'
    expect(fn).toHaveBeenCalledTimes(2)
    expect(s.get()).toStrictEqual(['a', 'b', 'c'])
  })

  it('should support Symbol.iterator and iterate correctly', () => {
    const s = arraySignal(['a', 'b', 'c'])
    const items = []

    for (const item of s) {
      items.push(item)
    }

    expect(items).toStrictEqual(['a', 'b', 'c'])
  })

  it('should support additional array methods and return correct values', () => {
    const s = arraySignal(['a', 'b', 'c', 'a'])

    expect(s.concat(['d'])).toStrictEqual(['a', 'b', 'c', 'a', 'd'])
    expect(Array.from(s.entries())).toStrictEqual([
      [0, 'a'],
      [1, 'b'],
      [2, 'c'],
      [3, 'a'],
    ])
    expect(Array.from(s.keys())).toStrictEqual([0, 1, 2, 3])
    expect(Array.from(s.values())).toStrictEqual(['a', 'b', 'c', 'a'])
    expect(s.every((x) => typeof x === 'string')).toBe(true)
    expect(s.some((x) => x === 'b')).toBe(true)
    expect(s.findIndex((x) => x === 'c')).toBe(2)
    expect(s.indexOf('a')).toBe(0)
    expect(s.lastIndexOf('a')).toBe(3)
    expect(s.join('-')).toBe('a-b-c-a')
    expect(s.toString()).toBe('a,b,c,a')
    expect(s.toLocaleString()).toBe('a,b,c,a')
    expect(s.at(1)).toBe('b')
    expect(s.at(-1)).toBe('a')
  })

  it('should support flat and flatMap and return flattened results', () => {
    const s = arraySignal([1, [2, 3], 4])

    expect(s.flat(1)).toStrictEqual([1, 2, 3, 4])
    expect(s.flatMap((x) => (Array.isArray(x) ? x : [x]))).toStrictEqual([1, 2, 3, 4])
  })

  it('should support forEach and execute callback for each element', () => {
    const s = arraySignal([1, 2, 3])
    const items: number[] = []

    s.forEach((x) => items.push(x * 2))
    expect(items).toStrictEqual([2, 4, 6])
  })

  it('should support reduce and reduceRight and accumulate values correctly', () => {
    const s = arraySignal([1, 2, 3])

    expect(s.reduce((sum, x) => sum + x, 0)).toBe(6)
    expect(s.reduceRight((str, x) => str + x, '')).toBe('321')
  })

  it('should support setting a new array has the source and keep reactivity', () => {
    const s = arraySignal(['a', 'b', 'c'])
    const fn = vi.fn(() => s.get())

    effect(fn)

    expect(fn).toHaveBeenCalledTimes(1)
    s.set(['d', 'e', 'f'])
    expect(fn).toHaveBeenCalledTimes(2)
    expect(s.get()).toStrictEqual(['d', 'e', 'f'])
    s.set(s.get().concat('g'))
    expect(fn).toHaveBeenCalledTimes(3)
    expect(s.get()).toStrictEqual(['d', 'e', 'f', 'g'])
  })

  const methods: Extract<keyof Array<any>, string>[] = [
    'at',
    'concat',
    'copyWithin',
    'entries',
    'every',
    'fill',
    'filter',
    'find',
    'findIndex',
    'findLast',
    'findLastIndex',
    'flat',
    'flatMap',
    'forEach',
    'includes',
    'indexOf',
    'join',
    'keys',
    'lastIndexOf',
    'map',
    'pop',
    'push',
    'reduce',
    'reduceRight',
    'reverse',
    'shift',
    'slice',
    'some',
    'sort',
    'splice',
    'toLocaleString',
    'toReversed',
    'toSorted',
    'toSpliced',
    'toString',
    'unshift',
    'values',
    'with',
  ] as const

  it.each(methods.map((m) => [m]))(
    `should not subscribe to ArraySignal source when accessing "%s" method`,
    (method) => {
      const s = arraySignal<string>([])
      const fn1 = vi.fn(() => s[method])
      effect(fn1)
      expect(fn1).toHaveBeenCalledTimes(1)
      s.trigger()
      expect(fn1).toHaveBeenCalledTimes(1)
    },
  )
})
