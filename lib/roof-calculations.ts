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
  const point1 = coordinates[longestEdgeIndex]
  const point2 = coordinates[longestEdgeIndex + 1]
  
  // Turf bearing returns -180 to 180
  const bearing = turf.bearing(point1, point2)
  
  // Convert bearing to azimuth (0-360 degrees)
  let azimuth = bearing >= 0 ? bearing : 360 + bearing
  
  // Solar panels face perpendicular to the ridge line
  // Add 90 degrees to get the direction panels actually face
  azimuth = (azimuth + 90) % 360
  
  // Round to nearest 5 degrees for cleaner values
  azimuth = Math.round(azimuth / 5) * 5
  
  return azimuth
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

