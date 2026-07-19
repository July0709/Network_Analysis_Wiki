// 步骤 3：Strength 强度中心性 —— 关联边权重逐条累加的算式动画
import { useMemo } from 'react'
import { NODES, buildGraph, edgeKey, nodeById } from '@/lib/graph'
import { strength } from '@/lib/centrality'
import { useAnim } from '@/hooks/useAnim'
import { useViz, useDemo } from './common'
import { fmt, type VizState } from '@/state/demo'
import { Formula, MiniBars, Note, PanelTitle } from '@/components/Panel'

const g = buildGraph()
const STR = strength(g)

export default function Step3() {
  const { selected } = useDemo()
  const incident = useMemo(
    () => [...(g.adj.get(selected) ?? [])].sort((a, b) => b.w - a.w),
    [selected],
  )
  const anim = useAnim(incident.length, 800, selected)

  const viz = useMemo<VizState>(() => {
    const nodes: VizState['nodes'] = {}
    const edges: VizState['edges'] = {}
    const counted = incident.slice(0, anim.index)
    const countedSet = new Set(counted.map((e) => e.to))
    for (const n of NODES) {
      nodes[n.id] = {
        dim: n.id !== selected && !countedSet.has(n.id),
        pulse: countedSet.has(n.id),
        value: `强度 ${fmt(STR.get(n.id)!)}`,
      }
    }
    nodes[selected] = { ...nodes[selected], pulse: true }
    for (const e of counted) {
      edges[edgeKey(selected, e.to)] = { highlight: true }
    }
    return { nodes, edges }
  }, [selected, incident, anim.index])

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
        label: `已累加 ${anim.index} / ${incident.length} 条边`,
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [anim.playing, anim.index, anim.speed, incident.length],
    ),
  )

  const partial = incident.slice(0, anim.index).reduce((s, e) => s + e.w, 0)
  const barData = useMemo(
    () =>
      [...NODES]
        .map((n) => ({ id: n.id, label: `${n.id} ${n.name}`, value: STR.get(n.id)! }))
        .sort((a, b) => b.value - a.value),
    [],
  )

  return (
    <div className="flex flex-col gap-4">
      <Formula>Strength(v) = Σ w(v, u)，u ∈ N(v)</Formula>
      <Note>
        强度是度的"加权版"：把关联边的相关系数<b className="text-slate-200">逐条加起来</b>。度相同的两个节点，边权更高者
        强度更大。对应 igraph：<code>strength(g, weights = E(g)$weight)</code>。
      </Note>

      <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3">
        <div className="text-center text-[11px] text-slate-400">
          {selected}（{nodeById(selected).name}）逐条累加
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1 font-mono text-[13px]">
          {incident.map((e, i) => (
            <span key={e.to} className="flex items-center gap-1">
              {i > 0 && <span className="text-slate-500">+</span>}
              <span
                className={`rounded px-1.5 py-0.5 tabular-nums transition-all duration-300 ${
                  i < anim.index ? 'bg-emerald-500/25 text-emerald-200' : 'bg-slate-800/60 text-slate-600'
                }`}
                title={`${selected} ↔ ${e.to}`}
              >
                {fmt(e.w)}
              </span>
            </span>
          ))}
          <span className="text-slate-500">=</span>
          <span className="rounded bg-emerald-500/30 px-1.5 py-0.5 font-bold tabular-nums text-emerald-100">
            {fmt(partial)}
          </span>
        </div>
        {anim.done && (
          <div className="mt-2 text-center text-[12px] text-emerald-300 fade-up">
            Strength({selected}) = {fmt(STR.get(selected)!)} ✓
          </div>
        )}
      </div>

      <div>
        <PanelTitle>全网络 Strength 排行</PanelTitle>
        <div className="mt-2">
          <MiniBars data={barData} highlight={selected} color="#34d399" />
        </div>
      </div>
      <Note>
        校验点：T03 的强度 = 0.85 + 0.80 + 0.88 + 0.78 = <b className="text-slate-200">3.310</b>，与 T08（3.100）分列各模块
        之首——度与强度双高是"严格 Hub"的判据（步骤 10 会用到）。
      </Note>
    </div>
  )
}
