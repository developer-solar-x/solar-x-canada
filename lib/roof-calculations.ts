// Roof calculation utilities for azimuth detection and analysis

import * as turf from '@turf/turf'

/**
 * Calculate roof azimuth (orientation) from polygon coordinates
 * Azimuth is measured in degrees clockwise from north (0-360)
 * 0/360 = North, 90 = East, 180 = South, 270 = West
 */
export function calculateRoofAzimuth(polygon: any): number {
  // Extract coordinates from the polygon
  // Handle both GeoJSON Feature and direct coordinates
  const coordinates = polygon.geometry?.coordinates?.[0] || polygon.coordinates?.[0]
  
  // If we don't have valid coordinates, default to south-facing
  if (!coordinates || coordinates.length < 3) {
    return 180 // Default to south
  }

  // Find the longest edge of the polygon
  // This is typically the ridge line or dominant roof edge
  let maxLength = 0
  let longestEdgeIndex = 0

  for (let i = 0; i < coordinates.length - 1; i++) {
    const point1 = turf.point(coordinates[i])
    const point2 = turf.point(coordinates[i + 1])
    const distance = turf.distance(point1, point2, { units: 'meters' })
    
    if (distance > maxLength) {
      maxLength = distance
      longestEdgeIndex = i
    }
  }

  // Calculate the bearing (direction) of the longest edge
  const edgeStart = coordinates[longestEdgeIndex]
  const edgeEnd = coordinates[longestEdgeIndex + 1]
  
  // Turf bearing returns -180 to 180
  const bearing = turf.bearing(edgeStart, edgeEnd)
  
  // Convert bearing to azimuth (0-360 degrees)
  let edgeAzimuth = bearing >= 0 ? bearing : 360 + bearing
  
  // Solar panels face perpendicular to the ridge line
  // There are two perpendicular directions: +90° and -90° (or +270°)
  const perpendicular1 = (edgeAzimuth + 90) % 360
  const perpendicular2 = (edgeAzimuth + 270) % 360
  
  // NEW APPROACH: Use polygon centroid to determine correct orientation
  // The roof faces AWAY from the centroid (outward normal)
  // Calculate polygon centroid
  const polygonFeature = polygon.geometry ? polygon : turf.polygon(coordinates)
  const centroid = turf.centroid(polygonFeature)
  const centroidCoords = centroid.geometry.coordinates
  
  // Calculate midpoint of the longest edge
  const midpoint = [
    (edgeStart[0] + edgeEnd[0]) / 2,
    (edgeStart[1] + edgeEnd[1]) / 2
  ]
  
  // Calculate bearing from centroid to midpoint (outward direction)
  const outwardBearing = turf.bearing(centroidCoords, midpoint)
  const outwardAzimuth = outwardBearing >= 0 ? outwardBearing : 360 + outwardBearing
  
  // Choose the perpendicular that's closer to the outward direction
  // This represents the direction the roof slope faces
  const diff1 = calculateAngularDifference(perpendicular1, outwardAzimuth)
  const diff2 = calculateAngularDifference(perpendicular2, outwardAzimuth)
  
  // Choose the perpendicular closer to the outward direction
  let roofAzimuth = diff1 < diff2 ? perpendicular1 : perpendicular2
  
  // Round to nearest 5 degrees for cleaner values
  roofAzimuth = Math.round(roofAzimuth / 5) * 5
  
  return roofAzimuth
}

/**
 * Helper function to calculate the angular difference between two azimuths
 * Returns the smallest angle between them (0-180 degrees)
 */
function calculateAngularDifference(azimuth1: number, azimuth2: number): number {
  // Normalize both azimuths to 0-360 range
  const norm1 = ((azimuth1 % 360) + 360) % 360
  const norm2 = ((azimuth2 % 360) + 360) % 360
  
  // Calculate absolute difference
  let diff = Math.abs(norm1 - norm2)
  
  // Handle wrap-around (e.g., 350° and 10° are only 20° apart, not 340°)
  if (diff > 180) {
    diff = 360 - diff
  }
  
  return diff
}

/**
 * Calculate roof azimuth with confidence score
 * Returns both the azimuth and a confidence level (0-100%)
 */
export function calculateRoofAzimuthWithConfidence(polygon: any): {
  azimuth: number
  confidence: number
  reason: string
} {
  // Extract coordinates from the polygon
  const coordinates = polygon.geometry?.coordinates?.[0] || polygon.coordinates?.[0]
  
  // Low confidence if invalid data
  if (!coordinates || coordinates.length < 3) {
    return {
      azimuth: 180,
      confidence: 0,
      reason: 'Invalid polygon data'
    }
  }

  // Find the longest and second-longest edges
  let maxLength = 0
  let secondMaxLength = 0
  let longestEdgeIndex = 0

  for (let i = 0; i < coordinates.length - 1; i++) {
    const point1 = turf.point(coordinates[i])
    const point2 = turf.point(coordinates[i + 1])
    const distance = turf.distance(point1, point2, { units: 'meters' })
    
    if (distance > maxLength) {
      secondMaxLength = maxLength
      maxLength = distance
      longestEdgeIndex = i
    } else if (distance > secondMaxLength) {
      secondMaxLength = distance
    }
  }

  // Calculate dominant edge ratio (how much longer is the longest edge)
  const edgeDominanceRatio = secondMaxLength > 0 ? maxLength / secondMaxLength : 1
  
  // Calculate the azimuth using the standard method
  const azimuth = calculateRoofAzimuth(polygon)
  
  // Calculate confidence based on multiple factors
  let confidence = 100
  let reason = 'High confidence detection'
  
  // Factor 1: Polygon complexity (simple shapes are more reliable)
  const vertexCount = coordinates.length - 1
  if (vertexCount > 8) {
    confidence -= 15
    reason = 'Complex roof shape may affect accuracy'
  } else if (vertexCount > 6) {
    confidence -= 10
  }
  
  // Factor 2: Edge dominance (clear longest edge is more reliable)
  if (edgeDominanceRatio < 1.2) {
    confidence -= 20
    reason = 'No clearly dominant edge - orientation uncertain'
  } else if (edgeDominanceRatio < 1.5) {
    confidence -= 10
    reason = 'Multiple similar-length edges detected'
  }
  
  // Factor 3: Roof shape regularity (check if it's roughly rectangular)
  const polygonFeature = polygon.geometry ? polygon : turf.polygon(coordinates)
  const area = turf.area(polygonFeature)
  const bbox = turf.bbox(polygonFeature)
  const bboxArea = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]) * 111320 * 111320 // Convert to square meters approx
  const areaRatio = area / bboxArea
  
  if (areaRatio < 0.5) {
    confidence -= 15
    reason = 'Irregular shape detected'
  } else if (areaRatio < 0.7) {
    confidence -= 8
  }
  
  // Ensure confidence stays in valid range
  confidence = Math.max(0, Math.min(100, confidence))
  
  return {
    azimuth,
    confidence,
    reason
  }
}

/**
 * Convert azimuth (degrees) to a human-readable direction label
 */
export function getDirectionLabel(azimuth: number): string {
  // Normalize azimuth to 0-360 range
  const normalizedAzimuth = ((azimuth % 360) + 360) % 360
  
  // Define direction ranges
  if (normalizedAzimuth >= 337.5 || normalizedAzimuth < 22.5) return 'North'
  if (normalizedAzimuth >= 22.5 && normalizedAzimuth < 67.5) return 'Northeast'
  if (normalizedAzimuth >= 67.5 && normalizedAzimuth < 112.5) return 'East'
  if (normalizedAzimuth >= 112.5 && normalizedAzimuth < 157.5) return 'Southeast'
  if (normalizedAzimuth >= 157.5 && normalizedAzimuth < 202.5) return 'South'
  if (normalizedAzimuth >= 202.5 && normalizedAzimuth < 247.5) return 'Southwest'
  if (normalizedAzimuth >= 247.5 && normalizedAzimuth < 292.5) return 'West'
  if (normalizedAzimuth >= 292.5 && normalizedAzimuth < 337.5) return 'Northwest'
  
  return 'South' // Default fallback
}

/**
 * Get production efficiency percentage compared to optimal south-facing
 * Based on typical solar production data for Canada
 */
export function getOrientationEfficiency(azimuth: number): number {
  // Normalize azimuth to 0-360 range
  const normalizedAzimuth = ((azimuth % 360) + 360) % 360
  
  // Calculate efficiency based on direction
  // South (180°) is 100% efficient
  // Efficiency drops as we move away from south
  
  if (normalizedAzimuth >= 157.5 && normalizedAzimuth <= 202.5) {
    // South: 100% efficient
    return 100
  } else if (normalizedAzimuth >= 135 && normalizedAzimuth < 157.5) {
    // Southeast: 95-98% efficient
    return 96
  } else if (normalizedAzimuth > 202.5 && normalizedAzimuth <= 225) {
    // Southwest: 95-98% efficient
    return 96
  } else if (normalizedAzimuth >= 112.5 && normalizedAzimuth < 135) {
    // ESE: 90-95% efficient
    return 92
  } else if (normalizedAzimuth > 225 && normalizedAzimuth <= 247.5) {
    // WSW: 90-95% efficient
    return 92
  } else if (normalizedAzimuth >= 67.5 && normalizedAzimuth < 112.5) {
    // East: 80-85% efficient
    return 82
  } else if (normalizedAzimuth > 247.5 && normalizedAzimuth <= 292.5) {
    // West: 80-85% efficient
    return 82
  } else if (normalizedAzimuth >= 22.5 && normalizedAzimuth < 67.5) {
    // Northeast: 70-75% efficient
    return 72
  } else if (normalizedAzimuth > 292.5 && normalizedAzimuth < 337.5) {
    // Northwest: 70-75% efficient
    return 72
  } else {
    // North: 50-60% efficient (poor)
    return 55
  }
}

/**
 * Get orientation quality rating
 */
export function getOrientationQuality(azimuth: number): {
  label: string
  color: string
  icon: string
} {
  const efficiency = getOrientationEfficiency(azimuth)
  
  if (efficiency >= 95) {
    return { label: 'Excellent', color: 'green', icon: '🌟' }
  } else if (efficiency >= 85) {
    return { label: 'Good', color: 'blue', icon: '✓' }
  } else if (efficiency >= 70) {
    return { label: 'Fair', color: 'yellow', icon: '⚠️' }
  } else {
    return { label: 'Poor', color: 'red', icon: '❌' }
  }
}

/**
 * Predefined roof orientations for manual selection
 */
export const ROOF_ORIENTATIONS = [
  { value: 'south', label: 'South', azimuth: 180, icon: '⬇️', efficiency: 100 },
  { value: 'southeast', label: 'Southeast', azimuth: 135, icon: '↙️', efficiency: 96 },
  { value: 'southwest', label: 'Southwest', azimuth: 225, icon: '↘️', efficiency: 96 },
  { value: 'east', label: 'East', azimuth: 90, icon: '⬅️', efficiency: 82 },
  { value: 'west', label: 'West', azimuth: 270, icon: '➡️', efficiency: 82 },
  { value: 'northeast', label: 'Northeast', azimuth: 45, icon: '↖️', efficiency: 72 },
  { value: 'northwest', label: 'Northwest', azimuth: 315, icon: '↗️', efficiency: 72 },
  { value: 'north', label: 'North', azimuth: 0, icon: '⬆️', efficiency: 55 },
] as const

