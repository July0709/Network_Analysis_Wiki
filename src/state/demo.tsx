// 全局演示状态：当前步骤、选中节点、画布视觉状态、控制条配置
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export interface NodeViz {
  hidden?: boolean // 完全隐藏（淡入动画用）
  dim?: boolean // 变灰
  scale?: number // 半径缩放（默认 1）
  fill?: string // 覆盖填充色
  pulse?: boolean // 脉冲光环
  badge?: string // 节点上方小标注（如最短距离）
  value?: string // 节点下方数值
  ripple?: boolean // 波纹扩散
}

export interface EdgeViz {
  hidden?: boolean
  dim?: boolean
  highlight?: boolean // 高亮色
  flow?: boolean // 流动虚线动画
  labelAlt?: string // 替换默认 r 标签（如 1/r）
}

export interface VizState {
  nodes: Record<string, NodeViz>
  edges: Record<string, EdgeViz>
  hideEdgeLabels?: boolean
}

export const emptyViz: VizState = { nodes: {}, edges: {} }

export interface ControlsConfig {
  showPlay?: boolean
  playing?: boolean
  onPlayPause?: () => void
  onStepFwd?: () => void
  onReset?: () => void
  speed?: number // ms / tick
  onSpeed?: (v: number) => void
  label?: string
}

interface DemoCtx {
  step: number
  setStep: (s: number) => void
  maxUnlocked: number
  freeNav: boolean
  setFreeNav: (b: boolean) => void
  selected: string
  setSelected: (id: string) => void
  viz: VizState
  setViz: (v: VizState) => void
  controls: ControlsConfig | null
  setControls: (c: ControlsConfig | null) => void
  threshold: number
  setThreshold: (t: number) => void
  disconnect: boolean
  setDisconnect: (b: boolean) => void
}

const Ctx = createContext<DemoCtx | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [step, setStepRaw] = useState(0)
  const [maxUnlocked, setMaxUnlocked] = useState(0)
  const [freeNav, setFreeNav] = useState(false)
  const [selected, setSelected] = useState('T03')
  const [viz, setViz] = useState<VizState>(emptyViz)
  const [controls, setControls] = useState<ControlsConfig | null>(null)
  const [threshold, setThreshold] = useState(0.6)
  const [disconnect, setDisconnect] = useState(false)

  const setStep = useCallback(
    (s: number) => {
      setStepRaw((prev) => {
        // 离开步骤 0 时锁定阈值回 0.60，保证后续步骤数值确定
        if (prev === 0 && s !== 0) setThreshold(0.6)
        return s
      })
      setMaxUnlocked((m) => Math.max(m, s))
    },
    [],
  )

  const value = useMemo<DemoCtx>(
    () => ({
      step,
      setStep,
      maxUnlocked,
      freeNav,
      setFreeNav,
      selected,
      setSelected,
      viz,
      setViz,
      controls,
      setControls,
      threshold,
      setThreshold,
      disconnect,
      setDisconnect,
    }),
    [step, setStep, maxUnlocked, freeNav, selected, viz, controls, threshold, disconnect],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useDemo(): DemoCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDemo must be used within DemoProvider')
  return ctx
}

export const fmt = (v: number, digits = 3): string => {
  if (Number.isNaN(v)) return 'NaN'
  if (!isFinite(v)) return '∞'
  return v.toFixed(digits)
}
