'use client'

// Step 2: Draw roof on map with Mapbox integration

import { useState } from 'react'
import { MapboxDrawing } from '../MapboxDrawing'
import { calculateRoofAzimuth, calculateRoofAzimuthWithConfidence, getDirectionLabel, getOrientationEfficiency, ROOF_ORIENTATIONS } from '@/lib/roof-calculations'
import * as turf from '@turf/turf'
import { DrawingTips } from './components/DrawingTips'
import { RoofAreaDisplay } from './components/RoofAreaDisplay'
import { SectionBreakdown } from './sections/SectionBreakdown'
import { useRoofAreaCalculation } from './hooks/useRoofAreaCalculation'
import type { StepDrawRoofProps } from './types'

const PANEL_AREA_SQFT = 23.9 // TS-BGT54(500)-G11: 1961 x 1134 mm

export function StepDrawRoof({ data, onComplete, onBack }: StepDrawRoofProps) {
  const [roofArea, setRoofArea] = useState<number | null>(data.roofAreaSqft || null)
  const [roofPolygon, setRoofPolygon] = useState<any>(data.roofPolygon || null)
  const [mapSnapshot, setMapSnapshot] = useState<string | null>(data.mapSnapshot || null)
  const [estimatedPanels, setEstimatedPanels] = useState<number | null>(
    data.roofAreaSqft ? Math.floor(data.roofAreaSqft / PANEL_AREA_SQFT) : null
  )
  
  // Individual roof sections breakdown (includes orientation per section)
  const [roofSections, setRoofSections] = useState<Array<{
    id: string, 
    area: number, 
    panels: number, 
    azimuth: number, 
    direction: string,
    efficiency: number,
    confidence?: number,
    confidenceReason?: string
  }>>([])
  
  // Roof orientation detection (uses largest section)
  const [detectedAzimuth, setDetectedAzimuth] = useState<number | null>(data.roofAzimuth || null)
  const [selectedAzimuth, setSelectedAzimuth] = useState<number>(data.roofAzimuth || 180)
  
  // Per-section orientation editing
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null)

  // Handle area calculation from map drawing (supports multiple polygons)
  const handleAreaCalculated = (areaSqFt: number, polygonData: any, snapshot?: string) => {
    // If no area (all polygons deleted), clear everything
    if (areaSqFt === 0 || !polygonData.features || polygonData.features.length === 0) {
      setRoofArea(null)
      setRoofPolygon(null)
      setMapSnapshot(null)
      setEstimatedPanels(null)
      setRoofSections([])
      setDetectedAzimuth(null)
      setSelectedAzimuth(180)
      return
    }
    
    setRoofArea(areaSqFt)
    setRoofPolygon(polygonData)
    if (snapshot) {
      setMapSnapshot(snapshot)
    }
    setEstimatedPanels(Math.floor(areaSqFt / PANEL_AREA_SQFT))
    
    // Calculate individual section areas and orientations
    if (polygonData.features && polygonData.features.length > 0) {
      let largestPolygon = polygonData.features[0]
      let maxArea = 0
      
      const sections = polygonData.features.map((feature: any, index: number) => {
        if (feature.geometry.type === 'Polygon') {
          const areaMeters = turf.area(feature)
          const areaSqFt = Math.round(areaMeters * 10.764)
          const panels = Math.floor(areaSqFt / PANEL_AREA_SQFT)
          
          // Calculate orientation with confidence for this specific section
          const orientationData = calculateRoofAzimuthWithConfidence(feature)
          const direction = getDirectionLabel(orientationData.azimuth)
          const efficiency = getOrientationEfficiency(orientationData.azimuth)
          
          // Track largest polygon for overall orientation
          if (areaMeters > maxArea) {
            maxArea = areaMeters
            largestPolygon = feature
          }
          
          return {
            id: feature.id || `section-${index + 1}`,
            area: areaSqFt,
            panels: panels,
            azimuth: orientationData.azimuth,
            direction: direction,
            efficiency: efficiency,
            confidence: orientationData.confidence,
            confidenceReason: orientationData.reason
          }
        }
        return null
      }).filter(Boolean)
      
      setRoofSections(sections as any)
      
      // Use largest section's orientation as the overall detected orientation
      const overallAzimuth = calculateRoofAzimuth(largestPolygon)
      setDetectedAzimuth(overallAzimuth)
      setSelectedAzimuth(overallAzimuth)
    } else {
      setRoofSections([])
    }
  }

  // Update orientation for a specific section
  const updateSectionOrientation = (sectionIndex: number, newAzimuth: number) => {
    const updatedSections = [...roofSections]
    updatedSections[sectionIndex] = {
      ...updatedSections[sectionIndex],
      azimuth: newAzimuth,
      direction: getDirectionLabel(newAzimuth),
      efficiency: getOrientationEfficiency(newAzimuth)
    }
    setRoofSections(updatedSections)

    // If the edited section is the largest one, also update the overall selectedAzimuth
    const largestIndex = updatedSections.reduce((maxIdx, s, idx, arr) => {
      return s.area > arr[maxIdx].area ? idx : maxIdx
    }, 0)

    if (sectionIndex === largestIndex) {
      setSelectedAzimuth(newAzimuth)
    }
    setEditingSectionIndex(null)
  }

  // Continue to next step
  const handleContinue = () => {
    if (roofArea && roofPolygon) {
      onComplete({
        roofAreaSqft: roofArea,
        roofPolygon: roofPolygon,
        mapSnapshot: mapSnapshot,
        roofAzimuth: selectedAzimuth, // Overall azimuth (for single section or largest section)
        roofSections: roofSections // Include per-section orientation data
      })
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr] lg:gap-6 px-3 sm:px-0" style={{ minHeight: 'calc(100vh - 180px)' }}>
      {/* Left sidebar - Instructions and measurements */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto lg:order-1 order-2" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy-500 mb-1 sm:mb-2">
            Draw Your Roof
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Click on the map to outline your roof's perimeter
          </p>
        </div>

        {/* Drawing Tips - Collapsible */}
        <DrawingTips />

        {/* Live measurements */}
        {roofArea && (
          <div className="space-y-4">
            <RoofAreaDisplay
              roofArea={roofArea}
              estimatedPanels={estimatedPanels}
              roofPolygon={roofPolygon}
            />

            {/* Individual section breakdown */}
            {roofSections.length >= 1 && (
              <SectionBreakdown
                roofSections={roofSections}
                roofArea={roofArea}
                estimatedPanels={estimatedPanels}
                editingSectionIndex={editingSectionIndex}
                setEditingSectionIndex={setEditingSectionIndex}
                updateSectionOrientation={updateSectionOrientation}
              />
            )}

            {/* Validation message */}
            {roofArea >= 200 && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                <span className="font-semibold">Great!</span> Your roof is perfectly sized for solar
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3 pt-4 pb-20 lg:pb-0">
          <button
            onClick={handleContinue}
            disabled={!roofArea || !roofPolygon}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
          
          {onBack && (
            <button
              onClick={onBack}
              className="btn-outline border-gray-300 text-gray-700 w-full"
            >
              Back
            </button>
          )}
        </div>
      </div>

      {/* Right side - Mapbox drawing interface */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden relative lg:order-2 order-1" style={{ height: 'calc(60vh)', minHeight: '360px' }}>
        {data.coordinates ? (
          <MapboxDrawing
            coordinates={data.coordinates}
            address={data.address || 'Your location'}
            onAreaCalculated={handleAreaCalculated}
            initialData={roofPolygon}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <p className="text-gray-500">No coordinates available</p>
          </div>
        )}
      </div>
    </div>
  )
}

