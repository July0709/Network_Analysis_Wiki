// 步骤组件公共辅助：注册画布视觉状态与控制条（卸载时清理）
import { useEffect } from 'react'
import { emptyViz, useDemo, type ControlsConfig, type VizState } from '@/state/demo'

export function useViz(viz: VizState, controls: ControlsConfig | null) {
  const { setViz, setControls } = useDemo()
  useEffect(() => {
    setViz(viz)
  }, [viz, setViz])
  useEffect(() => {
    setControls(controls)
  }, [controls, setControls])
  useEffect(
    () => () => {
      setViz(emptyViz)
      setControls(null)
    },
    [setViz, setControls],
  )
}

export { useDemo }
