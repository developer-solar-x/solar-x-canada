'use client'

// Step 2: Draw roof on map with Mapbox integration

import { useState } from 'react'
import { Ruler, ChevronDown, ChevronUp, Info, Edit2, AlertTriangle, CheckCircle, Activity } from 'lucide-react'
import { MapboxDrawing } from './MapboxDrawing'
import { calculateRoofAzimuth, calculateRoofAzimuthWithConfidence, getDirectionLabel, getOrientationEfficiency, getOrientationQuality, ROOF_ORIENTATIONS } from '@/lib/roof-calculations'
import * as turf from '@turf/turf'

interface StepDrawRoofProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
}

export function StepDrawRoof({ data, onComplete, onBack }: StepDrawRoofProps) {
  const [roofArea, setRoofArea] = useState<number | null>(data.roofAreaSqft || null)
  const [roofPolygon, setRoofPolygon] = useState<any>(data.roofPolygon || null)
  const [mapSnapshot, setMapSnapshot] = useState<string | null>(data.mapSnapshot || null)
  const [estimatedPanels, setEstimatedPanels] = useState<number | null>(
    data.roofAreaSqft ? Math.floor(data.roofAreaSqft / 17.5) : null
  )
  const [showTips, setShowTips] = useState(false)
  
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
  const [showOrientationSelector, setShowOrientationSelector] = useState(false)
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
    // Calculate panel count using actual panel dimensions
    const PANEL_AREA_SQFT = 23.9 // TS-BGT54(500)-G11: 1961 x 1134 mm
    setEstimatedPanels(Math.floor(areaSqFt / PANEL_AREA_SQFT))
    
    // Calculate individual section areas and orientations
    if (polygonData.features && polygonData.features.length > 0) {
      let largestPolygon = polygonData.features[0]
      let maxArea = 0
      
      // Calculate area, panels, and orientation for each section
      const PANEL_AREA_SQFT = 23.9 // TS-BGT54(500)-G11: 1961 x 1134 mm
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
    // so the value sent to the API (roofAzimuth) reflects the user's correction.
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

        {/* Drawing Tips - Collapsible (includes edit tips) */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setShowTips(!showTips)}
                    className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                  >
                    <h3 className="font-semibold text-navy-500">
                      Drawing & Edit Tips
                    </h3>
            {showTips ? (
              <ChevronUp size={20} className="text-navy-500" />
            ) : (
              <ChevronDown size={20} className="text-navy-500" />
            )}
          </button>
          
          {showTips && (
            <div className="px-4 pb-4">
                      <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                        <li>Click the <strong>polygon</strong> icon (top-left) to start drawing</li>
                        <li>Place points around roof edges; <strong>double‑click</strong> to finish</li>
                        <li>To edit: click the shape (red outline), drag corners; drag mid‑edge to add a corner</li>
                        <li>Press <strong>Backspace/Delete</strong> to remove the selected corner</li>
                        <li>Use the <strong>trash</strong> icon to delete a whole section</li>
                        <li>You can draw <strong>multiple polygons</strong> for different roof sections</li>
                      </ol>
            </div>
          )}
        </div>

        {/* Live measurements */}
        {roofArea && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-red-50 to-white p-4 rounded-lg border border-red-200">
              <div className="flex items-center gap-3 mb-2">
                <Ruler className="text-red-500" size={24} />
                <span className="text-sm font-medium text-gray-600">Roof Area</span>
              </div>
              <div className="text-3xl font-bold text-red-500">
                {roofArea.toLocaleString()} sq ft
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-gray-600 mb-2">
                Estimated Panel Capacity
              </div>
              <div className="text-2xl font-bold text-blue-500">
                ~{estimatedPanels} panels
              </div>
              {roofPolygon?.features?.length > 1 && (
                <div className="text-xs text-blue-600 mt-1">
                  {roofPolygon.features.length} roof sections
                </div>
              )}
            </div>

            {/* Individual section breakdown */}
            {roofSections.length >= 1 && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Ruler size={16} className="text-gray-500" />
                  Section Breakdown
                </div>
                <div className="space-y-3">
                  {roofSections.map((section, index) => {
                    // Determine color based on efficiency
                    const isExcellent = section.efficiency >= 95
                    const isGood = section.efficiency >= 85
                    const isFair = section.efficiency >= 70
                    const isPoor = section.efficiency < 70
                    
                    const qualityColor = isExcellent
                      ? 'text-green-700 bg-green-50 border-green-300' 
                      : isGood
                      ? 'text-blue-700 bg-blue-50 border-blue-300'
                      : isFair
                      ? 'text-yellow-700 bg-yellow-50 border-yellow-300'
                      : 'text-red-700 bg-red-50 border-red-300'
                    
                    const iconColor = isExcellent ? 'text-green-600' : isGood ? 'text-blue-600' : isFair ? 'text-yellow-600' : 'text-red-600'
                    
                    return (
                      <div key={section.id}>
                        {/* Section card */}
                        <div className={`rounded-lg border-2 overflow-hidden ${
                          editingSectionIndex === index ? 'border-blue-400 shadow-md' : 'border-gray-200'
                        }`}>
                          <div className="bg-gray-50 py-2 px-3 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                                {index + 1}
                              </div>
                              <span className="text-sm font-bold text-gray-800">Section {index + 1}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-navy-500">
                                {section.area.toLocaleString()} sq ft
                              </div>
                              <div className="text-xs text-gray-600">
                                ~{section.panels} panels
                              </div>
                            </div>
                          </div>
                          
                          {/* Orientation display */}
                          <div className="bg-white p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                  {isExcellent || isGood ? (
                                    <CheckCircle size={16} className={iconColor} />
                                  ) : (
                                    <AlertTriangle size={16} className={iconColor} />
                                  )}
                                  <span className="text-xs font-semibold text-gray-600">Roof Orientation</span>
                                </div>
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${qualityColor}`}>
                                  <span className="text-sm font-bold">{section.direction}</span>
                                  <span className="text-xs opacity-75">({section.azimuth}°)</span>
                                  <span className="text-xs font-bold ml-0.5">{section.efficiency}%</span>
                                </div>
                              </div>
                              
                              <button
                                onClick={() => setEditingSectionIndex(editingSectionIndex === index ? null : index)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  editingSectionIndex === index
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                <Edit2 size={13} />
                                {editingSectionIndex === index ? 'Cancel' : 'Correct'}
                              </button>
                            </div>
                            
                            {/* Confidence warning */}
                            {section.confidence !== undefined && section.confidence < 70 && editingSectionIndex !== index && (
                              <div className="mt-2.5 flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                                <Activity size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-blue-800 mb-0.5">
                                    Detection Confidence: {section.confidence}%
                                  </p>
                                  <p className="text-xs text-blue-700 leading-relaxed">
                                    {section.confidenceReason}. Please verify the orientation is correct.
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {/* Warning for poor orientations */}
                            {isPoor && editingSectionIndex !== index && (
                              <div className="mt-2.5 flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                                <AlertTriangle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-red-800 mb-0.5">
                                    Wrong roof orientation?
                                  </p>
                                  <p className="text-xs text-red-700 leading-relaxed">
                                    This section faces {section.direction.toLowerCase()}, which may produce {section.efficiency}% of optimal output. Click "Correct" if the auto-detection is wrong.
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {/* Info for fair orientations */}
                            {isFair && !isPoor && editingSectionIndex !== index && (
                              <div className="mt-2.5 flex items-start gap-2 p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <Info size={14} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-xs text-yellow-800 leading-relaxed">
                                    Moderate efficiency. Click "Correct" if the detected orientation is incorrect.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Orientation selector */}
                        {editingSectionIndex === index && (
                          <div className="mt-3 p-4 rounded-lg border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100">
                            <p className="text-sm font-bold text-navy-500 mb-3 flex items-center gap-2">
                              <Edit2 size={14} />
                              Select correct orientation for Section {index + 1}
                            </p>
                            <div className="grid grid-cols-4 gap-2 mb-3">
                              {ROOF_ORIENTATIONS.map((orientation) => {
                                const isSelected = section.azimuth === orientation.azimuth
                                const efficiencyColor = orientation.efficiency >= 95 ? 'green' : 
                                                       orientation.efficiency >= 85 ? 'blue' :
                                                       orientation.efficiency >= 70 ? 'yellow' : 'red'
                                
                                // Get short label abbreviation
                                const shortLabelMap: Record<string, string> = {
                                  'South': 'S',
                                  'Southeast': 'SE',
                                  'Southwest': 'SW',
                                  'East': 'E',
                                  'West': 'W',
                                  'Northeast': 'NE',
                                  'Northwest': 'NW',
                                  'North': 'N'
                                }
                                const shortLabel = shortLabelMap[orientation.label] || orientation.label
                                
                                return (
                                  <button
                                    key={orientation.value}
                                    onClick={() => updateSectionOrientation(index, orientation.azimuth)}
                                    className={`relative p-2.5 border-2 rounded-lg text-center transition-all shadow-sm ${
                                      isSelected
                                        ? 'border-red-500 bg-white shadow-md scale-105'
                                        : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-md'
                                    }`}
                                  >
                                    {isSelected && (
                                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                        <CheckCircle size={14} className="text-white" />
                                      </div>
                                    )}
                                    <div className="text-2xl mb-1">{orientation.icon}</div>
                                    <div className="font-bold text-xs text-gray-800">{shortLabel}</div>
                                    <div className={`text-[10px] font-semibold mt-0.5 ${
                                      efficiencyColor === 'green' ? 'text-green-600' :
                                      efficiencyColor === 'blue' ? 'text-blue-600' :
                                      efficiencyColor === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                      {orientation.efficiency}%
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                            <div className="text-xs text-gray-600 text-center">
                              Select the direction that best matches where your roof slopes
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  
                  {/* Total */}
                  <div className="flex items-center justify-between py-2 px-3 bg-red-50 rounded border-2 border-red-300 mt-3">
                    <span className="text-sm font-bold text-red-700">Total</span>
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-700">
                        {roofArea?.toLocaleString()} sq ft
                      </div>
                      <div className="text-xs text-red-600">
                        ~{estimatedPanels} panels
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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

