// 步骤 9：Hub_score / Bridge_score 合成 + 全网热力着色
import { useMemo, useState } from 'react'
import { buildGraph, nodeById } from '@/lib/graph'
import { computeAll } from '@/lib/centrality'
import { rankNodes } from '@/lib/ranking'
import { useViz, useDemo } from './common'
import { fmt, type VizState } from '@/state/demo'
import { Formula, MiniBars, Note, PanelTitle } from '@/components/Panel'

const RANKED = rankNodes(computeAll(buildGraph()))

type Mode = 'hub' | 'bridge'

function heatColor(t: number): string {
  // 深 slate → 亮 amber 的热力插值
  const clamp = Math.max(0, Math.min(1, t))
  const r = Math.round(30 + clamp * (250 - 30))
  const g = Math.round(41 + clamp * (190 - 41))
  const b = Math.round(59 + clamp * (80 - 59))
  return `rgb(${r},${g},${b})`
}

export default function Step9() {
  const { selected } = useDemo()
  const [mode, setMode] = useState<Mode>('hub')
  const sel = RANKED.find((r) => r.id === selected)!

  const viz = useMemo<VizState>(() => {
    const nodes: VizState['nodes'] = {}
    for (const r of RANKED) {
      const score = mode === 'hub' ? r.hubScore : r.bridgeScore
      nodes[r.id] = {
        fill: heatColor(score),
        scale: 0.65 + score * 0.75,
        value: fmt(score),
        pulse: r.id === selected,
      }
    }
    return { nodes, edges: {} }
  }, [mode, selected])

  useViz(viz, null)

  const barData = useMemo(
    () =>
      [...RANKED]
        .map((r) => ({
          id: r.id,
          label: `${r.id} ${nodeById(r.id).name}`,
          value: mode === 'hub' ? r.hubScore : r.bridgeScore,
        }))
        .sort((a, b) => b.value - a.value),
    [mode],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          onClick={() => setMode('hub')}
          className={`flex-1 rounded-lg px-3 py-2 text-[12px] font-bold transition ${
            mode === 'hub' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Hub_score
        </button>
        <button
          onClick={() => setMode('bridge')}
          className={`flex-1 rounded-lg px-3 py-2 text-[12px] font-bold transition ${
            mode === 'bridge' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Bridge_score
        </button>
      </div>

      {mode === 'hub' ? (
        <Formula>
          Hub_score = ( D% + S% + E% ) / 3 = ( {fmt(sel.degPct)} + {fmt(sel.strPct)} + {fmt(sel.eigPct)} ) / 3 ={' '}
          {fmt(sel.hubScore)}
        </Formula>
      ) : (
        <Formula>
          Bridge_score = ( B% + H% ) / 2 = ( {fmt(sel.btwPct)} + {fmt(sel.harPct)} ) / 2 = {fmt(sel.bridgeScore)}
        </Formula>
      )}

      <Note>
        {mode === 'hub'
          ? 'Hub_score 把模块内的度、强度、特征向量三个百分位取平均——衡量"模块内枢纽"。公式中的数字随选中节点实时代入。'
          : 'Bridge_score 把模块内的介数、调和中心性百分位取平均——衡量"跨界桥梁"。注意 T11 双重身份：既是模块 C 的 hub，又是桥节点。'}
      </Note>

      <div className="rounded-lg border border-slate-700/70 bg-slate-800/40 p-3 text-[12px]">
        <PanelTitle>
          选中 {selected}（{nodeById(selected).name}）
        </PanelTitle>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px] tabular-nums text-slate-300">
          <span>Degree %</span>
          <span className="text-right">{fmt(sel.degPct)}</span>
          <span>Strength %</span>
          <span className="text-right">{fmt(sel.strPct)}</span>
          <span>Eigenvector %</span>
          <span className="text-right">{fmt(sel.eigPct)}</span>
          <span>Betweenness %</span>
          <span className="text-right">{fmt(sel.btwPct)}</span>
          <span>Harmonic %</span>
          <span className="text-right">{fmt(sel.harPct)}</span>
          <span className="mt-1 border-t border-slate-700 pt-1 font-bold text-amber-300">Hub_score</span>
          <span className="mt-1 border-t border-slate-700 pt-1 text-right font-bold text-amber-300">{fmt(sel.hubScore)}</span>
          <span className="font-bold text-amber-300">Bridge_score</span>
          <span className="text-right font-bold text-amber-300">{fmt(sel.bridgeScore)}</span>
        </div>
      </div>

      <div>
        <PanelTitle>全网络 {mode === 'hub' ? 'Hub_score' : 'Bridge_score'} 排行</PanelTitle>
        <div className="mt-2">
          <MiniBars data={barData} highlight={selected} color="#f59e0b" />
        </div>
      </div>
      <Note>
        画布上节点颜色越亮、越大，得分越高。切换到 Bridge_score 时可以看到舞台瞬间换位：模块 hub 暗淡下去，
        T05 / T06 / T10 / T11 四个桥节点亮起来。
      </Note>
    </div>
  )
}
