'use client'

import { Ruler, Edit2, AlertTriangle, CheckCircle, Activity, Info } from 'lucide-react'
import { ROOF_ORIENTATIONS } from '@/lib/roof-calculations'
import { ORIENTATION_SHORT_LABELS } from '../constants'
import type { SectionBreakdownProps } from '../types'

export function SectionBreakdown({
  roofSections,
  roofArea,
  estimatedPanels,
  editingSectionIndex,
  setEditingSectionIndex,
  updateSectionOrientation,
  selectedSectionIndex,
  setSelectedSectionIndex
}: SectionBreakdownProps) {
  return (
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
                <div 
                  className={`bg-gray-50 py-2 px-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors ${
                    selectedSectionIndex === index ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedSectionIndex(selectedSectionIndex === index ? null : index)}
                >
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-7 h-7 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm"
                      style={{ 
                        backgroundColor: ['#DC143C', '#2563EB', '#16A34A', '#F59E0B', '#8B5CF6', '#EC4899'][index % 6]
                      }}
                    >
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
                      {editingSectionIndex === index ? 'Cancel' : 'Edit'}
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
                          This section faces {section.direction.toLowerCase()}, which may produce {section.efficiency}% of optimal output. Click "Edit" if the auto-detection is wrong.
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
                          Moderate efficiency. Click "Edit" if the detected orientation is incorrect.
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
                      
                      const shortLabel = ORIENTATION_SHORT_LABELS[orientation.label] || orientation.label
                      
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
  )
}

