/**
 * Panel Layout Calculation Utilities
 *
 * Calculates optimal placement of solar panels within roof polygon sections.
 * Uses shape-aware algorithms with polygon triangulation for intelligent placement.
 */

import * as turf from '@turf/turf'
import earcut from 'earcut'
import { PANEL_SPECS, getPanelAreaSqFt, getPanelWattage } from '@/config/panel-specs'

// Panel dimensions derived from centralized panel specs
export const PANEL_DIMENSIONS = {
  width: PANEL_SPECS.dimensions.width / 1000,  // Convert mm to meters
  height: PANEL_SPECS.dimensions.length / 1000, // Convert mm to meters
  areaSqFt: PANEL_SPECS.dimensions.areaSqFt,
  areaSqM: (PANEL_SPECS.dimensions.width / 1000) * (PANEL_SPECS.dimensions.length / 1000),
  wattage: PANEL_SPECS.electrical.peakPower,
}

// Spacing between panels
export const PANEL_SPACING = {
  horizontal: 0.05, // 5cm gap between panels horizontally
  vertical: 0.1,    // 10cm gap between panels vertically (for maintenance access)
}

// Panel with position and rotation
export interface PanelPosition {
  id: string
  center: [number, number] // [lng, lat]
  corners: [number, number][] // 4 corners of the panel
  rotation: number // degrees from north (0 = north, 90 = east)
  sectionId: string
}

// Result of panel layout calculation
export interface PanelLayoutResult {
  panels: PanelPosition[]
  totalPanels: number
  coveragePercent: number
  estimatedCapacityKw: number
}

/**
 * Convert meters to degrees at a given latitude
 */
function metersToDegreesLat(meters: number): number {
  return meters / 111320
}

function metersToDegreesLng(meters: number, latitude: number): number {
  return meters / (111320 * Math.cos(latitude * Math.PI / 180))
}

/**
 * Rotate a point around a center by given angle (degrees)
 */
function rotatePoint(
  point: [number, number],
  center: [number, number],
  angleDegrees: number
): [number, number] {
  const angleRad = (angleDegrees * Math.PI) / 180
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)

  const dx = point[0] - center[0]
  const dy = point[1] - center[1]

  return [
    center[0] + dx * cos - dy * sin,
    center[1] + dx * sin + dy * cos,
  ]
}

/**
 * Create panel rectangle corners from center point
 */
function createPanelCorners(
  center: [number, number],
  widthDeg: number,
  heightDeg: number,
  rotation: number
): [number, number][] {
  const halfW = widthDeg / 2
  const halfH = heightDeg / 2

  // Corners before rotation (relative to center)
  const corners: [number, number][] = [
    [center[0] - halfW, center[1] - halfH], // bottom-left
    [center[0] + halfW, center[1] - halfH], // bottom-right
    [center[0] + halfW, center[1] + halfH], // top-right
    [center[0] - halfW, center[1] + halfH], // top-left
  ]

  // Rotate all corners around center
  return corners.map(corner => rotatePoint(corner, center, rotation))
}

/**
 * Check if a panel (polygon) is fully contained within the roof polygon
 */
function isPanelInsideRoof(
  panelCorners: [number, number][],
  roofPolygon: any
): boolean {
  try {
    // Create panel polygon (close the ring)
    const panelPoly = turf.polygon([[...panelCorners, panelCorners[0]]])

    // Check if panel is within roof
    const intersection = turf.intersect(
      turf.featureCollection([panelPoly, roofPolygon])
    )

    if (!intersection) return false

    // Check if intersection area is at least 90% of panel area
    // This allows panels that are mostly within the roof boundary
    const panelArea = turf.area(panelPoly)
    const intersectionArea = turf.area(intersection)

    return intersectionArea >= panelArea * 0.90
  } catch {
    return false
  }
}

/**
 * Triangulate polygon using earcut to understand shape structure
 */
function triangulatePolygon(roofPolygon: any): Array<{
  triangle: [[number, number], [number, number], [number, number]]
  area: number
  centroid: [number, number]
}> {
  const coordinates = roofPolygon.geometry?.coordinates?.[0] || roofPolygon.coordinates?.[0]
  if (!coordinates || coordinates.length < 3) {
    return []
  }

  // Flatten coordinates for earcut (removes last duplicate point)
  const flatCoords: number[] = []
  for (let i = 0; i < coordinates.length - 1; i++) {
    flatCoords.push(coordinates[i][0], coordinates[i][1])
  }

  // Triangulate the polygon
  let triangles: number[] = []
  try {
    triangles = earcut(flatCoords)
    if (!triangles || triangles.length === 0 || triangles.length % 3 !== 0) {
      return [] // Invalid triangulation result
    }
  } catch (error) {
    console.warn('Earcut triangulation failed:', error)
    return [] // Return empty array on error
  }
  const result: Array<{
    triangle: [[number, number], [number, number], [number, number]]
    area: number
    centroid: [number, number]
  }> = []

  // Convert triangle indices to actual coordinates
  for (let i = 0; i < triangles.length; i += 3) {
    const i0 = triangles[i] * 2
    const i1 = triangles[i + 1] * 2
    const i2 = triangles[i + 2] * 2

    const p0: [number, number] = [flatCoords[i0], flatCoords[i0 + 1]]
    const p1: [number, number] = [flatCoords[i1], flatCoords[i1 + 1]]
    const p2: [number, number] = [flatCoords[i2], flatCoords[i2 + 1]]

    const triangle: [[number, number], [number, number], [number, number]] = [p0, p1, p2]
    
    // Calculate triangle area
    const trianglePoly = turf.polygon([[...triangle, triangle[0]]])
    const area = turf.area(trianglePoly)
    
    // Calculate centroid
    const centroid = turf.centroid(trianglePoly)
    const centroidCoords = centroid.geometry.coordinates as [number, number]

    result.push({
      triangle,
      area,
      centroid: centroidCoords,
    })
  }

  // Sort by area (largest first) to prioritize big areas for panel placement
  return result.sort((a, b) => b.area - a.area)
}

/**
 * Analyze polygon shape to determine optimal panel placement strategy
 * Uses triangulation for better shape understanding
 */
function analyzePolygonShape(roofPolygon: any, refLat: number): {
  dominantAngle: number
  isRectangular: boolean
  aspectRatio: number
  optimalRotation: number
  triangles: Array<{ triangle: [[number, number], [number, number], [number, number]], area: number, centroid: [number, number] }>
  largestTriangleArea: number
} {
  const coordinates = roofPolygon.geometry?.coordinates?.[0] || roofPolygon.coordinates?.[0]
  if (!coordinates || coordinates.length < 3) {
    return { 
      dominantAngle: 0, 
      isRectangular: false, 
      aspectRatio: 1, 
      optimalRotation: 0,
      triangles: [],
      largestTriangleArea: 0
    }
  }

  // Triangulate polygon for shape analysis
  const triangles = triangulatePolygon(roofPolygon)
  const largestTriangleArea = triangles.length > 0 ? triangles[0].area : 0

  // Find longest edge to determine dominant orientation
  let maxLength = 0
  let longestEdgeIndex = 0
  const edges: Array<{ length: number; angle: number }> = []

  for (let i = 0; i < coordinates.length - 1; i++) {
    const point1 = turf.point(coordinates[i])
    const point2 = turf.point(coordinates[i + 1])
    const distance = turf.distance(point1, point2, { units: 'meters' })
    const bearing = turf.bearing(coordinates[i], coordinates[i + 1])
    const angle = bearing >= 0 ? bearing : 360 + bearing
    
    edges.push({ length: distance, angle })
    
    if (distance > maxLength) {
      maxLength = distance
      longestEdgeIndex = i
    }
  }

  const dominantAngle = edges[longestEdgeIndex]?.angle || 0

  // Calculate bounding box to determine aspect ratio
  const bbox = turf.bbox(roofPolygon)
  const bboxWidth = turf.distance(
    turf.point([bbox[0], bbox[1]]),
    turf.point([bbox[2], bbox[1]]),
    { units: 'meters' }
  )
  const bboxHeight = turf.distance(
    turf.point([bbox[0], bbox[1]]),
    turf.point([bbox[0], bbox[3]]),
    { units: 'meters' }
  )
  const aspectRatio = bboxWidth / bboxHeight

  // Check if polygon is roughly rectangular (has 4-5 vertices and right angles)
  const vertexCount = coordinates.length - 1
  const isRectangular = vertexCount >= 4 && vertexCount <= 6

  // Optimal rotation: align panels with dominant edge (perpendicular to ridge)
  // For rectangular roofs, align with the longer side
  const optimalRotation = aspectRatio > 1 ? 0 : 90

  return {
    dominantAngle,
    isRectangular,
    aspectRatio,
    optimalRotation,
    triangles,
    largestTriangleArea,
  }
}

/**
 * Try multiple grid offsets to maximize panel count
 * Uses triangulation data to find optimal starting positions
 */
function tryGridOffsets(
  roofPolygon: any,
  panelHorizontalM: number,
  panelVerticalM: number,
  panelWidthDeg: number,
  panelHeightDeg: number,
  refLat: number,
  rotation: number,
  bbox: number[],
  sectionId: string,
  shapeAnalysis?: {
    triangles: Array<{ triangle: [[number, number], [number, number], [number, number]], area: number, centroid: [number, number] }>
    largestTriangleArea: number
  }
): PanelPosition[] {
  const [minLng, minLat, maxLng, maxLat] = bbox
  const padding = Math.min(panelWidthDeg, panelHeightDeg) * 0.1
  
  // Try multiple grid offsets (0%, 25%, 50%, 75% of panel size)
  const offsets = [0, 0.25, 0.5, 0.75]
  let bestPanels: PanelPosition[] = []
  let bestCount = 0

  // If we have triangulation data, also try starting from triangle centroids
  const startPoints: Array<[number, number]> = []
  
  if (shapeAnalysis && shapeAnalysis.triangles.length > 0) {
    // Use centroids of largest triangles as potential starting points
    const largeTriangles = shapeAnalysis.triangles
      .filter(t => t.area > shapeAnalysis.largestTriangleArea * 0.3) // Top 30% largest triangles
      .slice(0, 3) // Use top 3 largest triangles
    
    for (const triangle of largeTriangles) {
      startPoints.push(triangle.centroid)
    }
  }
  
  // Always include bounding box corners as fallback
  startPoints.push([minLng + padding, maxLat - padding]) // Top-left
  startPoints.push([minLng + padding, minLat + padding]) // Bottom-left
  startPoints.push([maxLng - padding, maxLat - padding]) // Top-right

  // Try standard grid offsets
  for (const offsetX of offsets) {
    for (const offsetY of offsets) {
      const panels: PanelPosition[] = []
      const gridStartLng = minLng + padding + (panelWidthDeg * offsetX)
      const gridStartLat = maxLat - padding - (panelHeightDeg * offsetY)
      let panelIndex = 0

      for (let lng = gridStartLng; lng <= maxLng - padding; lng += panelWidthDeg) {
        for (let lat = gridStartLat; lat >= minLat + padding; lat -= panelHeightDeg) {
          const panelCenter: [number, number] = [lng, lat]
          const corners = createPanelCorners(
            panelCenter,
            metersToDegreesLng(panelHorizontalM, refLat),
            metersToDegreesLat(panelVerticalM),
            rotation
          )

          if (isPanelInsideRoof(corners, roofPolygon)) {
            panels.push({
              id: `${sectionId}-panel-${panelIndex}`,
              center: panelCenter,
              corners,
              rotation,
              sectionId,
            })
            panelIndex++
          }
        }
      }

      // Keep the grid offset that produces the most panels
      if (panels.length > bestCount) {
        bestCount = panels.length
        bestPanels = panels
      }
    }
  }

  // Also try grid starting from triangle centroids (if available)
  if (startPoints.length > 0) {
    for (const [startLng, startLat] of startPoints) {
      // Try different offsets from this starting point
      for (const offsetX of [0, 0.5]) {
        for (const offsetY of [0, 0.5]) {
          const panels: PanelPosition[] = []
          const gridStartLng = startLng - (panelWidthDeg * offsetX)
          const gridStartLat = startLat + (panelHeightDeg * offsetY)
          let panelIndex = 0

          // Generate grid in both directions from starting point
          for (let lng = gridStartLng; lng <= maxLng - padding; lng += panelWidthDeg) {
            for (let lat = gridStartLat; lat >= minLat + padding; lat -= panelHeightDeg) {
              const panelCenter: [number, number] = [lng, lat]
              const corners = createPanelCorners(
                panelCenter,
                metersToDegreesLng(panelHorizontalM, refLat),
                metersToDegreesLat(panelVerticalM),
                rotation
              )

              if (isPanelInsideRoof(corners, roofPolygon)) {
                // Check for duplicates
                const isDuplicate = panels.some(p => 
                  Math.abs(p.center[0] - panelCenter[0]) < panelWidthDeg * 0.1 &&
                  Math.abs(p.center[1] - panelCenter[1]) < panelHeightDeg * 0.1
                )
                
                if (!isDuplicate) {
                  panels.push({
                    id: `${sectionId}-panel-${panelIndex}`,
                    center: panelCenter,
                    corners,
                    rotation,
                    sectionId,
                  })
                  panelIndex++
                }
              }
            }
          }

          // Also try going in reverse direction
          for (let lng = gridStartLng; lng >= minLng + padding; lng -= panelWidthDeg) {
            for (let lat = gridStartLat; lat <= maxLat - padding; lat += panelHeightDeg) {
              const panelCenter: [number, number] = [lng, lat]
              const corners = createPanelCorners(
                panelCenter,
                metersToDegreesLng(panelHorizontalM, refLat),
                metersToDegreesLat(panelVerticalM),
                rotation
              )

              if (isPanelInsideRoof(corners, roofPolygon)) {
                const isDuplicate = panels.some(p => 
                  Math.abs(p.center[0] - panelCenter[0]) < panelWidthDeg * 0.1 &&
                  Math.abs(p.center[1] - panelCenter[1]) < panelHeightDeg * 0.1
                )
                
                if (!isDuplicate) {
                  panels.push({
                    id: `${sectionId}-panel-${panelIndex}`,
                    center: panelCenter,
                    corners,
                    rotation,
                    sectionId,
                  })
                  panelIndex++
                }
              }
            }
          }

          if (panels.length > bestCount) {
            bestCount = panels.length
            bestPanels = panels
          }
        }
      }
    }
  }

  return bestPanels
}

/**
 * Calculate panel layout for a single roof section
 * Uses shape-aware algorithm to optimize panel placement
 */
export function calculatePanelLayout(
  roofPolygon: any,
  azimuth: number = 180,
  sectionId: string = 'section-1'
): PanelLayoutResult {
  const panels: PanelPosition[] = []

  try {
    // Get bounding box of the roof polygon
    const bbox = turf.bbox(roofPolygon)
    const [minLng, minLat, maxLng, maxLat] = bbox

    // Get centroid for reference latitude
    const centroid = turf.centroid(roofPolygon)
    const refLat = centroid.geometry.coordinates[1]

    // Panel dimensions: width=1134mm (shorter), height=1961mm (longer)
    // For landscape orientation (typical solar panel mounting):
    // - Horizontal dimension should use the longer edge (height = 1961mm)
    // - Vertical dimension should use the shorter edge (width = 1134mm)
    const panelHorizontalM = PANEL_DIMENSIONS.height // 1961mm - longer dimension horizontal
    const panelVerticalM = PANEL_DIMENSIONS.width    // 1134mm - shorter dimension vertical

    // Convert panel dimensions to degrees
    const panelWidthDeg = metersToDegreesLng(panelHorizontalM + PANEL_SPACING.horizontal, refLat)
    const panelHeightDeg = metersToDegreesLat(panelVerticalM + PANEL_SPACING.vertical)

    // Analyze polygon shape to determine optimal placement strategy
    // Uses triangulation to understand shape structure
    const shapeAnalysis = analyzePolygonShape(roofPolygon, refLat)

    // Calculate rotation angle - keep panels horizontal (landscape) for all orientations
    // This is the standard mounting approach and maximizes panel density
    const rotation = 0

    // Use shape-aware grid placement with multiple offset attempts
    // Pass triangulation data to guide placement from largest areas
    const panelsResult = tryGridOffsets(
      roofPolygon,
      panelHorizontalM,
      panelVerticalM,
      panelWidthDeg,
      panelHeightDeg,
      refLat,
      rotation,
      bbox,
      sectionId,
      shapeAnalysis
    )

    panels.push(...panelsResult)

    // Calculate coverage statistics
    const roofArea = turf.area(roofPolygon)
    const panelArea = panels.length * PANEL_DIMENSIONS.areaSqM
    const coveragePercent = (panelArea / roofArea) * 100

    // Estimate capacity using actual panel wattage from specs
    const estimatedCapacityKw = (panels.length * PANEL_DIMENSIONS.wattage) / 1000

    return {
      panels,
      totalPanels: panels.length,
      coveragePercent: Math.min(coveragePercent, 100),
      estimatedCapacityKw,
    }
  } catch (error) {
    console.error('Error calculating panel layout:', error)
    return {
      panels: [],
      totalPanels: 0,
      coveragePercent: 0,
      estimatedCapacityKw: 0,
    }
  }
}

/**
 * Calculate panel layouts for multiple roof sections
 */
export function calculateMultiSectionPanelLayout(
  roofPolygonData: any,
  roofSections: Array<{
    id: string
    azimuth: number
    area: number
  }>
): PanelLayoutResult {
  const allPanels: PanelPosition[] = []
  let totalCapacity = 0
  let totalRoofArea = 0
  let totalPanelArea = 0

  if (!roofPolygonData?.features) {
    return {
      panels: [],
      totalPanels: 0,
      coveragePercent: 0,
      estimatedCapacityKw: 0,
    }
  }

  roofPolygonData.features.forEach((feature: any, index: number) => {
    if (feature.geometry.type !== 'Polygon') return

    const section = roofSections[index]
    if (!section) return

    const result = calculatePanelLayout(
      feature,
      section.azimuth,
      section.id
    )

    allPanels.push(...result.panels)
    totalCapacity += result.estimatedCapacityKw

    try {
      const sectionArea = turf.area(feature)
      totalRoofArea += sectionArea
      totalPanelArea += result.totalPanels * PANEL_DIMENSIONS.areaSqM
    } catch {
      // Skip area calculation on error
    }
  })

  return {
    panels: allPanels,
    totalPanels: allPanels.length,
    coveragePercent: totalRoofArea > 0 ? (totalPanelArea / totalRoofArea) * 100 : 0,
    estimatedCapacityKw: totalCapacity,
  }
}

/**
 * Convert panel positions to GeoJSON for Mapbox rendering
 */
export function panelsToGeoJSON(panels: PanelPosition[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: panels.map(panel => ({
      type: 'Feature' as const,
      id: panel.id,
      properties: {
        id: panel.id,
        sectionId: panel.sectionId,
        rotation: panel.rotation,
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[...panel.corners, panel.corners[0]]], // Close the ring
      },
    })),
  }
}
