'use client'

// Step 2: Draw roof on map with Mapbox integration

import { useState } from 'react'
import { Ruler, ChevronDown, ChevronUp, Info, Edit2 } from 'lucide-react'
import { MapboxDrawing } from './MapboxDrawing'
import { calculateRoofAzimuth, getDirectionLabel, getOrientationEfficiency, getOrientationQuality, ROOF_ORIENTATIONS } from '@/lib/roof-calculations'
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
  const [showTips, setShowTips] = useState(true)
  
  // Individual roof sections breakdown (includes orientation per section)
  const [roofSections, setRoofSections] = useState<Array<{
    id: string, 
    area: number, 
    panels: number, 
    azimuth: number, 
    direction: string,
    efficiency: number
  }>>([])
  
  // Roof orientation detection (uses largest section)
  const [detectedAzimuth, setDetectedAzimuth] = useState<number | null>(data.roofAzimuth || null)
  const [showOrientationSelector, setShowOrientationSelector] = useState(false)
  const [selectedAzimuth, setSelectedAzimuth] = useState<number>(data.roofAzimuth || 180)

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
          
          // Calculate orientation for this specific section
          const azimuth = calculateRoofAzimuth(feature)
          const direction = getDirectionLabel(azimuth)
          const efficiency = getOrientationEfficiency(azimuth)
          
          // Track largest polygon for overall orientation
          if (areaMeters > maxArea) {
            maxArea = areaMeters
            largestPolygon = feature
          }
          
          return {
            id: feature.id || `section-${index + 1}`,
            area: areaSqFt,
            panels: panels,
            azimuth: azimuth,
            direction: direction,
            efficiency: efficiency
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

  // Continue to next step
  const handleContinue = () => {
    if (roofArea && roofPolygon) {
      onComplete({
        roofAreaSqft: roofArea,
        roofPolygon: roofPolygon,
        mapSnapshot: mapSnapshot,
        roofAzimuth: selectedAzimuth // Include the azimuth
      })
    }
  }

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-6" style={{ height: 'calc(100vh - 200px)' }}>
      {/* Left sidebar - Instructions and measurements */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div>
          <h2 className="text-2xl font-bold text-navy-500 mb-2">
            Draw Your Roof
          </h2>
          <p className="text-gray-600">
            Click on the map to outline your roof's perimeter
          </p>
        </div>

        {/* Drawing Tips - Collapsible */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setShowTips(!showTips)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                  >
                    <h3 className="font-semibold text-navy-500">
                      Drawing Tips
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
                        <li>Pan and zoom to find your roof</li>
                        <li>Click the <strong>polygon tool</strong> (top-left of map)</li>
                        <li>Click points around roof edges</li>
                        <li>Double-click to finish the shape</li>
                        <li><strong>Draw multiple polygons</strong> if you have multiple roof sections</li>
                        <li>Use <strong>edit tool</strong> to adjust points</li>
                        <li>Use <strong>trash icon</strong> to delete a polygon</li>
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
            {roofSections.length > 1 && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Ruler size={16} className="text-gray-500" />
                  Section Breakdown
                </div>
                <div className="space-y-2">
                  {roofSections.map((section, index) => {
                    // Determine color based on efficiency
                    const qualityColor = section.efficiency >= 90 
                      ? 'text-green-600 bg-green-50 border-green-200' 
                      : section.efficiency >= 70 
                      ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
                      : 'text-orange-600 bg-orange-50 border-orange-200'
                    
                    return (
                      <div 
                        key={section.id} 
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded border border-gray-200"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-sm text-gray-700">Section {index + 1}</div>
                            <div className={`text-xs font-semibold px-2 py-0.5 rounded inline-block mt-1 ${qualityColor}`}>
                              {section.direction} ({section.azimuth}°) - {section.efficiency}%
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-navy-500">
                            {section.area.toLocaleString()} sq ft
                          </div>
                          <div className="text-xs text-gray-500">
                            ~{section.panels} panels
                          </div>
                        </div>
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

            {/* Roof orientation detection - only show for single roof section */}
            {detectedAzimuth !== null && !showOrientationSelector && roofSections.length <= 1 && (
              <div className={`p-4 rounded-lg border ${
                getOrientationQuality(selectedAzimuth).color === 'green' 
                  ? 'bg-green-50 border-green-200' 
                  : getOrientationQuality(selectedAzimuth).color === 'blue'
                  ? 'bg-blue-50 border-blue-200'
                  : getOrientationQuality(selectedAzimuth).color === 'yellow'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3 mb-3">
                  <Info className={`flex-shrink-0 mt-0.5 ${
                    getOrientationQuality(selectedAzimuth).color === 'green' 
                      ? 'text-green-600' 
                      : getOrientationQuality(selectedAzimuth).color === 'blue'
                      ? 'text-blue-600'
                      : getOrientationQuality(selectedAzimuth).color === 'yellow'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`} size={20} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-navy-500 mb-1">
                      Detected: {getDirectionLabel(selectedAzimuth)}-facing {getOrientationQuality(selectedAzimuth).icon}
                    </p>
                    <p className="text-xs text-gray-700 mb-2">
                      {getOrientationEfficiency(selectedAzimuth)}% of optimal production
                    </p>
                    <button
                      onClick={() => setShowOrientationSelector(true)}
                      className="text-xs font-medium flex items-center gap-1 hover:underline"
                      style={{ 
                        color: getOrientationQuality(selectedAzimuth).color === 'green' 
                          ? '#059669' 
                          : getOrientationQuality(selectedAzimuth).color === 'blue'
                          ? '#2563eb'
                          : getOrientationQuality(selectedAzimuth).color === 'yellow'
                          ? '#d97706'
                          : '#dc2626'
                      }}
                    >
                      <Edit2 size={12} />
                      Change direction
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Manual orientation selector - only for single roof section */}
            {showOrientationSelector && roofSections.length <= 1 && (
              <div className="p-4 rounded-lg border border-gray-200 bg-white">
                <p className="text-sm font-semibold text-navy-500 mb-3">
                  Select Roof Direction
                </p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {ROOF_ORIENTATIONS.map((orientation) => (
                    <button
                      key={orientation.value}
                      onClick={() => {
                        setSelectedAzimuth(orientation.azimuth)
                        setShowOrientationSelector(false)
                      }}
                      className={`p-3 border-2 rounded-lg text-center transition-all ${
                        selectedAzimuth === orientation.azimuth
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{orientation.icon}</div>
                      <div className="font-semibold text-xs">{orientation.label}</div>
                      <div className="text-xs text-gray-600">{orientation.efficiency}%</div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowOrientationSelector(false)}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
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
        <div className="space-y-3 pt-4">
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
      <div className="bg-white rounded-xl shadow-lg overflow-hidden relative" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
        {data.coordinates ? (
          <MapboxDrawing
            coordinates={data.coordinates}
            address={data.address || 'Your location'}
            onAreaCalculated={handleAreaCalculated}
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

