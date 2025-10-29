'use client'

// Detailed lead view component for admin panel
// Displays comprehensive lead information similar to the review step

import { useState } from 'react'
import { 
  X, MapPin, Home, Image as ImageIcon, Zap, DollarSign, 
  Calendar, Mail, Phone, MessageSquare, Check, Edit2, Trash2,
  Download, ExternalLink, Clock, User, Tag
} from 'lucide-react'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import type { MockLead } from '@/lib/mock-leads'

interface LeadDetailViewProps {
  lead: MockLead
  onClose: () => void
  onStatusChange?: (leadId: string, newStatus: string) => void
}

export function LeadDetailView({ lead, onClose, onStatusChange }: LeadDetailViewProps) {
  // Current tab for tabbed sections
  const [activeTab, setActiveTab] = useState<'overview' | 'estimate' | 'activity'>('overview')
  
  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-red-100 text-red-700'
      case 'contacted': return 'bg-yellow-100 text-yellow-700'
      case 'qualified': return 'bg-green-100 text-green-700'
      case 'closed': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-start justify-center">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl my-8">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-xl px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-navy-500">{lead.full_name}</h2>
                <p className="text-sm text-gray-600">{lead.address}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(lead.status)}`}>
                {lead.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                lead.estimator_mode === 'easy' ? 'bg-red-100 text-red-600' : 'bg-navy-100 text-navy-600'
              }`}>
                {lead.estimator_mode === 'easy' ? 'Quick Estimate' : 'Detailed Analysis'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="btn-outline border-navy-500 text-navy-500 text-sm px-4 py-2">
                <Download size={16} />
                Export PDF
              </button>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-red-500 text-red-500'
                    : 'border-transparent text-gray-600 hover:text-navy-500'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('estimate')}
                className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'estimate'
                    ? 'border-red-500 text-red-500'
                    : 'border-transparent text-gray-600 hover:text-navy-500'
                }`}
              >
                Full Estimate
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'activity'
                    ? 'border-red-500 text-red-500'
                    : 'border-transparent text-gray-600 hover:text-navy-500'
                }`}
              >
                Activity Log
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column - Contact & Property Info */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Contact Information */}
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-navy-500 mb-4 flex items-center gap-2">
                      <User size={20} />
                      Contact Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Mail className="text-gray-400 flex-shrink-0 mt-0.5" size={18} />
                        <div>
                          <div className="text-xs text-gray-500">Email</div>
                          <a href={`mailto:${lead.email}`} className="text-sm font-medium text-blue-600 hover:underline">
                            {lead.email}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="text-gray-400 flex-shrink-0 mt-0.5" size={18} />
                        <div>
                          <div className="text-xs text-gray-500">Phone</div>
                          <a href={`tel:${lead.phone}`} className="text-sm font-medium text-blue-600 hover:underline">
                            {lead.phone}
                          </a>
                        </div>
                      </div>
                      {lead.preferred_contact_method && (
                        <div className="flex items-start gap-3">
                          <MessageSquare className="text-gray-400 flex-shrink-0 mt-0.5" size={18} />
                          <div>
                            <div className="text-xs text-gray-500">Preferred Method</div>
                            <div className="text-sm font-medium capitalize">{lead.preferred_contact_method}</div>
                          </div>
                        </div>
                      )}
                      {lead.preferred_contact_time && (
                        <div className="flex items-start gap-3">
                          <Clock className="text-gray-400 flex-shrink-0 mt-0.5" size={18} />
                          <div>
                            <div className="text-xs text-gray-500">Best Time</div>
                            <div className="text-sm font-medium capitalize">{lead.preferred_contact_time}</div>
                          </div>
                        </div>
                      )}
                      {lead.comments && (
                        <div className="pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">Comments</div>
                          <p className="text-sm text-gray-700 italic">"{lead.comments}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Property Location */}
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-navy-500 mb-4 flex items-center gap-2">
                      <MapPin size={20} />
                      Property Location
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500">Address</div>
                        <div className="text-sm font-medium">{lead.address}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500">City</div>
                          <div className="text-sm font-medium">{lead.city}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Province</div>
                          <div className="text-sm font-medium">{lead.province}</div>
                        </div>
                      </div>
                      {lead.postal_code && (
                        <div>
                          <div className="text-xs text-gray-500">Postal Code</div>
                          <div className="text-sm font-medium">{lead.postal_code}</div>
                        </div>
                      )}
                      {lead.coordinates && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${lead.coordinates.lat},${lead.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mt-2"
                        >
                          View on Map
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-navy-500 mb-4 flex items-center gap-2">
                      <Calendar size={20} />
                      Timeline
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-500">Submitted</div>
                        <div className="text-sm font-medium">{formatRelativeTime(new Date(lead.created_at))}</div>
                        <div className="text-xs text-gray-400">{new Date(lead.created_at).toLocaleString()}</div>
                      </div>
                      {lead.hubspot_synced_at && (
                        <div>
                          <div className="text-xs text-gray-500">Synced to HubSpot</div>
                          <div className="text-sm font-medium">{formatRelativeTime(new Date(lead.hubspot_synced_at))}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - System Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Roof Visualization */}
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-navy-500 mb-4 flex items-center gap-2">
                      <Home size={20} />
                      Your Roof
                      {lead.roof_sections && lead.roof_sections > 1 && (
                        <span className="text-sm font-normal text-gray-600">
                          ({lead.roof_sections} sections)
                        </span>
                      )}
                    </h3>
                    
                    {/* Roof Map Placeholder */}
                    <div className="bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ height: '400px' }}>
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <MapPin size={48} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Satellite View Not Available in Demo</p>
                          <p className="text-xs mt-1">Roof polygon data stored: {lead.roof_polygon ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Roof Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Total Area</div>
                        <div className="text-lg font-bold text-navy-500">
                          {lead.roof_area_sqft?.toLocaleString() || 'N/A'} sq ft
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Type</div>
                        <div className="text-sm font-semibold text-gray-700 capitalize">
                          {lead.roof_type?.replace('_', ' ') || 'N/A'}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Pitch</div>
                        <div className="text-sm font-semibold text-gray-700 capitalize">
                          {lead.roof_pitch || 'N/A'}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Age</div>
                        <div className="text-sm font-semibold text-gray-700">
                          {lead.roof_age || 'N/A'} years
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Shading</div>
                        <div className="text-sm font-semibold text-gray-700 capitalize">
                          {lead.shading_level || 'N/A'}
                        </div>
                      </div>
                      {lead.roof_azimuth && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Orientation</div>
                          <div className="text-sm font-semibold text-gray-700">
                            {lead.roof_azimuth}° 
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Property Photos */}
                  {lead.photo_count && lead.photo_count > 0 && (
                    <div className="card p-6">
                      <h3 className="text-lg font-bold text-navy-500 mb-4 flex items-center gap-2">
                        <ImageIcon size={20} />
                        Property Photos ({lead.photo_count})
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {lead.photo_urls?.map((url, index) => (
                          <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ImageIcon size={32} />
                            </div>
                          </div>
                        )) || (
                          <div className="col-span-3 bg-gray-50 rounded-lg p-6 text-center text-gray-500 text-sm">
                            {lead.photo_count} photo{lead.photo_count !== 1 ? 's' : ''} uploaded (not displayed in demo)
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* System Estimate Overview */}
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-navy-500 mb-4 flex items-center gap-2">
                      <Zap size={20} />
                      Solar System Estimate
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                        <div className="text-xs text-red-600 mb-1">System Size</div>
                        <div className="text-3xl font-bold text-red-600">
                          {lead.system_size_kw?.toFixed(1) || 'N/A'} kW
                        </div>
                        <div className="text-xs text-red-600 mt-1">
                          ~{lead.system_size_kw ? Math.round(lead.system_size_kw / 0.5) : 0} panels
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                        <div className="text-xs text-green-600 mb-1">Annual Savings</div>
                        <div className="text-3xl font-bold text-green-600">
                          {lead.annual_savings ? formatCurrency(lead.annual_savings) : 'N/A'}
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          {lead.annual_production_kwh?.toLocaleString() || 'N/A'} kWh/year
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                        <div className="text-xs text-blue-600 mb-1">Payback Period</div>
                        <div className="text-3xl font-bold text-blue-600">
                          {lead.payback_years?.toFixed(1) || 'N/A'} yrs
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Net: {lead.net_cost_after_incentives ? formatCurrency(lead.net_cost_after_incentives) : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Estimated Cost:</span>
                          <span className="ml-2 font-semibold text-navy-500">
                            {lead.estimated_cost ? formatCurrency(lead.estimated_cost) : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Net After Incentives:</span>
                          <span className="ml-2 font-semibold text-green-600">
                            {lead.net_cost_after_incentives ? formatCurrency(lead.net_cost_after_incentives) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Energy Usage */}
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-navy-500 mb-4 flex items-center gap-2">
                      <Zap size={20} />
                      Energy Usage
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <div className="text-xs text-gray-600 mb-1">Monthly Bill</div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {lead.monthly_bill ? formatCurrency(lead.monthly_bill) : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="text-xs text-gray-600 mb-1">Annual Usage</div>
                        <div className="text-2xl font-bold text-purple-600">
                          {lead.annual_usage_kwh?.toLocaleString() || 'N/A'} kWh
                        </div>
                      </div>
                    </div>
                    {lead.home_size && (
                      <div className="mt-3 text-sm text-gray-600">
                        <span className="font-semibold">Home Size:</span> {lead.home_size} sq ft
                      </div>
                    )}
                  </div>

                  {/* Add-ons */}
                  {lead.selected_add_ons && lead.selected_add_ons.length > 0 && (
                    <div className="card p-6">
                      <h3 className="text-lg font-bold text-navy-500 mb-4 flex items-center gap-2">
                        <Tag size={20} />
                        Selected Add-ons
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {lead.selected_add_ons.map((addOn, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold"
                          >
                            <Check size={16} />
                            {getAddOnName(addOn)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* HubSpot Integration Status */}
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-navy-500 mb-4">CRM Integration</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">
                          HubSpot Status: {lead.hubspot_synced ? (
                            <span className="text-green-600">✓ Synced</span>
                          ) : (
                            <span className="text-gray-400">Not Synced</span>
                          )}
                        </div>
                        {lead.hubspot_contact_id && (
                          <div className="text-xs text-gray-500 mt-1">
                            Contact ID: {lead.hubspot_contact_id}
                          </div>
                        )}
                        {lead.hubspot_deal_id && (
                          <div className="text-xs text-gray-500">
                            Deal ID: {lead.hubspot_deal_id}
                          </div>
                        )}
                      </div>
                      {!lead.hubspot_synced && (
                        <button className="btn-primary text-sm px-4 py-2">
                          Sync to HubSpot
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'estimate' && (
              <div className="text-center py-12 text-gray-500">
                <Zap size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">Full Estimate View</p>
                <p className="text-sm mt-2">Complete PVWatts data and detailed calculations would appear here</p>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="text-center py-12 text-gray-500">
                <Clock size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">Activity Timeline</p>
                <p className="text-sm mt-2">Lead activities, status changes, and notes would appear here</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 rounded-b-xl px-6 py-4 flex items-center justify-between">
            <div className="flex gap-2">
              <select
                value={lead.status}
                onChange={(e) => onStatusChange?.(lead.id, e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-sm"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="closed">Closed</option>
              </select>
              <button className="btn-outline border-gray-300 text-gray-700 text-sm px-4 py-2">
                <Edit2 size={16} />
                Add Note
              </button>
            </div>
            <div className="flex gap-2">
              <button className="btn-outline border-red-500 text-red-500 text-sm px-4 py-2">
                <Trash2 size={16} />
                Delete Lead
              </button>
              <button onClick={onClose} className="btn-primary text-sm px-6 py-2">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

