// 步骤 1：边强度 → 边距离（d = 1/w），标签逐边翻转动画
import { useEffect, useMemo } from 'react'
import { EDGES, NODES, buildGraph, edgeKey, nodeById } from '@/lib/graph'
import { useAnim } from '@/hooks/useAnim'
import { useViz, useDemo } from './common'
import { fmt, type VizState } from '@/state/demo'
import { Formula, Note, PanelTitle } from '@/components/Panel'

export default function Step1() {
  const { selected } = useDemo()
  const anim = useAnim(EDGES.length, 160)

  useEffect(() => {
    const t = window.setTimeout(() => anim.play(), 400)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const viz = useMemo<VizState>(() => {
    const edges: VizState['edges'] = {}
    EDGES.forEach((e, i) => {
      const flipped = i < anim.index
      edges[edgeKey(e.a, e.b)] = {
        labelAlt: flipped ? fmt(1 / e.w) : undefined,
        highlight: i === anim.index - 1 && !anim.done,
      }
    })
    return { nodes: {}, edges }
  }, [anim.index, anim.done])

  useViz(
    viz,
    useMemo(
      () => ({
        playing: anim.playing,
        onPlayPause: anim.toggle,
        onStepFwd: anim.stepFwd,
        onReset: anim.reset,
        label: `${Math.min(anim.index, EDGES.length)} / ${EDGES.length} 条边已翻转`,
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [anim.playing, anim.index],
    ),
  )

  const selEdges = useMemo(() => {
    const g = buildGraph()
    return (g.adj.get(selected) ?? []).map((e) => ({ to: e.to, w: e.w }))
  }, [selected])

  return (
    <div className="flex flex-col gap-4">
      <Formula>edge_distance = 1 / weight</Formula>
      <Note>
        相关系数 r 越高，两个菌属"越相似"，在图上应当"距离更近"。因此把边权 w 取倒数作为距离：
        <b className="text-amber-200"> 强相关 = 短距离</b>。之后的最短路径（介数、接近、调和中心性）全部使用这个
        1/r 距离跑 Dijkstra。边上标签正在从 r 值翻转为 1/r 值。
      </Note>

      <div>
        <PanelTitle>
          选中节点 {selected}（{nodeById(selected).name}）的关联边
        </PanelTitle>
        <div className="mt-2 overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-[11px]">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">边</th>
                <th className="px-2 py-1.5 text-right font-medium">r（强度）</th>
                <th className="px-2 py-1.5 text-right font-medium">1/r（距离）</th>
              </tr>
            </thead>
            <tbody>
              {selEdges.map((e) => (
                <tr key={e.to} className="border-t border-slate-800/60 text-slate-300">
                  <td className="px-2 py-1">
                    {selected} ↔ {e.to}
                  </td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmt(e.w)}</td>
                  <td className="px-2 py-1 text-right tabular-nums text-amber-200">{fmt(1 / e.w)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Note>
        例：T01–T02 的 r = 0.92 是最强相关，距离仅 {fmt(1 / 0.92)}；桥接边 T10–T11 的 r = 0.62 最弱，距离达{' '}
        {fmt(1 / 0.62)}——跨模块传播因此"路途遥远"，这正是桥节点介数极高的原因。
      </Note>
      <div className="text-[11px] text-slate-500">共 {NODES.length} 个节点 · {EDGES.length} 条边</div>
    </div>
  )
}
