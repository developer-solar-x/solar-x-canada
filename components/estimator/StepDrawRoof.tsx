'use client'

// Step 2: Draw roof on map with Mapbox integration

import { useState } from 'react'
import { Ruler, ChevronDown, ChevronUp } from 'lucide-react'
import { MapboxDrawing } from './MapboxDrawing'

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

  // Handle area calculation from map drawing
  const handleAreaCalculated = (areaSqFt: number, polygon: any, snapshot?: string) => {
    setRoofArea(areaSqFt)
    setRoofPolygon(polygon)
    if (snapshot) {
      setMapSnapshot(snapshot)
    }
    setEstimatedPanels(Math.floor(areaSqFt / 17.5)) // Assuming 17.5 sq ft per panel
  }

  // Continue to next step
  const handleContinue = () => {
    if (roofArea && roofPolygon) {
      onComplete({
        roofAreaSqft: roofArea,
        roofPolygon: roofPolygon,
        mapSnapshot: mapSnapshot
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
                        <li>Use <strong>edit tool</strong> to adjust points</li>
                        <li><strong>Drag the pin</strong> to reposition marker</li>
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
            </div>

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

