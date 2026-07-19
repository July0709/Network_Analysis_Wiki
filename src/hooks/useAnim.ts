// 通用离散动画推进 hook：播放/暂停/单步/重置 + 速度
import { useCallback, useEffect, useRef, useState } from 'react'

export interface Anim {
  index: number // 当前推进到第几步（0..count）
  playing: boolean
  speed: number
  setSpeed: (v: number) => void
  play: () => void
  pause: () => void
  toggle: () => void
  stepFwd: () => void
  reset: () => void
  done: boolean
}

export function useAnim(count: number, defaultSpeed = 900, resetKey: unknown = 0): Anim {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(defaultSpeed)
  const timer = useRef<number | null>(null)

  const stop = useCallback(() => {
    if (timer.current !== null) {
      window.clearInterval(timer.current)
      timer.current = null
    }
  }, [])

  useEffect(() => {
    setIndex(0)
    setPlaying(false)
    stop()
  }, [resetKey, count, stop])

  useEffect(() => {
    stop()
    if (playing && index < count) {
      timer.current = window.setInterval(() => {
        setIndex((i) => {
          if (i + 1 >= count) {
            setPlaying(false)
            return count
          }
          return i + 1
        })
      }, speed)
    }
    return stop
  }, [playing, speed, count, stop]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stop(), [stop])

  return {
    index,
    playing,
    speed,
    setSpeed,
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    toggle: () => setPlaying((p) => !p),
    stepFwd: () => {
      setPlaying(false)
      setIndex((i) => Math.min(count, i + 1))
    },
    reset: () => {
      setPlaying(false)
      setIndex(0)
    },
    done: index >= count,
  }
}
