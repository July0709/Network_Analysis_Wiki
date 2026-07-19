// 右侧讲解面板的通用小组件
import type { ReactNode } from 'react'

export function Formula({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-700/70 bg-slate-800/50 px-3 py-2.5 text-center font-mono text-[13px] leading-relaxed text-amber-200">
      {children}
    </div>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="text-[12px] leading-relaxed text-slate-400">{children}</p>
}

export function PanelTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-[13px] font-bold tracking-wide text-slate-200">{children}</h3>
}

/** 小条形图：label + 数值条 */
export function MiniBars({
  data,
  highlight,
  color = '#38bdf8',
  digits = 3,
}: {
  data: { id: string; label: string; value: number; na?: boolean }[]
  highlight?: string
  color?: string
  digits?: number
}) {
  const max = Math.max(...data.map((d) => (isFinite(d.value) ? d.value : 0)), 1e-9)
  return (
    <div className="flex flex-col gap-1">
      {data.map((d) => (
        <div
          key={d.id}
          className={`flex items-center gap-2 rounded px-1 py-0.5 text-[11px] ${
            highlight === d.id ? 'bg-sky-500/15 ring-1 ring-sky-500/40' : ''
          }`}
        >
          <span className="w-24 shrink-0 truncate text-slate-400" title={d.label}>
            {d.label}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-800">
            {!d.na && isFinite(d.value) && (
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(d.value / max) * 100}%`, background: color }}
              />
            )}
          </div>
          <span className="w-14 shrink-0 text-right tabular-nums text-slate-300">
            {d.na || !isFinite(d.value) ? 'NaN' : d.value.toFixed(digits)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function Tag({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ background: `${color ?? '#334155'}33`, color: color ?? '#94a3b8', border: `1px solid ${color ?? '#334155'}66` }}
    >
      {children}
    </span>
  )
}
