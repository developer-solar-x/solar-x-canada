'use client'

import { formatCurrency } from '@/lib/utils'

interface SavingsTooltipProps {
  active?: boolean
  label?: string | number
  payload?: Array<{
    name?: string
    value?: number
    color?: string
  }>
  coordinate?: { x: number; y: number }
  viewBox?: { width?: number; height?: number }
}

export function SavingsTooltip(props: SavingsTooltipProps) {
  const { active, label, payload, coordinate, viewBox } = props || {}
  if (!active || !payload || payload.length === 0 || !coordinate || !viewBox) return null

  const tooltipMaxWidth = 300 // px, keep in sync with styles below
  const horizontalGap = 16 // px gap from cursor
  const numericLabel = Number(label)
  const flipAfterYear = 20
  const shouldFlipLeft = !Number.isNaN(numericLabel) && numericLabel >= flipAfterYear

  // Compute left position with simple clamping so it never goes off-canvas
  const proposedLeft = shouldFlipLeft
    ? coordinate.x - tooltipMaxWidth - horizontalGap
    : coordinate.x + horizontalGap
  const left = Math.min(Math.max(proposedLeft, 0), Math.max(0, (viewBox.width || 0) - tooltipMaxWidth))

  // Place slightly above cursor; clamp to top
  const top = Math.max((coordinate.y || 0) - 60, 0)

  return (
    <div
      style={{ position: 'absolute', left, top, zIndex: 9999, pointerEvents: 'none', maxWidth: tooltipMaxWidth }}
      className="rounded-md border border-gray-200 bg-white text-[14px] shadow-md p-3"
    >
      <div className="text-xs font-semibold text-gray-700 mb-1">Year {label}</div>
      <div className="space-y-1">
        {payload.map((p: any, idx: number) => {
          const name = p?.name
          const val = typeof p?.value === 'number' ? formatCurrency(Math.round(p.value)) : p?.value
          return (
            <div key={idx} className="flex items-center gap-2 text-gray-700">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: p?.color || '#999' }} />
              <span className="whitespace-nowrap">{name}</span>
              <span className="ml-auto font-medium">{val}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

