// 步骤 8：模块内百分位排名（safe_percent_rank，dplyr percent_rank 语义）
import { useMemo, useState } from 'react'
import { MODULE_COLORS, buildGraph, nodeById } from '@/lib/graph'
import { computeAll } from '@/lib/centrality'
import { rankNodes } from '@/lib/ranking'
import { useViz, useDemo } from './common'
import { fmt, type VizState } from '@/state/demo'
import { Formula, Note } from '@/components/Panel'
import type { ModuleId } from '@/lib/graph'

const METRICS = computeAll(buildGraph())
const RANKED = rankNodes(METRICS)

type MetricKey = 'degPct' | 'strPct' | 'btwPct' | 'harPct' | 'eigPct'
const METRIC_LABELS: { key: MetricKey; label: string; color: string }[] = [
  { key: 'degPct', label: 'Degree %', color: '#38bdf8' },
  { key: 'strPct', label: 'Strength %', color: '#34d399' },
  { key: 'btwPct', label: 'Betweenness %', color: '#c084fc' },
  { key: 'harPct', label: 'Harmonic %', color: '#2dd4bf' },
  { key: 'eigPct', label: 'Eigenvector %', color: '#a78bfa' },
]

export default function Step8() {
  const { selected } = useDemo()
  const [metric, setMetric] = useState<MetricKey>('eigPct')

  const viz = useMemo<VizState>(() => {
    const nodes: VizState['nodes'] = {}
    for (const r of RANKED) {
      nodes[r.id] = {
        value: fmt(r[metric]),
        scale: 0.6 + r[metric] * 0.8,
        pulse: r.id === selected,
      }
    }
    return { nodes, edges: {} }
  }, [metric, selected])

  useViz(viz, null)

  const byModule = useMemo(() => {
    const m = new Map<ModuleId, typeof RANKED>()
    for (const r of RANKED) {
      if (!m.has(r.module)) m.set(r.module, [])
      m.get(r.module)!.push(r)
    }
    return m
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <Formula>percent_rank(x) = ( min_rank(x) − 1 ) / ( n − 1 )</Formula>
      <Note>
        不同指标量纲不同，无法直接比较。先在<b className="text-slate-200">模块内部</b>把每个指标转成 0–1
        的百分位（dplyr 的 percent_rank 语义：并列取最小名次）。safe 版处理两种边界：模块只有 1 个节点、或值全部相同时
        返回全 1。切换下方指标，画布节点大小与数值同步变化。
      </Note>

      <div className="flex flex-wrap gap-1.5">
        {METRIC_LABELS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
              metric === m.key ? 'text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            style={metric === m.key ? { background: m.color } : undefined}
          >
            {m.label}
          </button>
        ))}
      </div>

      {[...byModule.entries()].map(([mod, list]) => (
        <div key={mod} className="overflow-hidden rounded-lg border border-slate-800">
          <div
            className="px-2.5 py-1.5 text-[11px] font-bold"
            style={{ background: `${MODULE_COLORS[mod].base}22`, color: MODULE_COLORS[mod].light }}
          >
            {MODULE_COLORS[mod].label}（n = {list.length}）
          </div>
          <table className="w-full text-[10.5px]">
            <thead className="bg-slate-900 text-slate-500">
              <tr>
                <th className="px-2 py-1 text-left font-medium">节点</th>
                {METRIC_LABELS.map((m) => (
                  <th
                    key={m.key}
                    className={`px-1.5 py-1 text-right font-medium ${metric === m.key ? 'text-slate-200' : ''}`}
                  >
                    {m.label.replace(' %', '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr
                  key={r.id}
                  className={`border-t border-slate-800/60 tabular-nums ${
                    selected === r.id ? 'bg-sky-500/10 text-sky-200' : 'text-slate-300'
                  }`}
                >
                  <td className="px-2 py-1" title={nodeById(r.id).name}>
                    {r.id}
                  </td>
                  {METRIC_LABELS.map((m) => (
                    <td
                      key={m.key}
                      className={`px-1.5 py-1 text-right ${metric === m.key ? 'font-bold' : ''}`}
                      style={metric === m.key ? { color: m.color } : undefined}
                    >
                      {fmt(r[m.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <Note>
        观察：每个模块内 Degree% 与 Strength% 的 1.000 都落在同一个节点上（A→T03、B→T08、C→T11）——它们就是下一步
        合成 Hub_score 的主角；而 Betweenness% 的 1.000 则落在桥节点上。
      </Note>
    </div>
  )
}
