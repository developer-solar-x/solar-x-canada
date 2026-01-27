import { useEffect, useRef, useState, useCallback } from 'react'
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
  selectedSectionIndex?: number | null
  editMode?: boolean // When true, disable dragging of roof polygons
}

export function useMapboxDrawing({
  coordinates,
  address,
  onAreaCalculated,
  initialData,
  mapContainer,
  selectedSectionIndex,
  editMode = false,
}: UseMapboxDrawingProps) {
  const map = useRef<mapboxgl.Map | null>(null)
  const draw = useRef<MapboxDraw | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)
  const onAreaCalculatedRef = useRef(onAreaCalculated)
  const snapshotTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [currentArea, setCurrentArea] = useState<number | null>(null)
  const [mapReady, setMapReady] = useState<mapboxgl.Map | null>(null) // Track map instance for external use
  
  // History tracking for undo/redo
  const historyRef = useRef<any[]>([])
  const historyIndexRef = useRef<number>(-1)
  const isUndoRedoRef = useRef<boolean>(false) // Flag to prevent saving during undo/redo
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Update callback ref when it changes
  useEffect(() => {
    onAreaCalculatedRef.current = onAreaCalculated
  }, [onAreaCalculated])

  // Function to capture snapshot immediately
  const captureSnapshot = useCallback(async (): Promise<string | null> => {
    if (!map.current || !draw.current) {
      return Promise.resolve(null)
    }

    const data = draw.current.getAll()
    if (!data.features || data.features.length === 0) {
      return Promise.resolve(null)
    }

    // Calculate total area
    let totalAreaSqFt = 0
    data.features.forEach((feature: any) => {
      if (feature.geometry.type === 'Polygon') {
        const areaMeters = turf.area(feature)
        totalAreaSqFt += Math.round(areaMeters * 10.764)
      }
    })

    // Calculate bounding box of all polygons
    const allCoordinates: number[][] = []
    data.features.forEach((feature: any) => {
      if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates && feature.geometry.coordinates[0]) {
        feature.geometry.coordinates[0].forEach((coord: number[]) => {
          // Filter out null/undefined coordinates
          if (coord && Array.isArray(coord) && coord.length >= 2 && coord[0] != null && coord[1] != null) {
            allCoordinates.push(coord)
          }
        })
      }
    })

    if (allCoordinates.length === 0) {
      return Promise.resolve(null)
    }

    // Calculate bounds with padding
    const lngs = allCoordinates.map(coord => coord[0]).filter(lng => lng != null)
    const lats = allCoordinates.map(coord => coord[1]).filter(lat => lat != null)
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
    return new Promise<string | null>((resolve) => {
      setTimeout(() => {
        if (map.current) {
          const canvas = map.current.getCanvas()
          const mapSnapshot = canvas.toDataURL('image/png')
          // Update callback with snapshot
          onAreaCalculatedRef.current(totalAreaSqFt, data, mapSnapshot)
          resolve(mapSnapshot)
        } else {
          resolve(null)
        }
      }, 300)
    })
  }, [])

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
        // Highlight selected section with thicker border (must be after other stroke layers)
        {
          id: 'gl-draw-polygon-stroke-selected',
          type: 'line',
          filter: ['literal', false], // Start with false, will be updated dynamically
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
            'line-width': 8, // Thicker border for selected section (increased from 6)
            'line-opacity': 1,
          },
        },
      ],
    })

    map.current.addControl(draw.current, 'top-left')

    // Track if map style is loaded
    let mapStyleLoaded = false
    map.current.once('load', () => {
      mapStyleLoaded = true
      setMapReady(map.current) // Expose map instance when ready
    })
    
    // Also check if already loaded
    if (map.current.isStyleLoaded()) {
      mapStyleLoaded = true
    }

    // Function to add angle labels to polygons
    function addAngleLabels() {
      // Check if map is loaded and ready
      if (!map.current || !mapStyleLoaded || !map.current.isStyleLoaded()) {
        return
      }
      
      const data = draw.current!.getAll()
      
      // Remove existing angle labels
      if (map.current?.getSource('angle-labels')) {
        try {
          if (map.current.getLayer('angle-labels-layer')) {
            map.current.removeLayer('angle-labels-layer')
          }
          map.current.removeSource('angle-labels')
        } catch (e) {
          // Ignore errors if source/layer doesn't exist
        }
      }
      
      const labelFeatures: any[] = []
      
      data.features.forEach((feature, featureIndex) => {
        if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates && feature.geometry.coordinates[0]) {
          const coords = feature.geometry.coordinates[0]
          
          if (!coords || !Array.isArray(coords) || coords.length < 3) {
            return // Skip invalid polygons
          }
          
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
      
      if (labelFeatures.length > 0 && map.current && map.current.isStyleLoaded()) {
        try {
          // Remove existing source/layer if they exist
          if (map.current.getSource('angle-labels')) {
            if (map.current.getLayer('angle-labels-layer')) {
              map.current.removeLayer('angle-labels-layer')
            }
            map.current.removeSource('angle-labels')
          }
          
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
        } catch (e) {
          // Ignore errors if map is not ready
          console.warn('Failed to add angle labels:', e)
        }
      }
    }

    // Add section labels (Section 1, Section 2, etc.) at polygon centroids
    function addSectionLabels(featuresToLabel?: any[]) {
      // Check if map is loaded and ready
      if (!map.current) {
        return
      }
      
      // Wait for style to load if not ready yet
      if (!map.current.isStyleLoaded()) {
        // Retry after a short delay
        setTimeout(() => addSectionLabels(featuresToLabel), 100)
        return
      }
      
      // Use provided features or get from draw instance
      const data = featuresToLabel ? { features: featuresToLabel } : draw.current!.getAll()
      
      // Remove existing section labels
      if (map.current?.getSource('section-labels')) {
        try {
          if (map.current.getLayer('section-labels-layer')) {
            map.current.removeLayer('section-labels-layer')
          }
          map.current.removeSource('section-labels')
        } catch (e) {
          // Ignore errors if source/layer doesn't exist
        }
      }
      
      const sectionLabelFeatures: any[] = []
      
      data.features.forEach((feature) => {
        if (feature.geometry.type === 'Polygon' && 
            feature.geometry.coordinates && 
            feature.geometry.coordinates[0]) {
          const coords = feature.geometry.coordinates[0]
          
          if (!coords || !Array.isArray(coords) || coords.length < 3) {
            return // Skip invalid polygons
          }
          
          // Get section number from properties - check both user_featureCount and featureCount
          const sectionNumber = feature.properties?.user_featureCount !== undefined 
            ? feature.properties.user_featureCount 
            : (feature.properties?.featureCount !== undefined ? feature.properties.featureCount : null)
          
          // Only add label if section number is defined (valid polygon)
          if (sectionNumber !== undefined && sectionNumber !== null && sectionNumber >= 0) {
            try {
              // Calculate polygon centroid
              const polygonFeature = turf.polygon([coords])
              const centroid = turf.centroid(polygonFeature)
              const centroidCoords = centroid.geometry.coordinates
              
              // Get color for this section
              const color = POLYGON_COLORS[sectionNumber % POLYGON_COLORS.length]
              
              // Create label feature
              sectionLabelFeatures.push({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: centroidCoords
                },
                properties: {
                  label: `Section ${sectionNumber + 1}`,
                  color: color,
                  sectionNumber: sectionNumber
                }
              })
            } catch (e) {
              // Skip if centroid calculation fails
              console.warn('Failed to calculate centroid for section label:', e)
            }
          }
        }
      })
      
      if (sectionLabelFeatures.length > 0 && map.current) {
        // Function to actually add the layer
        const addLayerToMap = () => {
          if (!map.current || !map.current.isStyleLoaded()) {
            // Retry after a short delay if style isn't loaded
            setTimeout(addLayerToMap, 100)
            return
          }
          
          try {
            // Remove existing source if it exists
            if (map.current.getSource('section-labels')) {
              if (map.current.getLayer('section-labels-layer')) {
                map.current.removeLayer('section-labels-layer')
              }
              map.current.removeSource('section-labels')
            }
            
            map.current.addSource('section-labels', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: sectionLabelFeatures
              }
            })
            
            // Add layer above all draw layers so labels are visible
            // Try to add after selected layer, otherwise add at the end
            let beforeId: string | undefined = undefined
            try {
              if (map.current.getLayer('gl-draw-polygon-stroke-selected')) {
                beforeId = 'gl-draw-polygon-stroke-selected'
              }
            } catch {
              // Layer doesn't exist, add at end
            }
            
            map.current.addLayer({
            id: 'section-labels-layer',
            type: 'symbol',
            source: 'section-labels',
            layout: {
              'text-field': ['get', 'label'],
              'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
              'text-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 12,
                15, 14,
                18, 16,
                20, 18
              ],
              'text-anchor': 'center',
              'text-allow-overlap': true,
              'text-ignore-placement': true,
              'text-optional': false
            },
            paint: {
              'text-color': ['get', 'color'],
              'text-halo-color': '#FFFFFF',
              'text-halo-width': 3,
              'text-halo-blur': 1,
              'text-opacity': 1
            }
          }, beforeId) // Add after the selected stroke layer if it exists
          } catch (e) {
            // Ignore errors if map is not ready, but log for debugging
            console.warn('Failed to add section labels:', e)
          }
        }
        
        // Call the function to add layer
        addLayerToMap()
      }
    }

    // Save state to history
    function saveToHistory() {
      if (!draw.current) return
      
      const data = draw.current.getAll()
      const historyData = JSON.parse(JSON.stringify(data)) // Deep clone
      
      // Remove any future history if we're not at the end
      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
      }
      
      // Add new state to history
      historyRef.current.push(historyData)
      historyIndexRef.current = historyRef.current.length - 1
      
      // Limit history size to prevent memory issues
      if (historyRef.current.length > 50) {
        historyRef.current.shift()
        historyIndexRef.current--
      }
      
      // Update undo/redo state
      setCanUndo(historyIndexRef.current > 0)
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
    }

    // Calculate total area when polygons are drawn, updated, or deleted
    function updateArea() {
      // Clear any pending snapshot capture
      if (snapshotTimeoutRef.current) {
        clearTimeout(snapshotTimeoutRef.current)
        snapshotTimeoutRef.current = null
      }
      
      const data = draw.current!.getAll()
      
      // Save to history (but not during undo/redo operations)
      if (!isUndoRedoRef.current) {
        if (historyIndexRef.current >= 0) {
          const currentState = JSON.stringify(data)
          const lastState = historyIndexRef.current >= 0 
            ? JSON.stringify(historyRef.current[historyIndexRef.current])
            : null
          
          // Only save if state actually changed
          if (currentState !== lastState) {
            saveToHistory()
          }
        } else {
          // First state
          saveToHistory()
        }
      }
      
      // Process all features for property updates (including incomplete ones)
      // But filter only for callbacks
      let validIndex = 0
      const featuresToUpdate: any[] = []
      
      data.features.forEach((feature: any, index: number) => {
        if (feature.geometry.type === 'Polygon') {
          feature.properties = feature.properties || {}
          
          // Only assign featureCount to valid polygons (for color coding)
          // But don't filter them out - let Mapbox Draw manage incomplete polygons
          const hasValidCoords = feature.geometry.coordinates && 
                                 feature.geometry.coordinates[0] && 
                                 Array.isArray(feature.geometry.coordinates[0]) &&
                                 feature.geometry.coordinates[0].length >= 3
          
          if (hasValidCoords) {
            try {
              const areaMeters = turf.area(feature)
              const isValid = areaMeters > 0 && isFinite(areaMeters)
              
              if (isValid && feature.id) {
                // Set both featureCount and user_featureCount (map styles use user_featureCount)
                feature.properties.featureCount = validIndex
                feature.properties.user_featureCount = validIndex
                validIndex++
                
                // Store feature to update in draw instance
                featuresToUpdate.push({
                  id: feature.id,
                  properties: { ...feature.properties }
                })
              }
            } catch {
              // Invalid polygon, skip featureCount assignment
            }
          }
        }
      })
      
      // Update all features in draw instance with properties (including incomplete ones)
      // This ensures colors are applied while preserving incomplete polygons
      if (draw.current) {
        // Get all current features (including incomplete ones)
        const allCurrentFeatures = draw.current.getAll()
        
        // Update properties on all features
        allCurrentFeatures.features.forEach((feature: any) => {
          if (feature.geometry.type === 'Polygon') {
            // Find matching feature from our processed data
            const processedFeature = data.features.find((f: any) => f.id === feature.id)
            if (processedFeature && processedFeature.properties) {
              // Update properties
              feature.properties = {
                ...feature.properties,
                ...processedFeature.properties
              }
            }
          }
        })
        
        // Update draw instance with all features (complete and incomplete)
        // This applies the properties without removing incomplete polygons
        draw.current.set(allCurrentFeatures)
        
        // After updating draw instance, add section labels using the updated features
        // Use a small delay to ensure the draw instance has been updated
        setTimeout(() => {
          const updatedData = draw.current!.getAll()
          addSectionLabels(updatedData.features)
        }, 50)
      }
      
      // Filter out invalid polygons only for callbacks (not for draw instance)
      const validFeatures = data.features.filter((feature: any) => {
        if (feature.geometry.type !== 'Polygon') return false
        if (!feature.geometry.coordinates || !feature.geometry.coordinates[0]) return false
        if (!Array.isArray(feature.geometry.coordinates[0])) return false
        if (feature.geometry.coordinates[0].length < 3) return false
        // Check if polygon has valid area
        try {
          const areaMeters = turf.area(feature)
          return areaMeters > 0 && isFinite(areaMeters)
        } catch {
          return false
        }
      })
      
      // Create valid data object for callbacks
      const validData = {
        type: 'FeatureCollection',
        features: validFeatures
      }
      
      if (validFeatures.length > 0) {
        // Calculate angles for valid features only
        validFeatures.forEach((feature, index) => {
          feature.properties = feature.properties || {}
          feature.properties.featureCount = index
          feature.properties.user_featureCount = index // Also set user_featureCount for map styles
          
          // Calculate and store angles for each vertex
          if (feature.geometry.type === 'Polygon') {
            const coords = feature.geometry.coordinates?.[0]
            if (!coords || !Array.isArray(coords) || coords.length < 3) {
              // Skip invalid polygons
              return
            }
            const angles: number[] = []
            
            for (let i = 0; i < coords.length - 1; i++) {
              const prevIndex = i === 0 ? coords.length - 2 : i - 1
              const nextIndex = i + 1
              
              // Validate coordinates exist and are valid arrays
              const prevCoord = coords[prevIndex]
              const currCoord = coords[i]
              const nextCoord = coords[nextIndex]
              
              if (!prevCoord || !currCoord || !nextCoord ||
                  !Array.isArray(prevCoord) || !Array.isArray(currCoord) || !Array.isArray(nextCoord) ||
                  prevCoord.length < 2 || currCoord.length < 2 || nextCoord.length < 2) {
                // Skip invalid coordinates
                continue
              }
              
              const angle = calculateAngle(
                prevCoord,
                currCoord,
                nextCoord
              )
              
              angles.push(angle)
            }
            
            // Store angles in feature properties
            feature.properties.vertexAngles = angles
            feature.properties.color = POLYGON_COLORS[index % POLYGON_COLORS.length]
          }
        })
        
        // Don't call draw.current.set() here - it removes incomplete polygons being drawn!
        // Mapbox Draw manages its own state. We only filter for callbacks, not modify the draw instance.
        // Properties are set on the feature objects above, which will be used when features are complete.
        
        // Calculate total area of all valid polygons - REAL-TIME UPDATE
        let totalAreaSqMeters = 0
        
        validFeatures.forEach((feature) => {
          if (feature.geometry.type === 'Polygon') {
            const area = turf.area(feature as any)
            totalAreaSqMeters += area
          }
        })
        
        // Convert square meters to square feet
        const totalAreaSqFt = totalAreaSqMeters * 10.764
        
        // Update area immediately (real-time) without waiting for snapshot
        setCurrentArea(totalAreaSqFt)
        
        // Only call callback if we have valid features and area > 0
        // This prevents clearing results when polygons are temporarily filtered during selection
        if (totalAreaSqFt > 0 && validFeatures.length > 0) {
          onAreaCalculatedRef.current(totalAreaSqFt, validData, undefined)
        }
        
        // Add angle labels
        addAngleLabels()
        
        // Add section labels - pass validFeatures so properties are available
        addSectionLabels(validFeatures)
        
        // Re-apply highlight if a section is selected (in case updateArea cleared it)
        if (selectedSectionIndex !== null && selectedSectionIndex !== undefined && map.current && map.current.isStyleLoaded()) {
          const selectedLayer = map.current.getLayer('gl-draw-polygon-stroke-selected')
          if (selectedLayer) {
            try {
              map.current.setFilter('gl-draw-polygon-stroke-selected', [
                'all',
                ['==', '$type', 'Polygon'],
                ['==', ['to-number', ['get', 'user_featureCount']], selectedSectionIndex]
              ])
            } catch (e) {
              // Ignore errors
            }
          }
        }
        
        // Debounce snapshot capture - capture after user stops editing (separate from real-time area)
        snapshotTimeoutRef.current = setTimeout(() => {
          if (map.current && validFeatures.length > 0) {
            // Calculate bounding box of all valid polygons
            const allCoordinates: number[][] = []
            validFeatures.forEach(feature => {
              if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates && feature.geometry.coordinates[0]) {
                feature.geometry.coordinates[0].forEach(coord => {
                  // Filter out null/undefined coordinates
                  if (coord && Array.isArray(coord) && coord.length >= 2 && coord[0] != null && coord[1] != null) {
                    allCoordinates.push(coord)
                  }
                })
              }
            })
            
            if (allCoordinates.length > 0) {
              // Calculate bounds with padding
              const lngs = allCoordinates.map(coord => coord[0]).filter(lng => lng != null)
              const lats = allCoordinates.map(coord => coord[1]).filter(lat => lat != null)
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
                  // Update with snapshot (final update) - use valid data
                  onAreaCalculatedRef.current(totalAreaSqFt, validData, mapSnapshot)
                }
              }, 300)
            }
          }
        }, 1000) // Debounce snapshot capture to 1 second after last edit
      } else {
        // No polygons left - clear everything immediately
        setCurrentArea(null)
        
        // Remove angle labels
        if (map.current?.getSource('angle-labels')) {
          map.current.removeLayer('angle-labels-layer')
          map.current.removeSource('angle-labels')
        }
        
        // Update immediately when deleted (no snapshot needed)
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
        
        // Save initial state to history
        // First save an empty state so undo can go back to empty
        const emptyState = { type: 'FeatureCollection', features: [] }
        const initialHistoryData = JSON.parse(JSON.stringify(data))
        historyRef.current = [emptyState, initialHistoryData]
        historyIndexRef.current = 1 // Point to the initial data (index 1)
        setCanUndo(true) // Can undo back to empty state
        setCanRedo(false)
        // Fit bounds to existing polygons
        const allCoordinates: number[][] = []
        data.features.forEach(feature => {
          if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates && feature.geometry.coordinates[0]) {
            feature.geometry.coordinates[0].forEach(coord => {
              // Filter out null/undefined coordinates
              if (coord && Array.isArray(coord) && coord.length >= 2 && coord[0] != null && coord[1] != null) {
                allCoordinates.push(coord)
              }
            })
          }
        })
        if (allCoordinates.length > 0) {
          const lngs = allCoordinates.map(c => c[0]).filter(lng => lng != null)
          const lats = allCoordinates.map(c => c[1]).filter(lat => lat != null)
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

    // Listen for drawing events - prevent default behavior to avoid page refreshes
    map.current.on('draw.create', updateArea)
    map.current.on('draw.update', updateArea)
    map.current.on('draw.delete', updateArea)
    
    map.current.on('draw.modechange', (e: any) => {
      // Only trigger updateArea for mode changes that actually affect geometry
      // Don't update when just selecting/deselecting (simple_select <-> direct_select)
      const mode = e.mode
      const previousMode = e.previousMode
      
      // Only update if mode change indicates actual geometry change
      // Skip updates for selection-only mode changes
      if (mode === 'simple_select' && previousMode === 'direct_select') {
        // User finished editing, update area
        setTimeout(() => {
          updateArea()
        }, 0)
      } else if (mode === 'direct_select' && (previousMode === 'simple_select' || previousMode === 'draw_polygon')) {
        // User started editing or finished drawing, update area
        setTimeout(() => {
          updateArea()
        }, 0)
      } else if (mode !== 'simple_select' && mode !== 'direct_select') {
        // Mode changed to something else (like draw_polygon), update area
        setTimeout(() => {
          updateArea()
        }, 0)
      }
      // Otherwise, it's just selection change, don't update area
    })
    map.current.on('draw.selectionchange', () => {
      // Don't call updateArea on selection change - it doesn't change the area
      // Only update highlight if needed
      // Selection changes don't affect area calculations, so we skip updateArea to prevent clearing results
    })
    
    // Handle right-click for vertex deletion (more intuitive)
    map.current.on('contextmenu', (e: any) => {
      if (draw.current) {
        const currentMode = draw.current.getMode()
        
        // Only handle right-click deletion in direct_select mode (when editing vertices)
        if (currentMode === 'direct_select') {
          e.preventDefault()
          
          // Get selected features
          const selectedFeatures = draw.current.getSelected()
          
          if (selectedFeatures.features.length > 0) {
            // Check if clicking on a vertex
            const point = e.lngLat
            const feature = selectedFeatures.features[0]
            
            if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates && feature.geometry.coordinates[0]) {
              const coords = feature.geometry.coordinates[0]
              
              if (!coords || !Array.isArray(coords) || coords.length < 3) {
                return
              }
              
              // Find the closest vertex to the click point
              let closestIndex = -1
              let minDistance = Infinity
              
              for (let i = 0; i < coords.length - 1; i++) {
                const coord = coords[i]
                if (coord && Array.isArray(coord) && coord.length >= 2) {
                  const distance = Math.sqrt(
                    Math.pow(coord[0] - point.lng, 2) + 
                    Math.pow(coord[1] - point.lat, 2)
                  )
                  
                  if (distance < minDistance) {
                    minDistance = distance
                    closestIndex = i
                  }
                }
              }
              
              // If click is close to a vertex (within ~10 meters at zoom 21), delete it
              // At zoom 21, ~10 meters is roughly 0.0001 degrees
              if (closestIndex >= 0 && minDistance < 0.0001) {
                // Remove the vertex by creating a new coordinates array without it
                const newCoords = [...coords]
                newCoords.splice(closestIndex, 1)
                
                // Ensure polygon has at least 3 points (minimum for a valid polygon)
                if (newCoords.length >= 4) { // 4 because last point is duplicate of first
                  // Update the feature
                  const updatedFeature = {
                    ...feature,
                    geometry: {
                      ...feature.geometry,
                      coordinates: [[...newCoords]]
                    }
                  }
                  
                  // Update the draw instance - preserve all other features
                  const allFeatures = draw.current.getAll()
                  const updatedFeatures = allFeatures.features.map((f: any) => 
                    f.id === feature.id ? updatedFeature : f
                  )
                  
                  draw.current.set({
                    type: 'FeatureCollection',
                    features: updatedFeatures
                  })
                  
                  // Force immediate update
                  setTimeout(() => {
                    updateArea()
                  }, 0)
                }
              }
            }
          }
        }
      }
    })
    
    // Handle keyboard events for immediate deletion feedback
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle backspace/delete key for vertex deletion
      if ((e.key === 'Backspace' || e.key === 'Delete') && draw.current) {
        const selectedFeatures = draw.current.getSelected()
        const currentMode = draw.current.getMode()
        
        if (currentMode === 'direct_select' && selectedFeatures.features.length > 0) {
          // In direct_select mode, Mapbox Draw automatically handles vertex deletion
          // when Backspace/Delete is pressed, but we need to ensure immediate update
          // Force immediate update after deletion
          setTimeout(() => {
            updateArea()
          }, 10) // Slightly longer timeout to ensure Mapbox Draw processes the deletion first
        } else if (currentMode === 'simple_select' && selectedFeatures.features.length > 0) {
          // If in simple_select mode and feature is selected, delete the whole feature
          selectedFeatures.features.forEach((feature: any) => {
            draw.current!.delete(feature.id)
          })
          // Force immediate update
          setTimeout(() => {
            updateArea()
          }, 0)
        }
      }
    }
    
    // Add keyboard event listener to map container
    if (mapContainer.current) {
      mapContainer.current.addEventListener('keydown', handleKeyDown, true)
    }
    
    // Also prevent any form submissions or navigation from map interactions
    const preventRefresh = (e: Event) => {
      if (e.type === 'submit' || (e.target as HTMLElement)?.tagName === 'FORM') {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    
    if (mapContainer.current) {
      mapContainer.current.addEventListener('submit', preventRefresh, true)
    }

    // Cleanup on unmount
    return () => {
      // Clear any pending snapshot timeout
      if (snapshotTimeoutRef.current) {
        clearTimeout(snapshotTimeoutRef.current)
        snapshotTimeoutRef.current = null
      }
      
      // Remove keyboard event listener
      if (mapContainer.current) {
        mapContainer.current.removeEventListener('keydown', handleKeyDown, true)
        mapContainer.current.removeEventListener('submit', preventRefresh, true)
      }
      
      if (marker.current) {
        marker.current.remove()
        marker.current = null
      }
      if (map.current) {
        // Remove event listeners
        map.current.off('draw.create', updateArea)
        map.current.off('draw.update', updateArea)
        map.current.off('draw.delete', updateArea)
        map.current.off('draw.modechange')
        map.current.off('draw.selectionchange')
        
        // Remove angle labels if they exist
        if (map.current?.getSource('angle-labels')) {
          map.current.removeLayer('angle-labels-layer')
          map.current.removeSource('angle-labels')
        }
        map.current.remove()
        map.current = null
      }
    }
  }, [coordinates.lat, coordinates.lng, address, initialData, mapContainer, editMode])
  
  // Lock/unlock roof polygons based on editMode
  useEffect(() => {
    if (!draw.current || !map.current) return
    
    const currentData = draw.current.getAll()
    if (currentData.features.length === 0) return
    
    if (editMode) {
      // Lock polygons - switch to simple_select mode
      // Note: Mapbox Draw doesn't have a 'static' mode, so we use 'simple_select'
      // which allows selection but limits editing compared to direct_select
      const currentMode = draw.current.getMode()
      // Only change mode if we're in a drawing or editing mode
      if (currentMode === 'direct_select' || currentMode === 'draw_polygon') {
        draw.current.changeMode('simple_select')
      }
    } else {
      // Unlock polygons - allow normal editing
      // Keep current mode unless it's invalid, then default to simple_select
      const currentMode = draw.current.getMode()
      const validModes = ['simple_select', 'direct_select', 'draw_polygon']
      if (!validModes.includes(currentMode)) {
        draw.current.changeMode('simple_select')
      }
    }
  }, [editMode])

  // Update selected section highlight when selectedSectionIndex changes
  useEffect(() => {
    if (!map.current) return
    
    const updateHighlight = () => {
      if (!map.current || !map.current.isStyleLoaded()) {
        // Retry after a short delay if style isn't loaded
        setTimeout(updateHighlight, 100)
        return
      }
      
      const selectedLayer = map.current.getLayer('gl-draw-polygon-stroke-selected')
      if (selectedLayer) {
        if (selectedSectionIndex !== null && selectedSectionIndex !== undefined) {
          // Show highlight for selected section
          try {
            // Move layer to top to ensure it's visible above other layers
            try {
              map.current.moveLayer('gl-draw-polygon-stroke-selected')
            } catch {
              // Layer might already be at top, ignore
            }
            
            // Show highlight regardless of active state (so it works even when polygon is selected/active)
            map.current.setFilter('gl-draw-polygon-stroke-selected', [
              'all',
              ['==', '$type', 'Polygon'],
              ['==', ['to-number', ['get', 'user_featureCount']], selectedSectionIndex]
            ])
          } catch (e) {
            console.warn('Failed to set highlight filter:', e)
          }
        } else {
          // Hide highlight when no section is selected
          try {
            map.current.setFilter('gl-draw-polygon-stroke-selected', ['literal', false])
          } catch (e) {
            console.warn('Failed to hide highlight:', e)
          }
        }
      } else {
        // Layer doesn't exist yet, retry after a short delay
        setTimeout(updateHighlight, 200)
      }
    }
    
    updateHighlight()
  }, [selectedSectionIndex])

  // Undo function - needs to be defined after updateArea
  const undo = useCallback(() => {
    if (!draw.current || historyIndexRef.current <= 0) return
    
    isUndoRedoRef.current = true
    historyIndexRef.current--
    const previousState = historyRef.current[historyIndexRef.current]
    
    if (previousState) {
      draw.current.set(previousState)
      // Manually trigger updateArea logic without saving to history
      const data = draw.current.getAll()
      
      if (data.features.length > 0) {
        // Calculate area
        let totalAreaSqMeters = 0
        data.features.forEach((feature: any) => {
          if (feature.geometry.type === 'Polygon') {
            totalAreaSqMeters += turf.area(feature)
          }
        })
        const totalAreaSqFt = totalAreaSqMeters * 10.764
        setCurrentArea(totalAreaSqFt)
        onAreaCalculatedRef.current(totalAreaSqFt, data, undefined)
      } else {
        setCurrentArea(null)
        onAreaCalculatedRef.current(0, { type: 'FeatureCollection', features: [] }, undefined)
      }
      
      setCanUndo(historyIndexRef.current > 0)
      setCanRedo(true)
    }
    isUndoRedoRef.current = false
  }, [])
  
  // Redo function - needs to be defined after updateArea
  const redo = useCallback(() => {
    if (!draw.current || historyIndexRef.current >= historyRef.current.length - 1) return
    
    isUndoRedoRef.current = true
    historyIndexRef.current++
    const nextState = historyRef.current[historyIndexRef.current]
    
    if (nextState) {
      draw.current.set(nextState)
      // Manually trigger updateArea logic without saving to history
      const data = draw.current.getAll()
      
      if (data.features.length > 0) {
        // Calculate area
        let totalAreaSqMeters = 0
        data.features.forEach((feature: any) => {
          if (feature.geometry.type === 'Polygon') {
            totalAreaSqMeters += turf.area(feature)
          }
        })
        const totalAreaSqFt = totalAreaSqMeters * 10.764
        setCurrentArea(totalAreaSqFt)
        onAreaCalculatedRef.current(totalAreaSqFt, data, undefined)
      } else {
        setCurrentArea(null)
        onAreaCalculatedRef.current(0, { type: 'FeatureCollection', features: [] }, undefined)
      }
      
      setCanUndo(true)
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
    }
    isUndoRedoRef.current = false
  }, [])
  
  // Check if undo is available
  const checkCanUndo = useCallback(() => {
    return historyIndexRef.current > 0
  }, [])
  
  // Check if redo is available
  const checkCanRedo = useCallback(() => {
    return historyIndexRef.current < historyRef.current.length - 1
  }, [])

  return {
    currentArea,
    captureSnapshot,
    undo,
    redo,
    canUndo: checkCanUndo,
    canRedo: checkCanRedo,
    mapInstance: mapReady,
  }
}

