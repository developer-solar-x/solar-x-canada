'use client'

// Mapbox drawing component with satellite imagery and roof drawing tools

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import * as turf from '@turf/turf'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

interface MapboxDrawingProps {
  coordinates: { lat: number; lng: number }
  address: string
  onAreaCalculated: (areaSqFt: number, polygon: any, mapSnapshot?: string) => void
}

export function MapboxDrawing({ coordinates, address, onAreaCalculated }: MapboxDrawingProps) {
  // Map container reference
  const mapContainer = useRef<HTMLDivElement>(null)
  // Map instance
  const map = useRef<mapboxgl.Map | null>(null)
  // Draw control instance
  const draw = useRef<MapboxDraw | null>(null)
  // Marker instance
  const marker = useRef<mapboxgl.Marker | null>(null)
  // Store callback in ref to prevent re-initialization
  const onAreaCalculatedRef = useRef(onAreaCalculated)
  
  // Current drawn area
  const [currentArea, setCurrentArea] = useState<number | null>(null)

  // Update callback ref when it changes
  useEffect(() => {
    onAreaCalculatedRef.current = onAreaCalculated
  }, [onAreaCalculated])

  useEffect(() => {
    // Check if Mapbox token is configured
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    
    if (!mapboxToken) {
      console.error('Mapbox token not configured')
      return
    }

    // Don't initialize if already initialized
    if (map.current) return

    // Set the access token
    mapboxgl.accessToken = mapboxToken

    // Initialize map with high-resolution tiles
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/satellite-v9', // Pure satellite for best imagery
      center: [coordinates.lng, coordinates.lat],
      zoom: 21, // Start at higher zoom for roof detail
      pitch: 0, // Top-down view
      minZoom: 0, // Full zoom out capability (world view, like Google Maps)
      maxZoom: 24, // Maximum possible zoom (satellite detail level)
      renderWorldCopies: true, // Allow scrolling across the world
      preserveDrawingBuffer: true, // Better rendering quality
      antialias: true, // Smooth edges (auto-detects retina displays for HD tiles)
    })

    // Add navigation controls (zoom and compass for rotation)
    map.current.addControl(
      new mapboxgl.NavigationControl({
        showCompass: true, // Enable compass for map rotation
        showZoom: true,
        visualizePitch: false
      }), 
      'top-right'
    )

    // Add draggable marker at the address location
    marker.current = new mapboxgl.Marker({ 
      color: '#DC143C',
      draggable: true // Make marker draggable
    })
      .setLngLat([coordinates.lng, coordinates.lat])
      .setPopup(
        new mapboxgl.Popup({ 
          offset: 25,
          closeButton: true,
          closeOnClick: false
        }).setHTML(`<div style="padding: 8px;"><strong>Your Location</strong><br/><small>${address}</small></div>`)
      )
      .addTo(map.current)

    // Initialize drawing controls
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      styles: [
        // Polygon fill
        {
          id: 'gl-draw-polygon-fill',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: {
            'fill-color': '#DC143C',
            'fill-opacity': 0.3,
          },
        },
        // Polygon outline
        {
          id: 'gl-draw-polygon-stroke-active',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: {
            'line-color': '#DC143C',
            'line-width': 3,
          },
        },
        // Vertex points
        {
          id: 'gl-draw-polygon-and-line-vertex-active',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
          paint: {
            'circle-radius': 6,
            'circle-color': '#DC143C',
            'circle-stroke-color': '#FFFFFF',
            'circle-stroke-width': 2,
          },
        },
      ],
    })

    map.current.addControl(draw.current, 'top-left')

    // Listen for drawing events
    map.current.on('draw.create', updateArea)
    map.current.on('draw.update', updateArea)
    map.current.on('draw.delete', () => {
      setCurrentArea(null)
    })

    // Calculate area when polygon is drawn or updated
    function updateArea() {
      const data = draw.current!.getAll()
      
      if (data.features.length > 0) {
        const polygon = data.features[0]
        
        // Calculate area using Turf.js
        const area = turf.area(polygon as any)
        
        // Convert square meters to square feet
        const areaSqFt = area * 10.764
        
        setCurrentArea(areaSqFt)
        
        // Capture map snapshot for review
        setTimeout(() => {
          if (map.current) {
            const canvas = map.current.getCanvas()
            const mapSnapshot = canvas.toDataURL('image/png')
            // Use ref to call callback without causing re-initialization
            onAreaCalculatedRef.current(areaSqFt, polygon, mapSnapshot)
          }
        }, 500) // Wait for drawing to complete
      }
    }

    // Cleanup on unmount
    return () => {
      if (marker.current) {
        marker.current.remove()
        marker.current = null
      }
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [coordinates.lat, coordinates.lng, address])

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

