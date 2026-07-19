// 步骤 2：Degree 度中心性 —— 邻居脉冲 + 逐条计数 + 全网条形图
import { useMemo } from 'react'
import { NODES, buildGraph, edgeKey, nodeById } from '@/lib/graph'
import { degree } from '@/lib/centrality'
import { useAnim } from '@/hooks/useAnim'
import { useViz, useDemo } from './common'
import type { VizState } from '@/state/demo'
import { Formula, MiniBars, Note, PanelTitle } from '@/components/Panel'

const g = buildGraph()
const DEG = degree(g)

export default function Step2() {
  const { selected } = useDemo()
  const neighbors = useMemo(() => (g.adj.get(selected) ?? []).map((e) => e.to), [selected])
  const anim = useAnim(neighbors.length, 700, selected)

  const viz = useMemo<VizState>(() => {
    const nodes: VizState['nodes'] = {}
    const edges: VizState['edges'] = {}
    const counted = neighbors.slice(0, anim.index)
    for (const n of NODES) {
      nodes[n.id] = {
        dim: n.id !== selected && !counted.includes(n.id),
        pulse: counted.includes(n.id),
        value: `度 ${DEG.get(n.id)}`,
      }
    }
    nodes[selected] = { ...nodes[selected], pulse: true }
    for (const nb of counted) {
      edges[edgeKey(selected, nb)] = { highlight: true, flow: true }
    }
    return { nodes, edges }
  }, [selected, neighbors, anim.index])

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
        label: `已计数 ${anim.index} / ${neighbors.length} 个邻居`,
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [anim.playing, anim.index, anim.speed, neighbors.length],
    ),
  )

  const barData = useMemo(
    () =>
      [...NODES]
        .map((n) => ({ id: n.id, label: `${n.id} ${n.name}`, value: DEG.get(n.id)! }))
        .sort((a, b) => b.value - a.value),
    [],
  )

  return (
    <div className="flex flex-col gap-4">
      <Formula>
        Degree(v) = |{'{'} u : (v, u) ∈ E {'}'}|
      </Formula>
      <Note>
        度中心性就是<b className="text-slate-200">数连接数</b>：与节点直接相连的边有几条。点击任意节点，它的邻居会逐个
        点亮脉冲、关联边高亮流动，右侧同步计数。对应 igraph：<code>degree(g)</code>。
      </Note>

      <div className="rounded-lg border border-sky-500/40 bg-sky-500/10 p-3 text-center">
        <div className="text-[11px] text-slate-400">
          {selected}（{nodeById(selected).name}）
        </div>
        <div className="mt-1 font-mono text-2xl font-bold text-sky-300 tabular-nums">
          连接数 = {anim.index}
          {anim.done && <span className="ml-2 text-emerald-400">✓ Degree = {DEG.get(selected)}</span>}
        </div>
        <div className="mt-1.5 flex flex-wrap justify-center gap-1.5">
          {neighbors.map((nb, i) => (
            <span
              key={nb}
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all duration-300 ${
                i < anim.index ? 'bg-sky-500/30 text-sky-200' : 'bg-slate-800 text-slate-600'
              }`}
            >
              {nb}
            </span>
          ))}
        </div>
      </div>

      <div>
        <PanelTitle>全网络 Degree 排行</PanelTitle>
        <div className="mt-2">
          <MiniBars data={barData} highlight={selected} color="#38bdf8" digits={0} />
        </div>
      </div>
      <Note>
        模块 A 中 T03 度最高（4），模块 B 中 T08 度最高（4），模块 C 中 T11 度最高（4）——模块内"枢纽"已现雏形。
      </Note>
    </div>
  )
}
