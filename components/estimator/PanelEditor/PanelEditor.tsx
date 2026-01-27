'use client'

/**
 * Interactive Panel Editor
 * Canvas overlay for dragging, rotating, and arranging solar panels
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Stage, Layer, Line } from 'react-konva'
import { SolarPanel } from './SolarPanel'
import { PanelEditorControls } from './PanelEditorControls'
import type {
  PanelData,
  PanelEditorProps,
  PanelFormation,
  PanelOrientation,
} from './types'
import { PANEL_SPECS } from '@/config/panel-specs'

// Convert panel dimensions to default pixel size (at standard zoom)
const BASE_PANEL_WIDTH = 40 // pixels for portrait width
const BASE_PANEL_HEIGHT = 70 // pixels for portrait height
const PANEL_ASPECT_RATIO = PANEL_SPECS.dimensions.length / PANEL_SPECS.dimensions.width // ~1.73

export function PanelEditor({
  width,
  height,
  roofPolygonPixels,
  initialPanels,
  onPanelsChange,
  onPanelCountChange,
  sectionId = 'section-1',
  sectionAzimuth = 180,
}: PanelEditorProps) {
  // Panel state
  const [panels, setPanels] = useState<PanelData[]>(initialPanels || [])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Editor settings
  const [formation, setFormation] = useState<PanelFormation>('grid')
  const [orientation, setOrientation] = useState<PanelOrientation>('portrait')
  const [spacing, setSpacing] = useState(4) // pixels between panels
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize, setGridSize] = useState(10)
  const [showGrid, setShowGrid] = useState(false)

  // Panel dimensions based on orientation
  const panelWidth = orientation === 'portrait' ? BASE_PANEL_WIDTH : BASE_PANEL_HEIGHT
  const panelHeight = orientation === 'portrait' ? BASE_PANEL_HEIGHT : BASE_PANEL_WIDTH

  // Generate panels based on formation
  const generatePanels = useCallback(
    (formationType: PanelFormation, orient: PanelOrientation): PanelData[] => {
      if (!roofPolygonPixels || roofPolygonPixels.length < 3) return []

      const pWidth = orient === 'portrait' ? BASE_PANEL_WIDTH : BASE_PANEL_HEIGHT
      const pHeight = orient === 'portrait' ? BASE_PANEL_HEIGHT : BASE_PANEL_WIDTH

      // Calculate bounding box of roof polygon
      const xs = roofPolygonPixels.map((p) => p[0])
      const ys = roofPolygonPixels.map((p) => p[1])
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)

      // Padding from roof edges
      const padding = 10

      const newPanels: PanelData[] = []
      let panelIndex = 0

      // Base rotation from section azimuth (panels face perpendicular to azimuth)
      const baseRotation = (sectionAzimuth + 180) % 360 - 180

      switch (formationType) {
        case 'grid': {
          // Standard grid formation
          for (let y = minY + padding; y + pHeight < maxY - padding; y += pHeight + spacing) {
            for (let x = minX + padding; x + pWidth < maxX - padding; x += pWidth + spacing) {
              // Check if panel center is inside roof polygon
              const centerX = x + pWidth / 2
              const centerY = y + pHeight / 2
              if (isPointInPolygon(centerX, centerY, roofPolygonPixels)) {
                newPanels.push({
                  id: `${sectionId}-panel-${panelIndex++}`,
                  x,
                  y,
                  width: pWidth,
                  height: pHeight,
                  rotation: 0,
                  sectionId,
                })
              }
            }
          }
          break
        }

        case 'staggered': {
          // Brick-like staggered pattern
          let rowIndex = 0
          for (let y = minY + padding; y + pHeight < maxY - padding; y += pHeight + spacing) {
            const offset = rowIndex % 2 === 1 ? (pWidth + spacing) / 2 : 0
            for (
              let x = minX + padding + offset;
              x + pWidth < maxX - padding;
              x += pWidth + spacing
            ) {
              const centerX = x + pWidth / 2
              const centerY = y + pHeight / 2
              if (isPointInPolygon(centerX, centerY, roofPolygonPixels)) {
                newPanels.push({
                  id: `${sectionId}-panel-${panelIndex++}`,
                  x,
                  y,
                  width: pWidth,
                  height: pHeight,
                  rotation: 0,
                  sectionId,
                })
              }
            }
            rowIndex++
          }
          break
        }

        case 'diagonal': {
          // Diagonal arrangement
          const diagonalAngle = 15 // degrees
          for (let y = minY + padding; y + pHeight < maxY - padding; y += pHeight + spacing) {
            for (let x = minX + padding; x + pWidth < maxX - padding; x += pWidth + spacing) {
              const centerX = x + pWidth / 2
              const centerY = y + pHeight / 2
              if (isPointInPolygon(centerX, centerY, roofPolygonPixels)) {
                newPanels.push({
                  id: `${sectionId}-panel-${panelIndex++}`,
                  x,
                  y,
                  width: pWidth,
                  height: pHeight,
                  rotation: diagonalAngle,
                  sectionId,
                })
              }
            }
          }
          break
        }

        case 'custom':
        default:
          // Keep existing panels for custom mode
          return panels
      }

      return newPanels
    },
    [roofPolygonPixels, sectionId, sectionAzimuth, spacing, panels]
  )

  // Initialize panels when roof polygon changes
  useEffect(() => {
    if (roofPolygonPixels && roofPolygonPixels.length >= 3 && panels.length === 0) {
      const newPanels = generatePanels(formation, orientation)
      setPanels(newPanels)
    }
  }, [roofPolygonPixels])

  // Notify parent of panel changes
  useEffect(() => {
    onPanelsChange?.(panels)
    onPanelCountChange?.(panels.length)
  }, [panels, onPanelsChange, onPanelCountChange])

  // Handle panel selection
  const handleSelect = useCallback((id: string, multiSelect: boolean) => {
    setSelectedIds((prev) => {
      if (multiSelect) {
        return prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      }
      return [id]
    })
  }, [])

  // Handle drag start
  const handleDragStart = useCallback((id: string) => {
    if (!selectedIds.includes(id)) {
      setSelectedIds([id])
    }
  }, [selectedIds])

  // Handle drag end
  const handleDragEnd = useCallback((id: string, x: number, y: number) => {
    setPanels((prev) =>
      prev.map((p) => (p.id === id ? { ...p, x, y } : p))
    )
    // Switch to custom mode when manually moving panels
    setFormation('custom')
  }, [])

  // Handle transform end (resize/rotate)
  const handleTransformEnd = useCallback(
    (id: string, attrs: Partial<PanelData>) => {
      setPanels((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...attrs } : p))
      )
      setFormation('custom')
    },
    []
  )

  // Handle click on empty area
  const handleStageClick = useCallback((e: any) => {
    if (e.target === e.target.getStage()) {
      setSelectedIds([])
    }
  }, [])

  // Handle formation change
  const handleFormationChange = useCallback(
    (newFormation: PanelFormation) => {
      setFormation(newFormation)
      if (newFormation !== 'custom') {
        const newPanels = generatePanels(newFormation, orientation)
        setPanels(newPanels)
        setSelectedIds([])
      }
    },
    [generatePanels, orientation]
  )

  // Handle orientation change
  const handleOrientationChange = useCallback(
    (newOrientation: PanelOrientation) => {
      setOrientation(newOrientation)
      if (formation !== 'custom') {
        const newPanels = generatePanels(formation, newOrientation)
        setPanels(newPanels)
        setSelectedIds([])
      }
    },
    [generatePanels, formation]
  )

  // Handle spacing change
  const handleSpacingChange = useCallback(
    (newSpacing: number) => {
      setSpacing(newSpacing)
      if (formation !== 'custom') {
        const newPanels = generatePanels(formation, orientation)
        setPanels(newPanels)
      }
    },
    [generatePanels, formation, orientation]
  )

  // Delete selected panels
  const handleDeleteSelected = useCallback(() => {
    setPanels((prev) => prev.filter((p) => !selectedIds.includes(p.id)))
    setSelectedIds([])
    setFormation('custom')
  }, [selectedIds])

  // Add a single panel
  const handleAddPanel = useCallback(() => {
    const centerX = width / 2 - panelWidth / 2
    const centerY = height / 2 - panelHeight / 2
    const newPanel: PanelData = {
      id: `${sectionId}-panel-${Date.now()}`,
      x: centerX,
      y: centerY,
      width: panelWidth,
      height: panelHeight,
      rotation: 0,
      sectionId,
    }
    setPanels((prev) => [...prev, newPanel])
    setSelectedIds([newPanel.id])
    setFormation('custom')
  }, [width, height, panelWidth, panelHeight, sectionId])

  // Rotate selected panels
  const handleRotateSelected = useCallback((degrees: number) => {
    setPanels((prev) =>
      prev.map((p) =>
        selectedIds.includes(p.id)
          ? { ...p, rotation: (p.rotation + degrees) % 360 }
          : p
      )
    )
    setFormation('custom')
  }, [selectedIds])

  // Reset to auto-generated layout
  const handleReset = useCallback(() => {
    const newPanels = generatePanels(formation === 'custom' ? 'grid' : formation, orientation)
    setPanels(newPanels)
    setSelectedIds([])
    if (formation === 'custom') {
      setFormation('grid')
    }
  }, [generatePanels, formation, orientation])

  // Grid lines for snap visualization
  const gridLines = useMemo(() => {
    if (!showGrid) return null
    const lines: JSX.Element[] = []

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, height]}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1}
        />
      )
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[0, y, width, y]}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1}
        />
      )
    }

    return lines
  }, [showGrid, width, height, gridSize])

  // Roof polygon outline
  const roofOutline = useMemo(() => {
    if (!roofPolygonPixels || roofPolygonPixels.length < 3) return null
    const points = roofPolygonPixels.flat()
    return (
      <Line
        points={[...points, points[0], points[1]]}
        stroke="#DC143C"
        strokeWidth={2}
        dash={[5, 5]}
        closed
      />
    )
  }, [roofPolygonPixels])

  return (
    <div className="relative">
      {/* Controls */}
      <PanelEditorControls
        formation={formation}
        orientation={orientation}
        spacing={spacing}
        snapToGrid={snapToGrid}
        showGrid={showGrid}
        selectedCount={selectedIds.length}
        totalCount={panels.length}
        onFormationChange={handleFormationChange}
        onOrientationChange={handleOrientationChange}
        onSpacingChange={handleSpacingChange}
        onSnapToGridChange={setSnapToGrid}
        onShowGridChange={setShowGrid}
        onAddPanel={handleAddPanel}
        onDeleteSelected={handleDeleteSelected}
        onRotateSelected={handleRotateSelected}
        onReset={handleReset}
      />

      {/* Canvas */}
      <Stage
        width={width}
        height={height}
        onClick={handleStageClick}
        onTap={handleStageClick}
        style={{ background: 'transparent' }}
      >
        <Layer>
          {/* Grid lines */}
          {gridLines}

          {/* Roof outline */}
          {roofOutline}

          {/* Solar panels */}
          {panels.map((panel) => (
            <SolarPanel
              key={panel.id}
              panel={panel}
              isSelected={selectedIds.includes(panel.id)}
              onSelect={handleSelect}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onTransformEnd={handleTransformEnd}
              snapToGrid={snapToGrid}
              gridSize={gridSize}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}

// Helper: Check if point is inside polygon (ray casting algorithm)
function isPointInPolygon(x: number, y: number, polygon: number[][]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1]
    const xj = polygon[j][0],
      yj = polygon[j][1]

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}
