// 模块内百分位排名（dplyr percent_rank 语义）与 Hub / Bridge 评分
import type { ModuleId } from './graph'
import { NODES } from './graph'
import type { MetricSet } from './centrality'

/** dplyr::percent_rank：(min_rank(x)-1)/(n-1)；n==1 或全部相同时返回全 1（safe 版） */
export function safePercentRank(values: number[]): number[] {
  const n = values.length
  if (n <= 1) return values.map(() => 1)
  const allSame = values.every((v) => v === values[0])
  if (allSame) return values.map(() => 1)
  // min_rank：升序、并列取最小名次（1 起）
  const sorted = [...values].sort((a, b) => a - b)
  return values.map((v) => {
    const rank = sorted.findIndex((s) => s === v) + 1
    return (rank - 1) / (n - 1)
  })
}

export interface RankedNode {
  id: string
  module: ModuleId
  degree: number
  strength: number
  betweenness: number
  closeness: number
  harmonic: number
  eigenvector: number
  degPct: number
  strPct: number
  btwPct: number
  harPct: number
  eigPct: number
  hubScore: number
  bridgeScore: number
}

export function rankNodes(m: MetricSet): RankedNode[] {
  const byModule = new Map<ModuleId, string[]>()
  for (const nd of NODES) {
    if (!byModule.has(nd.module)) byModule.set(nd.module, [])
    byModule.get(nd.module)!.push(nd.id)
  }
  const pcts = new Map<string, { deg: number; str: number; btw: number; har: number; eig: number }>()
  for (const [, ids] of byModule) {
    const grab = (mm: Map<string, number>) => ids.map((id) => mm.get(id)!)
    const degP = safePercentRank(grab(m.degree))
    const strP = safePercentRank(grab(m.strength))
    const btwP = safePercentRank(grab(m.betweenness))
    const harP = safePercentRank(grab(m.harmonic))
    const eigP = safePercentRank(grab(m.eigenvector))
    ids.forEach((id, i) =>
      pcts.set(id, { deg: degP[i], str: strP[i], btw: btwP[i], har: harP[i], eig: eigP[i] }),
    )
  }
  return NODES.map((nd) => {
    const p = pcts.get(nd.id)!
    return {
      id: nd.id,
      module: nd.module,
      degree: m.degree.get(nd.id)!,
      strength: m.strength.get(nd.id)!,
      betweenness: m.betweenness.get(nd.id)!,
      closeness: m.closeness.get(nd.id)!,
      harmonic: m.harmonic.get(nd.id)!,
      eigenvector: m.eigenvector.get(nd.id)!,
      degPct: p.deg,
      strPct: p.str,
      btwPct: p.btw,
      harPct: p.har,
      eigPct: p.eig,
      hubScore: (p.deg + p.str + p.eig) / 3,
      bridgeScore: (p.btw + p.har) / 2,
    }
  })
}

/** 严格 Hub：模块内 Degree_pct ≥ 0.95 且 Strength_pct ≥ 0.95 */
export function strictHubs(ranked: RankedNode[]): string[] {
  return ranked.filter((r) => r.degPct >= 0.95 && r.strPct >= 0.95).map((r) => r.id)
}

/** 每模块 Top 5%：min_rank(desc Hub_score) ≤ max(1, ceil(n*0.05)) */
export function top5PercentPerModule(ranked: RankedNode[]): string[] {
  const out: string[] = []
  const byModule = new Map<ModuleId, RankedNode[]>()
  for (const r of ranked) {
    if (!byModule.has(r.module)) byModule.set(r.module, [])
    byModule.get(r.module)!.push(r)
  }
  for (const [, list] of byModule) {
    const k = Math.max(1, Math.ceil(list.length * 0.05))
    const sorted = [...list].sort((a, b) => b.hubScore - a.hubScore)
    // min_rank(desc)：并列同分共享名次
    let rank = 0
    let prev = Infinity
    sorted.forEach((r, i) => {
      if (r.hubScore !== prev) {
        rank = i + 1
        prev = r.hubScore
      }
      if (rank <= k) out.push(r.id)
    })
  }
  return out
}

/** 每模块 Hub_score 前三名 */
export function top3PerModule(ranked: RankedNode[]): string[] {
  const out: string[] = []
  const byModule = new Map<ModuleId, RankedNode[]>()
  for (const r of ranked) {
    if (!byModule.has(r.module)) byModule.set(r.module, [])
    byModule.get(r.module)!.push(r)
  }
  for (const [, list] of byModule) {
    const sorted = [...list].sort((a, b) => b.hubScore - a.hubScore)
    sorted.slice(0, 3).forEach((r) => out.push(r.id))
  }
  return out
}

/** 桥梁榜：按 Betweenness 降序（全网络） */
export function bridgeRanking(ranked: RankedNode[]): RankedNode[] {
  return [...ranked].sort((a, b) => b.betweenness - a.betweenness)
}
