// 步骤 5：Closeness 接近中心性 —— Dijkstra 波纹 + 距离求和取倒数
import { useMemo } from 'react'
import { NODES, buildGraph, nodeById } from '@/lib/graph'
import { dijkstra } from '@/lib/centrality'
import { useAnim } from '@/hooks/useAnim'
import { useViz, useDemo } from './common'
import { fmt, type VizState } from '@/state/demo'
import { Formula, Note } from '@/components/Panel'

const g = buildGraph()
const N = NODES.length

export default function Step5() {
  const { selected } = useDemo()
  const sssp = useMemo(() => dijkstra(g, selected), [selected])
  // 可达节点按距离从近到远（跳过源点自身）
  const revealOrder = useMemo(() => sssp.order.filter((id) => id !== selected), [sssp])
  const anim = useAnim(revealOrder.length + 1, 450, selected) // 最后一帧用于显示结果

  const viz = useMemo<VizState>(() => {
    const nodes: VizState['nodes'] = {}
    const reached = new Set(revealOrder.slice(0, anim.index))
    for (const n of NODES) {
      if (n.id === selected) {
        nodes[n.id] = { pulse: true, badge: '源点', ripple: true }
      } else if (reached.has(n.id)) {
        const d = sssp.dist.get(n.id)!
        nodes[n.id] = { badge: `d=${fmt(d)}`, ripple: n.id === revealOrder[anim.index - 1] }
      } else {
        nodes[n.id] = { dim: true }
      }
    }
    return { nodes, edges: {}, hideEdgeLabels: true }
  }, [anim.index, revealOrder, selected, sssp])

  useViz(
    viz,
    useMemo(
      () => ({
        playing: anim.playing,
        onPlayPause: anim.toggle,
        onStepFwd: anim.stepFwd,
        onReset: anim.reset,
        speed: anim.speed,
        onSpeed: anim.setSpeed,
        label: `已到达 ${Math.min(anim.index, revealOrder.length)} / ${revealOrder.length} 个节点`,
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [anim.playing, anim.index, anim.speed, revealOrder.length],
    ),
  )

  const reachedList = revealOrder.slice(0, Math.min(anim.index, revealOrder.length))
  const sum = reachedList.reduce((s, id) => s + sssp.dist.get(id)!, 0)
  const full = anim.index > revealOrder.length
  const totalSum = revealOrder.reduce((s, id) => s + sssp.dist.get(id)!, 0)

  return (
    <div className="flex flex-col gap-4">
      <Formula>
        C(v) = (n − 1) / Σ<sub>u≠v</sub> d(v, u)
      </Formula>
      <Note>
        接近中心性 = 到全网其他节点的最短距离之和的<b className="text-slate-200">倒数</b>（乘 n−1 归一化）。从选中节点
        发出的波纹按 Dijkstra 顺序逐个"到达"其他节点，节点上方标注最短距离。距离总和越小，节点越"居中"。
      </Note>

      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
        <div className="text-[11px] text-slate-400">
          从 {selected}（{nodeById(selected).name}）出发的距离累加
        </div>
        <div className="mt-2 max-h-32 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300">
          {reachedList.length === 0 && <span className="text-slate-600">等待波纹扩散…</span>}
          {reachedList.map((id) => (
            <span key={id} className="mr-2 inline-block tabular-nums">
              d({id})={fmt(sssp.dist.get(id)!)}
            </span>
          ))}
        </div>
        <div className="mt-2 border-t border-amber-500/30 pt-2 font-mono text-[13px] tabular-nums text-amber-200">
          Σd = {fmt(full ? totalSum : sum)}
        </div>
        {full && (
          <div className="fade-up mt-1.5 text-center font-mono text-[15px] font-bold tabular-nums text-amber-100">
            C({selected}) = {N - 1} / {fmt(totalSum)} = {fmt((N - 1) / totalSum)}
          </div>
        )}
      </div>

      <Note>
        隐患预告：这个公式要求网络<b className="text-slate-200">完全连通</b>——只要有一个节点不可达，Σd 就出现 ∞，
        igraph 会返回 0 或 NaN。下一步用"断开跨模块边"实验直观对比 Closeness 的失效与 Harmonic 的稳健。
      </Note>
    </div>
  )
}
