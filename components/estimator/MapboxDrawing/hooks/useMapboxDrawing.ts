import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import * as turf from '@turf/turf'
import { POLYGON_COLORS } from '../constants'
import { calculateAngle, calculateLabelOffset } from '../utils/angleCalculations'

interface UseMapboxDrawingProps {
  coordinates: { lat: number; lng: number }
  address: string
  onAreaCalculated: (areaSqFt: number, polygon: any, mapSnapshot?: string) => void
  initialData?: any
  mapContainer: React.RefObject<HTMLDivElement>
}

export function useMapboxDrawing({
  coordinates,
  address,
  onAreaCalculated,
  initialData,
  mapContainer,
}: UseMapboxDrawingProps) {
  const map = useRef<mapboxgl.Map | null>(null)
  const draw = useRef<MapboxDraw | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)
  const onAreaCalculatedRef = useRef(onAreaCalculated)
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
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [coordinates.lng, coordinates.lat],
      zoom: 21,
      pitch: 0,
      minZoom: 0,
      maxZoom: 24,
      renderWorldCopies: true,
      preserveDrawingBuffer: true,
      antialias: true,
    })

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: false
      }), 
      'top-right'
    )

    // Add draggable marker at the address location
    marker.current = new mapboxgl.Marker({ 
      color: '#DC143C',
      draggable: true
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
        {
          id: 'gl-draw-polygon-fill-active',
          type: 'fill',
          filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
          paint: {
            'fill-color': '#DC143C',
            'fill-opacity': 0.3,
          },
        },
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
        {
          id: 'gl-draw-polygon-stroke-active',
          type: 'line',
          filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
          paint: {
            'line-color': '#DC143C',
            'line-width': 3,
          },
        },
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

    // Function to add angle labels to polygons
    function addAngleLabels() {
      const data = draw.current!.getAll()
      
      // Remove existing angle labels
      if (map.current?.getSource('angle-labels')) {
        map.current.removeLayer('angle-labels-layer')
        map.current.removeSource('angle-labels')
      }
      
      const labelFeatures: any[] = []
      
      data.features.forEach((feature, featureIndex) => {
        if (feature.geometry.type === 'Polygon') {
          const coords = feature.geometry.coordinates[0]
          const color = POLYGON_COLORS[featureIndex % POLYGON_COLORS.length]
          
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
                priority: priority
              }
            })
          }
        }
      })
      
      if (labelFeatures.length > 0 && map.current) {
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
            'text-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15, 0,
              16, 9,
              18, 11,
              20, 13
            ],
            'text-offset': [
              ['get', 'offsetX'],
              ['get', 'offsetY']
            ],
            'text-anchor': 'center',
            'text-allow-overlap': false,
            'text-ignore-placement': false,
            'text-optional': true,
            'text-padding': 8,
            'symbol-spacing': 250,
            'text-max-angle': 45,
            'symbol-sort-key': ['get', 'priority']
          },
          paint: {
            'text-color': ['get', 'color'],
            'text-halo-color': '#FFFFFF',
            'text-halo-width': 3,
            'text-halo-blur': 1,
            'text-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15, 0,
              16, 0.9,
              18, 0.95
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
            feature.properties.color = POLYGON_COLORS[index % POLYGON_COLORS.length]
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
                padding: 80,
                maxZoom: 20,
                duration: 0
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
        if (map.current?.getSource('angle-labels')) {
          map.current.removeLayer('angle-labels-layer')
          map.current.removeSource('angle-labels')
        }
        
        onAreaCalculatedRef.current(0, { type: 'FeatureCollection', features: [] }, undefined)
      }
    }

    // If we have previously drawn polygons, preload them
    if (initialData && initialData.features && initialData.features.length > 0) {
      try {
        draw.current!.set(initialData)
        // Compute area and update state/callback
        const data = draw.current!.getAll()
        let totalAreaSqMeters = 0
        data.features.forEach((feature) => {
          if (feature.geometry.type === 'Polygon') {
            totalAreaSqMeters += turf.area(feature as any)
          }
        })
        const totalAreaSqFt = totalAreaSqMeters * 10.764
        setCurrentArea(totalAreaSqFt)
        onAreaCalculatedRef.current(totalAreaSqFt, data)
        // Fit bounds to existing polygons
        const allCoordinates: number[][] = []
        data.features.forEach(feature => {
          if (feature.geometry.type === 'Polygon') {
            feature.geometry.coordinates[0].forEach(coord => allCoordinates.push(coord))
          }
        })
        if (allCoordinates.length > 0) {
          const lngs = allCoordinates.map(c => c[0])
          const lats = allCoordinates.map(c => c[1])
          const bounds = new mapboxgl.LngLatBounds(
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)]
          )
          map.current.fitBounds(bounds, { padding: 80, maxZoom: 20, duration: 0 })
        }
      } catch (e) {
        console.warn('Failed to preload drawing data:', e)
      }
    }

    // Listen for drawing events
    map.current.on('draw.create', updateArea)
    map.current.on('draw.update', updateArea)
    map.current.on('draw.delete', updateArea)

    // Cleanup on unmount
    return () => {
      if (marker.current) {
        marker.current.remove()
        marker.current = null
      }
      if (map.current) {
        // Remove angle labels if they exist
        if (map.current?.getSource('angle-labels')) {
          map.current.removeLayer('angle-labels-layer')
          map.current.removeSource('angle-labels')
        }
        map.current.remove()
        map.current = null
      }
    }
  }, [coordinates.lat, coordinates.lng, address, initialData, mapContainer])

  return {
    currentArea,
  }
}

