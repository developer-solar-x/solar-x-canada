'use client'

/**
 * Panel Editor Modal
 *
 * Fullscreen modal for interactive panel layout editing.
 * Uses the map snapshot as background and overlays the Konva canvas.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { X, Save, Maximize2, Minimize2 } from 'lucide-react'
import { PanelEditor } from './PanelEditor'
import type { PanelData } from './types'
import { PANEL_SPECS } from '@/config/panel-specs'
import type { PanelLayoutResult } from '@/lib/panel-layout'

interface PanelEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (panels: PanelData[], panelCount: number) => void
  mapSnapshot: string | null // Base64 image of the map
  roofPolygon: any // GeoJSON polygon
  roofSections: Array<{
    id: string
    azimuth: number
    area: number
    panels: number
  }>
  mapBounds: {
    minLng: number
    maxLng: number
    minLat: number
    maxLat: number
  } | null
  initialPanels?: PanelData[]
  panelLayout?: PanelLayoutResult | null
}

export function PanelEditorModal({
  isOpen,
  onClose,
  onSave,
  mapSnapshot,
  roofPolygon,
  roofSections,
  mapBounds,
  initialPanels,
  panelLayout,
}: PanelEditorModalProps) {
  const [panels, setPanels] = useState<PanelData[]>(initialPanels || [])
  const [panelCount, setPanelCount] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Canvas dimensions
  const canvasWidth = isFullscreen ? window.innerWidth - 48 : 800
  const canvasHeight = isFullscreen ? window.innerHeight - 200 : 500

  // Convert panel layout positions (lat/lng) to canvas pixels
  const convertedPanels = useMemo(() => {
    if (!panelLayout?.panels || !mapBounds || panelLayout.panels.length === 0) {
      return initialPanels || []
    }

    // If we already have custom panels, use those instead
    if (initialPanels && initialPanels.length > 0) {
      return initialPanels
    }

    // Convert each panel from lat/lng to canvas pixels
    return panelLayout.panels.map((panel, index) => {
      const [lng, lat] = panel.center
      
      // Convert to canvas coordinates
      const x = ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * canvasWidth
      const y = ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) * canvasHeight
      
      // Calculate panel size from corners (convert from lat/lng degrees to pixels)
      const corner0 = panel.corners[0]
      const corner1 = panel.corners[1]
      const corner2 = panel.corners[2]
      
      const widthPx = Math.sqrt(
        Math.pow(((corner1[0] - corner0[0]) / (mapBounds.maxLng - mapBounds.minLng)) * canvasWidth, 2) +
        Math.pow(((corner1[1] - corner0[1]) / (mapBounds.maxLat - mapBounds.minLat)) * canvasHeight, 2)
      )
      const heightPx = Math.sqrt(
        Math.pow(((corner2[0] - corner1[0]) / (mapBounds.maxLng - mapBounds.minLng)) * canvasWidth, 2) +
        Math.pow(((corner2[1] - corner1[1]) / (mapBounds.maxLat - mapBounds.minLat)) * canvasHeight, 2)
      )
      
      return {
        id: panel.id,
        x: x - widthPx / 2,
        y: y - heightPx / 2,
        width: Math.abs(widthPx),
        height: Math.abs(heightPx),
        rotation: panel.rotation,
        sectionId: panel.sectionId,
      } as PanelData
    })
  }, [panelLayout, mapBounds, canvasWidth, canvasHeight, initialPanels])

  // Initialize panels from converted layout when modal opens
  useEffect(() => {
    if (isOpen && convertedPanels.length > 0) {
      // Only initialize if we don't have custom panels already
      if (!initialPanels || initialPanels.length === 0) {
        setPanels(convertedPanels)
        setPanelCount(convertedPanels.length)
      } else {
        setPanelCount(initialPanels.length)
      }
    }
  }, [isOpen, convertedPanels, initialPanels])

  // Convert GeoJSON polygon to canvas pixel coordinates
  const roofPolygonPixels = useMemo(() => {
    if (!roofPolygon?.features || !mapBounds) return []

    const allPolygons: number[][][] = []

    roofPolygon.features.forEach((feature: any) => {
      if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates?.[0]) {
        const coords = feature.geometry.coordinates[0]
        const pixels = coords.map((coord: number[]) => {
          const [lng, lat] = coord
          // Convert lng/lat to canvas x/y
          const x =
            ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) *
            canvasWidth
          const y =
            ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) *
            canvasHeight
          return [x, y]
        })
        allPolygons.push(pixels)
      }
    })

    // Return first polygon for now (could support multiple)
    return allPolygons[0] || []
  }, [roofPolygon, mapBounds, canvasWidth, canvasHeight])

  // Handle save
  const handleSave = useCallback(() => {
    onSave(panels, panelCount)
    onClose()
  }, [panels, panelCount, onSave, onClose])

  // Handle panels change
  const handlePanelsChange = useCallback((newPanels: PanelData[]) => {
    setPanels(newPanels)
  }, [])

  // Handle panel count change
  const handlePanelCountChange = useCallback((count: number) => {
    setPanelCount(count)
  }, [])

  // Calculate estimated system size
  const estimatedKw = useMemo(() => {
    return (panelCount * PANEL_SPECS.electrical.peakPower) / 1000
  }, [panelCount])

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-xl shadow-2xl overflow-hidden transition-all ${
          isFullscreen ? 'w-full h-full m-4' : 'w-[900px] max-w-[95vw] max-h-[90vh]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-navy-500 text-white">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Panel Layout Editor</h2>
            <span className="px-2 py-0.5 bg-white/20 rounded text-sm">
              {panelCount} panels ({estimatedKw.toFixed(1)} kW)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="p-4 overflow-auto" style={{ maxHeight: isFullscreen ? 'calc(100vh - 140px)' : '70vh' }}>
          {/* Map snapshot background with canvas overlay */}
          <div
            className="relative mx-auto rounded-lg overflow-hidden border-2 border-gray-200"
            style={{
              width: canvasWidth,
              height: canvasHeight,
              backgroundImage: mapSnapshot ? `url(${mapSnapshot})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: mapSnapshot ? undefined : '#e5e7eb',
            }}
          >
            {/* No snapshot or polygon fallback */}
            {(!roofPolygonPixels || roofPolygonPixels.length === 0) && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <p>Draw a roof section first to enable panel editing</p>
              </div>
            )}

            {/* Konva Canvas Overlay */}
            {roofPolygonPixels && roofPolygonPixels.length > 0 && (
              <div className="absolute inset-0">
                <PanelEditor
                  width={canvasWidth}
                  height={canvasHeight}
                  roofPolygonPixels={roofPolygonPixels}
                  initialPanels={convertedPanels.length > 0 ? convertedPanels : panels}
                  onPanelsChange={handlePanelsChange}
                  onPanelCountChange={handlePanelCountChange}
                  sectionId={roofSections[0]?.id || 'section-1'}
                  sectionAzimuth={roofSections[0]?.azimuth || 180}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
          <div className="text-sm text-gray-600">
            Drag panels to reposition. Use corner handles to resize. Press Delete to remove selected.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-500 text-white hover:bg-navy-600 transition-colors"
            >
              <Save size={18} />
              Save Layout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
