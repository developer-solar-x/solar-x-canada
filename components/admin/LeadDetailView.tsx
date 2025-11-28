'use client'

// Detailed lead view component for admin panel
// Displays comprehensive lead information similar to the review step

import { useState, useEffect } from 'react'
import { 
  X, MapPin, Home, Image as ImageIcon, Zap, DollarSign, 
  Calendar, Mail, Phone, MessageSquare, Check, Edit2, Trash2,
  Download, ExternalLink, Clock, User, Tag, CreditCard
} from 'lucide-react'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { ImageModal } from '@/components/ui/ImageModal'
import { getStatusColor, getAddOnName, getCombinedBlock, asNumber } from './LeadDetailView/utils'
import { useLeadData, useMobileDetection, useNotes, useActivities } from './LeadDetailView/hooks'
import { OverviewTab } from './LeadDetailView/tabs/OverviewTab'
import { EstimateTab } from './LeadDetailView/tabs/EstimateTab'
import { PeakShavingTab } from './LeadDetailView/tabs/PeakShavingTab'
import { ActivityTab } from './LeadDetailView/tabs/ActivityTab'
import { PeakShavingInfoModal } from './LeadDetailView/modals/PeakShavingInfoModal'
import { AddNoteModal } from './LeadDetailView/modals/AddNoteModal'

// Lead type matching database schema
interface Lead {
  id: string
  full_name: string
  email: string
  phone: string
  address: string
  province: string
  status: string
  system_size_kw?: number
  annual_savings?: number
  solar_annual_savings?: number
  combined_annual_savings?: number
  created_at: string
  hubspot_synced?: boolean
  rate_plan?: string
  // New fields from updated schema
  estimator_mode?: string
  program_type?: string
  lead_type?: string
  has_battery?: boolean
  selected_battery_ids?: string[]
  annual_escalator?: number
  // TOU fields
  tou_solar?: number
  tou_battery_solar_capture?: number
  tou_total_offset?: number
  tou_buy_from_grid?: number
  tou_actual_cost_after_battery_optimization?: number
  tou_savings?: number
  tou_annual_savings?: number
  tou_monthly_savings?: number
  tou_profit_25_year?: number
  tou_payback_period?: number
  tou_total_bill_savings_percent?: number
  tou_before_solar?: number
  tou_after_solar?: number
  // ULO fields
  ulo_solar?: number
  ulo_battery_solar_capture?: number
  ulo_total_offset?: number
  ulo_buy_from_grid?: number
  ulo_actual_cost_after_battery_optimization?: number
  ulo_savings?: number
  ulo_annual_savings?: number
  ulo_monthly_savings?: number
  ulo_profit_25_year?: number
  ulo_payback_period?: number
  ulo_total_bill_savings_percent?: number
  ulo_before_solar?: number
  ulo_after_solar?: number
  // Battery cost fields
  battery_cost?: number
  battery_rebate?: number
  // Full data JSON
  full_data_json?: string
  [key: string]: any // Allow other database fields
}

interface LeadDetailViewProps {
  lead: Lead
  onClose: () => void
  onStatusChange?: (leadId: string, newStatus: string) => void
}

export function LeadDetailView({ lead, onClose, onStatusChange }: LeadDetailViewProps) {
  // Current tab for tabbed sections
  const [activeTab, setActiveTab] = useState<'overview' | 'estimate' | 'peakshaving' | 'activity'>('overview')
  
  // State for image modal
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string; title: string } | null>(null)
  
  // State for current lead
  const [currentLead, setCurrentLead] = useState<Lead>(lead)
  const [loading, setLoading] = useState(false)
  
  // State for add note modal
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  
  // Custom hooks
  const isMobile = useMobileDetection()
  const { notes, setNotes } = useNotes(lead.id)
  const { activities, setActivities, refreshActivities } = useActivities(lead.id)
  
  // Parse lead data
  const leadData = useLeadData(currentLead)

  // Feature flag: toggle Peak Shaving tab visibility (keep logic/code intact)
  const SHOW_PEAK_SHAVING = false

  // Plain-language computation info modal for Peak Shaving
  const [calcInfoOpen, setCalcInfoOpen] = useState(false)
  const [calcInfoTitle, setCalcInfoTitle] = useState('')
  const [calcInfoBody, setCalcInfoBody] = useState<React.ReactNode>(null)
  
  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentLead.status) return
    
    const oldStatus = currentLead.status
    setLoading(true)
    
    // Optimistically update local state
    const updatedLead = { ...currentLead, status: newStatus }
    setCurrentLead(updatedLead)
    onStatusChange?.(lead.id, newStatus)
    
    // Optimistically add activity to local state
    const tempActivity = {
      id: `temp-${Date.now()}`,
      lead_id: lead.id,
      activity_type: 'status_change',
      activity_data: {
        old_status: oldStatus,
        new_status: newStatus,
      },
      created_at: new Date().toISOString(),
    }
    setActivities(prev => [tempActivity, ...prev])
    
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Refresh activities to get the real activity from database
          await refreshActivities()
        }
      } else {
        // Revert optimistic update on error
        setCurrentLead({ ...currentLead, status: oldStatus })
        setActivities(prev => prev.filter(a => a.id !== tempActivity.id))
        const error = await response.json()
        alert(`Failed to update status: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      // Revert optimistic update on error
      setCurrentLead({ ...currentLead, status: oldStatus })
      setActivities(prev => prev.filter(a => a.id !== tempActivity.id))
      console.error('Error updating status:', error)
      alert('Failed to update status. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  // Handle add note
  const handleAddNote = async () => {
    if (!noteText.trim()) {
      alert('Please enter a note')
      return
    }
    
    const noteTextToSave = noteText.trim()
    setSavingNote(true)
    
    // Optimistically add note to local state
    const tempNote = {
      id: `temp-${Date.now()}`,
      lead_id: lead.id,
      note: noteTextToSave,
      created_by: 'admin',
      created_at: new Date().toISOString(),
    }
    setNotes(prev => [tempNote, ...prev])
    
    // Optimistically add activity to local state
    const tempActivity = {
      id: `temp-activity-${Date.now()}`,
      lead_id: lead.id,
      activity_type: 'note_added',
      activity_data: {
        note_preview: noteTextToSave.substring(0, 100),
      },
      created_at: new Date().toISOString(),
    }
    setActivities(prev => [tempActivity, ...prev])
    
    // Clear input and close modal immediately
    setNoteText('')
    setNoteModalOpen(false)
    
    try {
      const response = await fetch(`/api/leads/${lead.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          note: noteTextToSave,
          created_by: 'admin' // In production, get from auth context
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Replace temp note with real note from database
          setNotes(prev => prev.map(n => n.id === tempNote.id ? result.data : n))
          
          // Refresh activities to get the real activity from database
          await refreshActivities()
        }
      } else {
        // Revert optimistic updates on error
        setNotes(prev => prev.filter(n => n.id !== tempNote.id))
        setActivities(prev => prev.filter(a => a.id !== tempActivity.id))
        setNoteText(noteTextToSave)
        setNoteModalOpen(true)
        const error = await response.json()
        alert(`Failed to add note: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      // Revert optimistic updates on error
      setNotes(prev => prev.filter(n => n.id !== tempNote.id))
      setActivities(prev => prev.filter(a => a.id !== tempActivity.id))
      setNoteText(noteTextToSave)
      setNoteModalOpen(true)
      console.error('Error adding note:', error)
      alert('Failed to add note. Please try again.')
    } finally {
      setSavingNote(false)
    }
  }
  
  // Handle export PDF
  const handleExportPDF = async () => {
    try {
      // Open PDF in new window (will be converted to PDF by browser print dialog)
      const pdfUrl = `/api/leads/${lead.id}/export-pdf`
      window.open(pdfUrl, '_blank')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF. Please try again.')
    }
  }
  
  // Handle delete lead
  const handleDeleteLead = async () => {
    if (!confirm(`Are you sure you want to delete this lead? This action cannot be undone.`)) {
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          alert('Lead deleted successfully')
          onClose()
          // Refresh the page or update parent component
          window.location.reload()
        }
      } else {
        const error = await response.json()
        alert(`Failed to delete lead: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting lead:', error)
      alert('Failed to delete lead. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  // Refresh activities when tab changes to activity
  useEffect(() => {
    if (activeTab === 'activity') {
      refreshActivities()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const openPeakShavingInfo = (plan: 'TOU' | 'ULO') => {
    const planData: any = plan === 'TOU' ? peakShaving?.tou : peakShaving?.ulo
    const usage = planData?.result?.usageByPeriod
    const offsets = planData?.result?.batteryOffsets
    const leftover = planData?.result?.leftoverEnergy
    const annual = plan === 'TOU' ? touAnnual : uloAnnual
    const monthly = getCombinedBlock(planData)?.monthly
    const payback = plan === 'TOU' ? touPayback : uloPayback
    const profit25 = getCombinedBlock(planData)?.projection?.netProfit25Year

    setCalcInfoTitle(`${plan === 'TOU' ? 'Time‑of‑Use (TOU)' : 'Ultra‑Low Overnight (ULO)'} — How we calculate`)
    setCalcInfoBody(
      <div className="space-y-3 text-gray-700">
        <p>
          We start with the customer's yearly energy use and spread it across the plan's time windows (Peak, Mid‑peak, Off‑peak{plan === 'ULO' ? ', Ultra‑low' : ''}).
          Then, we use stored solar energy in the battery to replace the most expensive hours first.
        </p>
        <div className="bg-gray-50 rounded p-3 text-sm">
          <div className="font-semibold mb-1">1) Energy used during the day</div>
          {usage ? (
            <ul className="list-disc ml-4">
              <li>Peak hours: {usage.onPeak?.toLocaleString()} kWh</li>
              <li>Mid‑peak: {usage.midPeak?.toLocaleString()} kWh</li>
              <li>Off‑peak: {usage.offPeak?.toLocaleString()} kWh</li>
              {plan === 'ULO' && usage.ultraLow != null && (<li>Ultra‑low: {usage.ultraLow?.toLocaleString()} kWh</li>)}
            </ul>
          ) : (
            <div>Not available</div>
          )}
        </div>
        <div className="bg-gray-50 rounded p-3 text-sm">
          <div className="font-semibold mb-1">2) Energy covered by the battery</div>
          {offsets ? (
            <ul className="list-disc ml-4">
              <li>Peak hours: {offsets.onPeak?.toLocaleString()} kWh</li>
              <li>Mid‑peak: {offsets.midPeak?.toLocaleString()} kWh</li>
              <li>Off‑peak: {offsets.offPeak?.toLocaleString()} kWh</li>
            </ul>
          ) : (
            <div>Not available</div>
          )}
          <div className="text-xs text-gray-500 mt-2">We always fill the most expensive hours first to maximize savings.</div>
        </div>
        <div className="bg-gray-50 rounded p-3 text-sm">
          <div className="font-semibold mb-1">3) What's left to buy from the grid</div>
          {leftover ? (
            <div>
              <div><span className="font-semibold">{leftover.totalKwh?.toLocaleString()} kWh</span> at {leftover.ratePerKwh ?? '—'} per kWh</div>
              <div className="text-xs text-gray-500">About {Math.round((leftover.costPercent || 0) * 10) / 10}% of the total bill</div>
            </div>
          ) : (
            <div>Not available</div>
          )}
        </div>
        <div className="bg-white rounded border p-3 text-sm">
          <div className="font-semibold mb-1">Savings Summary</div>
          <ul className="list-disc ml-4">
            <li>Estimated yearly savings: {typeof annual === 'number' ? formatCurrency(annual) : '—'}</li>
            <li>Estimated monthly savings: {monthly ? formatCurrency(monthly) : '—'}</li>
            <li>Estimated payback time: {typeof payback === 'number' ? `${payback} years` : '—'}</li>
            <li>Estimated 25‑year profit: {profit25 != null ? formatCurrency(profit25) : '—'}</li>
          </ul>
        </div>
        <p className="text-xs text-gray-500">Notes: The exact split by time windows and savings evolve if rates or usage change. We use the plan's official time windows and the battery's usable capacity to keep estimates realistic.</p>
      </div>
    )
    setCalcInfoOpen(true)
  }
  
  // Destructure lead data
  const {
    coordinates,
    city,
    estimateData,
    peakShaving,
    photoUrls,
    photoSummary,
    combinedTotalSystemCost,
    combinedTotalIncentives,
    combinedNetAfterIncentives,
    touCombined,
    uloCombined,
    touAnnual,
    uloAnnual,
    touPayback,
    uloPayback,
    roofSectionsParsed,
    numPanels,
    productionChartData,
    displayTotalCost,
    displayIncentives,
    displayNetCost,
    displayAnnualProduction,
    displayMonthlyProduction,
    batteryPrice,
    batteryRebate,
    selectedBatteries,
    selectedBatteryFromPeak,
    netMetering,
  } = leadData

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-start justify-center">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl my-8">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-xl px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-navy-500">{currentLead.full_name}</h2>
                <p className="text-sm text-gray-600">{currentLead.address}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(currentLead.status)}`}>
                {currentLead.status}
              </span>
              {/* No best plan badge; users do not select a plan */}
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExportPDF}
                className="btn-outline border-navy-500 text-navy-500 text-sm px-4 py-2 hover:bg-navy-50"
                disabled={loading}
              >
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
              {SHOW_PEAK_SHAVING && (
                <button
                  onClick={() => setActiveTab('peakshaving')}
                  className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
                    activeTab === 'peakshaving'
                      ? 'border-red-500 text-red-500'
                      : 'border-transparent text-gray-600 hover:text-navy-500'
                  }`}
                >
                  Peak Shaving
                </button>
              )}
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
              <OverviewTab
                lead={lead}
                city={city}
                coordinates={coordinates}
                photoUrls={photoUrls}
                photoSummary={photoSummary}
                roofSectionsParsed={roofSectionsParsed}
                numPanels={numPanels}
                displayTotalCost={displayTotalCost}
                displayIncentives={displayIncentives}
                displayNetCost={displayNetCost}
                displayAnnualProduction={displayAnnualProduction}
                combinedTotalSystemCost={combinedTotalSystemCost}
                combinedTotalIncentives={combinedTotalIncentives}
                combinedNetAfterIncentives={combinedNetAfterIncentives}
                batteryPrice={batteryPrice}
                batteryRebate={batteryRebate}
                selectedBatteries={selectedBatteries}
                selectedBatteryFromPeak={selectedBatteryFromPeak}
                peakShaving={peakShaving}
                touAnnual={touAnnual}
                uloAnnual={uloAnnual}
                touPayback={touPayback}
                uloPayback={uloPayback}
                  netMetering={netMetering}
                onImageClick={(image) => {
                  setSelectedImage(image)
                  setImageModalOpen(true)
                }}
              />
            )}

            {activeTab === 'estimate' && (
              <EstimateTab
                productionChartData={productionChartData}
                displayAnnualProduction={displayAnnualProduction}
                isMobile={isMobile}
              />
            )}

            {SHOW_PEAK_SHAVING && activeTab === 'peakshaving' && (
              <PeakShavingTab
                lead={lead}
                peakShaving={peakShaving}
                touAnnual={touAnnual}
                uloAnnual={uloAnnual}
                touPayback={touPayback}
                uloPayback={uloPayback}
                onInfoClick={openPeakShavingInfo}
              />
            )}

            {activeTab === 'activity' && (
              <ActivityTab
                notes={notes}
                activities={activities}
              />
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 rounded-b-xl px-6 py-4 flex items-center justify-between">
            <div className="flex gap-2">
              <select
                value={currentLead.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={loading}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="closed">Closed</option>
              </select>
              <button 
                onClick={() => setNoteModalOpen(true)}
                className="btn-outline border-gray-300 text-gray-700 text-sm px-4 py-2"
              >
                <Edit2 size={16} />
                Add Note
              </button>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleDeleteLead}
                disabled={loading}
                className="btn-outline border-red-500 text-red-500 text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
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

      {/* Image Modal for viewing photos in full size */}
      {selectedImage && (
        <ImageModal
          isOpen={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
          imageSrc={selectedImage.src}
          imageAlt={selectedImage.alt}
          title={selectedImage.title}
        />
      )}

      {/* Peak Shaving Info Modal */}
      <PeakShavingInfoModal
        isOpen={calcInfoOpen}
        onClose={() => setCalcInfoOpen(false)}
        title={calcInfoTitle}
        body={calcInfoBody}
      />

      {/* Add Note Modal */}
      <AddNoteModal
        isOpen={noteModalOpen}
        onClose={() => {
          setNoteModalOpen(false)
          setNoteText('')
        }}
        noteText={noteText}
        onNoteTextChange={setNoteText}
        onSave={handleAddNote}
        saving={savingNote}
      />
    </div>
  )
}


