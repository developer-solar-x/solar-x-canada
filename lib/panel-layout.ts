/**
 * Panel Layout Calculation Utilities
 *
 * This module serves as the primary interface for panel layout calculations.
 * It uses the commercial-grade panel-layout-engine internally while maintaining
 * backward compatibility with existing code.
 * 
 * @see panel-layout-engine.ts for the core implementation
 */

import * as turf from '@turf/turf'
import { PANEL_SPECS } from '@/config/panel-specs'
import {
  calculatePanelLayout as calculatePanelLayoutEngine,
  calculateMultiSectionPanelLayout as calculateMultiSectionLayoutEngine,
  type LayoutResult,
  type PanelPosition as EnginePanelPosition,
  type LayoutStyle,
} from './panel-layout-engine'

// Re-export LayoutStyle for use in components
export type { LayoutStyle }

// ============================================================================
// PANEL DIMENSIONS (for backward compatibility)
// ============================================================================

export const PANEL_DIMENSIONS = {
  width: PANEL_SPECS.dimensions.width / 1000,  // Convert mm to meters (1.134m)
  height: PANEL_SPECS.dimensions.length / 1000, // Convert mm to meters (1.961m)
  areaSqFt: PANEL_SPECS.dimensions.areaSqFt,    // 23.9 sq ft
  areaSqM: (PANEL_SPECS.dimensions.width / 1000) * (PANEL_SPECS.dimensions.length / 1000),
  wattage: PANEL_SPECS.electrical.peakPower,    // 500W
}

// Spacing between panels (for backward compatibility)
export const PANEL_SPACING = {
  horizontal: 0.025, // 2.5cm gap between panels horizontally
  vertical: 0.025,   // 2.5cm gap between panels vertically
}

// ============================================================================
// LAYOUT STYLE OPTIONS
// ============================================================================

export const LAYOUT_STYLES: Array<{
  value: LayoutStyle
  label: string
  description: string
  icon: string
}> = [
  { 
    value: 'auto', 
    label: 'Auto', 
    description: 'Maximize panel count automatically',
    icon: '✨'
  },
  { 
    value: 'landscape', 
    label: 'Landscape', 
    description: 'Horizontal panel orientation',
    icon: '▬'
  },
  { 
    value: 'portrait', 
    label: 'Portrait', 
    description: 'Vertical panel orientation',
    icon: '▮'
  },
  { 
    value: 'brick', 
    label: 'Brick', 
    description: 'Staggered rows pattern',
    icon: '🧱'
  },
  { 
    value: 'aligned', 
    label: 'Grid', 
    description: 'Strictly aligned rows',
    icon: '▦'
  },
]

// ============================================================================
// TYPES (for backward compatibility)
// ============================================================================

export interface PanelPosition {
  id: string
  center: [number, number] // [lng, lat]
  corners: [number, number][] // 4 corners of the panel
  rotation: number // degrees from north (0 = north, 90 = east)
  sectionId: string
  row?: number
  column?: number
  orientation?: 'landscape' | 'portrait'
}

export interface PanelLayoutResult {
  panels: PanelPosition[]
  totalPanels: number
  coveragePercent: number
  estimatedCapacityKw: number
  roofRotation?: number
  usableArea?: number
  totalRoofArea?: number
  layoutMethod?: 'mobb' | 'edge-aligned' | 'grid'
  layoutStyle?: LayoutStyle
  panelOrientation?: 'landscape' | 'portrait'
}

export interface PanelLayoutOptions {
  layoutStyle?: LayoutStyle
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Calculate optimal panel layout for a single roof section
 * Uses the commercial-grade MOBB algorithm for accurate panel alignment
 * 
 * @param roofPolygon - GeoJSON polygon or feature representing the roof section
 * @param azimuth - Roof azimuth in degrees (used for reference, actual rotation is auto-detected)
 * @param sectionId - Unique identifier for this roof section
 * @param options - Optional layout configuration including layout style
 * @returns Panel layout result with positions and statistics
 */
export function calculatePanelLayout(
  roofPolygon: any,
  azimuth: number = 180,
  sectionId: string = 'section-1',
  options?: PanelLayoutOptions
): PanelLayoutResult {
  try {
    // Use the new commercial-grade engine
    const result = calculatePanelLayoutEngine(roofPolygon, azimuth, sectionId, {
      layoutStyle: options?.layoutStyle,
    })
    
    // Convert to backward-compatible format
    return {
      panels: result.panels as PanelPosition[],
      totalPanels: result.totalPanels,
      coveragePercent: result.coveragePercent,
      estimatedCapacityKw: result.estimatedCapacityKw,
      roofRotation: result.roofRotation,
      usableArea: result.usableArea,
      totalRoofArea: result.totalRoofArea,
      layoutMethod: result.layoutMethod,
      layoutStyle: result.layoutStyle,
      panelOrientation: result.panelOrientation,
    }
  } catch (error) {
    console.error('Panel layout calculation failed:', error)
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
 * 
 * @param roofPolygonData - GeoJSON FeatureCollection containing roof polygons
 * @param roofSections - Array of roof section metadata
 * @param options - Optional layout configuration including layout style
 * @returns Combined panel layout result for all sections
 */
export function calculateMultiSectionPanelLayout(
  roofPolygonData: any,
  roofSections: Array<{
    id: string
    azimuth: number
    area: number
  }>,
  options?: PanelLayoutOptions
): PanelLayoutResult {
  try {
    // Use the new commercial-grade engine
    const result = calculateMultiSectionLayoutEngine(roofPolygonData, roofSections, {
      layoutStyle: options?.layoutStyle,
    })
    
    // Convert to backward-compatible format
    return {
      panels: result.panels as PanelPosition[],
      totalPanels: result.totalPanels,
      coveragePercent: result.coveragePercent,
      estimatedCapacityKw: result.estimatedCapacityKw,
      roofRotation: result.roofRotation,
      usableArea: result.usableArea,
      totalRoofArea: result.totalRoofArea,
      layoutMethod: result.layoutMethod,
      layoutStyle: result.layoutStyle,
      panelOrientation: result.panelOrientation,
    }
  } catch (error) {
    console.error('Multi-section panel layout calculation failed:', error)
    return {
      panels: [],
      totalPanels: 0,
      coveragePercent: 0,
      estimatedCapacityKw: 0,
    }
  }
}

/**
 * Convert panel positions to GeoJSON for Mapbox rendering
 * 
 * @param panels - Array of panel positions
 * @returns GeoJSON FeatureCollection of panel polygons
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
        row: panel.row,
        column: panel.column,
        orientation: panel.orientation,
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[...panel.corners, panel.corners[0]]], // Close the ring
      },
    })),
  }
}

// ============================================================================
// UTILITY FUNCTIONS (for backward compatibility and external use)
// ============================================================================

/**
 * Convert meters to degrees at a given latitude
 */
export function metersToDegreesLat(meters: number): number {
  return meters / 111320
}

/**
 * Convert meters to degrees longitude at a given latitude
 */
export function metersToDegreesLng(meters: number, latitude: number): number {
  return meters / (111320 * Math.cos((latitude * Math.PI) / 180))
}

/**
 * Rotate a point around a center by given angle (degrees)
 */
export function rotatePoint(
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
export function createPanelCorners(
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
 * Check if a panel is fully contained within a roof polygon
 */
export function isPanelInsideRoof(
  panelCorners: [number, number][],
  roofPolygon: any
): boolean {
  try {
    // Create panel polygon (close the ring)
    const panelPoly = turf.polygon([[...panelCorners, panelCorners[0]]])

    // Check intersection
    const intersection = turf.intersect(
      turf.featureCollection([panelPoly, roofPolygon])
    )

    if (!intersection) return false

    // Allow panels that are at least 90% inside
    const panelArea = turf.area(panelPoly)
    const intersectionArea = turf.area(intersection)

    return intersectionArea >= panelArea * 0.90
  } catch {
    return false
  }
}
