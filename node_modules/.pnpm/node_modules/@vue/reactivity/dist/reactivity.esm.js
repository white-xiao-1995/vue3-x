// packages/reactivity/src/system.ts
var linkPool;
function link(dep, sub) {
  const currentDep = sub.depsTail;
  const nextDep = currentDep === void 0 ? sub.deps : currentDep.nextDep;
  if (nextDep && nextDep.dep === dep) {
    sub.depsTail = nextDep;
    console.log("\u76F8\u540C\u7684\u4F9D\u8D56\u9879\uFF0C\u76F4\u63A5\u590D\u7528");
    return;
  }
  let newLink;
  if (linkPool) {
    console.log("\u590D\u7528linkPool");
    newLink = linkPool;
    linkPool = linkPool.nextDep;
    newLink.nextDep = nextDep;
    newLink.dep = dep;
    newLink.sub = sub;
  } else {
    newLink = {
      sub,
      nextSub: void 0,
      perSub: void 0,
      dep,
      nextDep
    };
  }
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink;
    newLink.perSub = dep.subsTail;
    dep.subsTail = newLink;
  } else {
    dep.subs = newLink;
    dep.subsTail = newLink;
  }
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink;
    sub.depsTail = newLink;
  } else {
    sub.deps = newLink;
    sub.depsTail = newLink;
  }
}
function propagate(subs) {
  let link2 = subs;
  let queuedEffect = [];
  while (link2) {
    const sub = link2.sub;
    if (!sub.tracking) {
      queuedEffect.push(link2.sub);
    }
    link2 = link2.nextSub;
  }
  queuedEffect.forEach((effect2) => effect2.notify());
}
function startTrack(sub) {
  sub.tracking = true;
  sub.depsTail = void 0;
}
function endTrack(sub) {
  sub.tracking = false;
  if (sub.depsTail?.nextDep) {
    clearTracking(sub.depsTail.nextDep);
    sub.depsTail.nextDep = void 0;
  } else if (!sub.depsTail && sub.deps) {
    clearTracking(sub.deps);
    sub.deps = void 0;
  }
}
function clearTracking(link2) {
  while (link2) {
    const { dep, perSub, nextSub, nextDep } = link2;
    if (perSub) {
      perSub.nextSub = nextSub;
      link2 = void 0;
    } else {
      dep.subs = nextSub;
    }
    if (nextSub) {
      nextSub.perSub = perSub;
      link2.perSub = void 0;
    } else {
      dep.subsTail = perSub;
    }
    link2.dep = link2.sub = void 0;
    link2.nextDep = linkPool;
    linkPool = link2;
    link2 = nextDep;
  }
}

// packages/reactivity/src/effect.ts
var activeSub;
var ReactiveEffect = class {
  constructor(fn) {
    this.fn = fn;
  }
  deps;
  depsTail;
  tracking = false;
  run() {
    const perSub = activeSub;
    activeSub = this;
    startTrack(this);
    try {
      return this.fn();
    } finally {
      endTrack(this);
      activeSub = perSub;
    }
  }
  notify() {
    this.scheduler();
  }
  scheduler() {
    this.run();
  }
};
function effect(fn, options) {
  const e = new ReactiveEffect(fn);
  Object.assign(e, options);
  e.run();
  const runner = e.run.bind(e);
  runner.effect = e;
  return runner;
}

// packages/reactivity/src/ref.ts
var RefImpl = class {
  _value;
  ["__v_isRef" /* IS_REF */] = true;
  // 订阅者
  subs;
  subsTail;
  constructor(value) {
    this._value = value;
  }
  get value() {
    trackRef(this);
    return this._value;
  }
  set value(newValue) {
    this._value = newValue;
    triggerRef(this);
  }
};
function ref(value) {
  return new RefImpl(value);
}
function isRef(value) {
  return !!(value && value["__v_isRef" /* IS_REF */]);
}
function trackRef(dep) {
  if (activeSub) link(dep, activeSub);
}
function triggerRef(dep) {
  if (dep.subs) propagate(dep.subs);
}
export {
  ReactiveEffect,
  activeSub,
  effect,
  isRef,
  ref,
  trackRef,
  triggerRef
};
//# sourceMappingURL=reactivity.esm.js.map
