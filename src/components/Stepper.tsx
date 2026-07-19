// 左侧步骤导航（Stepper）：逐步解锁 + 自由浏览开关
import { Lock, Check } from 'lucide-react'
import { useDemo } from '@/state/demo'

export const STEP_TITLES = [
  '从数据到网络',
  '边强度 → 边距离',
  'Degree 度中心性',
  'Strength 强度中心性',
  'Betweenness 介数中心性',
  'Closeness 接近中心性',
  'Harmonic 调和中心性',
  'Eigenvector 特征向量',
  '模块内百分位排名',
  'Hub / Bridge 评分',
  '筛选 Hub 与桥梁',
]

export default function Stepper() {
  const { step, setStep, maxUnlocked, freeNav, setFreeNav } = useDemo()
  return (
    <nav className="flex flex-col gap-0.5">
      {STEP_TITLES.map((title, i) => {
        const locked = !freeNav && i > maxUnlocked
        const active = i === step
        const done = i < step || i < maxUnlocked
        return (
          <button
            key={i}
            disabled={locked}
            onClick={() => setStep(i)}
            className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition ${
              active
                ? 'bg-sky-600/20 text-sky-300 ring-1 ring-sky-500/40'
                : locked
                  ? 'cursor-not-allowed text-slate-600'
                  : 'text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <span
              className={`flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                active
                  ? 'border-sky-400 bg-sky-500/30 text-sky-200'
                  : locked
                    ? 'border-slate-700 text-slate-600'
                    : done
                      ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-400'
                      : 'border-slate-600 text-slate-400'
              }`}
              style={{ width: 22, height: 22 }}
            >
              {locked ? <Lock size={10} /> : done && !active ? <Check size={11} /> : i}
            </span>
            <span className="leading-tight">{title}</span>
          </button>
        )
      })}
      <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-2 text-[11px] text-slate-400">
        <input
          type="checkbox"
          checked={freeNav}
          onChange={(e) => setFreeNav(e.target.checked)}
          className="accent-sky-500"
        />
        自由浏览（解锁全部步骤）
      </label>
    </nav>
  )
}
