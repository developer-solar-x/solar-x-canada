'use client'

// Mapbox drawing component with satellite imagery and roof drawing tools

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import * as turf from '@turf/turf'
import { Box, Mountain, Maximize2, Triangle, Zap } from 'lucide-react'
import { calculateInstantEstimate } from '@/lib/instant-estimate'
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
  // Show recenter button when user has moved away
  const [showRecenter, setShowRecenter] = useState(false)
  // 3D view toggle
  const [is3DView, setIs3DView] = useState(false)
  // Show angles toggle
  const [showAngles, setShowAngles] = useState(true)
  // Store angles data
  const [angles, setAngles] = useState<{ angle: number; bearing: number; index: number }[]>([])
  // Store edge lengths
  const [edgeLengths, setEdgeLengths] = useState<number[]>([])
  // Current zoom level (for display)
  const [currentZoom, setCurrentZoom] = useState(21)
  // Instant estimate calculation
  const [instantEstimate, setInstantEstimate] = useState<ReturnType<typeof calculateInstantEstimate> | null>(null)

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

    // Add navigation controls with zoom settings
    map.current.addControl(
      new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: false
      }), 
      'top-right'
    )
    
    // Add scale control to show distance
    map.current.addControl(
      new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'metric'
      }),
      'bottom-right'
    )

    // Add 3D terrain when map loads
    map.current.on('load', () => {
      // Add 3D terrain source
      map.current!.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      })
      
      // Add hillshade layer for better depth perception
      map.current!.addLayer({
        id: 'hillshade',
        type: 'hillshade',
        source: 'mapbox-dem',
        layout: { visibility: 'none' }, // Hidden by default
        paint: {
          'hillshade-shadow-color': '#000000',
          'hillshade-illumination-anchor': 'viewport',
          'hillshade-exaggeration': 0.3
        }
      })
    })

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

    // Listen for marker drag to show recenter button
    marker.current.on('dragend', () => {
      setShowRecenter(true)
    })
    
    // Track when user moves the map
    map.current.on('moveend', () => {
      const center = map.current!.getCenter()
      const markerPos = marker.current!.getLngLat()
      const distance = center.distanceTo(markerPos)
      
      // Show recenter button if user has moved significantly away (> 50 meters)
      if (distance > 50) {
        setShowRecenter(true)
      }
    })

    // Update zoom level display
    map.current.on('zoom', () => {
      if (map.current) {
        setCurrentZoom(Math.round(map.current.getZoom() * 10) / 10)
      }
    })

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

    // Calculate angles between edges
    function calculateAngles(coordinates: number[][]) {
      const anglesData: { angle: number; bearing: number; index: number }[] = []
      const lengths: number[] = []
      const n = coordinates.length
      
      for (let i = 0; i < n; i++) {
        const prev = coordinates[(i - 1 + n) % n]
        const curr = coordinates[i]
        const next = coordinates[(i + 1) % n]
        
        // Calculate vectors
        const v1 = [prev[0] - curr[0], prev[1] - curr[1]]
        const v2 = [next[0] - curr[0], next[1] - curr[1]]
        
        // Calculate angle between vectors (in degrees)
        const dot = v1[0] * v2[0] + v1[1] * v2[1]
        const det = v1[0] * v2[1] - v1[1] * v2[0]
        const angle = Math.atan2(det, dot) * (180 / Math.PI)
        const interiorAngle = angle < 0 ? 180 + (180 + angle) : 180 - angle
        
        // Calculate bearing (compass direction) of edge from current to next point
        const dx = next[0] - curr[0]
        const dy = next[1] - curr[1]
        let bearing = Math.atan2(dx, dy) * (180 / Math.PI)
        bearing = (bearing + 360) % 360 // Normalize to 0-360
        
        // Calculate edge length (in meters)
        const from = turf.point(curr)
        const to = turf.point(next)
        const length = turf.distance(from, to, { units: 'meters' })
        
        anglesData.push({
          angle: Math.round(interiorAngle * 10) / 10,
          bearing: Math.round(bearing * 10) / 10,
          index: i
        })
        
        lengths.push(Math.round(length * 10) / 10)
      }
      
      setAngles(anglesData)
      setEdgeLengths(lengths)
    }

    // Calculate area when polygon is drawn or updated
    function updateArea() {
      const data = draw.current!.getAll()
      
      if (data.features.length > 0) {
        const polygon = data.features[0]
        
        // Calculate area using Turf.js
        const area = turf.area(polygon as any)
        
        // Convert square meters to square feet
        const areaSqFt = area * 10.764
        
        // Calculate angles if polygon has coordinates
        if (polygon.geometry && polygon.geometry.type === 'Polygon') {
          const coords = (polygon.geometry as any).coordinates[0]
          // Remove last coordinate if it's a duplicate of the first (closing point)
          const uniqueCoords = coords.slice(0, -1)
          if (uniqueCoords.length >= 3) {
            calculateAngles(uniqueCoords)
          }
        }
        
        setCurrentArea(areaSqFt)
        
        // Calculate instant estimate
        const estimate = calculateInstantEstimate(areaSqFt, 'ON') // TODO: Get province from context
        setInstantEstimate(estimate)
        
        // Capture map snapshot for review
        setTimeout(() => {
          if (map.current) {
            const canvas = map.current.getCanvas()
            const mapSnapshot = canvas.toDataURL('image/png')
            // Use ref to call callback without causing re-initialization
            onAreaCalculatedRef.current(areaSqFt, polygon, mapSnapshot)
          }
        }, 500) // Wait for drawing to complete
      } else {
        setAngles([])
        setEdgeLengths([])
        setInstantEstimate(null)
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

  // Recenter map to marker location
  const handleRecenter = () => {
    if (map.current && marker.current) {
      const markerPos = marker.current.getLngLat()
      map.current.flyTo({
        center: markerPos,
        zoom: 21,
        pitch: is3DView ? 45 : 0,
        duration: 1000
      })
      setShowRecenter(false)
    }
  }

  // Toggle 3D view
  const toggle3DView = () => {
    if (!map.current) return
    
    const newIs3D = !is3DView
    setIs3DView(newIs3D)
    
    map.current.easeTo({
      pitch: newIs3D ? 45 : 0,
      bearing: newIs3D ? -17.6 : 0,
      duration: 1000
    })
    
    // Toggle hillshade visibility
    if (map.current.getLayer('hillshade')) {
      map.current.setLayoutProperty(
        'hillshade',
        'visibility',
        newIs3D ? 'visible' : 'none'
      )
    }
  }

  // Smart zoom presets
  const zoomToLevel = (level: number) => {
    if (!map.current) return
    map.current.easeTo({
      zoom: level,
      duration: 500
    })
  }

  // Helper function to convert bearing to compass direction
  const getCompassDirection = (bearing: number): string => {
    const directions = [
      { name: 'N', min: 337.5, max: 360 },
      { name: 'N', min: 0, max: 22.5 },
      { name: 'NE', min: 22.5, max: 67.5 },
      { name: 'E', min: 67.5, max: 112.5 },
      { name: 'SE', min: 112.5, max: 157.5 },
      { name: 'S', min: 157.5, max: 202.5 },
      { name: 'SW', min: 202.5, max: 247.5 },
      { name: 'W', min: 247.5, max: 292.5 },
      { name: 'NW', min: 292.5, max: 337.5 },
    ]
    
    for (const dir of directions) {
      if (bearing >= dir.min && bearing < dir.max) {
        return dir.name
      }
    }
    return 'N'
  }

  return (
    <div className="relative w-full h-full" style={{ minHeight: '600px' }}>
      {/* Map container */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Instant Estimate Display - Top Left */}
      {instantEstimate && currentArea && currentArea > 0 && (
        <div className="absolute top-4 left-4 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-2xl p-4 max-w-sm z-20">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Zap size={20} />
            </div>
            <h3 className="font-bold text-lg">Instant Estimate</h3>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center bg-white/10 rounded-lg px-3 py-2">
              <span className="opacity-90">System Size</span>
              <span className="font-bold">{instantEstimate.systemSizeKw} kW</span>
            </div>
            <div className="flex justify-between items-center bg-white/10 rounded-lg px-3 py-2">
              <span className="opacity-90">Estimated Cost</span>
              <span className="font-bold">${instantEstimate.estimatedCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center bg-white/10 rounded-lg px-3 py-2">
              <span className="opacity-90">Annual Savings</span>
              <span className="font-bold">${instantEstimate.annualSavings.toLocaleString()}/yr</span>
            </div>
            <div className="flex justify-between items-center bg-white/10 rounded-lg px-3 py-2">
              <span className="opacity-90">Monthly Savings</span>
              <span className="font-bold">${instantEstimate.monthlySavings}/mo</span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-white/20 text-xs opacity-75">
            <div className="flex items-center justify-between">
              <span>{instantEstimate.panelCount} solar panels</span>
              <span>~{Math.round(instantEstimate.co2Offset / 2000)} tons CO₂/yr</span>
            </div>
          </div>
          
          <p className="mt-2 text-xs opacity-75 italic">
            Rough estimate • Exact quote after review
          </p>
        </div>
      )}

       {/* All Controls - Bottom Left */}
       <div className="absolute bottom-4 left-4 z-20 flex gap-2">
         {/* View Mode Toggles */}
         <div className="flex flex-col gap-2">
           {/* 3D/2D View Toggle */}
           <button
             onClick={toggle3DView}
             className={`px-4 py-3 rounded-lg shadow-lg transition-all font-semibold text-sm flex items-center gap-2 ${
               is3DView
                 ? 'bg-navy-500 text-white'
                 : 'bg-white text-navy-500 hover:bg-gray-50'
             }`}
             aria-label={is3DView ? 'Switch to 2D View' : 'Switch to 3D View'}
           >
             {is3DView ? <Mountain size={20} /> : <Box size={20} />}
             {is3DView ? '3D' : '2D'}
           </button>

           {/* Angles Toggle */}
           {angles.length > 0 && (
             <button
               onClick={() => setShowAngles(!showAngles)}
               className={`px-4 py-3 rounded-lg shadow-lg transition-all font-semibold text-sm flex items-center gap-2 ${
                 showAngles
                   ? 'bg-navy-500 text-white'
                   : 'bg-white text-navy-500 hover:bg-gray-50'
               }`}
               aria-label="Toggle Angle Display"
             >
               <Triangle size={20} />
               ∠
             </button>
           )}
         </div>

         {/* Zoom Presets with Level Indicator */}
         <div className="bg-white rounded-lg shadow-lg overflow-hidden">
           {/* Zoom Level Header */}
           <div className="px-3 py-2 bg-navy-500 text-white flex items-center justify-between">
             <div className="text-[10px] font-bold">Zoom</div>
             <div className="text-base font-bold">{currentZoom}</div>
           </div>
          <button
            onClick={() => zoomToLevel(22)}
            className="w-full px-3 py-2 text-xs font-semibold text-navy-500 hover:bg-navy-50 transition-colors border-b border-gray-100 text-left"
            aria-label="Zoom to maximum detail"
          >
            Max
          </button>
          <button
            onClick={() => zoomToLevel(21)}
            className="w-full px-3 py-2 text-xs font-semibold text-navy-500 hover:bg-navy-50 transition-colors border-b border-gray-100 text-left"
            aria-label="Zoom to roof level"
          >
            Roof
          </button>
          <button
            onClick={() => zoomToLevel(19)}
            className="w-full px-3 py-2 text-xs font-semibold text-navy-500 hover:bg-navy-50 transition-colors border-b border-gray-100 text-left"
            aria-label="Zoom to building level"
          >
            Building
          </button>
          <button
            onClick={() => zoomToLevel(15)}
            className="w-full px-3 py-2 text-xs font-semibold text-navy-500 hover:bg-navy-50 transition-colors border-b border-gray-100 text-left"
            aria-label="Zoom to street level"
          >
            Street
          </button>
          <button
            onClick={() => zoomToLevel(12)}
            className="w-full px-3 py-2 text-xs font-semibold text-navy-500 hover:bg-navy-50 transition-colors border-b border-gray-100 text-left"
            aria-label="Zoom to area level"
          >
            Area
          </button>
          <button
            onClick={() => zoomToLevel(8)}
            className="w-full px-3 py-2 text-xs font-semibold text-navy-500 hover:bg-navy-50 transition-colors text-left"
            aria-label="Zoom to city level"
          >
            City
          </button>
         </div>
       </div>

       {/* Angle and Measurement Info Panel - Popup on right */}
       {showAngles && angles.length > 0 && (
         <div className="absolute bottom-20 right-4 bg-white rounded-lg shadow-xl p-3 max-w-xs z-15 border border-gray-200">
           <div className="flex items-center justify-between mb-2">
             <h3 className="font-bold text-navy-500 text-sm flex items-center gap-1">
               <Triangle size={14} />
               Measurements
             </h3>
            <button
              onClick={() => setShowAngles(false)}
              className="text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              &times;
            </button>
           </div>
           <div className="space-y-1.5 text-[10px] max-h-48 overflow-y-auto pr-1">
             {angles.map((angleData, idx) => (
               <div key={idx} className="bg-gray-50 rounded p-1.5 border border-gray-100">
                 <div className="font-semibold text-gray-700 text-xs mb-1">P{idx + 1}</div>
                 <div className="grid grid-cols-3 gap-1 text-[9px]">
                   <div>
                     <div className="text-gray-400">∠</div>
                     <div className="font-bold text-navy-500">{angleData.angle}°</div>
                   </div>
                   <div>
                     <div className="text-gray-400">Dir</div>
                     <div className="font-bold text-blue-500">{angleData.bearing}°</div>
                   </div>
                   <div>
                     <div className="text-gray-400">Len</div>
                     <div className="font-bold text-red-500">{edgeLengths[idx]}m</div>
                   </div>
                   <div className="col-span-3 text-gray-600 text-[9px] mt-0.5">
                     {getCompassDirection(angleData.bearing)}
                   </div>
                 </div>
               </div>
             ))}
           </div>
          <div className="mt-2 pt-2 border-t border-gray-200 text-[9px] text-blue-600 bg-blue-50 px-2 py-1 rounded">
            <strong>Tip:</strong> South (180°) = best solar!
          </div>
         </div>
       )}

       {/* Recenter button (shows when user moves away) */}
      {showRecenter && (
        <button
          onClick={handleRecenter}
          className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-600 transition-colors z-20 text-sm font-semibold"
        >
          Recenter
        </button>
      )}

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

