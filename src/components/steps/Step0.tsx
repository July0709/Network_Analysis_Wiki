// 步骤 0：从数据到网络 —— 流程动画 + 相关阈值滑块联动
import { useEffect, useMemo } from 'react'
import { EDGES, NODES, MODULE_COLORS, buildGraph, edgeKey } from '@/lib/graph'
import { degree, strength } from '@/lib/centrality'
import { useAnim } from '@/hooks/useAnim'
import { useViz, useDemo } from './common'
import { fmt, type VizState } from '@/state/demo'
import { Formula, Note, PanelTitle } from '@/components/Panel'

const PIPELINE = ['丰度表', 'CLR 转换', 'Spearman 相关矩阵', '阈值过滤 r ≥ 0.6', '共现网络']

export default function Step0() {
  const { threshold, setThreshold, selected } = useDemo()
  const anim = useAnim(NODES.length + EDGES.length, 90)

  // 进入步骤自动播放一次淡入
  useEffect(() => {
    const t = window.setTimeout(() => anim.play(), 300)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const g = useMemo(() => buildGraph(threshold), [threshold])
  const deg = useMemo(() => degree(g), [g])
  const str = useMemo(() => strength(g), [g])

  const viz = useMemo<VizState>(() => {
    const nodes: VizState['nodes'] = {}
    NODES.forEach((n, i) => {
      nodes[n.id] = { hidden: i >= anim.index }
    })
    const edges: VizState['edges'] = {}
    EDGES.forEach((e, i) => {
      const appeared = NODES.length + i < anim.index
      const pass = e.w >= threshold - 1e-9
      edges[edgeKey(e.a, e.b)] = { hidden: !appeared || !pass }
    })
    return { nodes, edges }
  }, [anim.index, threshold])

  useViz(
    viz,
    useMemo(
      () => ({
        playing: anim.playing,
        onPlayPause: anim.toggle,
        onStepFwd: anim.stepFwd,
        onReset: anim.reset,
        label: anim.done ? '网络构建完成' : '构建动画播放中…',
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [anim.playing, anim.done, anim.index],
    ),
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <PanelTitle>分析流水线</PanelTitle>
        <div className="mt-2 flex flex-col gap-1.5">
          {PIPELINE.map((p, i) => (
            <div key={p} className="flex items-center gap-2 text-[12px]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600/25 text-[10px] font-bold text-sky-300">
                {i + 1}
              </span>
              <span className="text-slate-300">{p}</span>
              {i < PIPELINE.length - 1 && <span className="text-slate-600">↓</span>}
            </div>
          ))}
        </div>
      </div>

      <Formula>ρ(i, j) = Spearman(CLR(xᵢ), CLR(xᵗ))，保留 |r| ≥ 阈值 的边</Formula>

      <div className="rounded-lg border border-slate-700/70 bg-slate-800/40 p-3">
        <div className="mb-2 flex items-center justify-between">
          <PanelTitle>相关阈值 r</PanelTitle>
          <span className="rounded bg-sky-600/25 px-2 py-0.5 font-mono text-[13px] font-bold text-sky-300">
            {threshold.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min={0.6}
          max={0.9}
          step={0.01}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-full accent-sky-500"
        />
        <div className="mt-1 flex justify-between text-[10px] text-slate-500">
          <span>0.60（22 条边全保留）</span>
          <span>0.90</span>
        </div>
        <Note>
          当前保留 <b className="text-slate-200">{g.edges.length}</b> / 22 条边。拖动滑块观察：阈值升高时弱相关的边被
          剔除，网络变稀疏，各节点的度与强度随之变化。离开本步骤时阈值会锁定回 0.60，保证后续演示数值确定。
        </Note>
      </div>

      <div>
        <PanelTitle>节点指标联动（当前阈值下）</PanelTitle>
        <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-800">
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 bg-slate-900 text-slate-400">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">节点</th>
                <th className="px-2 py-1.5 text-left font-medium">模块</th>
                <th className="px-2 py-1.5 text-right font-medium">Degree</th>
                <th className="px-2 py-1.5 text-right font-medium">Strength</th>
              </tr>
            </thead>
            <tbody>
              {NODES.map((n) => (
                <tr
                  key={n.id}
                  className={`border-t border-slate-800/60 ${selected === n.id ? 'bg-sky-500/10 text-sky-200' : 'text-slate-300'}`}
                >
                  <td className="px-2 py-1">
                    {n.id} {n.name}
                  </td>
                  <td className="px-2 py-1" style={{ color: MODULE_COLORS[n.module].light }}>
                    {n.module}
                  </td>
                  <td className="px-2 py-1 text-right tabular-nums">{deg.get(n.id)}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmt(str.get(n.id)!)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
