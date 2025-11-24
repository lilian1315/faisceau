# Faisceau

Faisceau is a tiny opinionated wrapper around [`alien-signals`](https://github.com/stackblitz/alien-signals) that exposes class-based helpers for signals and computed values. It keeps the ergonomics of alien-signals while providing:

- `Signal` and `Computed` classes with `get`, `peek`, and `set` helpers.
- Type guards (`isSignal`, `isComputed`) for narrowing.
- A safe `peek` helper implemented via `setActiveSub` so side reads do not create subscriptions.
- A simple `batch` helper that pairs `startBatch`/`endBatch`.
- Full re-export of the underlying alien-signals API so you do not lose low-level access.

## Installation

```bash
pnpm add faisceau
```

## Quick start

```ts
import { batch, computed, signal } from 'faisceau'

const count = signal(0)
const double = computed(() => count.get() * 2)

count.set(1)
console.log(double.get()) // 2

// Read the value without creating a subscription
const snapshot = count.peek()

// Update several signals in one go
batch(() => {
  count.set(count.get() + 1)
})
```

Because Faisceau re-exports everything from `alien-signals`, you can still import granular primitives when you need them:

```ts
import { effect, effectScope, endBatch, setActiveSub, startBatch } from 'faisceau'
```

## API

### `signal<T>(initial: T): Signal<T>`
Creates a `Signal` instance backed by alien-signals.

- `get()` returns the current value and tracks.
- `peek()` returns the current value without tracking (temporarily clears the active subscriber).
- `set(value: T)` updates the value.

### `computed<T>(fn: () => T): Computed<T>`
Creates a `Computed` instance backed by alien-signals.

- `get()` returns the derived value and tracks dependencies.
- `peek()` reads the current value without tracking.

### `isSignal(value): value is Signal<any>` / `isComputed(value): value is Computed<any>`
Runtime guards that let TypeScript narrow when working with mixed values.

### `batch(fn: () => void)`
Runs `fn` between `startBatch` and `endBatch`, letting alien-signals flush subscribers once.

## License

[MIT](./LICENSE)
