import { it, expect, describe, vi } from 'vite-plus/test'
import { CannotBecomeEqualError, signal, when, whenEqual } from '../src/index.ts'
import { sleep } from './utils.ts'

describe('when', () => {
  it('should resolve when the condition is true', async () => {
    let promise = vi.fn(() => when(() => true))

    void promise()
    await sleep(1)
    expect(promise).toHaveResolved()
  })

  it('should resolve when the condition become true', async () => {
    let ready = signal(false)
    let promise = vi.fn(() => when(() => ready.get() === true))

    void promise()
    await sleep(1)
    expect(promise).not.toHaveResolved()
    ready.set(true)
    await sleep(1)
    expect(promise).toHaveResolved()
  })
})

describe('whenEqual', () => {
  it('should resolve when not-reactive values are equal', async () => {
    let promise = vi.fn(() => whenEqual('a' as any, 'a' as any))

    void promise()
    await sleep(1)
    expect(promise).toHaveResolved()
  })

  it('should reject when not-reactive values are not equal', async () => {
    await expect(whenEqual('a', 'b')).rejects.toThrow(CannotBecomeEqualError)
  })

  it('should resolve when the values become true', async () => {
    let ready = signal(false)
    let promise = vi.fn(() => whenEqual(ready, true))

    void promise()
    await sleep(1)
    expect(promise).not.toHaveResolved()
    ready.set(true)
    await sleep(1)
    expect(promise).toHaveResolved()
  })
})
