// 内置示例网络：14 个菌属节点、3 个模块、固定坐标（确定性布局）
export type ModuleId = 'A' | 'B' | 'C'

export interface GNode {
  id: string
  name: string
  module: ModuleId
  x: number
  y: number
}

export interface GEdge {
  a: string
  b: string
  w: number // Spearman 相关系数 r
  bridge?: boolean // 跨模块桥接边
}

export const MODULE_COLORS: Record<ModuleId, { base: string; light: string; dark: string; label: string }> = {
  A: { base: '#10b981', light: '#6ee7b7', dark: '#065f46', label: '模块 A' },
  B: { base: '#3b82f6', light: '#93c5fd', dark: '#1e3a8a', label: '模块 B' },
  C: { base: '#f97316', light: '#fdba74', dark: '#7c2d12', label: '模块 C' },
}

export const BRIDGE_COLOR = '#c084fc'

export const NODES: GNode[] = [
  { id: 'T01', name: 'Lactobacillus', module: 'A', x: 140, y: 190 },
  { id: 'T02', name: 'Bifidobacterium', module: 'A', x: 150, y: 450 },
  { id: 'T03', name: 'Faecalibacterium', module: 'A', x: 250, y: 320 },
  { id: 'T04', name: 'Roseburia', module: 'A', x: 360, y: 210 },
  { id: 'T05', name: 'Akkermansia', module: 'A', x: 370, y: 430 },
  { id: 'T06', name: 'Bacteroides', module: 'B', x: 570, y: 150 },
  { id: 'T07', name: 'Prevotella', module: 'B', x: 760, y: 170 },
  { id: 'T08', name: 'Ruminococcus', module: 'B', x: 680, y: 320 },
  { id: 'T09', name: 'Alistipes', module: 'B', x: 770, y: 470 },
  { id: 'T10', name: 'Parabacteroides', module: 'B', x: 580, y: 480 },
  { id: 'T11', name: 'Escherichia', module: 'C', x: 990, y: 200 },
  { id: 'T12', name: 'Klebsiella', module: 'C', x: 1120, y: 260 },
  { id: 'T13', name: 'Enterococcus', module: 'C', x: 980, y: 440 },
  { id: 'T14', name: 'Streptococcus', module: 'C', x: 1110, y: 400 },
]

export const EDGES: GEdge[] = [
  // 模块 A 内部
  { a: 'T01', b: 'T02', w: 0.92 },
  { a: 'T01', b: 'T03', w: 0.85 },
  { a: 'T02', b: 'T03', w: 0.78 },
  { a: 'T02', b: 'T04', w: 0.71 },
  { a: 'T03', b: 'T04', w: 0.88 },
  { a: 'T03', b: 'T05', w: 0.8 },
  { a: 'T04', b: 'T05', w: 0.75 },
  // 模块 B 内部
  { a: 'T06', b: 'T07', w: 0.9 },
  { a: 'T06', b: 'T08', w: 0.83 },
  { a: 'T07', b: 'T08', w: 0.76 },
  { a: 'T07', b: 'T09', w: 0.81 },
  { a: 'T08', b: 'T09', w: 0.72 },
  { a: 'T08', b: 'T10', w: 0.79 },
  { a: 'T09', b: 'T10', w: 0.86 },
  // 模块 C 内部
  { a: 'T11', b: 'T12', w: 0.89 },
  { a: 'T11', b: 'T13', w: 0.74 },
  { a: 'T12', b: 'T14', w: 0.82 },
  { a: 'T13', b: 'T14', w: 0.77 },
  { a: 'T11', b: 'T14', w: 0.68 },
  { a: 'T12', b: 'T13', w: 0.7 },
  // 跨模块桥接边
  { a: 'T05', b: 'T06', w: 0.65, bridge: true },
  { a: 'T10', b: 'T11', w: 0.62, bridge: true },
]

export const nodeById = (id: string): GNode => NODES.find((n) => n.id === id)!

export const edgeKey = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`)

export interface Adjacency {
  ids: string[]
  // 邻接表：id -> [{to, w, dist}]
  adj: Map<string, { to: string; w: number; dist: number }[]>
  edges: GEdge[] // 过滤后的边
}

/** 按阈值 / 断开桥接边 构建邻接结构。dist = 1 / w */
export function buildGraph(threshold = 0.6, disconnect = false): Adjacency {
  const edges = EDGES.filter((e) => e.w >= threshold - 1e-9 && !(disconnect && e.bridge))
  const adj = new Map<string, { to: string; w: number; dist: number }[]>()
  for (const n of NODES) adj.set(n.id, [])
  for (const e of edges) {
    const dist = 1 / e.w
    adj.get(e.a)!.push({ to: e.b, w: e.w, dist })
    adj.get(e.b)!.push({ to: e.a, w: e.w, dist })
  }
  return { ids: NODES.map((n) => n.id), adj, edges }
}
