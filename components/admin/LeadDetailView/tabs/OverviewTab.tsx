'use client'

import { 
  User, Mail, Phone, MessageSquare, Clock, CreditCard, Zap, Tag,
  MapPin, Calendar, Home, Image as ImageIcon, ExternalLink, Check
} from 'lucide-react'
import { formatRelativeTime, formatCurrency } from '@/lib/utils'
import { asNumber, getAddOnName, getCombinedBlock } from '../utils'

interface OverviewTabProps {
  lead: any
  city: string
  coordinates: { lat: number; lng: number } | null
  photoUrls: string[]
  photoSummary: any
  roofSectionsParsed: any[]
  numPanels: number | null
  displayTotalCost: number | null
  displayIncentives: number | null
  displayNetCost: number | null
  displayAnnualProduction: number | null
  combinedTotalSystemCost: number
  combinedTotalIncentives: number
  combinedNetAfterIncentives: number
  batteryPrice: number | null
  batteryRebate: number | null
  peakShaving: any
  touAnnual: number | null
  uloAnnual: number | null
  touPayback: number | null
  uloPayback: number | null
  onImageClick: (image: { src: string; alt: string; title: string }) => void
}

export function OverviewTab({
  lead,
  city,
  coordinates,
  photoUrls,
  photoSummary,
  roofSectionsParsed,
  numPanels,
  displayTotalCost,
  displayIncentives,
  displayNetCost,
  displayAnnualProduction,
  combinedTotalSystemCost,
  combinedTotalIncentives,
  combinedNetAfterIncentives,
  batteryPrice,
  batteryRebate,
  peakShaving,
  touAnnual,
  uloAnnual,
  touPayback,
  uloPayback,
  onImageClick,
}: OverviewTabProps) {
  return (
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
            {lead.financing_preference && (
              <div className="flex items-start gap-3">
                <CreditCard className="text-gray-400 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <div className="text-xs text-gray-500">Financing Preference</div>
                  <div className="text-sm font-medium capitalize">{lead.financing_preference}</div>
                </div>
              </div>
            )}
            {lead.program_type && (
              <div className="flex items-start gap-3">
                <Zap className="text-gray-400 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <div className="text-xs text-gray-500">Program</div>
                  <div className="text-sm font-medium capitalize">
                    {lead.program_type.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>
            )}
            {lead.estimator_mode && (
              <div className="flex items-start gap-3">
                <Tag className="text-gray-400 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <div className="text-xs text-gray-500">Estimator Mode</div>
                  <div className="text-sm font-medium capitalize">
                    {lead.estimator_mode}
                  </div>
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
                <div className="text-sm font-medium">{city}</div>
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
            {coordinates && coordinates.lat && coordinates.lng && (
              <div className="mt-2">
                <div className="text-xs text-gray-500">Coordinates</div>
                <div className="text-sm font-medium">{coordinates.lat}, {coordinates.lng}</div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`}
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
            {roofSectionsParsed.length > 1 && (
              <span className="text-sm font-normal text-gray-600">
                ({roofSectionsParsed.length} sections)
              </span>
            )}
          </h3>
          
          {/* Roof Snapshot from roof drawing step - prioritize map_snapshot from hrs_residential_leads */}
          {/* Support both map_snapshot (hrs_residential_leads) and map_snapshot_url (leads_v3) */}
          {/* Do NOT fall back to photos - only show map snapshot from roof drawing */}
          {(lead.map_snapshot || lead.map_snapshot_url) ? (
            <div className="rounded-lg overflow-hidden mb-4" style={{ height: '400px' }}>
              <img
                src={typeof (lead.map_snapshot || lead.map_snapshot_url) === 'string' 
                  ? (lead.map_snapshot || lead.map_snapshot_url) 
                  : ''}
                alt="Roof drawing snapshot from map"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // If map snapshot fails to load, show placeholder instead of falling back to photos
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100"><div class="text-center"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mx-auto mb-2 opacity-50"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><p class="text-sm">Map Snapshot Not Available</p><p class="text-xs mt-1">Roof polygon data stored: ' + (lead.roof_polygon ? 'Yes' : 'No') + '</p></div></div>'
                  }
                }}
              />
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ height: '400px' }}>
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MapPin size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Roof Drawing Snapshot Not Available</p>
                  <p className="text-xs mt-1">Roof polygon data stored: {lead.roof_polygon ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Roof Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Total Area</div>
              <div className="text-lg font-bold text-navy-500">
                {(asNumber(lead.roof_area_sqft) ?? 0) ? (asNumber(lead.roof_area_sqft) as number).toLocaleString() : 'N/A'} sq ft
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
        {(photoUrls?.length > 0 || lead.photo_count > 0) && (
          <div className="card p-6">
            <h3 className="text-lg font-bold text-navy-500 mb-4 flex items-center gap-2">
              <ImageIcon size={20} />
              Property Photos ({photoUrls?.length || lead.photo_count || 0})
            </h3>
            {photoUrls && photoUrls.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {photoUrls.map((url: string, index: number) => (
                  <div 
                    key={index} 
                    className="aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      onImageClick({ 
                        src: url, 
                        alt: `Property photo ${index + 1}`, 
                        title: `Property Photo ${index + 1}` 
                      })
                    }}
                  >
                    <img
                      src={url}
                      alt={`Property photo ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>'
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500 text-sm">
                {lead.photo_count || 0} photo{(lead.photo_count || 0) !== 1 ? 's' : ''} uploaded (URLs not available)
              </div>
            )}
            {photoSummary?.byCategory && (
              <div className="mt-3 text-xs text-gray-700">
                <div className="font-semibold mb-1">Categories:</div>
                <div className="flex flex-wrap gap-2">
                  {photoSummary.byCategory.map((c: any, i: number) => (
                    <span key={i} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {c.category}: {c.count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* System Estimate Overview */}
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-navy-500 flex items-center gap-2">
              <Zap size={20} />
              Solar System Estimate
            </h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
              <div className="text-xs text-red-600 mb-1">System Size</div>
              <div className="text-3xl font-bold text-red-600">
                {typeof lead.system_size_kw === 'number' ? lead.system_size_kw.toFixed(1) : (asNumber(lead.system_size_kw)?.toFixed(1) || 'N/A')} kW
              </div>
              <div className="text-xs text-red-600 mt-1">
                ~{typeof numPanels === 'number' ? Math.round(numPanels) : (asNumber(lead.system_size_kw) ? Math.round((asNumber(lead.system_size_kw) as number) / 0.5) : 0)} panels
              </div>
              <div className="text-xs text-red-600 mt-1">
                Annual Production: {typeof displayAnnualProduction === 'number' ? displayAnnualProduction.toLocaleString() : 'N/A'} kWh/year
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="text-xs text-green-600 mb-1">Total Rebates</div>
              <div className="text-3xl font-bold text-green-600">
                {lead.program_type === 'net_metering' ? (
                  <span className="text-gray-500">$0</span>
                ) : (
                  formatCurrency(combinedTotalIncentives)
                )}
              </div>
              <div className="text-xs text-green-600 mt-1">
                {lead.program_type === 'net_metering' ? (
                  <span className="text-gray-500">No rebates for net metering</span>
                ) : (
                  'Solar + Battery rebates'
                )}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="text-xs text-blue-600 mb-1">Net After Rebates</div>
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(lead.program_type === 'net_metering' ? combinedTotalSystemCost : combinedNetAfterIncentives)}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {lead.program_type === 'net_metering' 
                  ? 'Total system cost (no rebates)' 
                  : 'Based on saved solar and battery costs'
                }
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Solar Cost:</span>
                <span className="ml-2 font-semibold text-navy-500">
                  {typeof displayTotalCost === 'number' ? formatCurrency(displayTotalCost) : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Solar Rebate:</span>
                <span className="ml-2 font-semibold text-green-600">
                  {lead.program_type === 'net_metering' ? (
                    <span className="text-gray-500">$0</span>
                  ) : (
                    typeof displayIncentives === 'number' ? formatCurrency(displayIncentives) : 'N/A'
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Battery Cost:</span>
                <span className="ml-2 font-semibold text-navy-500">{typeof batteryPrice === 'number' ? formatCurrency(batteryPrice) : '—'}</span>
              </div>
              <div>
                <span className="text-gray-600">Battery Rebate:</span>
                <span className="ml-2 font-semibold text-green-600">
                  {lead.program_type === 'net_metering' ? (
                    <span className="text-gray-500">$0</span>
                  ) : (
                    typeof batteryRebate === 'number' ? formatCurrency(batteryRebate) : '—'
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Total System Cost:</span>
                <span className="ml-2 font-semibold text-navy-700">{formatCurrency(combinedTotalSystemCost)}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Rebates:</span>
                <span className="ml-2 font-semibold text-green-700">
                  {lead.program_type === 'net_metering' ? (
                    <span className="text-gray-500">No rebates for net metering</span>
                  ) : (
                    formatCurrency(combinedTotalIncentives)
                  )}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Net After Rebates:</span>
                <span className="ml-2 font-semibold text-green-700">
                  {lead.program_type === 'net_metering' ? (
                    formatCurrency(combinedTotalSystemCost)
                  ) : (
                    formatCurrency(combinedNetAfterIncentives)
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Energy Usage */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-bold text-navy-500 mb-3">Energy Usage</h4>
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
        </div>

        {/* Peak Shaving / Plan Comparison */}
        {(lead.peak_shaving || lead.tou_total_offset || lead.ulo_total_offset) && (
          <div className="card p-6">
            <h3 className="text-lg font-bold text-navy-500 mb-4">Rate Plan Comparison</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {/* TOU Plan */}
              {(peakShaving?.tou || lead.tou_total_offset !== undefined) && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-200">
                  <div className="text-sm font-bold text-blue-700 mb-4 uppercase tracking-wide">TOU Plan</div>
                  <div className="space-y-3">
                    {/* Energy Offset */}
                    {lead.tou_total_offset !== undefined && (
                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Energy Offset</div>
                        <div className="text-2xl font-bold text-blue-700">
                          {typeof lead.tou_total_offset === 'number' ? lead.tou_total_offset.toFixed(1) : lead.tou_total_offset}%
                        </div>
                      </div>
                    )}
                    {/* Total Bill Savings */}
                    {lead.tou_total_bill_savings_percent !== undefined && (
                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Total Bill Savings</div>
                        <div className="text-2xl font-bold text-purple-700">
                          {typeof lead.tou_total_bill_savings_percent === 'number' ? lead.tou_total_bill_savings_percent.toFixed(1) : lead.tou_total_bill_savings_percent}%
                        </div>
                      </div>
                    )}
                    {/* Payback Period */}
                    {lead.tou_payback_period !== undefined && (
                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Payback Period</div>
                        <div className="text-2xl font-bold text-maple-700">
                          {typeof lead.tou_payback_period === 'number' ? lead.tou_payback_period.toFixed(1) : lead.tou_payback_period} yrs
                        </div>
                      </div>
                    )}
                    {/* Annual Savings */}
                    <div className="bg-white/70 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Annual Savings</div>
                      <div className="text-2xl font-bold text-green-700">
                        {touAnnual ? formatCurrency(touAnnual) : (lead.tou_annual_savings ? formatCurrency(lead.tou_annual_savings) : '—')}
                      </div>
                      {lead.tou_monthly_savings && (
                        <div className="text-xs text-gray-600 mt-1">
                          {formatCurrency(lead.tou_monthly_savings)}/month
                        </div>
                      )}
                    </div>
                    {/* 25-Year Profit */}
                  {getCombinedBlock(peakShaving?.tou)?.projection?.netProfit25Year !== undefined && (
                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">25-Year Profit</div>
                        <div className="text-xl font-bold text-green-700">
                          {formatCurrency(getCombinedBlock(peakShaving?.tou)?.projection?.netProfit25Year || 0)}
                        </div>
                      </div>
                  )}
                  </div>
                </div>
              )}
              {/* ULO Plan */}
              {(peakShaving?.ulo || lead.ulo_total_offset !== undefined) && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border-2 border-green-200">
                  <div className="text-sm font-bold text-green-700 mb-4 uppercase tracking-wide">ULO Plan</div>
                  <div className="space-y-3">
                    {/* Energy Offset */}
                    {lead.ulo_total_offset !== undefined && (
                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Energy Offset</div>
                        <div className="text-2xl font-bold text-blue-700">
                          {typeof lead.ulo_total_offset === 'number' ? lead.ulo_total_offset.toFixed(1) : lead.ulo_total_offset}%
                        </div>
                      </div>
                    )}
                    {/* Total Bill Savings */}
                    {lead.ulo_total_bill_savings_percent !== undefined && (
                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Total Bill Savings</div>
                        <div className="text-2xl font-bold text-purple-700">
                          {typeof lead.ulo_total_bill_savings_percent === 'number' ? lead.ulo_total_bill_savings_percent.toFixed(1) : lead.ulo_total_bill_savings_percent}%
                        </div>
                      </div>
                    )}
                    {/* Payback Period */}
                    {lead.ulo_payback_period !== undefined && (
                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Payback Period</div>
                        <div className="text-2xl font-bold text-maple-700">
                          {typeof lead.ulo_payback_period === 'number' ? lead.ulo_payback_period.toFixed(1) : lead.ulo_payback_period} yrs
                        </div>
                      </div>
                    )}
                    {/* Annual Savings */}
                    <div className="bg-white/70 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Annual Savings</div>
                      <div className="text-2xl font-bold text-green-700">
                        {uloAnnual ? formatCurrency(uloAnnual) : (lead.ulo_annual_savings ? formatCurrency(lead.ulo_annual_savings) : '—')}
                      </div>
                      {lead.ulo_monthly_savings && (
                        <div className="text-xs text-gray-600 mt-1">
                          {formatCurrency(lead.ulo_monthly_savings)}/month
                        </div>
                      )}
                    </div>
                    {/* 25-Year Profit */}
                  {getCombinedBlock(peakShaving?.ulo)?.projection?.netProfit25Year !== undefined && (
                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">25-Year Profit</div>
                        <div className="text-xl font-bold text-green-700">
                          {formatCurrency(getCombinedBlock(peakShaving?.ulo)?.projection?.netProfit25Year || 0)}
                        </div>
                      </div>
                  )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Environmental & Financing */}
        {(lead.env_co2_offset_tpy != null || lead.financing_preference || lead.env_trees_equivalent != null || lead.env_cars_off_road != null) && (
          <div className="grid md:grid-cols-2 gap-6">
            {(lead.env_co2_offset_tpy != null || lead.env_trees_equivalent != null || lead.env_cars_off_road != null) && (
              <div className="card p-6">
                <h3 className="text-lg font-bold text-navy-500 mb-3">Environmental Impact</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-green-50 rounded p-3">
                    <div className="text-xs text-gray-600">CO₂/yr</div>
                    <div className="text-green-700 font-semibold">{lead.env_co2_offset_tpy ?? '—'}</div>
                  </div>
                  <div className="bg-green-50 rounded p-3">
                    <div className="text-xs text-gray-600">Trees</div>
                    <div className="text-green-700 font-semibold">{lead.env_trees_equivalent ?? '—'}</div>
                  </div>
                  <div className="bg-green-50 rounded p-3">
                    <div className="text-xs text-gray-600">Cars Off</div>
                    <div className="text-green-700 font-semibold">{lead.env_cars_off_road ?? '—'}</div>
                  </div>
                </div>
              </div>
            )}
            {lead.financing_preference && (
              <div className="card p-6">
                <h3 className="text-lg font-bold text-navy-500 mb-3">Financing Preference</h3>
                <div className="text-sm">{lead.financing_preference}</div>
              </div>
            )}
          </div>
        )}

        {/* Add-ons */}
        {Array.isArray(lead.selected_add_ons) && lead.selected_add_ons.length > 0 ? (
          <div className="card p-6">
            <h3 className="text-lg font-bold text-navy-500 mb-4 flex items-center gap-2">
              <Tag size={20} />
              Selected Add-ons
            </h3>
            <div className="flex flex-wrap gap-2">
              {lead.selected_add_ons.map((addOn: string, index: number) => (
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
        ) : null}

        {/* HubSpot Integration Status */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-navy-500 mb-4">CRM Integration</h3>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-sm font-semibold">
                  HubSpot Status: {lead.hubspot_synced ? (
                    <span className="text-green-600">✓ Synced</span>
                  ) : (
                    <span className="text-gray-400">Not Synced</span>
                  )}
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                  Coming Soon
                </span>
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
              <div className="text-xs text-gray-500 mt-2">
                HubSpot CRM integration will be available in a future update
              </div>
            </div>
            <button 
              className="btn-primary text-sm px-4 py-2 opacity-50 cursor-not-allowed"
              disabled
              title="HubSpot integration coming soon"
            >
              Sync to HubSpot
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

