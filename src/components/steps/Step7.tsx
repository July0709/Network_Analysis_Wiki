// 步骤 7：Eigenvector 特征向量中心性 —— 幂迭代动画 + 收敛曲线
import { useMemo } from 'react'
import { NODES, buildGraph, nodeById } from '@/lib/graph'
import { eigenvector } from '@/lib/centrality'
import { useAnim } from '@/hooks/useAnim'
import { useViz, useDemo } from './common'
import { fmt, type VizState } from '@/state/demo'
import { Formula, MiniBars, Note, PanelTitle } from '@/components/Panel'

const g = buildGraph()
const EIG = eigenvector(g)
const ITERS = EIG.history.length
// 播放帧：前 25 轮逐帧，之后每 10 轮取一帧（前密后疏，兼顾观感与收敛全貌）
const FRAMES: number[] = (() => {
  const f: number[] = []
  for (let i = 0; i < Math.min(25, ITERS); i++) f.push(i)
  for (let i = 35; i < ITERS; i += 10) f.push(i)
  if (f[f.length - 1] !== ITERS - 1) f.push(ITERS - 1)
  return f
})()
const CONVERGED = EIG.deltas[EIG.deltas.length - 1] < 1e-7

export default function Step7() {
  const { selected } = useDemo()
  const anim = useAnim(FRAMES.length, 450)
  const iter = FRAMES[Math.min(anim.index, FRAMES.length - 1)]
  const vec = EIG.history[iter]
  const maxNow = Math.max(...vec)

  const viz = useMemo<VizState>(() => {
    const nodes: VizState['nodes'] = {}
    NODES.forEach((n, i) => {
      const scaled = vec[i] / maxNow
      nodes[n.id] = {
        scale: 0.55 + scaled * 1.1,
        value: fmt(scaled),
        pulse: n.id === selected,
      }
    })
    return { nodes, edges: {} }
  }, [vec, maxNow, selected])

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
        label: `第 ${iter} / ${ITERS - 1} 轮迭代`,
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [anim.playing, anim.index, anim.speed, iter],
    ),
  )

  const barData = useMemo(
    () =>
      [...NODES]
        .map((n) => ({ id: n.id, label: `${n.id} ${n.name}`, value: EIG.values.get(n.id)! }))
        .sort((a, b) => b.value - a.value),
    [],
  )

  // 收敛曲线（max|Δx| 随迭代轮次，log 显示）
  const chartPts = useMemo(() => {
    const deltas = EIG.deltas
    const w = 300
    const h = 70
    const maxD = Math.max(...deltas, 1e-9)
    const minLog = Math.log10(1e-7)
    const pts = deltas.map((d, i) => {
      const x = (i / Math.max(deltas.length - 1, 1)) * (w - 16) + 8
      const logv = Math.max(Math.log10(Math.max(d, 1e-7)), minLog)
      const y = 6 + ((Math.log10(maxD) - logv) / (Math.log10(maxD) - minLog)) * (h - 16)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    return { pts: pts.join(' '), w, h }
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <Formula>
        x ← A·x，每轮 L2 归一化；收敛后缩放到 max = 1
      </Formula>
      <Note>
        特征向量中心性的直觉：<b className="text-slate-200">与"重要"的节点相连，你也重要</b>。幂迭代反复把邻接矩阵 A
        （权重 = r）乘到分值向量上，节点大小随每轮分值起伏，直到收敛。点播放观察分值如何从均匀初始值分化出层次。
        对应 igraph：<code>eigen_centrality(g, weights = E(g)$weight)</code>。
      </Note>

      <div className="rounded-lg border border-violet-500/40 bg-violet-500/10 p-3">
        <div className="flex items-baseline justify-between text-[11px] text-slate-400">
          <span>收敛过程（max|Δx|，对数轴）</span>
          <span className="font-mono tabular-nums text-violet-300">
            Δ = {iter > 0 ? EIG.deltas[iter - 1].toExponential(2) : '—'}
          </span>
        </div>
        <svg viewBox={`0 0 ${chartPts.w} ${chartPts.h}`} className="mt-1 w-full">
          <polyline points={chartPts.pts} fill="none" stroke="#a78bfa" strokeWidth={1.5} opacity={0.5} />
          {iter > 0 && (
            <circle
              cx={((iter - 1) / Math.max(EIG.deltas.length - 1, 1)) * (chartPts.w - 16) + 8}
              cy={(() => {
                const d = Math.max(EIG.deltas[iter - 1], 1e-7)
                const maxD = Math.max(...EIG.deltas)
                const minLog = Math.log10(1e-7)
                return 6 + ((Math.log10(maxD) - Math.log10(d)) / (Math.log10(maxD) - minLog)) * (chartPts.h - 16)
              })()}
              r={3.5}
              fill="#c4b5fd"
            />
          )}
        </svg>
        {anim.done && (
          <div className="fade-up mt-1 text-center text-[11px] text-emerald-300">
            {CONVERGED
              ? `已收敛（${EIG.deltas.length} 轮，Δ < 1e-7）`
              : `第 ${EIG.deltas.length} 轮，Δ = ${EIG.deltas[EIG.deltas.length - 1].toExponential(1)}`}
          </div>
        )}
      </div>

      <div className="text-[12px] text-slate-400">
        选中 {selected}（{nodeById(selected).name}）：当前轮分值{' '}
        <span className="font-mono font-bold tabular-nums text-violet-300">
          {fmt(vec[NODES.findIndex((n) => n.id === selected)] / maxNow)}
        </span>
        ，最终 <span className="font-mono font-bold tabular-nums text-violet-200">{fmt(EIG.values.get(selected)!)}</span>
      </div>

      <div>
        <PanelTitle>最终 Eigenvector 排行（max = 1）</PanelTitle>
        <div className="mt-2">
          <MiniBars data={barData} highlight={selected} color="#a78bfa" />
        </div>
      </div>
      <Note>
        模块内部强相关（r 高、边密）的节点互相"抬轿"，因此模块 hub（T03 / T08 / T11）的分值明显高于模块边缘节点；
        桥接节点因邻居权重较弱，分值并不突出——它的高光时刻在介数与调和中心性里。
      </Note>
    </div>
  )
}
