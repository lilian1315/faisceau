# Faisceau

Faisceau is a tiny opinionated wrapper around [`alien-signals`](https://github.com/stackblitz/alien-signals) that exposes class-based helpers for signals and computed values. It keeps the ergonomics of alien-signals while providing:

- `Signal` and `Computed` classes with `get`, `peek`, and `set` helpers.
- Type guards (`isSignal`, `isComputed`) for narrowing.
- A safe `peek` and `untracked` helpers implemented via `setActiveSub` so side reads do not create subscriptions.
- A simple `batch` helper that pairs `startBatch`/`endBatch`.
- Full re-export of the underlying alien-signals API so you do not lose low-level access.

## Installation

```bash
pnpm add faisceau
```

## Quick start

```ts
import { batch, computed, effect, signal } from 'faisceau'

const count = signal(0)
const double = computed(() => count.get() * 2)
const status = signal<'idle' | 'dirty'>('idle')

effect(() => {
  console.log(
    'count is',
    count.get(),
    'double is',
    double.get(),
    'status is',
    status.peek(), // peek avoids subscribing the effect to status changes
  )
})

count.set(1)
console.log(double.get()) // 2

// Update several signals in one go without retriggering the effect for `status`
batch(() => {
  status.set('dirty')
  count.set(count.get() + 1)
  status.set('idle')
})
```

Because Faisceau re-exports everything from `alien-signals`, you can still import granular primitives when you need them:

```ts
import { effect, effectScope, endBatch, setActiveSub, startBatch } from 'faisceau'
```

## API

### `signal<T>(initialValue: T): Signal<T>`

Creates a `Signal` instance backed by alien-signals.

- `get()` returns the current value and tracks.
- `peek()` returns the current value without tracking (temporarily clears the active subscriber).
- `set(value: T)` updates the value.

### `computed<T>(getter: (previousValue?: T) => T): Computed<T>`

Creates a `Computed` instance backed by alien-signals.

- `get()` returns the derived value and tracks dependencies.
- `peek()` reads the current value without tracking.

### `isSignal<T>` / `isComputed<T>(obj)` / `isReactive(obj)`

Runtime guards that let TypeScript narrow when working with mixed values.

### `batch(fn: () => void)`

Runs `fn` between `startBatch` and `endBatch`, letting alien-signals flush subscribers once.

### `untracked<T>(fn: () => T): T`

Temporarily clears the active subscriber while running `fn`, so reads performed
inside the callback do not become dependencies of the currently active
subscriber. Effects created inside the callback are not parented to the active
subscriber.

Example:

```ts
import { effect, signal, untracked } from 'faisceau'

const count = signal(0)

effect(() => {
  // This effect will not be subscribed to `count` reads done inside `untracked`.
  console.log('effect ran')
  untracked(() => {
    // reading here won't make the outer effect depend on `count`
    console.log('peek-like read', count.get())
  })
})

count.set(1) // only triggers the inner reads' effects if they were created
```

## `unwrap<T>(value: T | Reactive<T>): T`

Returns the underlying value of a reactive instance, or the value itself if it is not reactive.  
Useful when you want to work with the raw value regardless of whether it’s reactive.

## `when(condition: () => boolean): Promise<void>`

Returns a promise that resolves once a reactive-aware condition becomes true.
The condition re-evaluates whenever its reactive dependencies change.

Example:

```ts
import { signal, when } from 'faisceau'

const ready = signal(false)

when(() => ready.get()).then(() => {
  console.log('Ready is true!')
})

// Later
ready.set(true)
```

## `whenEqual<T>(a: MayBeReactive<T>, b: MayBeReactive<T>): Promise<void>`

Returns a promise that resolves when two values become strictly equal (===).
Works with reactive and non-reactive values. Throws CannotBecomeEqualError if both values are non-reactive and already different.

Example:

```ts
import { signal, when } from 'faisceau'

const ready = signal(false)

when(() => ready.get()).then(() => {
  console.log('Ready is true!')
})

// Later
ready.set(true)
```

## License

MIT
