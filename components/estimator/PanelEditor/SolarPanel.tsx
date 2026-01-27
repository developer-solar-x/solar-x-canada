'use client'

/**
 * Individual Solar Panel Component
 * Renders a draggable, rotatable solar panel on the Konva canvas
 */

import { useRef, useEffect } from 'react'
import { Rect, Group, Transformer } from 'react-konva'
import type Konva from 'konva'
import type { PanelData } from './types'

interface SolarPanelProps {
  panel: PanelData
  isSelected: boolean
  onSelect: (id: string, multiSelect: boolean) => void
  onDragStart: (id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
  onTransformEnd: (id: string, attrs: Partial<PanelData>) => void
  snapToGrid: boolean
  gridSize: number
}

export function SolarPanel({
  panel,
  isSelected,
  onSelect,
  onDragStart,
  onDragEnd,
  onTransformEnd,
  snapToGrid,
  gridSize,
}: SolarPanelProps) {
  const groupRef = useRef<Konva.Group>(null)
  const transformerRef = useRef<Konva.Transformer>(null)

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current])
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  const handleDragStart = () => {
    onDragStart(panel.id)
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    let x = e.target.x()
    let y = e.target.y()

    // Snap to grid if enabled
    if (snapToGrid) {
      x = Math.round(x / gridSize) * gridSize
      y = Math.round(y / gridSize) * gridSize
      e.target.position({ x, y })
    }

    onDragEnd(panel.id, x, y)
  }

  const handleTransformEnd = () => {
    const node = groupRef.current
    if (!node) return

    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // Reset scale and update width/height
    node.scaleX(1)
    node.scaleY(1)

    onTransformEnd(panel.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(20, panel.width * scaleX),
      height: Math.max(20, panel.height * scaleY),
      rotation: node.rotation(),
    })
  }

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    onSelect(panel.id, e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey)
  }

  // Panel colors
  const panelFill = '#1a2533' // Dark blue-black
  const panelStroke = isSelected ? '#4a90d9' : '#a8b4c4' // Blue when selected, silver otherwise
  const cellLineColor = '#2a3a4d' // Subtle grid lines for solar cells

  // Calculate cell grid (6x10 cells typical for residential panels)
  const cellRows = 6
  const cellCols = 10
  const cellWidth = panel.width / cellCols
  const cellHeight = panel.height / cellRows

  return (
    <>
      <Group
        ref={groupRef}
        x={panel.x}
        y={panel.y}
        rotation={panel.rotation}
        draggable
        onClick={handleClick}
        onTap={handleClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      >
        {/* Panel background */}
        <Rect
          width={panel.width}
          height={panel.height}
          fill={panelFill}
          stroke={panelStroke}
          strokeWidth={isSelected ? 3 : 2}
          cornerRadius={2}
          shadowColor="black"
          shadowBlur={isSelected ? 10 : 5}
          shadowOpacity={0.3}
          shadowOffsetX={2}
          shadowOffsetY={2}
        />

        {/* Solar cell grid lines - vertical */}
        {Array.from({ length: cellCols - 1 }, (_, i) => (
          <Rect
            key={`v-${i}`}
            x={(i + 1) * cellWidth - 0.5}
            y={2}
            width={1}
            height={panel.height - 4}
            fill={cellLineColor}
          />
        ))}

        {/* Solar cell grid lines - horizontal */}
        {Array.from({ length: cellRows - 1 }, (_, i) => (
          <Rect
            key={`h-${i}`}
            x={2}
            y={(i + 1) * cellHeight - 0.5}
            width={panel.width - 4}
            height={1}
            fill={cellLineColor}
          />
        ))}

        {/* Frame highlight (top-left) */}
        <Rect
          x={0}
          y={0}
          width={panel.width}
          height={2}
          fill="rgba(255,255,255,0.1)"
        />
        <Rect
          x={0}
          y={0}
          width={2}
          height={panel.height}
          fill="rgba(255,255,255,0.1)"
        />
      </Group>

      {/* Transformer for resize/rotate when selected */}
      {isSelected && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={true}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
          ]}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size
            if (newBox.width < 20 || newBox.height < 20) {
              return oldBox
            }
            return newBox
          }}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          rotationSnapTolerance={5}
        />
      )}
    </>
  )
}
