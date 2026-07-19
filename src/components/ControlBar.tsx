// 播放 / 暂停 / 单步 / 重置 / 速度 控制条
import { Play, Pause, StepForward, RotateCcw } from 'lucide-react'
import { useDemo } from '@/state/demo'

export default function ControlBar() {
  const { controls } = useDemo()
  if (!controls) return null
  const { showPlay = true, playing, onPlayPause, onStepFwd, onReset, speed, onSpeed, label } = controls
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2">
      {showPlay && onPlayPause && (
        <button
          onClick={onPlayPause}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-sky-600 px-3 text-xs font-semibold text-white transition hover:bg-sky-500"
        >
          {playing ? <Pause size={13} /> : <Play size={13} />}
          {playing ? '暂停' : '播放'}
        </button>
      )}
      {onStepFwd && (
        <button
          onClick={onStepFwd}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-700 px-3 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
        >
          <StepForward size={13} /> 单步
        </button>
      )}
      {onReset && (
        <button
          onClick={onReset}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-700 px-3 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
        >
          <RotateCcw size={13} /> 重置
        </button>
      )}
      {onSpeed && speed !== undefined && (
        <label className="flex items-center gap-2 text-[11px] text-slate-400">
          速度
          <input
            type="range"
            min={150}
            max={2000}
            step={50}
            value={2150 - speed}
            onChange={(e) => onSpeed(2150 - Number(e.target.value))}
            className="h-1 w-24 accent-sky-500"
          />
          <span className="w-12 text-right tabular-nums">{(1000 / speed).toFixed(1)}×</span>
        </label>
      )}
      {label && <span className="ml-auto text-[11px] tabular-nums text-slate-400">{label}</span>}
    </div>
  )
}
