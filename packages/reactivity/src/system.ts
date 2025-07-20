import { type ReactiveEffect } from './effect';

interface Dep {
  subs: Link | undefined
  subsTail: Link | undefined
}
export interface Sub {
  deps: Link | undefined
  depsTail: Link | undefined

}
/**
 * 链表节点
 */
export interface Link {
  // 订阅者
  sub: ReactiveEffect
  nextSub: Link | undefined
  perSub: Link | undefined
  // 依赖项
  dep: Dep
  nextDep: Link | undefined
}
let linkPool: Link
/**
 * 订阅者链表
 * @param dep 
 * @param sub 
 */ export function link(dep, sub) {

  const currentDep = sub.depsTail
  const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep
  // if (nextDep && nextDep.dep === undefined && sub.deps) {
  if (nextDep && nextDep.dep === dep) {
    sub.depsTail = nextDep
    console.log('相同的依赖项，直接复用');
    return
  }
  // }

  let newLink
  if (linkPool) {
    console.log('复用linkPool');
    
    newLink = linkPool 
    linkPool = linkPool.nextDep
    newLink.nextDep = nextDep
    newLink.dep = dep
    newLink.sub = sub
  } else {
    newLink = {
      sub,
      nextSub: undefined,
      perSub: undefined,
      dep,
      nextDep
    }
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
    const sub = link.sub
    if (!sub.tracking) {
      queuedEffect.push(link.sub)
    }
    link = link.nextSub
  }
  // 通知 effect 重新执行，获取到最新的值
  queuedEffect.forEach(effect => effect.notify())
}
/**
 * 开始追踪依赖，将depsTail 尾节点设置成undefined
 * @param sub  
 */
export function startTrack(sub) {
  sub.tracking = true
  sub.depsTail = undefined
}
/**
 * 结束追踪依赖，找到需要清理的依赖
 * @param sub 
 */
export function endTrack(sub) {
  sub.tracking = false
  // 如果 depsTail 还有 nextDep，说明后面的依赖需要清理
  if (sub.depsTail?.nextDep) {
    // clearTracking 用来清理依赖，后续实现它，就是断开所有的关联关系
    clearTracking(sub.depsTail.nextDep)
    // 如果从尾节点后面开始的，那尾节点后面的就不要了，因为我们已经把它清理掉了
    sub.depsTail.nextDep = undefined
  }
  // 如果 depsTail 为空但 deps 存在，说明这次执行没有收集到任何依赖
  else if (!sub.depsTail && sub.deps) {
    // clearTracking 用来清理依赖，后续实现它，就是断开所有的关联关系
    clearTracking(sub.deps)
    sub.deps = undefined // 如果从头节点开始清理的，那头节点就不要了
  }
}

function clearTracking(link: Link) {
  while (link) {
    const { dep, perSub, nextSub, nextDep } = link

    /**
     * 如果 prevSub 有，那就吧prevSub 的下一个节点，指向当前节点的下一个
     * 如果没有，那他就是头节点，把dep.subs 指向当前节点的下一个节点
     */
    if (perSub) {
      perSub.nextSub = nextSub
      link = undefined
    } else {
      dep.subs = nextSub
    }

    /**
     * 如果下一个节点有，那就把 nextSub 的上一个节点，指向当前节点的上一个节点
     * 如果下一个节点没有，那他就是尾结点，把dep.depsTail 指向当前节点的上一个节点
     */
    if (nextSub) {
      nextSub.perSub = perSub
      link.perSub = undefined
    } else {
      dep.subsTail = perSub
    }

    
    
    link.dep = link.sub = undefined
    link.nextDep = linkPool
    linkPool = link
    link = nextDep

  }
}