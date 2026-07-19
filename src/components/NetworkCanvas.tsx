// SVG 网络画布：边粗细 ∝ r，节点可点击，支持高亮/流动/波纹/缩放/数值标注
import { EDGES, MODULE_COLORS, BRIDGE_COLOR, NODES, edgeKey } from '@/lib/graph'
import { useDemo } from '@/state/demo'

const NODE_R = 17

export function edgeWidth(w: number): number {
  return 1.2 + ((w - 0.6) / 0.32) * 5
}

export default function NetworkCanvas() {
  const { viz, selected, setSelected } = useDemo()
  const pos = new Map(NODES.map((n) => [n.id, n]))

  return (
    <svg viewBox="0 0 1200 640" className="h-auto w-full select-none">
      <defs>
        <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 边 */}
      {EDGES.map((e) => {
        const ev = viz.edges[edgeKey(e.a, e.b)] ?? {}
        if (ev.hidden) return null
        const a = pos.get(e.a)!
        const b = pos.get(e.b)!
        const color = e.bridge ? BRIDGE_COLOR : MODULE_COLORS[a.module].base
        const width = edgeWidth(e.w)
        const opacity = ev.dim ? 0.12 : ev.highlight || ev.flow ? 1 : 0.55
        return (
          <g key={edgeKey(e.a, e.b)} style={{ transition: 'opacity .45s' }} opacity={opacity}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={ev.highlight ? '#f8fafc' : color}
              strokeWidth={ev.highlight ? width + 1.5 : width}
              strokeLinecap="round"
              style={{ transition: 'stroke .3s, stroke-width .3s' }}
            />
            {ev.flow && (
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#fef08a"
                strokeWidth={width * 0.55}
                strokeLinecap="round"
                strokeDasharray="4 14"
                className="edge-flow"
              />
            )}
            {!viz.hideEdgeLabels && (
              <g
                style={{
                  transition: 'opacity .4s',
                  opacity: ev.dim ? 0.25 : 0.95,
                }}
              >
                <text
                  x={(a.x + b.x) / 2}
                  y={(a.y + b.y) / 2 - 4}
                  textAnchor="middle"
                  fontSize={10}
                  fill={ev.labelAlt ? '#fde68a' : '#94a3b8'}
                  style={{ paintOrder: 'stroke', stroke: '#0f172a', strokeWidth: 3, transition: 'fill .5s' }}
                  className={ev.labelAlt ? 'label-flip' : undefined}
                >
                  {ev.labelAlt ?? e.w.toFixed(2)}
                </text>
              </g>
            )}
          </g>
        )
      })}

      {/* 节点 */}
      {NODES.map((n) => {
        const nv = viz.nodes[n.id] ?? {}
        const mc = MODULE_COLORS[n.module]
        const r = NODE_R * (nv.scale ?? 1)
        const isSel = selected === n.id
        return (
          <g
            key={n.id}
            onClick={() => setSelected(n.id)}
            className="cursor-pointer"
            style={{ transition: 'opacity .45s' }}
            opacity={nv.hidden ? 0 : nv.dim ? 0.18 : 1}
            pointerEvents={nv.hidden ? 'none' : undefined}
          >
            {nv.ripple && (
              <circle cx={n.x} cy={n.y} r={NODE_R} fill="none" stroke={mc.light} strokeWidth={2} className="ripple" />
            )}
            {nv.pulse && (
              <circle cx={n.x} cy={n.y} r={NODE_R + 5} fill="none" stroke={mc.light} strokeWidth={2.5} className="pulse-ring" />
            )}
            <circle
              cx={n.x}
              cy={n.y}
              r={r}
              fill={nv.fill ?? mc.dark}
              stroke={isSel ? '#f8fafc' : mc.base}
              strokeWidth={isSel ? 3.5 : 2}
              filter={isSel ? 'url(#glow)' : undefined}
              style={{ transition: 'r .6s cubic-bezier(.34,1.56,.64,1), fill .6s, stroke .3s' }}
            />
            <text x={n.x} y={n.y + 3.5} textAnchor="middle" fontSize={10} fontWeight={700} fill={mc.light} pointerEvents="none">
              {n.id}
            </text>
            {nv.badge && (
              <text
                x={n.x}
                y={n.y - r - 8}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                fill="#fde68a"
                style={{ paintOrder: 'stroke', stroke: '#0f172a', strokeWidth: 3 }}
              >
                {nv.badge}
              </text>
            )}
            <text
              x={n.x}
              y={n.y + r + 15}
              textAnchor="middle"
              fontSize={11}
              fill="#cbd5e1"
              style={{ paintOrder: 'stroke', stroke: '#0f172a', strokeWidth: 3, transition: 'y .6s' }}
            >
              {n.name}
            </text>
            {nv.value && (
              <text
                x={n.x}
                y={n.y + r + 29}
                textAnchor="middle"
                fontSize={11}
                fontWeight={700}
                fill="#f8fafc"
                style={{ paintOrder: 'stroke', stroke: '#0f172a', strokeWidth: 3 }}
              >
                {nv.value}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
