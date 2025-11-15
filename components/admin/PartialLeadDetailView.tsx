'use client'

// Detailed view for partial leads (in-progress estimates)
// Shows what data the user has entered so far

import { useState } from 'react'
import { 
  X, MapPin, Home, Clock, Mail, AlertCircle, Zap, Tag,
  TrendingUp, CheckCircle, Edit2, Trash2, Send, ExternalLink, CreditCard
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import type { MockPartialLead } from '@/lib/mock-partial-leads'

interface PartialLeadDetailViewProps {
  partialLead: MockPartialLead
  onClose: () => void
  onDelete?: (id: string) => void
  onSendReminder?: (email: string) => void
}

export function PartialLeadDetailView({ 
  partialLead, 
  onClose, 
  onDelete,
  onSendReminder 
}: PartialLeadDetailViewProps) {
  // Calculate progress metrics
  const totalSteps = partialLead.estimator_data.estimatorMode === 'easy' ? 8 : 7
  const completion = Math.round((partialLead.current_step / totalSteps) * 100)
  const isRecent = (Date.now() - new Date(partialLead.created_at).getTime()) / (1000 * 60 * 60) <= 24
  const isHot = completion >= 70 && isRecent
  const isHighPriority = completion >= 70
  
  // Get step names for easy and detailed modes
  const easyStepNames = [
    'Program Selection',
    'Location',
    'Roof Size',
    'Energy Usage',
    'Battery Savings',
    'Add-ons',
    'Photos',
    'Details',
    'Review',
    'Contact Form'
  ]
  
  const detailedStepNames = [
    'Program Selection',
    'Location',
    'Draw Roof',
    'Property Details',
    'Battery Savings',
    'Add-ons',
    'Photos',
    'Review',
    'Contact Form'
  ]
  
  const stepNames = partialLead.estimator_data.estimatorMode === 'easy' ? easyStepNames : detailedStepNames
  const currentStepName = stepNames[partialLead.current_step] || 'Unknown'
  
  // Get add-on display names
  const getAddOnName = (addOnId: string) => {
    const names: Record<string, string> = {
      'ev_charger': 'EV Charger',
      'heat_pump': 'Heat Pump',
      'new_roof': 'New Roof',
      'water_heater': 'Water Heater',
      'battery': 'Battery Storage'
    }
    return names[addOnId] || addOnId
  }
  
  // Priority badge
  const getPriorityBadge = () => {
    if (isHot) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
          <AlertCircle size={14} />
          HOT LEAD - Follow Up Now!
        </span>
      )
    } else if (isHighPriority) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <TrendingUp size={14} />
          High Priority
        </span>
      )
    } else if (isRecent) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
          <Clock size={14} />
          Recent Activity
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
          Cold Lead
        </span>
      )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-start justify-center">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl my-8">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-xl px-6 py-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="text-yellow-500" size={24} />
                  <div>
                    <h2 className="text-2xl font-bold text-navy-500">Partial Lead</h2>
                    <p className="text-sm text-gray-600">{partialLead.email}</p>
                  </div>
                </div>
                {getPriorityBadge()}
                {partialLead.estimator_data.peakShaving?.ratePlan && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    Best Plan: {partialLead.estimator_data.peakShaving.ratePlan.toUpperCase()}
                  </span>
                )}
              </div>
              
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Progress & Timeline */}
              <div className="lg:col-span-1 space-y-6">
                {/* Progress Overview */}
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-navy-500 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} />
                    Completion Progress
                  </h3>
                  
                  {/* Circular progress */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative w-32 h-32">
                      <svg className="transform -rotate-90 w-32 h-32">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke={completion >= 70 ? '#10b981' : completion >= 40 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${completion * 3.51} 351.68`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-navy-500">{completion}%</span>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <div className="text-sm font-semibold text-gray-700">Step {partialLead.current_step} of {totalSteps}</div>
                      <div className="text-xs text-gray-500 mt-1">{currentStepName}</div>
                    </div>
                  </div>

                  {/* Step checklist */}
                  <div className="space-y-2">
                    {stepNames.slice(0, totalSteps).map((stepName, index) => (
                      <div 
                        key={index}
                        className={`flex items-center gap-3 p-2 rounded-lg ${
                          index < partialLead.current_step 
                            ? 'bg-green-50' 
                            : index === partialLead.current_step 
                            ? 'bg-yellow-50' 
                            : 'bg-gray-50'
                        }`}
                      >
                        {index < partialLead.current_step ? (
                          <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                        ) : index === partialLead.current_step ? (
                          <Clock className="text-yellow-600 flex-shrink-0" size={20} />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0" />
                        )}
                        <span className={`text-sm font-medium ${
                          index < partialLead.current_step 
                            ? 'text-green-700' 
                            : index === partialLead.current_step 
                            ? 'text-yellow-700' 
                            : 'text-gray-500'
                        }`}>
                          {stepName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-navy-500 mb-4 flex items-center gap-2">
                    <Clock size={20} />
                    Timeline
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500">Started</div>
                      <div className="text-sm font-medium">{formatRelativeTime(new Date(partialLead.created_at))}</div>
                      <div className="text-xs text-gray-400">{new Date(partialLead.created_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Last Activity</div>
                      <div className="text-sm font-medium">{formatRelativeTime(new Date(partialLead.updated_at))}</div>
                      <div className="text-xs text-gray-400">{new Date(partialLead.updated_at).toLocaleString()}</div>
                    </div>
                    {partialLead.resumed_at && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="text-xs text-green-600 font-semibold">✓ User Resumed</div>
                        <div className="text-sm font-medium">{formatRelativeTime(new Date(partialLead.resumed_at))}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Follow-up Recommendation */}
                {(isHot || isHighPriority) && (
                  <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                    <h3 className="text-lg font-bold text-navy-500 mb-3">💡 Recommended Action</h3>
                    <div className="text-sm text-gray-700 space-y-2">
                      {isHot && (
                        <p className="font-semibold text-red-600">
                          This is a HOT lead! They were active recently and made significant progress. 
                          Contact them within the next 2 hours for best results.
                        </p>
                      )}
                      <p>
                        <strong>Email template:</strong> "Hi! I noticed you started a solar estimate for {partialLead.estimator_data.address || 'your property'}. 
                        I'd love to help you complete it and answer any questions you might have."
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Captured Data */}
              <div className="lg:col-span-2 space-y-6">
                {/* Contact Information */}
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-navy-500 mb-4 flex items-center gap-2">
                    <Mail size={20} />
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="text-gray-400 flex-shrink-0" size={18} />
                      <div>
                        <div className="text-xs text-gray-500">Email</div>
                        <a href={`mailto:${partialLead.email}`} className="text-sm font-medium text-blue-600 hover:underline">
                          {partialLead.email}
                        </a>
                      </div>
                    </div>
                    {(partialLead.estimator_data.financingOption || partialLead.estimator_data.financingPreference) && (
                      <div className="flex items-center gap-3">
                        <CreditCard className="text-gray-400 flex-shrink-0" size={18} />
                        <div>
                          <div className="text-xs text-gray-500">Financing Preference</div>
                          <div className="text-sm font-medium capitalize">
                            {partialLead.estimator_data.financingOption || partialLead.estimator_data.financingPreference}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-xs text-yellow-800">
                        <strong>Note:</strong> Full contact details (name, phone) are collected at the final step. 
                        This user hasn't reached that stage yet.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Property Location */}
                {partialLead.estimator_data.address && (
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-navy-500 mb-4 flex items-center gap-2">
                      <MapPin size={20} />
                      Property Location
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500">Address</div>
                        <div className="text-sm font-medium">{partialLead.estimator_data.address}</div>
                      </div>
                      {(partialLead.estimator_data.city || partialLead.estimator_data.province) && (
                        <div className="grid grid-cols-2 gap-4">
                          {partialLead.estimator_data.city && (
                            <div>
                              <div className="text-xs text-gray-500">City</div>
                              <div className="text-sm font-medium">{partialLead.estimator_data.city}</div>
                            </div>
                          )}
                          {partialLead.estimator_data.province && (
                            <div>
                              <div className="text-xs text-gray-500">Province</div>
                              <div className="text-sm font-medium">{partialLead.estimator_data.province}</div>
                            </div>
                          )}
                        </div>
                      )}
                      {partialLead.estimator_data.coordinates && (
                        <div className="mt-1">
                          <div className="text-xs text-gray-500">Coordinates</div>
                          <div className="text-sm font-medium">{partialLead.estimator_data.coordinates.lat}, {partialLead.estimator_data.coordinates.lng}</div>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${partialLead.estimator_data.coordinates.lat},${partialLead.estimator_data.coordinates.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs text-blue-600 hover:underline mt-1"
                          >
                            View on Map
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Roof Information */}
                {(partialLead.estimator_data.roofAreaSqft || partialLead.estimator_data.mapSnapshot || partialLead.map_snapshot_url) && (
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-navy-500 mb-4 flex items-center gap-2">
                      <Home size={20} />
                      Roof Information
                    </h3>
                    
                    {/* Map Snapshot */}
                    {(partialLead.estimator_data.mapSnapshot || partialLead.map_snapshot_url) && (
                      <div className="rounded-lg overflow-hidden mb-4" style={{ height: '400px' }}>
                        <img
                          src={partialLead.map_snapshot_url || partialLead.estimator_data.mapSnapshot || ''}
                          alt="Roof snapshot"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Hide image if it fails to load
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            if (target.nextElementSibling) {
                              (target.nextElementSibling as HTMLElement).style.display = 'flex'
                            }
                          }}
                        />
                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100" style={{ display: 'none' }}>
                          <div className="text-center">
                            <MapPin size={48} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Map snapshot failed to load</p>
                            <p className="text-xs mt-1">Roof polygon data stored: {partialLead.estimator_data.roofPolygon ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Area</div>
                        <div className="text-lg font-bold text-navy-500">
                          {partialLead.estimator_data.roofAreaSqft?.toLocaleString() ?? 'N/A'} sq ft
                        </div>
                      </div>
                      {partialLead.estimator_data.roofType && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Type</div>
                          <div className="text-sm font-semibold text-gray-700 capitalize">
                            {partialLead.estimator_data.roofType.replace('_', ' ')}
                          </div>
                        </div>
                      )}
                      {partialLead.estimator_data.roofPitch && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Pitch</div>
                          <div className="text-sm font-semibold text-gray-700 capitalize">
                            {partialLead.estimator_data.roofPitch}
                          </div>
                        </div>
                      )}
                      {partialLead.estimator_data.roofAge && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Age</div>
                          <div className="text-sm font-semibold text-gray-700">
                            {partialLead.estimator_data.roofAge} years
                          </div>
                        </div>
                      )}
                      {partialLead.estimator_data.shadingLevel && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Shading</div>
                          <div className="text-sm font-semibold text-gray-700 capitalize">
                            {partialLead.estimator_data.shadingLevel}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Energy Usage */}
                {(partialLead.estimator_data.annualUsageKwh || partialLead.estimator_data.monthlyBill || partialLead.estimator_data.homeSize) && (
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-navy-500 mb-4 flex items-center gap-2">
                      <Zap size={20} />
                      Energy Information
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {partialLead.estimator_data.annualUsageKwh && (
                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="text-xs text-gray-600 mb-1">Annual Usage</div>
                          <div className="text-2xl font-bold text-purple-600">
                            {partialLead.estimator_data.annualUsageKwh.toLocaleString()} kWh
                          </div>
                        </div>
                      )}
                      {partialLead.estimator_data.monthlyBill && (
                        <div className="bg-yellow-50 rounded-lg p-4">
                          <div className="text-xs text-gray-600 mb-1">Legacy Monthly Bill</div>
                          <div className="text-2xl font-bold text-yellow-600">
                            ${partialLead.estimator_data.monthlyBill}
                          </div>
                        </div>
                      )}
                      {partialLead.estimator_data.homeSize && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="text-xs text-gray-600 mb-1">Home Size</div>
                          <div className="text-lg font-bold text-blue-600">
                            {partialLead.estimator_data.homeSize} sq ft
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Add-ons */}
                {partialLead.estimator_data.selectedAddOns && partialLead.estimator_data.selectedAddOns.length > 0 && (
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-navy-500 mb-4 flex items-center gap-2">
                      <Tag size={20} />
                      Selected Add-ons
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {partialLead.estimator_data.selectedAddOns.map((addOn, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold"
                        >
                          <CheckCircle size={16} />
                          {getAddOnName(addOn)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photos */}
                {partialLead.estimator_data.photoCount && partialLead.estimator_data.photoCount > 0 && (
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-navy-500 mb-4">
                      Property Photos ({partialLead.estimator_data.photoCount})
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500 text-sm">
                      {partialLead.estimator_data.photoCount} photo{partialLead.estimator_data.photoCount !== 1 ? 's' : ''} uploaded
                    </div>
                  </div>
                )}

                {/* Peak Shaving inputs preview */}
                {(partialLead.estimator_data.peakShaving) && (
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-navy-500 mb-4">Battery Savings (Draft)</h3>
                    <div className="grid md:grid-cols-3 gap-3 text-sm">
                      {partialLead.estimator_data.peakShaving.ratePlan && (
                        <div className="bg-gray-50 rounded p-3">
                          <div className="text-xs text-gray-600">Plan</div>
                          <div className="font-semibold uppercase">{partialLead.estimator_data.peakShaving.ratePlan}</div>
                        </div>
                      )}
                      {partialLead.estimator_data.peakShaving.systemSizeKw && (
                        <div className="bg-gray-50 rounded p-3">
                          <div className="text-xs text-gray-600">System Size</div>
                          <div className="font-semibold">{partialLead.estimator_data.peakShaving.systemSizeKw} kW</div>
                        </div>
                      )}
                      {partialLead.estimator_data.peakShaving.selectedBattery && (
                        <div className="bg-gray-50 rounded p-3">
                          <div className="text-xs text-gray-600">Battery</div>
                          <div className="font-semibold">{partialLead.estimator_data.peakShaving.selectedBattery}</div>
                        </div>
                      )}
                      {partialLead.estimator_data.peakShaving.annualUsageKwh && (
                        <div className="bg-gray-50 rounded p-3">
                          <div className="text-xs text-gray-600">Annual Usage</div>
                          <div className="font-semibold">{partialLead.estimator_data.peakShaving.annualUsageKwh.toLocaleString()} kWh</div>
                        </div>
                      )}
                      {partialLead.estimator_data.peakShaving.manualProductionKwh && (
                        <div className="bg-gray-50 rounded p-3">
                          <div className="text-xs text-gray-600">Annual Production (est.)</div>
                          <div className="font-semibold">{partialLead.estimator_data.peakShaving.manualProductionKwh.toLocaleString()} kWh</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Optional: Environmental & Financing (if present later in flow) */}
                {((partialLead as any).environmental || partialLead.estimator_data.financingOption || partialLead.estimator_data.financingPreference) ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {(partialLead as any).environmental && (
                      <div className="card p-6">
                        <h3 className="text-lg font-bold text-navy-500 mb-2">Environmental</h3>
                        <div className="grid grid-cols-3 gap-3 text-center text-sm">
                          <div>
                            <div className="text-xs text-gray-600">CO₂/yr</div>
                            <div className="font-semibold">{(partialLead as any).environmental.co2_tpy ?? '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Trees</div>
                            <div className="font-semibold">{(partialLead as any).environmental.trees ?? '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Cars</div>
                            <div className="font-semibold">{(partialLead as any).environmental.cars_off_road ?? '—'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {(partialLead.estimator_data.financingOption || partialLead.estimator_data.financingPreference) && (
                      <div className="card p-6">
                        <h3 className="text-lg font-bold text-navy-500 mb-2">Financing Preference</h3>
                        <div className="text-sm capitalize">
                          {partialLead.estimator_data.financingOption || partialLead.estimator_data.financingPreference}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Data Summary */}
                <div className="card p-6 bg-gray-50">
                  <h3 className="text-lg font-bold text-navy-500 mb-4">Data Completeness</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className={`p-3 rounded-lg text-center ${
                      partialLead.estimator_data.address ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                    }`}>
                      <div className="text-xs font-semibold">Location</div>
                      <div className="text-lg">{partialLead.estimator_data.address ? '✓' : '○'}</div>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${
                      partialLead.estimator_data.roofAreaSqft ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                    }`}>
                      <div className="text-xs font-semibold">Roof Data</div>
                      <div className="text-lg">{partialLead.estimator_data.roofAreaSqft ? '✓' : '○'}</div>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${
                      (partialLead.estimator_data.annualUsageKwh || partialLead.estimator_data.monthlyBill)
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      <div className="text-xs font-semibold">Energy Data</div>
                        <div className="text-lg">
                          {(partialLead.estimator_data.annualUsageKwh || partialLead.estimator_data.monthlyBill) ? '✓' : '○'}
                        </div>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${
                      partialLead.estimator_data.photoCount ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                    }`}>
                      <div className="text-xs font-semibold">Photos</div>
                      <div className="text-lg">{partialLead.estimator_data.photoCount ? '✓' : '○'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 rounded-b-xl px-6 py-4 flex items-center justify-between">
            <div className="flex gap-2">
              <button 
                onClick={() => onSendReminder?.(partialLead.email)}
                className="btn-primary text-sm px-6 py-2 inline-flex items-center gap-2"
              >
                <Send size={16} />
                Send Follow-Up Email
              </button>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => onDelete?.(partialLead.id)}
                className="btn-outline border-red-500 text-red-500 text-sm px-4 py-2 inline-flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete
              </button>
              <button onClick={onClose} className="btn-outline border-gray-300 text-gray-700 text-sm px-6 py-2">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

