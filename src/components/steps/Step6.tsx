// 步骤 6：Harmonic 调和中心性 —— 累加 1/d；断开跨模块边对比 Closeness 失效
import { useMemo } from 'react'
import { NODES, buildGraph, nodeById } from '@/lib/graph'
import { dijkstra, closeness, harmonic } from '@/lib/centrality'
import { useAnim } from '@/hooks/useAnim'
import { useViz, useDemo } from './common'
import { fmt, type VizState } from '@/state/demo'
import { Formula, Note, PanelTitle, Tag } from '@/components/Panel'



export default function Step6() {
  const { selected, disconnect, setDisconnect } = useDemo()
  const g = useMemo(() => buildGraph(0.6, disconnect), [disconnect])
  const sssp = useMemo(() => dijkstra(g, selected), [g, selected])
  const revealOrder = useMemo(() => sssp.order.filter((id) => id !== selected), [sssp])
  const anim = useAnim(revealOrder.length + 1, 450, `${selected}-${disconnect}`)

  const clo = useMemo(() => closeness(g), [g])
  const har = useMemo(() => harmonic(g), [g])

  const viz = useMemo<VizState>(() => {
    const nodes: VizState['nodes'] = {}
    const edges: VizState['edges'] = {}
    const reached = new Set(revealOrder.slice(0, anim.index))
    for (const n of NODES) {
      if (n.id === selected) {
        nodes[n.id] = { pulse: true, badge: '源点', ripple: true }
      } else if (reached.has(n.id)) {
        const d = sssp.dist.get(n.id)!
        nodes[n.id] = {
          badge: `1/d=${fmt(1 / d)}`,
          ripple: n.id === revealOrder[anim.index - 1],
        }
      } else if (!isFinite(sssp.dist.get(n.id)!)) {
        nodes[n.id] = { dim: true, badge: '不可达' }
      } else {
        nodes[n.id] = { dim: true }
      }
    }
    if (disconnect) {
      edges['T05|T06'] = { hidden: true }
      edges['T10|T11'] = { hidden: true }
    }
    return { nodes, edges, hideEdgeLabels: true }
  }, [anim.index, revealOrder, selected, sssp, disconnect])

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
        label: `已到达 ${Math.min(anim.index, revealOrder.length)} / ${revealOrder.length} 个可达节点`,
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [anim.playing, anim.index, anim.speed, revealOrder.length],
    ),
  )

  const reachedList = revealOrder.slice(0, Math.min(anim.index, revealOrder.length))
  const partial = reachedList.reduce((s, id) => s + 1 / sssp.dist.get(id)!, 0)
  const full = anim.index > revealOrder.length
  const unreachable = NODES.filter((n) => n.id !== selected && !isFinite(sssp.dist.get(n.id)!))

  return (
    <div className="flex flex-col gap-4">
      <Formula>
        H(v) = [ Σ<sub>u≠v</sub> 1 / d(v, u) ] / (n − 1)，不可达贡献 0
      </Formula>
      <Note>
        调和中心性把"距离的倒数"<b className="text-slate-200">直接累加</b>：越近的节点贡献越大，不可达节点贡献 0
        而不是让整个公式爆炸——因此对不连通网络依然友好。这是它在微生物共现网络分析中比 Closeness 更稳健的关键原因。
      </Note>

      <label className="flex cursor-pointer items-center justify-between rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-2.5">
        <span className="text-[12px] font-semibold text-rose-200">断开跨模块边（T05–T06、T10–T11）</span>
        <input
          type="checkbox"
          checked={disconnect}
          onChange={(e) => setDisconnect(e.target.checked)}
          className="h-4 w-4 accent-rose-500"
        />
      </label>

      <div className="rounded-lg border border-teal-500/40 bg-teal-500/10 p-3">
        <div className="text-[11px] text-slate-400">
          从 {selected}（{nodeById(selected).name}）出发的 1/d 累加
        </div>
        <div className="mt-2 max-h-24 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300">
          {reachedList.length === 0 && <span className="text-slate-600">等待波纹扩散…</span>}
          {reachedList.map((id) => (
            <span key={id} className="mr-2 inline-block tabular-nums">
              1/d({id})={fmt(1 / sssp.dist.get(id)!)}
            </span>
          ))}
        </div>
        {unreachable.length > 0 && (
          <div className="mt-1.5 text-[11px] text-rose-300">
            不可达（贡献 0）：{unreachable.map((n) => n.id).join('、')}
          </div>
        )}
        <div className="mt-2 border-t border-teal-500/30 pt-2 font-mono text-[13px] tabular-nums text-teal-200">
          Σ 1/d = {fmt(full ? reachedList.reduce((s, id) => s + 1 / sssp.dist.get(id)!, 0) : partial)}
        </div>
        {full && (
          <div className="fade-up mt-1.5 text-center font-mono text-[15px] font-bold tabular-nums text-teal-100">
            H({selected}) = {fmt(har.get(selected)!)}
          </div>
        )}
      </div>

      <div>
        <PanelTitle>同一网络下两种指标对比（{selected}）</PanelTitle>
        <div className="mt-2 grid grid-cols-2 gap-2 text-center">
          <div className={`rounded-lg border p-2.5 ${disconnect ? 'border-rose-500/60 bg-rose-500/10' : 'border-slate-700 bg-slate-800/40'}`}>
            <div className="text-[10px] text-slate-400">Closeness C(v)</div>
            <div className={`mt-1 font-mono text-lg font-bold tabular-nums ${disconnect ? 'text-rose-300' : 'text-slate-200'}`}>
              {fmt(clo.get(selected)!)}
            </div>
            {disconnect && <Tag color="#fb7185">存在不可达 → 失效</Tag>}
          </div>
          <div className="rounded-lg border border-teal-500/50 bg-teal-500/10 p-2.5">
            <div className="text-[10px] text-slate-400">Harmonic H(v)</div>
            <div className="mt-1 font-mono text-lg font-bold tabular-nums text-teal-200">{fmt(har.get(selected)!)}</div>
            {disconnect && <Tag color="#2dd4bf">依然有限 ✓</Tag>}
          </div>
        </div>
      </div>

      <Note>
        断开桥接边后三个模块互不连通：Closeness 的 Σd 含 ∞，归一化结果变成 NaN（igraph 中表现为 0/NaN）；而
        Harmonic 把不可达项记 0，数值依然可比。后续 Bridge_score 选用 Harmonic 正是出于这个原因。
      </Note>
    </div>
  )
}
