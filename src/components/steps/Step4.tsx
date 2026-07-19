// 步骤 4：Betweenness 介数中心性 —— 逐对播放经过选中节点的最短路径
import { useEffect, useMemo } from 'react'
import { NODES, buildGraph, edgeKey, nodeById } from '@/lib/graph'
import { pairsThrough } from '@/lib/centrality'
import { useAnim } from '@/hooks/useAnim'
import { useViz, useDemo } from './common'
import { fmt, type VizState } from '@/state/demo'
import { Formula, Note, PanelTitle } from '@/components/Panel'

const g = buildGraph()
const NORM = ((NODES.length - 1) * (NODES.length - 2)) / 2 // 78

export default function Step4() {
  const { selected, setSelected } = useDemo()
  const pairs = useMemo(() => pairsThrough(g, selected), [selected])

  // 桥节点效果最震撼：若当前选中节点不经过任何最短路径，默认切到 T10
  useEffect(() => {
    if (pairs.length === 0) setSelected('T10')
  }, [pairs.length, setSelected])

  const anim = useAnim(pairs.length, 500, selected)

  const viz = useMemo<VizState>(() => {
    const nodes: VizState['nodes'] = {}
    const edges: VizState['edges'] = {}
    const current = anim.index > 0 ? pairs[anim.index - 1] : null
    const onPath = new Set(current?.path ?? [])
    for (const n of NODES) {
      nodes[n.id] = {
        dim: current ? !onPath.has(n.id) : n.id !== selected,
        pulse: n.id === selected,
        value: n.id === selected ? `B_raw ${fmt(accum(pairs, anim.index))}` : undefined,
      }
    }
    if (current) {
      for (let i = 0; i + 1 < current.path.length; i++) {
        edges[edgeKey(current.path[i], current.path[i + 1])] = { highlight: true, flow: true }
      }
    }
    return { nodes, edges }
  }, [pairs, anim.index, selected])

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
        label: `路径对 ${anim.index} / ${pairs.length}`,
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [anim.playing, anim.index, anim.speed, pairs.length],
    ),
  )

  const raw = accum(pairs, anim.index)
  const current = anim.index > 0 ? pairs[anim.index - 1] : null

  return (
    <div className="flex flex-col gap-4">
      <Formula>
        B(v) = Σ<sub>s&lt;t</sub> σ<sub>st</sub>(v) / σ<sub>st</sub>，归一化 ÷ (n−1)(n−2)/2 = {NORM}
      </Formula>
      <Note>
        介数衡量一个节点<b className="text-slate-200">躺在多少条最短路径上</b>。点对 (s,t) 若有多条等长最短路径，经过 v
        的比例按 σ<sub>st</sub>(v)/σ<sub>st</sub> 计入。点播放：画布逐对高亮经过 {selected} 的最短路径，计数器实时累加。
        对应 igraph：<code>betweenness(g, weights = 1/E(g)$weight, normalized = TRUE)</code>。
      </Note>

      <div className="rounded-lg border border-purple-500/40 bg-purple-500/10 p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] text-slate-400">
            {selected}（{nodeById(selected).name}）介数累加器
          </span>
          <span className="text-[10px] text-slate-500">{pairs.length} 个路径对经过它</span>
        </div>
        <div className="mt-1.5 font-mono text-xl font-bold tabular-nums text-purple-300">
          Σ σ<sub>st</sub>(v)/σ<sub>st</sub> = {fmt(raw)}
        </div>
        {current && (
          <div key={anim.index} className="fade-up mt-2 rounded bg-slate-900/70 px-2 py-1.5 text-[11px] text-slate-300">
            <span className="font-mono text-amber-200">
              {current.s} → {current.t}
            </span>
            <span className="mx-1.5 text-slate-500">贡献</span>
            <span className="font-mono tabular-nums text-purple-300">+{fmt(current.contribution)}</span>
            <div className="mt-1 font-mono text-[10px] text-slate-500">{current.path.join(' → ')}</div>
          </div>
        )}
        {anim.done && (
          <div className="fade-up mt-2 border-t border-purple-500/30 pt-2 text-center text-[13px]">
            <span className="text-slate-400">归一化：</span>
            <span className="font-mono font-bold text-purple-200">
              {fmt(accum(pairs, pairs.length))} / {NORM} = {fmt(accum(pairs, pairs.length) / NORM)}
            </span>
          </div>
        )}
      </div>

      <PanelTitle>为什么桥节点介数最高？</PanelTitle>
      <Note>
        T05–T06 与 T10–T11 是连接模块的唯一通道（紫色边）。任何跨模块点对的 1/r 最短路径都必须经过桥两端的节点（
        T05 / T06 / T10 / T11），它们的介数因此远超模块内部节点。试试选中 T10 或 T06，播放时能看到大量跨模块路径
        川流不息；再对比选中 T01（模块边缘节点）——几乎没有路径经过它。
      </Note>
    </div>
  )
}

function accum(pairs: { contribution: number }[], k: number): number {
  let s = 0
  for (let i = 0; i < k && i < pairs.length; i++) s += pairs[i].contribution
  return s
}
