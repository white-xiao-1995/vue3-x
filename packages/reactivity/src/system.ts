import { type ReactiveEffect } from './effect';

interface Dep {
  subs: Link | undefined
  subsTail: Link | undefined
}
/**
 * 链表节点
 */
export interface Link {
  sub: ReactiveEffect
  nextSub: Link | undefined
  perSub: Link | undefined
  dep: Dep
  nextDep: Link | undefined
}
/**
 * 订阅者链表
 * @param dep 
 * @param sub 
 */ export function link(dep, sub) {

  const currentDep = sub.depsTail
  const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep
  // if (nextDep && nextDep.dep === undefined && sub.deps) {
  if (nextDep && nextDep.dep === dep) {
    console.log('相同的依赖项，直接复用');
    return
  }
  // }

  const newLink = { 
    sub,
    nextSub: undefined,
    perSub: undefined,
    dep,
    nextDep: undefined
  }
  // 将链表节点与 dep 建立关联关系
  /**
   * 订阅者链表关系，
   * 1.尾结点有，那就往尾结点后面加
   * 2.如果尾结点没有，则表示第一次关联，那就往头节点添加
   */
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink
    newLink.perSub = dep.subsTail
    dep.subsTail = newLink
  } else {
    dep.subs = newLink
    dep.subsTail = newLink
  }
  // 将链表节点与 sub 建立关联关系
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  } else {
    sub.deps = newLink
    sub.depsTail = newLink
  }
}

export function propagate(subs) {
  let link = subs
  let queuedEffect = []
  while (link) {
    queuedEffect.push(link.sub)
    link = link.nextSub
  }
  // 通知 effect 重新执行，获取到最新的值
  queuedEffect.forEach(effect => effect.notify())
}