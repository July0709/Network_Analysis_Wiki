// 中心性算法：全部在前端实时计算，语义对齐 igraph
import type { Adjacency } from './graph'

const EPS = 1e-9

export interface MetricSet {
  degree: Map<string, number>
  strength: Map<string, number>
  betweenness: Map<string, number> // 归一化
  betweennessRaw: Map<string, number>
  closeness: Map<string, number> // 归一化；不连通时为 NaN
  harmonic: Map<string, number> // 归一化；不可达贡献 0
  eigenvector: Map<string, number> // 缩放到 max = 1
}

/** Dijkstra（含最短路径计数 sigma 与前驱，供介数与路径动画使用） */
export interface SSSP {
  dist: Map<string, number>
  sigma: Map<string, number>
  pred: Map<string, string[]>
  order: string[] // 按距离从近到远的可达节点顺序（含源点）
}

export function dijkstra(g: Adjacency, source: string): SSSP {
  const dist = new Map<string, number>()
  const sigma = new Map<string, number>()
  const pred = new Map<string, string[]>()
  const done = new Set<string>()
  for (const id of g.ids) {
    dist.set(id, Infinity)
    sigma.set(id, 0)
    pred.set(id, [])
  }
  dist.set(source, 0)
  sigma.set(source, 1)
  const order: string[] = []

  while (true) {
    let u: string | null = null
    let best = Infinity
    for (const id of g.ids) {
      if (!done.has(id) && dist.get(id)! < best - EPS) {
        best = dist.get(id)!
        u = id
      }
    }
    if (u === null || !isFinite(best)) break
    done.add(u)
    order.push(u)
    for (const { to, dist: w } of g.adj.get(u)!) {
      const nd = best + w
      const cur = dist.get(to)!
      if (nd < cur - EPS) {
        dist.set(to, nd)
        sigma.set(to, sigma.get(u)!)
        pred.set(to, [u])
      } else if (Math.abs(nd - cur) < EPS) {
        sigma.set(to, sigma.get(to)! + sigma.get(u)!)
        pred.get(to)!.push(u)
      }
    }
  }
  return { dist, sigma, pred, order }
}

export function degree(g: Adjacency): Map<string, number> {
  const m = new Map<string, number>()
  for (const id of g.ids) m.set(id, g.adj.get(id)!.length)
  return m
}

export function strength(g: Adjacency): Map<string, number> {
  const m = new Map<string, number>()
  for (const id of g.ids) m.set(id, g.adj.get(id)!.reduce((s, e) => s + e.w, 0))
  return m
}

/** 无向归一化介数（igraph normalized）：B(v)=Σ_{s<t,s≠v≠t} σ_st(v)/σ_st ÷ ((n-1)(n-2)/2) */
export function betweenness(g: Adjacency): { norm: Map<string, number>; raw: Map<string, number> } {
  const n = g.ids.length
  const raw = new Map<string, number>(g.ids.map((id) => [id, 0]))
  const sssp = new Map<string, SSSP>()
  for (const id of g.ids) sssp.set(id, dijkstra(g, id))

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const s = g.ids[i]
      const t = g.ids[j]
      const ds = sssp.get(s)!
      const dt = sssp.get(t)!
      const d = ds.dist.get(t)!
      if (!isFinite(d)) continue
      const total = ds.sigma.get(t)!
      if (total <= 0) continue
      for (const v of g.ids) {
        if (v === s || v === t) continue
        const dv1 = ds.dist.get(v)!
        const dv2 = dt.dist.get(v)!
        if (!isFinite(dv1) || !isFinite(dv2)) continue
        if (Math.abs(dv1 + dv2 - d) < 1e-6) {
          const through = ds.sigma.get(v)! * dt.sigma.get(v)!
          raw.set(v, raw.get(v)! + through / total)
        }
      }
    }
  }
  const normFactor = ((n - 1) * (n - 2)) / 2
  const norm = new Map<string, number>()
  for (const id of g.ids) norm.set(id, raw.get(id)! / normFactor)
  return { norm, raw }
}

/** 从源点到全网的距离表（含 Infinity 表示不可达） */
export function distances(g: Adjacency, source: string): Map<string, number> {
  return dijkstra(g, source).dist
}

/** 归一化接近中心性 C(v) = (n-1)/Σd；存在不可达节点时返回 NaN（对应 igraph 的 NaN/失效） */
export function closeness(g: Adjacency): Map<string, number> {
  const n = g.ids.length
  const m = new Map<string, number>()
  for (const id of g.ids) {
    const d = distances(g, id)
    let sum = 0
    let unreachable = false
    for (const other of g.ids) {
      if (other === id) continue
      const dd = d.get(other)!
      if (!isFinite(dd)) {
        unreachable = true
        break
      }
      sum += dd
    }
    if (unreachable) m.set(id, NaN)
    else m.set(id, sum > EPS ? (n - 1) / sum : 0)
  }
  return m
}

/** 归一化调和中心性 H(v) = [Σ 1/d] / (n-1)，不可达贡献 0 */
export function harmonic(g: Adjacency): Map<string, number> {
  const n = g.ids.length
  const m = new Map<string, number>()
  for (const id of g.ids) {
    const d = distances(g, id)
    let sum = 0
    for (const other of g.ids) {
      if (other === id) continue
      const dd = d.get(other)!
      if (isFinite(dd) && dd > EPS) sum += 1 / dd
    }
    m.set(id, sum / (n - 1))
  }
  return m
}

export interface EigenResult {
  values: Map<string, number> // 缩放到 max=1
  history: number[][] // 每轮迭代（L2 归一化后、未缩放）的向量，按 g.ids 顺序
  deltas: number[] // 每轮 max|Δx|
}

/** 特征向量中心性：幂迭代 x←A·x，每轮 L2 归一化，收敛后按 igraph 习惯缩放到 max=1 */
export function eigenvector(g: Adjacency, maxIter = 500, tol = 1e-7): EigenResult {
  const n = g.ids.length
  const idx = new Map(g.ids.map((id, i) => [id, i]))
  const A: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  for (const e of g.edges) {
    const i = idx.get(e.a)!
    const j = idx.get(e.b)!
    A[i][j] = e.w
    A[j][i] = e.w
  }
  let x = new Array(n).fill(1 / Math.sqrt(n))
  const history: number[][] = [x.slice()]
  const deltas: number[] = []
  for (let it = 0; it < maxIter; it++) {
    const y = new Array(n).fill(0)
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) if (A[i][j] > 0) y[i] += A[i][j] * x[j]
    const norm = Math.sqrt(y.reduce((s, v) => s + v * v, 0))
    if (norm < EPS) break
    for (let i = 0; i < n; i++) y[i] /= norm
    let delta = 0
    for (let i = 0; i < n; i++) delta = Math.max(delta, Math.abs(y[i] - x[i]))
    deltas.push(delta)
    history.push(y.slice())
    x = y
    if (delta < tol) break
  }
  const max = Math.max(...x)
  const values = new Map<string, number>()
  g.ids.forEach((id, i) => values.set(id, x[i] / max))
  return { values, history, deltas }
}

/** 一次性计算全部指标 */
export function computeAll(g: Adjacency): MetricSet {
  const btw = betweenness(g)
  return {
    degree: degree(g),
    strength: strength(g),
    betweenness: btw.norm,
    betweennessRaw: btw.raw,
    closeness: closeness(g),
    harmonic: harmonic(g),
    eigenvector: eigenvector(g).values,
  }
}

/** 介数动画用：经过 v 的所有 (s,t) 对及其贡献与一条代表路径 */
export interface ThroughPair {
  s: string
  t: string
  contribution: number
  path: string[]
}

function onePath(pred: Map<string, string[]>, from: string, to: string): string[] {
  // 沿前驱链回溯一条最短路径 to -> from
  const path = [to]
  let cur = to
  let guard = 0
  while (cur !== from && guard++ < 100) {
    const p = pred.get(cur)!
    if (!p.length) break
    cur = p[0]
    path.push(cur)
  }
  return path.reverse() // from -> to
}

export function pairsThrough(g: Adjacency, v: string): ThroughPair[] {
  const n = g.ids.length
  const sssp = new Map<string, SSSP>()
  for (const id of g.ids) sssp.set(id, dijkstra(g, id))
  const out: ThroughPair[] = []
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const s = g.ids[i]
      const t = g.ids[j]
      if (s === v || t === v) continue
      const ds = sssp.get(s)!
      const dt = sssp.get(t)!
      const d = ds.dist.get(t)!
      if (!isFinite(d)) continue
      const total = ds.sigma.get(t)!
      const dv1 = ds.dist.get(v)!
      const dv2 = dt.dist.get(v)!
      if (!isFinite(dv1) || !isFinite(dv2)) continue
      if (Math.abs(dv1 + dv2 - d) < 1e-6) {
        const through = ds.sigma.get(v)! * dt.sigma.get(v)!
        if (through <= 0) continue
        // 代表路径：s→v（沿 s 的前驱树）接 v→t（沿 v 的前驱树）
        const dv = sssp.get(v)!
        const p1 = onePath(ds.pred, s, v)
        const p2 = onePath(dv.pred, v, t)
        out.push({ s, t, contribution: through / total, path: [...p1, ...p2.slice(1)] })
      }
    }
  }
  // 贡献从大到小排序，动画先看"主角"路径
  out.sort((a, b) => b.contribution - a.contribution)
  return out
}
