'use client'

// Mapbox drawing component with satellite imagery and roof drawing tools

import { useRef, useImperativeHandle, forwardRef } from 'react'
import { useMapboxDrawing } from './hooks/useMapboxDrawing'
import type { MapboxDrawingProps } from './types'

export interface MapboxDrawingRef {
  captureSnapshot: () => Promise<string | null>
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  getActualPanelCount: () => number
}

export const MapboxDrawing = forwardRef<MapboxDrawingRef, MapboxDrawingProps>(
  function MapboxDrawing({
    coordinates,
    address,
    onAreaCalculated,
    initialData,
    selectedSectionIndex,
    panelSettingsBySection = {},
    hideRoofFill = false,
  }, ref) {
    const mapContainer = useRef<HTMLDivElement>(null)

    const { captureSnapshot, undo, redo, canUndo, canRedo, actualPanelCount } = useMapboxDrawing({
      coordinates,
      address,
      onAreaCalculated,
      initialData,
      mapContainer,
      selectedSectionIndex,
      editMode: false,
      panelSettingsBySection,
      hideRoofFill,
    })

    useImperativeHandle(ref, () => ({
      captureSnapshot: captureSnapshot || (async () => null),
      undo: undo || (() => {}),
      redo: redo || (() => {}),
      canUndo: canUndo || (() => false),
      canRedo: canRedo || (() => false),
      getActualPanelCount: () => actualPanelCount,
    }), [captureSnapshot, undo, redo, canUndo, canRedo, actualPanelCount])

    return (
      <div className="relative w-full h-full" style={{ minHeight: '600px' }}>
        <div
          ref={mapContainer}
          className="absolute inset-0"
          tabIndex={0}
          style={{
            width: '100%',
            height: '100%',
            filter: 'contrast(1.1) saturate(1.15) brightness(1.05)',
            outline: 'none',
          }}
        />

        {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg p-8 max-w-md text-center">
              <p className="text-red-500 font-bold mb-2">Mapbox API Token Missing</p>
              <p className="text-sm text-gray-600 mb-4">
                Add your Mapbox access token to <code className="bg-gray-100 px-2 py-1">.env.local</code>
              </p>
              <p className="text-xs text-gray-500">
                Get your token from <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Mapbox Account</a>
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }
)
