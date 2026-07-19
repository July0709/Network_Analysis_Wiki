// 步骤 10：筛选 Hub 与桥梁 —— 四种规则 + 结果表 + 分析产出清单
import { useMemo, useState } from 'react'
import { MODULE_COLORS, buildGraph, nodeById } from '@/lib/graph'
import { computeAll } from '@/lib/centrality'
import { bridgeRanking, rankNodes, strictHubs, top3PerModule, top5PercentPerModule, type RankedNode } from '@/lib/ranking'
import { useViz, useDemo } from './common'
import { fmt, type VizState } from '@/state/demo'
import { Note, PanelTitle } from '@/components/Panel'

const RANKED = rankNodes(computeAll(buildGraph()))
const STRICT = strictHubs(RANKED)
const TOP5 = top5PercentPerModule(RANKED)
const TOP3 = top3PerModule(RANKED)
const BRIDGES = bridgeRanking(RANKED)

const TABS = [
  { key: 'strict', label: '严格 Hub', desc: 'Degree% ≥ 0.95 且 Strength% ≥ 0.95（模块内）' },
  { key: 'top5', label: '每模块 Top 5%', desc: 'min_rank(desc Hub_score) ≤ max(1, ⌈n×5%⌉)' },
  { key: 'top3', label: '每模块 Top 3', desc: '各模块 Hub_score 前三名' },
  { key: 'bridge', label: '桥梁榜', desc: '按 Betweenness 降序（全网络，14 节点全列）' },
] as const

type TabKey = (typeof TABS)[number]['key']

const OUTPUTS = [
  'network_edges.csv — 边表（from, to, r, edge_distance, bridge 标记）',
  'network_nodes.csv — 节点表（Taxon, Module, 坐标）',
  'centrality_metrics.csv — 五个中心性指标原始值',
  'module_percentiles.csv — 模块内 percent_rank 结果',
  'hub_bridge_scores.csv — Hub_score / Bridge_score 与筛选标签',
  'hub_bridge_summary.csv — 严格Hub / Top5% / Top3 / 桥梁榜名单',
  'centrality_report.xlsx — 汇总工作簿（以上各表分 sheet）',
]

export default function Step10() {
  const { selected } = useDemo()
  const [tab, setTab] = useState<TabKey>('strict')

  const hitSet = useMemo(() => {
    switch (tab) {
      case 'strict':
        return new Set(STRICT)
      case 'top5':
        return new Set(TOP5)
      case 'top3':
        return new Set(TOP3)
      case 'bridge': {
        // 高亮介数第 4 名及以上的全部节点（含并列：T08 与 T11 同分）
        const fourth = BRIDGES[3].betweenness
        return new Set(BRIDGES.filter((r) => r.betweenness >= fourth - 1e-12).map((r) => r.id))
      }
    }
  }, [tab])

  const viz = useMemo<VizState>(() => {
    const nodes: VizState['nodes'] = {}
    for (const r of RANKED) {
      const hit = hitSet.has(r.id)
      nodes[r.id] = {
        dim: !hit,
        pulse: hit,
        value: hit ? (tab === 'bridge' ? `B ${fmt(r.betweenness)}` : `Hub ${fmt(r.hubScore)}`) : undefined,
      }
    }
    return { nodes, edges: {} }
  }, [hitSet, tab])

  useViz(viz, null)

  const rows: RankedNode[] = useMemo(() => {
    if (tab === 'bridge') return BRIDGES
    return RANKED.filter((r) => hitSet.has(r.id)).sort((a, b) => b.hubScore - a.hubScore)
  }, [tab, hitSet])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-2 py-2 text-[11.5px] font-bold transition ${
              tab === t.key ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Note>{TABS.find((t) => t.key === tab)!.desc}</Note>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-[10.5px]">
          <thead className="bg-slate-900 text-slate-500">
            <tr>
              {['#', 'Taxon', 'Module', 'Degree', 'Strength', 'Betweenness', 'Eigenvector', 'Hub_score'].map((h) => (
                <th key={h} className="px-1.5 py-1.5 text-right font-medium first:text-left [&:nth-child(-n+3)]:text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.id}
                className={`border-t border-slate-800/60 tabular-nums ${
                  selected === r.id ? 'bg-sky-500/10 text-sky-200' : 'text-slate-300'
                }`}
              >
                <td className="px-1.5 py-1 text-slate-500">{i + 1}</td>
                <td className="px-1.5 py-1">
                  {r.id} {nodeById(r.id).name}
                </td>
                <td className="px-1.5 py-1" style={{ color: MODULE_COLORS[r.module].light }}>
                  {r.module}
                </td>
                <td className="px-1.5 py-1 text-right">{r.degree}</td>
                <td className="px-1.5 py-1 text-right">{fmt(r.strength)}</td>
                <td className="px-1.5 py-1 text-right">{fmt(r.betweenness)}</td>
                <td className="px-1.5 py-1 text-right">{fmt(r.eigenvector)}</td>
                <td className="px-1.5 py-1 text-right font-bold text-amber-300">{fmt(r.hubScore)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <PanelTitle>教学点回顾</PanelTitle>
        <Note>
          严格 Hub 命中 T03 / T08 / T11——模块内度与强度双 1.000；Top 5% 每模块仅取 1 人，结果与严格 Hub
          一致；Top 3 给出每模块的完整枢纽梯队；桥梁榜前三名被 T06 / T05 / T10 霸占，T08 与 T11
          以相同介数并列其后。注意 T11 同时出现在 Hub 与桥梁两侧——它是"既是模块枢纽、又是跨界桥梁"的双重角色节点。
        </Note>
      </div>

      <div className="rounded-lg border border-slate-700/70 bg-slate-800/40 p-3">
        <PanelTitle>分析产出（对应 R 脚本写出的文件）</PanelTitle>
        <ul className="mt-2 flex flex-col gap-1">
          {OUTPUTS.map((o) => (
            <li key={o} className="font-mono text-[10.5px] leading-relaxed text-slate-400">
              <span className="text-emerald-400">✓</span> {o}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
