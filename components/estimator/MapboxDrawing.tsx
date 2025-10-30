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
  // Track polygon colors
  const polygonColors = useRef<string[]>(['#DC143C', '#2563EB', '#16A34A', '#F59E0B', '#8B5CF6', '#EC4899'])

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
        combine_features: false,
        uncombine_features: false,
      },
      defaultMode: 'simple_select',
      styles: [
        // Polygon fill - multiple colors
        {
          id: 'gl-draw-polygon-fill-inactive',
          type: 'fill',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
          paint: {
            'fill-color': [
              'case',
              ['==', ['%', ['to-number', ['get', 'user_featureCount']], 6], 0], '#DC143C',
              ['==', ['%', ['to-number', ['get', 'user_featureCount']], 6], 1], '#2563EB',
              ['==', ['%', ['to-number', ['get', 'user_featureCount']], 6], 2], '#16A34A',
              ['==', ['%', ['to-number', ['get', 'user_featureCount']], 6], 3], '#F59E0B',
              ['==', ['%', ['to-number', ['get', 'user_featureCount']], 6], 4], '#8B5CF6',
              '#EC4899'
            ],
            'fill-opacity': 0.3,
          },
        },
        // Active polygon fill
        {
          id: 'gl-draw-polygon-fill-active',
          type: 'fill',
          filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
          paint: {
            'fill-color': '#DC143C',
            'fill-opacity': 0.3,
          },
        },
        // Polygon outline - multiple colors
        {
          id: 'gl-draw-polygon-stroke-inactive',
          type: 'line',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
          paint: {
            'line-color': [
              'case',
              ['==', ['%', ['to-number', ['get', 'user_featureCount']], 6], 0], '#DC143C',
              ['==', ['%', ['to-number', ['get', 'user_featureCount']], 6], 1], '#2563EB',
              ['==', ['%', ['to-number', ['get', 'user_featureCount']], 6], 2], '#16A34A',
              ['==', ['%', ['to-number', ['get', 'user_featureCount']], 6], 3], '#F59E0B',
              ['==', ['%', ['to-number', ['get', 'user_featureCount']], 6], 4], '#8B5CF6',
              '#EC4899'
            ],
            'line-width': 3,
          },
        },
        // Active polygon outline
        {
          id: 'gl-draw-polygon-stroke-active',
          type: 'line',
          filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
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
    map.current.on('draw.delete', updateArea)

    // Function to calculate angle at a vertex
    function calculateAngle(p1: number[], p2: number[], p3: number[]): number {
      // Calculate angle at p2 formed by p1-p2-p3
      const angle1 = Math.atan2(p1[1] - p2[1], p1[0] - p2[0])
      const angle2 = Math.atan2(p3[1] - p2[1], p3[0] - p2[0])
      let angle = Math.abs(angle1 - angle2) * (180 / Math.PI)
      
      // Normalize to 0-180 range
      if (angle > 180) angle = 360 - angle
      
      return Math.round(angle)
    }

    // Function to calculate optimal label offset based on interior angle direction
    function calculateLabelOffset(
      prevCoord: number[], 
      currCoord: number[], 
      nextCoord: number[], 
      angle: number
    ): [number, number] {
      // Calculate vectors from current vertex to adjacent vertices
      const vec1 = [prevCoord[0] - currCoord[0], prevCoord[1] - currCoord[1]]
      const vec2 = [nextCoord[0] - currCoord[0], nextCoord[1] - currCoord[1]]
      
      // Calculate bisector (average direction pointing into the polygon)
      const bisectorX = (vec1[0] + vec2[0]) / 2
      const bisectorY = (vec1[1] + vec2[1]) / 2
      
      // Normalize and scale for label offset
      const length = Math.sqrt(bisectorX * bisectorX + bisectorY * bisectorY)
      if (length === 0) return [0, -2.5]
      
      // Dynamic offset based on angle sharpness
      // Sharp angles (< 60°) need more distance, obtuse angles (> 120°) need less
      let offsetDistance = 2.5
      if (angle < 60) {
        offsetDistance = 3.5 // Sharp corners need more space
      } else if (angle > 120) {
        offsetDistance = 2.0 // Obtuse corners need less space
      }
      
      // Invert direction (we want label inside the polygon)
      const offsetX = -(bisectorX / length) * offsetDistance
      const offsetY = -(bisectorY / length) * offsetDistance
      
      return [offsetX, offsetY]
    }

    // Function to add angle labels to polygons
    function addAngleLabels() {
      const data = draw.current!.getAll()
      
      // Remove existing angle labels
      if (map.current.getSource('angle-labels')) {
        map.current.removeLayer('angle-labels-layer')
        map.current.removeSource('angle-labels')
      }
      
      const labelFeatures: any[] = []
      
      data.features.forEach((feature, featureIndex) => {
        if (feature.geometry.type === 'Polygon') {
          const coords = feature.geometry.coordinates[0]
          const color = polygonColors.current[featureIndex % polygonColors.current.length]
          
          // Calculate angle at each vertex
          for (let i = 0; i < coords.length - 1; i++) {
            const prevIndex = i === 0 ? coords.length - 2 : i - 1
            const nextIndex = i + 1
            
            const angle = calculateAngle(
              coords[prevIndex],
              coords[i],
              coords[nextIndex]
            )
            
            // Calculate smart offset pointing into the polygon
            const offset = calculateLabelOffset(
              coords[prevIndex],
              coords[i],
              coords[nextIndex],
              angle
            )
            
            // Priority system: Flag important angles for better visibility
            // Sharp angles (< 60°) and very obtuse (> 135°) are more important
            const priority = (angle < 60 || angle > 135) ? 1 : 
                            (Math.abs(angle - 90) > 10) ? 2 : 3
            
            // Create label feature with optimized positioning
            labelFeatures.push({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: coords[i]
              },
              properties: {
                angle: `${angle}°`,
                color: color,
                offsetX: offset[0],
                offsetY: offset[1],
                priority: priority // Lower number = higher priority
              }
            })
          }
        }
      })
      
      if (labelFeatures.length > 0) {
        map.current.addSource('angle-labels', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: labelFeatures
          }
        })
        
        map.current.addLayer({
          id: 'angle-labels-layer',
          type: 'symbol',
          source: 'angle-labels',
          layout: {
            'text-field': ['get', 'angle'],
            'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
            // Zoom-responsive text size: larger when zoomed in, hidden below zoom 16
            'text-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15, 0,   // Hidden below zoom 16
              16, 9,   // At zoom 16, text is 9px
              18, 11,  // At zoom 18, text is 11px
              20, 13   // At zoom 20, text is 13px
            ],
            // Use calculated offsets that point into the polygon interior
            'text-offset': [
              ['get', 'offsetX'],
              ['get', 'offsetY']
            ],
            'text-anchor': 'center',
            // Enable collision detection to prevent overlapping
            'text-allow-overlap': false, // Don't allow overlap
            'text-ignore-placement': false, // Respect other symbols
            'text-optional': true, // Hide labels that would overlap rather than force them
            'text-padding': 8, // Increased padding for better spacing
            'symbol-spacing': 250, // Minimum distance between symbols
            'text-max-angle': 45, // Maximum angle change for line labels
            // Priority system: show important angles first
            'symbol-sort-key': ['get', 'priority']
          },
          paint: {
            'text-color': ['get', 'color'],
            'text-halo-color': '#FFFFFF',
            'text-halo-width': 3, // Thick halo for readability on satellite
            'text-halo-blur': 1, // Slight blur for smooth halo
            'text-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15, 0,    // Invisible below zoom 15
              16, 0.9,  // Fade in at zoom 16
              18, 0.95  // Full opacity at zoom 18+
            ]
          }
        })
      }
    }

    // Calculate total area when polygons are drawn, updated, or deleted
    function updateArea() {
      const data = draw.current!.getAll()
      
      if (data.features.length > 0) {
        // Assign feature count for color coding and calculate angles
        data.features.forEach((feature, index) => {
          feature.properties = feature.properties || {}
          feature.properties.featureCount = index
          
          // Calculate and store angles for each vertex
          if (feature.geometry.type === 'Polygon') {
            const coords = feature.geometry.coordinates[0]
            const angles: number[] = []
            
            for (let i = 0; i < coords.length - 1; i++) {
              const prevIndex = i === 0 ? coords.length - 2 : i - 1
              const nextIndex = i + 1
              
              const angle = calculateAngle(
                coords[prevIndex],
                coords[i],
                coords[nextIndex]
              )
              
              angles.push(angle)
            }
            
            // Store angles in feature properties
            feature.properties.vertexAngles = angles
            feature.properties.color = polygonColors.current[index % polygonColors.current.length]
          }
        })
        
        // Update draw with color properties
        draw.current!.set(data)
        
        // Calculate total area of all polygons
        let totalAreaSqMeters = 0
        
        data.features.forEach((feature) => {
          if (feature.geometry.type === 'Polygon') {
            const area = turf.area(feature as any)
            totalAreaSqMeters += area
          }
        })
        
        // Convert square meters to square feet
        const totalAreaSqFt = totalAreaSqMeters * 10.764
        
        setCurrentArea(totalAreaSqFt)
        
        // Add angle labels
        addAngleLabels()
        
        // Capture map snapshot for review - zoom to fit all drawn polygons
        setTimeout(() => {
          if (map.current && data.features.length > 0) {
            // Calculate bounding box of all polygons
            const allCoordinates: number[][] = []
            data.features.forEach(feature => {
              if (feature.geometry.type === 'Polygon') {
                feature.geometry.coordinates[0].forEach(coord => {
                  allCoordinates.push(coord)
                })
              }
            })
            
            if (allCoordinates.length > 0) {
              // Calculate bounds with padding
              const lngs = allCoordinates.map(coord => coord[0])
              const lats = allCoordinates.map(coord => coord[1])
              const bounds = new mapboxgl.LngLatBounds(
                [Math.min(...lngs), Math.min(...lats)],
                [Math.max(...lngs), Math.max(...lats)]
              )
              
              // Fit map to bounds with padding for better view
              map.current.fitBounds(bounds, {
                padding: 80, // Padding around the polygons
                maxZoom: 20, // Don't zoom in too much
                duration: 0 // Instant, no animation
              })
              
              // Wait for map to finish repositioning before capturing
              setTimeout(() => {
                if (map.current) {
                  const canvas = map.current.getCanvas()
                  const mapSnapshot = canvas.toDataURL('image/png')
                  // Pass all features (multiple polygons) with angle data
                  onAreaCalculatedRef.current(totalAreaSqFt, data, mapSnapshot)
                }
              }, 300)
            }
          }
        }, 500) // Wait for drawing to complete
      } else {
        // No polygons left - clear everything
        setCurrentArea(null)
        
        // Remove angle labels
        if (map.current.getSource('angle-labels')) {
          map.current.removeLayer('angle-labels-layer')
          map.current.removeSource('angle-labels')
        }
        
        onAreaCalculatedRef.current(0, { type: 'FeatureCollection', features: [] }, undefined)
      }
    }

    // Cleanup on unmount
    return () => {
      if (marker.current) {
        marker.current.remove()
        marker.current = null
      }
      if (map.current) {
        // Remove angle labels if they exist
        if (map.current.getSource('angle-labels')) {
          map.current.removeLayer('angle-labels-layer')
          map.current.removeSource('angle-labels')
        }
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

