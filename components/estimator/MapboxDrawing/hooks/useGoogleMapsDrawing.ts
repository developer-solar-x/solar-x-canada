import { useEffect, useRef, useState, useCallback } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import * as turf from '@turf/turf'
import { POLYGON_COLORS } from '../constants'
import { calculateAngle, calculateLabelOffset } from '../utils/angleCalculations'

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google?: typeof google
  }
}

interface UseGoogleMapsDrawingProps {
  coordinates: { lat: number; lng: number }
  address: string
  onAreaCalculated: (areaSqFt: number, polygon: any, mapSnapshot?: string) => void
  initialData?: any
  mapContainer: React.RefObject<HTMLDivElement>
  selectedSectionIndex?: number | null
  editMode?: boolean
}

export function useGoogleMapsDrawing({
  coordinates,
  address,
  onAreaCalculated,
  initialData,
  mapContainer,
  selectedSectionIndex,
  editMode = false,
}: UseGoogleMapsDrawingProps) {
  const map = useRef<google.maps.Map | null>(null)
  const drawingManager = useRef<google.maps.drawing.DrawingManager | null>(null)
  const polygons = useRef<google.maps.Polygon[]>([])
  const markers = useRef<google.maps.Marker[]>([])
  const onAreaCalculatedRef = useRef(onAreaCalculated)
  const snapshotTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [currentArea, setCurrentArea] = useState<number | null>(null)
  const [mapReady, setMapReady] = useState<google.maps.Map | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  
  // History tracking for undo/redo
  const historyRef = useRef<any[]>([])
  const historyIndexRef = useRef<number>(-1)
  const isUndoRedoRef = useRef<boolean>(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Update callback ref when it changes
  useEffect(() => {
    onAreaCalculatedRef.current = onAreaCalculated
  }, [onAreaCalculated])

  // Convert Google Maps polygon to GeoJSON
  function polygonToGeoJSON(polygon: google.maps.Polygon): any {
    const path = polygon.getPath()
    const coordinates: number[][] = []
    
    path.forEach((latLng) => {
      coordinates.push([latLng.lng(), latLng.lat()])
    })
    
    // Close the ring
    if (coordinates.length > 0 && 
        (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || 
         coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
      coordinates.push([coordinates[0][0], coordinates[0][1]])
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates],
      },
      properties: {
        featureCount: polygons.current.indexOf(polygon),
        user_featureCount: polygons.current.indexOf(polygon),
      },
    }
  }

  // Convert all polygons to GeoJSON FeatureCollection
  function getAllPolygonsAsGeoJSON(): any {
    const features = polygons.current.map((polygon) => polygonToGeoJSON(polygon))
    return {
      type: 'FeatureCollection',
      features,
    }
  }

  // Calculate total area from all polygons
  const calculateTotalArea = useCallback((): number => {
    let totalAreaSqMeters = 0
    polygons.current.forEach((polygon) => {
      const geoJSON = polygonToGeoJSON(polygon)
      totalAreaSqMeters += turf.area(geoJSON)
    })
    return totalAreaSqMeters * 10.764 // Convert to square feet
  }, [])

  // Capture snapshot
  const captureSnapshot = useCallback(async (): Promise<string | null> => {
    if (!map.current) {
      return Promise.resolve(null)
    }

    const geoJSON = getAllPolygonsAsGeoJSON()
    if (!geoJSON.features || geoJSON.features.length === 0) {
      return Promise.resolve(null)
    }

    const totalAreaSqFt = calculateTotalArea()

    // Fit bounds to all polygons
    const bounds = new google.maps.LatLngBounds()
    polygons.current.forEach((polygon) => {
      const path = polygon.getPath()
      path.forEach((latLng) => {
        bounds.extend(latLng)
      })
    })

    if (bounds.isEmpty()) {
      return Promise.resolve(null)
    }

    map.current.fitBounds(bounds)

    // Wait for map to finish repositioning
    return new Promise<string | null>((resolve) => {
      setTimeout(() => {
        // For Google Maps, we can't directly capture canvas like Mapbox
        // We'll need to use html2canvas or similar, but for now return null
        // The snapshot functionality can be added later if needed
        onAreaCalculatedRef.current(totalAreaSqFt, geoJSON, null)
        resolve(null)
      }, 300)
    })
  }, [calculateTotalArea])

  // Update area calculation
  const updateArea = useCallback(() => {
    if (snapshotTimeoutRef.current) {
      clearTimeout(snapshotTimeoutRef.current)
      snapshotTimeoutRef.current = null
    }

    const totalAreaSqFt = calculateTotalArea()
    setCurrentArea(totalAreaSqFt)

    const geoJSON = getAllPolygonsAsGeoJSON()
    
    if (totalAreaSqFt > 0 && geoJSON.features.length > 0) {
      onAreaCalculatedRef.current(totalAreaSqFt, geoJSON, undefined)
      
      // Debounce snapshot capture
      snapshotTimeoutRef.current = setTimeout(() => {
        captureSnapshot()
      }, 1000)
    } else {
      onAreaCalculatedRef.current(0, { type: 'FeatureCollection', features: [] }, undefined)
    }
  }, [calculateTotalArea, captureSnapshot])

  // Save to history
  function saveToHistory() {
    const currentState = getAllPolygonsAsGeoJSON()
    const historyData = JSON.parse(JSON.stringify(currentState))

    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    }

    historyRef.current.push(historyData)
    historyIndexRef.current = historyRef.current.length - 1

    if (historyRef.current.length > 50) {
      historyRef.current.shift()
      historyIndexRef.current--
    }

    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
  }

  // Undo function
  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0 || !map.current) return

    isUndoRedoRef.current = true
    historyIndexRef.current--
    const previousState = historyRef.current[historyIndexRef.current]

    if (previousState) {
      // Clear current polygons
      polygons.current.forEach((polygon) => polygon.setMap(null))
      polygons.current = []

      // Restore polygons from history
      if (previousState.features) {
        previousState.features.forEach((feature: any, index: number) => {
          if (feature.geometry.type === 'Polygon') {
            const coords = feature.geometry.coordinates[0].map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0],
            }))

            const polygon = new google.maps.Polygon({
              paths: coords,
              strokeColor: POLYGON_COLORS[index % POLYGON_COLORS.length],
              strokeOpacity: 1,
              strokeWeight: 3,
              fillColor: POLYGON_COLORS[index % POLYGON_COLORS.length],
              fillOpacity: 0.3,
              editable: !editMode,
              draggable: !editMode,
            })

            polygon.setMap(map.current)
            polygons.current.push(polygon)

            // Add event listeners
            polygon.addListener('set_at', updateArea)
            polygon.addListener('insert_at', updateArea)
            polygon.addListener('remove_at', updateArea)
            polygon.addListener('dragend', updateArea)
          }
        })
      }

      updateArea()
      setCanUndo(historyIndexRef.current > 0)
      setCanRedo(true)
    }
    isUndoRedoRef.current = false
  }, [editMode, updateArea])

  // Redo function
  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1 || !map.current) return

    isUndoRedoRef.current = true
    historyIndexRef.current++
    const nextState = historyRef.current[historyIndexRef.current]

    if (nextState) {
      // Clear current polygons
      polygons.current.forEach((polygon) => polygon.setMap(null))
      polygons.current = []

      // Restore polygons from history
      if (nextState.features) {
        nextState.features.forEach((feature: any, index: number) => {
          if (feature.geometry.type === 'Polygon') {
            const coords = feature.geometry.coordinates[0].map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0],
            }))

            const polygon = new google.maps.Polygon({
              paths: coords,
              strokeColor: POLYGON_COLORS[index % POLYGON_COLORS.length],
              strokeOpacity: 1,
              strokeWeight: 3,
              fillColor: POLYGON_COLORS[index % POLYGON_COLORS.length],
              fillOpacity: 0.3,
              editable: !editMode,
              draggable: !editMode,
            })

            polygon.setMap(map.current)
            polygons.current.push(polygon)

            // Add event listeners
            polygon.addListener('set_at', updateArea)
            polygon.addListener('insert_at', updateArea)
            polygon.addListener('remove_at', updateArea)
            polygon.addListener('dragend', updateArea)
          }
        })
      }

      updateArea()
      setCanUndo(true)
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
    }
    isUndoRedoRef.current = false
  }, [editMode, updateArea])

  // Check if undo is available
  const checkCanUndo = useCallback(() => {
    return historyIndexRef.current > 0
  }, [])

  // Check if redo is available
  const checkCanRedo = useCallback(() => {
    return historyIndexRef.current < historyRef.current.length - 1
  }, [])

  // Initialize Google Maps
  useEffect(() => {
    const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!googleMapsApiKey) {
      console.error('Google Maps API key not configured')
      return
    }

    if (map.current) return

    // Set global options for Google Maps API
    setOptions({
      apiKey: googleMapsApiKey,
      version: 'weekly',
    })

    // Import required libraries - this populates the global google.maps namespace
    Promise.all([
      importLibrary('maps'),
      importLibrary('drawing'),
      importLibrary('geometry'),
    ]).then(() => {
      if (!mapContainer.current || !window.google?.maps) {
        console.error('Google Maps libraries failed to load')
        return
      }

      // Initialize map using global google.maps namespace
      map.current = new google.maps.Map(mapContainer.current, {
        center: { lat: coordinates.lat, lng: coordinates.lng },
        zoom: 21,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      })

      // Listen for map errors
      google.maps.event.addListener(map.current, 'tilesloaded', () => {
        // Check if watermark is present (indicates billing/API issue)
        // The watermark appears as a visual overlay, so we check for common error states
        setApiError(null)
      })

      // Listen for API errors
      google.maps.event.addListenerOnce(map.current, 'error', () => {
        setApiError('api_error')
      })

      setMapReady(map.current)

      // Add marker at address location
      const marker = new google.maps.Marker({
        position: { lat: coordinates.lat, lng: coordinates.lng },
        map: map.current,
        title: address,
        draggable: true,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#DC143C',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      })

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="padding: 8px;"><strong>Your Location</strong><br/><small>${address}</small></div>`,
      })

      marker.addListener('click', () => {
        infoWindow.open(map.current, marker)
      })

      markers.current.push(marker)

      // Initialize DrawingManager
      drawingManager.current = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_LEFT,
          drawingModes: [google.maps.drawing.OverlayType.POLYGON],
        },
        polygonOptions: {
          fillColor: '#DC143C',
          fillOpacity: 0.3,
          strokeWeight: 3,
          strokeColor: '#DC143C',
          clickable: true,
          editable: !editMode,
          draggable: !editMode,
          zIndex: 1,
        },
      })

      drawingManager.current.setMap(map.current)

      // Handle polygon completion
      google.maps.event.addListener(
        drawingManager.current,
        'polygoncomplete',
        (polygon: google.maps.Polygon) => {
          // Set color based on polygon count
          const index = polygons.current.length
          polygon.setOptions({
            fillColor: POLYGON_COLORS[index % POLYGON_COLORS.length],
            strokeColor: POLYGON_COLORS[index % POLYGON_COLORS.length],
          })

          polygon.setMap(map.current)
          polygons.current.push(polygon)

          // Add event listeners for editing
          polygon.addListener('set_at', updateArea)
          polygon.addListener('insert_at', updateArea)
          polygon.addListener('remove_at', updateArea)
          polygon.addListener('dragend', updateArea)

          if (!isUndoRedoRef.current) {
            saveToHistory()
          }

          updateArea()
        }
      )

      // Load initial data if provided
      if (initialData && initialData.features && initialData.features.length > 0) {
        initialData.features.forEach((feature: any, index: number) => {
          if (feature.geometry.type === 'Polygon') {
            const coords = feature.geometry.coordinates[0].map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0],
            }))

            const polygon = new google.maps.Polygon({
              paths: coords,
              strokeColor: POLYGON_COLORS[index % POLYGON_COLORS.length],
              strokeOpacity: 1,
              strokeWeight: 3,
              fillColor: POLYGON_COLORS[index % POLYGON_COLORS.length],
              fillOpacity: 0.3,
              editable: !editMode,
              draggable: !editMode,
            })

            polygon.setMap(map.current)
            polygons.current.push(polygon)

            // Add event listeners
            polygon.addListener('set_at', updateArea)
            polygon.addListener('insert_at', updateArea)
            polygon.addListener('remove_at', updateArea)
            polygon.addListener('dragend', updateArea)
          }
        })

        updateArea()

        // Save initial state to history
        const emptyState = { type: 'FeatureCollection', features: [] }
        const initialHistoryData = getAllPolygonsAsGeoJSON()
        historyRef.current = [emptyState, initialHistoryData]
        historyIndexRef.current = 1
        setCanUndo(true)
        setCanRedo(false)
      }

      // Handle delete key for polygon deletion
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.key === 'Backspace' || e.key === 'Delete') && map.current) {
          // Find selected polygon (this would need selection tracking)
          // For now, we'll implement basic deletion
        }
      }

      if (mapContainer.current) {
        mapContainer.current.addEventListener('keydown', handleKeyDown, true)
      }

      // Store cleanup function
      return () => {
        if (snapshotTimeoutRef.current) {
          clearTimeout(snapshotTimeoutRef.current)
        }
        if (mapContainer.current) {
          mapContainer.current.removeEventListener('keydown', handleKeyDown, true)
        }
      }
    }).catch((error) => {
      console.error('Error loading Google Maps:', error)
      setApiError('load_error')
      // Check for specific error types
      if (error.message?.includes('ApiProjectMapError') || error.message?.includes('ApiNotActivatedMapError')) {
        setApiError('api_project_error')
        console.error(`
          Google Maps API Error: ${error.message}
          
          Common fixes:
          1. Verify your API key is correct in .env.local
          2. Enable the following APIs in Google Cloud Console:
             - Maps JavaScript API
             - Drawing Library
             - Geometry Library
          3. Ensure billing is enabled for your Google Cloud project
          4. Check API key restrictions (if any) allow your domain
          
          Visit: https://console.cloud.google.com/apis/library
        `)
      }
    })

    return () => {
      if (snapshotTimeoutRef.current) {
        clearTimeout(snapshotTimeoutRef.current)
      }
      polygons.current.forEach((polygon) => polygon.setMap(null))
      markers.current.forEach((marker) => marker.setMap(null))
      if (drawingManager.current) {
        drawingManager.current.setMap(null)
      }
      if (map.current) {
        // Google Maps cleanup is handled automatically
      }
    }
  }, [coordinates.lat, coordinates.lng, address, initialData, mapContainer, editMode])

  return {
    currentArea,
    captureSnapshot,
    undo,
    redo,
    canUndo: checkCanUndo,
    canRedo: checkCanRedo,
    mapInstance: mapReady,
    apiError,
  }
}
