type DeltaListener = (delta: string) => void
type EndListener = (error?: string) => void

/**
 * 单条 assistant 消息的流式缓冲：LLM 产出写入，SSE 连接订阅。
 * 把 LLM 流与前端连接解耦——前端断开不影响 LLM 继续生成，
 * 刷新后新连接从 offset 回放已缓存 delta 并续接实时输出。
 */
export class StreamBuffer {
  private deltas: string[] = []
  private done = false
  private error?: string
  private deltaListeners = new Set<DeltaListener>()
  private endListeners = new Set<EndListener>()

  append(delta: string): void {
    if (this.done) return
    this.deltas.push(delta)
    for (const l of this.deltaListeners) l(delta)
  }

  finish(error?: string): void {
    if (this.done) return
    this.done = true
    this.error = error
    const ends = [...this.endListeners]
    this.deltaListeners.clear()
    this.endListeners.clear()
    for (const fn of ends) fn(error)
  }

  /** 订阅：先同步回放 offset 之后的已缓存 delta，再接实时 delta；
   *  任务结束时回调 onEnd（已结束时立即回调）。返回取消订阅函数。 */
  subscribe(offset: number, onDelta: DeltaListener, onEnd: EndListener): () => void {
    for (let i = offset; i < this.deltas.length; i++) onDelta(this.deltas[i])
    if (this.done) {
      onEnd(this.error)
      return () => {}
    }
    this.deltaListeners.add(onDelta)
    this.endListeners.add(onEnd)
    return () => {
      this.deltaListeners.delete(onDelta)
      this.endListeners.delete(onEnd)
    }
  }
}
