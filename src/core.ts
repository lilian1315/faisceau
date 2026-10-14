import { createReactiveSystem, Link, ReactiveFlags, type ReactiveNode } from 'alien-signals/system'

interface EffectScopeNode extends ReactiveNode {}

interface EffectNode extends ReactiveNode {
  fn(): (() => void) | void
  cleanup: (() => void) | void
}

const reactiveSymbol = Symbol('faisceau reactive symbol')

export interface Reactive<T = any> {
  [reactiveSymbol]: true
  get(): T
}

export interface Computed<T = any> extends Reactive<T> {}

export interface Signal<T = any> extends Reactive<T> {
  set(next: T): T
}

export type MaybeReactive<T> = T | Reactive<T>

// Marks a parent (effect or scope) whose deps include at least one child
// effect. Used to gate the dispose-children-first slow path in run() so
// leaf effects (no children, no own cleanup) avoid the extra deps walk.
// The bit is outside ReactiveFlags' range and never touched by system.ts.
const HasChildEffect = 64

let cycle = 0
let runDepth = 0
let batchDepth = 0
let notifyIndex = 0
let queuedLength = 0
let activeSub: ReactiveNode | undefined

const queued: (EffectNode | undefined)[] = []
const { link, unlink, propagate, checkDirty, shallowPropagate } = createReactiveSystem({
  update(node: SignalNode | ComputedNode | EffectScopeNode): boolean {
    if (node instanceof SignalNode || node instanceof ComputedNode) {
      return node.update()
    }
    node.flags = ReactiveFlags.Mutable
    return true
  },
  notify(effect: EffectNode) {
    let insertIndex = queuedLength
    let firstInsertedIndex = insertIndex

    do {
      queued[insertIndex++] = effect
      effect.flags &= ~ReactiveFlags.Watching
      effect = effect.subs?.sub as EffectNode
      if (effect === undefined || !(effect.flags & ReactiveFlags.Watching)) {
        break
      }
    } while (true)

    queuedLength = insertIndex

    while (firstInsertedIndex < --insertIndex) {
      const left = queued[firstInsertedIndex]
      queued[firstInsertedIndex++] = queued[insertIndex]
      queued[insertIndex] = left
    }
  },
  unwatched(node: SignalNode | ComputedNode | EffectNode | EffectScopeNode) {
    if (node instanceof ComputedNode) {
      if (node.depsTail !== undefined) {
        node.flags = ReactiveFlags.Mutable | ReactiveFlags.Dirty
        disposeAllDepsInReverse(node)
      }
    } else if (node instanceof SignalNode) {
      // Nothing to do for signals, they are always mutable and never dirty until pendingValue changes
    } else if ('fn' in node) {
      effectOper.call(node)
    } else {
      effectScopeOper.call(node)
    }
  },
})

export function getActiveSub(): ReactiveNode | undefined {
  return activeSub
}

export function setActiveSub(sub?: ReactiveNode) {
  const prevSub = activeSub
  activeSub = sub
  return prevSub
}

export function getBatchDepth(): number {
  return batchDepth
}

export function startBatch() {
  ++batchDepth
}

export function endBatch() {
  if (!--batchDepth) {
    flush()
  }
}

export function isReactive(value: unknown): value is Reactive {
  return value instanceof SignalNode || value instanceof ComputedNode
}

export function isSignal(value: unknown): value is Signal {
  return value instanceof SignalNode
}

export function isComputed(value: unknown): value is Computed {
  return value instanceof ComputedNode
}

export function isEffect(fn: () => void): boolean {
  return fn.name === 'bound ' + effectOper.name
}

export function isEffectScope(fn: () => void): boolean {
  return fn.name === 'bound ' + effectScopeOper.name
}

export function signal<T>(): Signal<T | undefined>
export function signal<T>(initialValue: T): Signal<T>
export function signal<T>(initialValue?: T) {
  return new SignalNode(initialValue)
}

export function computed<T>(getter: (previousValue?: T) => T): Computed {
  return new ComputedNode(getter)
}

export function effect(fn: () => void | (() => void)): () => void {
  const e: EffectNode = {
    fn,
    cleanup: undefined,
    subs: undefined,
    subsTail: undefined,
    deps: undefined,
    depsTail: undefined,
    flags: ReactiveFlags.Watching | ReactiveFlags.RecursedCheck,
  }
  const prevSub = setActiveSub(e)
  if (prevSub !== undefined) {
    link(e, prevSub, 0)
    prevSub.flags |= HasChildEffect
  }
  try {
    ++runDepth
    e.cleanup = e.fn()
  } finally {
    --runDepth
    activeSub = prevSub
    e.flags &= ~ReactiveFlags.RecursedCheck
  }
  return effectOper.bind(e)
}

export function effectScope(fn: () => void): () => void {
  const e: EffectScopeNode = {
    deps: undefined,
    depsTail: undefined,
    subs: undefined,
    subsTail: undefined,
    flags: ReactiveFlags.Mutable,
  }
  const prevSub = setActiveSub(e)
  if (prevSub !== undefined) {
    link(e, prevSub, 0)
    prevSub.flags |= HasChildEffect
  }
  try {
    fn()
  } finally {
    activeSub = prevSub
  }
  return effectScopeOper.bind(e)
}

export function trigger(reactive: Reactive | (() => void)): void {
  const sub: ReactiveNode = {
    deps: undefined,
    depsTail: undefined,
    flags: ReactiveFlags.Watching | ReactiveFlags.RecursedCheck,
  }
  const prevSub = setActiveSub(sub)
  ++batchDepth
  try {
    if (typeof reactive === 'function') reactive()
    else reactive.get()
  } finally {
    activeSub = prevSub
    sub.flags = ReactiveFlags.None
    let link = sub.deps
    while (link !== undefined) {
      const dep = link.dep
      link = unlink(link, sub)
      const subs = dep.subs
      if (subs !== undefined) {
        propagate(subs, !!runDepth)
        shallowPropagate(subs)
      }
    }
    if (!--batchDepth) {
      flush()
    }
  }
}

function run(e: EffectNode): void {
  const flags = e.flags
  if (flags & ReactiveFlags.Dirty || (flags & ReactiveFlags.Pending && checkDirty(e.deps!, e))) {
    if (flags & HasChildEffect) {
      let link = e.depsTail
      while (link !== undefined) {
        const prev = link.prevDep
        const dep = link.dep
        if (!(dep instanceof ComputedNode || dep instanceof SignalNode)) {
          unlink(link, e)
        }
        link = prev
      }
    }
    if (e.cleanup) {
      runCleanup(e)
      if (!e.flags) {
        return
      }
    }
    e.depsTail = undefined
    e.flags = ReactiveFlags.Watching | ReactiveFlags.RecursedCheck
    const prevSub = setActiveSub(e)
    try {
      ++cycle
      ++runDepth
      e.cleanup = e.fn()
    } finally {
      --runDepth
      activeSub = prevSub
      e.flags &= ~ReactiveFlags.RecursedCheck
      purgeDeps(e)
    }
  } else if (e.deps !== undefined) {
    e.flags = ReactiveFlags.Watching | (flags & HasChildEffect)
  }
}

function flush(): void {
  try {
    while (notifyIndex < queuedLength) {
      const effect = queued[notifyIndex]!
      queued[notifyIndex++] = undefined
      run(effect)
    }
  } finally {
    while (notifyIndex < queuedLength) {
      const effect = queued[notifyIndex]!
      queued[notifyIndex++] = undefined
      effect.flags |= ReactiveFlags.Watching | ReactiveFlags.Recursed
    }
    notifyIndex = 0
    queuedLength = 0
  }
}

class ComputedNode<T = any> implements Computed<T>, ReactiveNode {
  [reactiveSymbol]: true = true
  value: T | undefined = undefined
  subs: Link | undefined = undefined
  subsTail: Link | undefined = undefined
  deps: Link | undefined = undefined
  depsTail: Link | undefined = undefined
  flags: ReactiveFlags = ReactiveFlags.Mutable | ReactiveFlags.Dirty
  getter: (oldValue: T | undefined) => T

  constructor(getter: (oldValue: T | undefined) => T) {
    this.getter = getter
  }

  get() {
    const flags = this.flags
    if (
      flags & ReactiveFlags.Dirty ||
      (flags & ReactiveFlags.Pending &&
        (checkDirty(this.deps!, this) || ((this.flags = flags & ~ReactiveFlags.Pending), false)))
    ) {
      if (this.update()) {
        const subs = this.subs
        if (subs !== undefined) {
          shallowPropagate(subs)
        }
      }
    } else if (!flags) {
      this.flags = ReactiveFlags.Mutable | ReactiveFlags.RecursedCheck
      const prevSub = setActiveSub(this)
      try {
        this.value = this.getter(this.value)
      } finally {
        activeSub = prevSub
        this.flags &= ~ReactiveFlags.RecursedCheck
      }
    }
    const sub = activeSub
    if (sub !== undefined) {
      link(this, sub, cycle)
    }
    return this.value!
  }

  update() {
    if (this.flags & HasChildEffect) {
      let link = this.depsTail
      while (link !== undefined) {
        const prev = link.prevDep
        const dep = link.dep
        if (!(dep instanceof SignalNode || dep instanceof ComputedNode)) {
          unlink(link, this)
        }
        link = prev
      }
    }
    this.depsTail = undefined
    this.flags = ReactiveFlags.Mutable | ReactiveFlags.RecursedCheck
    const prevSub = setActiveSub(this)
    try {
      ++cycle
      const oldValue = this.value
      return oldValue !== (this.value = this.getter(oldValue))
    } finally {
      activeSub = prevSub
      this.flags &= ~ReactiveFlags.RecursedCheck
      purgeDeps(this)
    }
  }
}

class SignalNode<T = any> implements Signal<T>, ReactiveNode {
  [reactiveSymbol]: true = true
  subs: Link | undefined = undefined
  subsTail: Link | undefined = undefined
  flags: ReactiveFlags = ReactiveFlags.Mutable
  currentValue: T
  pendingValue: T

  constructor(value: T) {
    this.pendingValue = this.currentValue = value
  }

  get(): T {
    if (this.flags & ReactiveFlags.Dirty) {
      if (this.update()) {
        const subs = this.subs
        if (subs !== undefined) {
          shallowPropagate(subs)
        }
      }
    }
    const sub = activeSub
    if (sub !== undefined) {
      link(this, sub, cycle)
    }
    return this.currentValue
  }

  set(value: T): T {
    this.pendingValue = value
    this.flags = ReactiveFlags.Mutable | ReactiveFlags.Dirty
    const subs = this.subs
    if (subs !== undefined) {
      propagate(subs, !!runDepth)
      if (batchDepth === 0) {
        flush()
      }
    }

    return value
  }

  update() {
    this.flags = ReactiveFlags.Mutable
    return this.currentValue !== (this.currentValue = this.pendingValue)
  }
}

function runCleanup(e: EffectNode): void {
  const cleanup = e.cleanup!
  e.cleanup = undefined
  const prevSub = activeSub
  activeSub = undefined
  try {
    cleanup()
  } finally {
    activeSub = prevSub
  }
}

function effectOper(this: EffectNode): void {
  effectScopeOper.call(this)
  if (this.cleanup) {
    runCleanup(this)
  }
}

function effectScopeOper(this: EffectScopeNode): void {
  this.flags = ReactiveFlags.None
  disposeAllDepsInReverse(this)
  const sub = this.subs
  if (sub !== undefined) {
    unlink(sub)
  }
}

function disposeAllDepsInReverse(sub: ReactiveNode): void {
  let link = sub.depsTail
  while (link !== undefined) {
    const prev = link.prevDep
    unlink(link, sub)
    link = prev
  }
}

function purgeDeps(sub: ReactiveNode) {
  const depsTail = sub.depsTail
  let dep = depsTail !== undefined ? depsTail.nextDep : sub.deps
  while (dep !== undefined) {
    dep = unlink(dep, sub)
  }
}
