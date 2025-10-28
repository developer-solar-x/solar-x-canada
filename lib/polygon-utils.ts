// Polygon and angle utilities for roof data analysis

/**
 * Extract angle information from stored polygon data
 * The polygon data includes calculated angles for each vertex
 */
export function extractPolygonAngles(roofPolygon: any): {
  sectionIndex: number
  vertexAngles: number[]
  color: string
  vertexCount: number
  avgAngle: number
  hasRightAngles: boolean
}[] {
  if (!roofPolygon || !roofPolygon.features) {
    return []
  }

  return roofPolygon.features.map((feature: any, index: number) => {
    const angles = feature.properties?.vertexAngles || []
    const color = feature.properties?.color || '#DC143C'
    
    // Calculate average angle
    const avgAngle = angles.length > 0 
      ? Math.round(angles.reduce((sum: number, a: number) => sum + a, 0) / angles.length)
      : 0
    
    // Check if has right angles (90° ± 5°)
    const hasRightAngles = angles.some((angle: number) => 
      Math.abs(angle - 90) <= 5
    )
    
    return {
      sectionIndex: index + 1,
      vertexAngles: angles,
      color,
      vertexCount: angles.length,
      avgAngle,
      hasRightAngles
    }
  })
}

/**
 * Format angle data for display
 */
export function formatAngleData(roofPolygon: any): string {
  const sections = extractPolygonAngles(roofPolygon)
  
  if (sections.length === 0) {
    return 'No angle data available'
  }
  
  return sections.map(section => {
    const angleList = section.vertexAngles.map(a => `${a}°`).join(', ')
    return `Section ${section.sectionIndex}: [${angleList}] (avg: ${section.avgAngle}°)`
  }).join('\n')
}

/**
 * Validate roof polygon data quality
 */
export function validateRoofPolygon(roofPolygon: any): {
  isValid: boolean
  warnings: string[]
  issues: string[]
} {
  const warnings: string[] = []
  const issues: string[] = []
  
  if (!roofPolygon || !roofPolygon.features || roofPolygon.features.length === 0) {
    issues.push('No polygon data found')
    return { isValid: false, warnings, issues }
  }
  
  const sections = extractPolygonAngles(roofPolygon)
  
  sections.forEach(section => {
    // Check for too few vertices
    if (section.vertexCount < 3) {
      issues.push(`Section ${section.sectionIndex}: Too few vertices (${section.vertexCount})`)
    }
    
    // Check for suspiciously sharp angles
    const sharpAngles = section.vertexAngles.filter(a => a < 30)
    if (sharpAngles.length > 0) {
      warnings.push(`Section ${section.sectionIndex}: Has ${sharpAngles.length} very sharp angle(s) (< 30°)`)
    }
    
    // Check for very obtuse angles
    const obtuseAngles = section.vertexAngles.filter(a => a > 150)
    if (obtuseAngles.length > 0) {
      warnings.push(`Section ${section.sectionIndex}: Has ${obtuseAngles.length} very obtuse angle(s) (> 150°)`)
    }
    
    // Check for irregular polygon (non-standard roof shape)
    const angleVariance = calculateVariance(section.vertexAngles)
    if (angleVariance > 500) {
      warnings.push(`Section ${section.sectionIndex}: Highly irregular shape (high angle variance)`)
    }
  })
  
  return {
    isValid: issues.length === 0,
    warnings,
    issues
  }
}

/**
 * Calculate variance of angles
 */
function calculateVariance(angles: number[]): number {
  if (angles.length === 0) return 0
  
  const mean = angles.reduce((sum, a) => sum + a, 0) / angles.length
  const squaredDiffs = angles.map(a => Math.pow(a - mean, 2))
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / angles.length
  
  return variance
}

/**
 * Check if polygon represents a simple rectangular roof
 */
export function isRectangularRoof(roofPolygon: any): boolean {
  const sections = extractPolygonAngles(roofPolygon)
  
  if (sections.length !== 1) return false
  
  const section = sections[0]
  
  // Should have 4 vertices
  if (section.vertexCount !== 4) return false
  
  // All angles should be close to 90°
  const allRightAngles = section.vertexAngles.every(angle => 
    Math.abs(angle - 90) <= 10
  )
  
  return allRightAngles
}

/**
 * Get summary statistics for roof polygon
 */
export function getRoofPolygonStats(roofPolygon: any): {
  totalSections: number
  totalVertices: number
  avgAnglesPerSection: number
  hasMultipleSections: boolean
  isRegularShape: boolean
  complexity: 'simple' | 'moderate' | 'complex'
} {
  const sections = extractPolygonAngles(roofPolygon)
  
  const totalVertices = sections.reduce((sum, s) => sum + s.vertexCount, 0)
  const avgAnglesPerSection = sections.length > 0 
    ? Math.round(totalVertices / sections.length)
    : 0
  
  // Determine complexity
  let complexity: 'simple' | 'moderate' | 'complex' = 'simple'
  if (sections.length > 2 || totalVertices > 12) {
    complexity = 'complex'
  } else if (sections.length > 1 || totalVertices > 6) {
    complexity = 'moderate'
  }
  
  return {
    totalSections: sections.length,
    totalVertices,
    avgAnglesPerSection,
    hasMultipleSections: sections.length > 1,
    isRegularShape: isRectangularRoof(roofPolygon),
    complexity
  }
}

