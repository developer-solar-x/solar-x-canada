'use client'

// Mapbox drawing component with satellite imagery and roof drawing tools

import { useRef, useImperativeHandle, forwardRef } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { useMapboxDrawing } from './hooks/useMapboxDrawing'
import type { MapboxDrawingProps } from './types'

export interface MapboxDrawingRef {
  captureSnapshot: () => Promise<string | null>
}

export const MapboxDrawing = forwardRef<MapboxDrawingRef, MapboxDrawingProps>(
  function MapboxDrawing({ coordinates, address, onAreaCalculated, initialData }, ref) {
    // Map container reference
    const mapContainer = useRef<HTMLDivElement>(null)

    const { captureSnapshot } = useMapboxDrawing({
      coordinates,
      address,
      onAreaCalculated,
      initialData,
      mapContainer,
    })

    // Expose captureSnapshot method via ref
    useImperativeHandle(ref, () => ({
      captureSnapshot: captureSnapshot || (async () => null),
    }), [captureSnapshot])

  return (
    <div className="relative w-full h-full" style={{ minHeight: '600px' }}>
      {/* Map container */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0"
        style={{ 
          width: '100%', 
          height: '100%',
          // Image enhancement filters for better satellite clarity
          filter: 'contrast(1.1) saturate(1.15) brightness(1.05)',
        }}
      />

      {/* Mapbox token missing warning */}
      {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-8 max-w-md text-center">
            <p className="text-red-500 font-bold mb-2">Mapbox Token Missing</p>
            <p className="text-sm text-gray-600">
              Add your Mapbox token to <code className="bg-gray-100 px-2 py-1">.env.local</code>
            </p>
          </div>
        </div>
      )}
    </div>
  )
  }
)

