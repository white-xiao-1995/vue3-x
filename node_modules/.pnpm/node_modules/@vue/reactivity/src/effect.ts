import { endTrack, Link, startTrack } from "./system"

export let activeSub

export class ReactiveEffect {
  constructor(public fn) { }

  deps: Link | undefined
  depsTail: Link | undefined

  tracking = false
  run() {

    const perSub = activeSub
    activeSub = this
    startTrack(this)
    try {
      return this.fn()
    } finally {
      endTrack(this)
      activeSub = perSub
    }
    // this.fn()
    // activeSub = undefined
  }
  notify() {
    this.scheduler()
  }
  scheduler() {
    this.run()
  }
}

export function effect(fn, options) {
  const e = new ReactiveEffect(fn)
  Object.assign(e, options)
  e.run()
  const runner = e.run.bind(e)
  runner.effect = e
  return runner
}