import { activeSub } from "./effect";
import { link, propagate, type Link } from './system';



enum ReactiveFlags {
  IS_REF = '__v_isRef'
}

class RefImpl {
  _value;

  [ReactiveFlags.IS_REF] = true
  // 订阅者
  subs: Link
  subsTail: Link

  constructor(value) {
    this._value = value
  }

  get value() {
    // console.log('被访问', activeSub);
    trackRef(this)
    return this._value
    
  }
  set value(newValue) {
    // console.log('被修改');
    this._value = newValue
    triggerRef(this)
  }
}

export function ref(value) {
  return new RefImpl(value)
}

export function isRef(value) {
  return !!(value && value[ReactiveFlags.IS_REF])
}

/**
 * 
 * @param dep 依赖收集
 */
export function trackRef(dep) {
  if (activeSub) link(dep, activeSub)
}
/**
 * 
 * @param dep 触发依赖
 */
export function triggerRef(dep) {
  if (dep.subs) propagate(dep.subs)

}

 
