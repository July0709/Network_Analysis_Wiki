// 主页面：左步骤导航 / 中画布+控制条 / 右讲解面板
import { DemoProvider, useDemo } from '@/state/demo'
import Stepper, { STEP_TITLES } from '@/components/Stepper'
import NetworkCanvas from '@/components/NetworkCanvas'
import ControlBar from '@/components/ControlBar'
import Step0 from '@/components/steps/Step0'
import Step1 from '@/components/steps/Step1'
import Step2 from '@/components/steps/Step2'
import Step3 from '@/components/steps/Step3'
import Step4 from '@/components/steps/Step4'
import Step5 from '@/components/steps/Step5'
import Step6 from '@/components/steps/Step6'
import Step7 from '@/components/steps/Step7'
import Step8 from '@/components/steps/Step8'
import Step9 from '@/components/steps/Step9'
import Step10 from '@/components/steps/Step10'
import { ChevronLeft, ChevronRight, Network } from 'lucide-react'

const STEP_COMPONENTS = [Step0, Step1, Step2, Step3, Step4, Step5, Step6, Step7, Step8, Step9, Step10]

function Shell() {
  const { step, setStep, maxUnlocked, freeNav } = useDemo()
  const Active = STEP_COMPONENTS[step]
  const canNext = step < STEP_COMPONENTS.length - 1 && (freeNav || step + 1 <= maxUnlocked + 1)

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      {/* 顶栏 */}
      <header className="border-b border-slate-800 bg-slate-900/70 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1700px] items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600/25 text-sky-300">
            <Network size={18} />
          </span>
          <div>
            <h1 className="text-[15px] font-bold tracking-wide text-slate-100">网络中心性计算 · 交互式演示</h1>
            <p className="text-[11px] text-slate-400">
              复现 CLR + Spearman（r ≥ 0.6）微生物共现网络的 igraph 中心性分析流程 · 内置示例数据 14 节点 / 22 边
            </p>
          </div>
          <div className="ml-auto hidden items-center gap-3 text-[10px] text-slate-500 md:flex">
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-500" /> 模块 A</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-blue-500" /> 模块 B</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-orange-500" /> 模块 C</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-purple-400" /> 桥接边</span>
          </div>
        </div>
      </header>

      {/* 三栏 */}
      <main className="mx-auto flex w-full max-w-[1700px] flex-1 flex-col gap-4 p-4 lg:grid lg:grid-cols-[220px_minmax(0,1fr)_380px]">
        {/* 左：步骤导航 */}
        <aside className="rounded-2xl border border-slate-800 bg-slate-900/50 p-2.5 lg:sticky lg:top-4 lg:self-start">
          <div className="mb-2 px-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">计算流程</div>
          <Stepper />
        </aside>

        {/* 中：画布 */}
        <section className="flex min-w-0 flex-col gap-3">
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
              <span className="text-[12px] font-semibold text-slate-300">
                步骤 {step} · {STEP_TITLES[step]}
              </span>
              <span className="text-[10px] text-slate-500">点击任意节点选中 · 边粗细 ∝ |r|</span>
            </div>
            <NetworkCanvas />
          </div>
          <ControlBar />
          <div className="flex items-center justify-between">
            <button
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-[12px] text-slate-300 transition hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronLeft size={14} /> 上一步
            </button>
            <div className="flex gap-1">
              {STEP_TITLES.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-sky-400' : i <= maxUnlocked ? 'w-1.5 bg-emerald-600' : 'w-1.5 bg-slate-700'}`}
                />
              ))}
            </div>
            <button
              disabled={!canNext}
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-sky-500 disabled:opacity-30"
            >
              下一步 <ChevronRight size={14} />
            </button>
          </div>
        </section>

        {/* 右：讲解面板 */}
        <aside className="min-h-[400px] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/50 p-4 lg:max-h-[calc(100vh-120px)] lg:sticky lg:top-4">
          <Active />
        </aside>
      </main>

      <footer className="border-t border-slate-800 px-4 py-2.5 text-center text-[10px] text-slate-600">
        教学演示 · 数据为内置示例 · 全部中心性指标在前端实时计算（语义对齐 igraph / dplyr）
      </footer>
    </div>
  )
}

export default function Home() {
  return (
    <DemoProvider>
      <Shell />
    </DemoProvider>
  )
}
