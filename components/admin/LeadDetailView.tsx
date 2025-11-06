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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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
  
  // State for notes and activities
  const [notes, setNotes] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>(lead.activities || [])
  const [currentLead, setCurrentLead] = useState<Lead>(lead)
  const [loading, setLoading] = useState(false)
  
  // State for add note modal
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  
  // Mobile detection for responsive charts
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const handleResize = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Fetch notes and activities when component loads
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch(`/api/leads/${lead.id}/notes`)
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setNotes(result.data.notes || [])
          }
        }
      } catch (error) {
        console.error('Error fetching notes:', error)
      }
    }
    
    fetchNotes()
    refreshActivities()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id])

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
  
  // Refresh activities - fetch activities directly for this lead
  const refreshActivities = async () => {
    try {
      // Fetch activities directly from the activities table by querying all leads and finding this one
      // This is a workaround since we don't have a direct activities endpoint
      const response = await fetch(`/api/leads?status=all`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data.leads) {
          const updatedLead = result.data.leads.find((l: Lead) => l.id === lead.id)
          if (updatedLead && updatedLead.activities) {
            setActivities(updatedLead.activities)
          } else if (updatedLead) {
            // If lead found but no activities, set empty array
            setActivities([])
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing activities:', error)
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
  
  // Parse coordinates if it's a string (JSONB from database)
  const coordinates = typeof currentLead.coordinates === 'string' 
    ? JSON.parse(currentLead.coordinates) 
    : currentLead.coordinates
    
  // Extract city from address if not provided
  const city = currentLead.city || (() => {
    if (!currentLead.address) return ''
    const parts = currentLead.address.split(',').map(p => p.trim())
    // Expect: [street, city, province postal, country]
    return parts[1] || parts[0] || ''
  })()
  
  // Safe JSON parse helper
  const parseJson = (value: any): any => {
    if (typeof value === 'string') {
      try { return JSON.parse(value) } catch { return null }
    }
    return value
  }

  // Numeric coercion helper
  const asNumber = (value: any): number | null => {
    if (typeof value === 'number' && isFinite(value)) return value
    if (typeof value === 'string') {
      const n = parseFloat(value)
      return isNaN(n) ? null : n
    }
    return null
  }
  
  // Map database fields to expected format
  // Database uses solar_estimate (JSONB), but component expects estimate_data
  // Parse if it's a string (JSONB from database)
  const estimateDataRaw = typeof lead.solar_estimate === 'string'
    ? parseJson(lead.solar_estimate)
    : (lead.solar_estimate || lead.estimate_data)
  const estimateData = estimateDataRaw || null
  
  // Parse additional JSONB/string fields
  const peakShaving = parseJson(lead.peak_shaving) || lead.peak_shaving || null
  const productionMonthlyFromDb = Array.isArray(lead.production_monthly_kwh)
    ? lead.production_monthly_kwh
    : (typeof lead.production_monthly_kwh === 'string' ? parseJson(lead.production_monthly_kwh) : null)

  // Selected batteries (could be JSON string or array)
  const selectedBatteries: string[] = Array.isArray(lead.selected_batteries)
    ? lead.selected_batteries
    : (typeof lead.selected_batteries === 'string' ? (parseJson(lead.selected_batteries) || []) : [])
  const selectedBatteryFromPeak: string | null = peakShaving?.selectedBattery || null
  
  // Parse photo URLs - filter out blob URLs (they expire)
  const photoUrls = Array.isArray(lead.photo_urls)
    ? lead.photo_urls.filter((url: any) => url && typeof url === 'string' && !url.startsWith('blob:'))
    : (typeof lead.photo_urls === 'string' ? parseJson(lead.photo_urls)?.filter((url: any) => url && typeof url === 'string' && !url.startsWith('blob:')) : [])
  
  // Parse photo summary if it's a JSON string
  const photoSummary = typeof lead.photo_summary === 'string' ? parseJson(lead.photo_summary) : lead.photo_summary

  // Combined totals JSON (parsed)
  const combinedTotals = typeof lead.combined_totals === 'string' ? parseJson(lead.combined_totals) : lead.combined_totals
  const combinedNet = asNumber(combinedTotals?.net_cost)
  const combinedMonthly = asNumber(combinedTotals?.monthly_savings)
  const combinedProfit25 = asNumber(combinedTotals?.profit_25y)

  // Battery simple values (if present)
  const batteryPrice = asNumber(lead.battery_price)
  const batteryRebate = asNumber(lead.battery_rebate)
  const batteryNet = asNumber(lead.battery_net_cost)

  // Map annual savings - prefer combined, then solar-only; coerce strings
  const annualSavings = asNumber(lead.combined_annual_savings) 
    ?? asNumber(lead.solar_annual_savings) 
    ?? asNumber(lead.annual_savings) 
    ?? null

  // Safe display values with DB fallbacks (coerce numeric strings)
  const displayTotalCost = asNumber(estimateData?.costs?.totalCost) ?? asNumber(lead.solar_total_cost)
  const displayIncentives = asNumber(estimateData?.costs?.incentives) ?? asNumber(lead.solar_incentives)
  const displayNetCost = asNumber(estimateData?.costs?.netCost) 
    ?? asNumber(lead.solar_net_cost) 
    ?? asNumber(lead.combined_net_cost)
  const displayPaybackYears = asNumber(estimateData?.savings?.paybackYears) ?? asNumber(lead.combined_payback_years)
  const displayMonthlySavings = asNumber(estimateData?.savings?.monthlySavings) ?? asNumber(lead.solar_monthly_savings)
  const displayAnnualProduction = asNumber(estimateData?.production?.annualKwh) ?? asNumber(lead.production_annual_kwh)
  const displayMonthlyProduction = Array.isArray(estimateData?.production?.monthlyKwh)
    ? estimateData.production.monthlyKwh
    : (Array.isArray(productionMonthlyFromDb) ? productionMonthlyFromDb : null)

  // Derived combined figures using saved battery_* columns when available
  const combinedTotalSystemCost = (displayTotalCost ?? 0) + (batteryPrice ?? 0)
  const combinedTotalIncentives = (displayIncentives ?? 0) + (batteryRebate ?? 0)
  const combinedNetAfterIncentives = (displayNetCost ?? 0) + (batteryNet ?? 0)

  // Plan comparison values with robust extraction for nested shapes
  const getCombinedBlock = (plan: any) => {
    if (!plan) return null
    return plan?.allResults?.combined?.combined
      || plan?.allResults?.combined
      || plan?.combined
      || null
  }
  const touCombined = getCombinedBlock(peakShaving?.tou)
  const uloCombined = getCombinedBlock(peakShaving?.ulo)
  
  const touAnnual = asNumber(lead.tou_annual_savings)
    ?? asNumber(touCombined?.annual)
    ?? asNumber(peakShaving?.tou?.result?.annualSavings)
  const uloAnnual = asNumber(lead.ulo_annual_savings)
    ?? asNumber(uloCombined?.annual)
    ?? asNumber(peakShaving?.ulo?.result?.annualSavings)
  const touPayback = asNumber(lead.tou_payback_years)
    ?? asNumber(peakShaving?.tou?.projection?.paybackYears)
    ?? asNumber(touCombined?.projection?.paybackYears)
  const uloPayback = asNumber(lead.ulo_payback_years)
    ?? asNumber(peakShaving?.ulo?.projection?.paybackYears)
    ?? asNumber(uloCombined?.projection?.paybackYears)
  
  // Choose useful Annual Savings and Payback based on best plan/available data
  const combinedAnnual = asNumber(combinedTotals?.annual_savings) ?? asNumber(lead.combined_annual_savings)
  const bestAnnualSavings = (() => {
    // Headline uses combined totals if present; else solar-only; do not use plan values here
    if (typeof combinedAnnual === 'number') return combinedAnnual
    return annualSavings ?? null
  })()
  const combinedPayback = asNumber(combinedTotals?.payback_years) ?? asNumber(lead.combined_payback_years)
  const bestPayback = (() => {
    // Headline uses combined totals if present; else solar-only; do not use plan values here
    if (typeof combinedPayback === 'number') return combinedPayback
    return typeof displayPaybackYears === 'number' ? displayPaybackYears : null
  })()

  // No single best plan display; we always show full comparison in its own section
  
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

  // Roof sections: support number, JSON string, or array
  const roofSectionsParsed = (() => {
    if (Array.isArray(lead.roof_sections)) return lead.roof_sections
    if (typeof lead.roof_sections === 'string') return parseJson(lead.roof_sections) || []
    return []
  })()

  // Panels count: prefer DB column, then estimate JSON
  const numPanels = asNumber(lead.num_panels) ?? asNumber(estimateData?.system?.numPanels)

  // Prepare chart data for Full Estimate tab
  const productionChartData = Array.isArray(displayMonthlyProduction) && displayMonthlyProduction.length > 0
    ? displayMonthlyProduction.map((kwh: number, i: number) => ({
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
        production: kwh,
      }))
    : []


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
                    
                    {/* Roof Snapshot or Placeholder */}
                    {lead.map_snapshot_url ? (
                      <div className="rounded-lg overflow-hidden mb-4" style={{ height: '400px' }}>
                        <img
                          src={typeof lead.map_snapshot_url === 'string' ? lead.map_snapshot_url : ''}
                          alt="Roof snapshot"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                    <div className="bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ height: '400px' }}>
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <MapPin size={48} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Satellite View Not Available in Demo</p>
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
                                setSelectedImage({ 
                                  src: url, 
                                  alt: `Property photo ${index + 1}`, 
                                  title: `Property Photo ${index + 1}` 
                                })
                                setImageModalOpen(true)
                              }}
                            >
                              <img
                                src={url}
                                alt={`Property photo ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback if image fails to load
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
                          {formatCurrency(combinedTotalIncentives)}
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          Solar + Battery incentives
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                        <div className="text-xs text-blue-600 mb-1">Net After Incentives</div>
                        <div className="text-3xl font-bold text-blue-600">
                          {formatCurrency(combinedNetAfterIncentives)}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Based on saved solar and battery costs
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
                          <span className="ml-2 font-semibold text-green-600">{typeof displayIncentives === 'number' ? formatCurrency(displayIncentives) : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Battery Cost:</span>
                          <span className="ml-2 font-semibold text-navy-500">{typeof batteryPrice === 'number' ? formatCurrency(batteryPrice) : '—'}</span>
                      </div>
                        <div>
                          <span className="text-gray-600">Battery Rebate:</span>
                          <span className="ml-2 font-semibold text-green-600">{typeof batteryRebate === 'number' ? formatCurrency(batteryRebate) : '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total System Cost:</span>
                          <span className="ml-2 font-semibold text-navy-700">{formatCurrency(combinedTotalSystemCost)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Incentives:</span>
                          <span className="ml-2 font-semibold text-green-700">{formatCurrency(combinedTotalIncentives)}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600">Net After Incentives:</span>
                          <span className="ml-2 font-semibold text-green-700">{formatCurrency(combinedNetAfterIncentives)}</span>
                    </div>
                  </div>

                    </div>

                    {/* Energy Usage (moved here) */}
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
                  {lead.peak_shaving && (
                    <div className="card p-6">
                      <h3 className="text-lg font-bold text-navy-500 mb-4">Rate Plan Comparison</h3>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        {peakShaving?.tou && (
                          <div className="border rounded-lg p-3">
                            <div className="text-xs text-gray-600 mb-1">TOU</div>
                            <div>Annual: <span className="font-semibold text-navy-600">{touAnnual ? formatCurrency(touAnnual) : '—'}</span></div>
                            <div>Payback: <span className="font-semibold text-navy-600">{typeof touPayback === 'number' ? `${touPayback} yrs` : '—'}</span></div>
                            {getCombinedBlock(peakShaving?.tou)?.projection?.netProfit25Year !== undefined && (
                              <div>Profit 25y: <span className="font-semibold text-green-700">{formatCurrency(getCombinedBlock(peakShaving?.tou)?.projection?.netProfit25Year || 0)}</span></div>
                            )}
                          </div>
                        )}
                        {peakShaving?.ulo && (
                          <div className="border rounded-lg p-3">
                            <div className="text-xs text-gray-600 mb-1">ULO</div>
                            <div>Annual: <span className="font-semibold text-navy-600">{uloAnnual ? formatCurrency(uloAnnual) : '—'}</span></div>
                            <div>Payback: <span className="font-semibold text-navy-600">{typeof uloPayback === 'number' ? `${uloPayback} yrs` : '—'}</span></div>
                            {getCombinedBlock(peakShaving?.ulo)?.projection?.netProfit25Year !== undefined && (
                              <div>Profit 25y: <span className="font-semibold text-green-700">{formatCurrency(getCombinedBlock(peakShaving?.ulo)?.projection?.netProfit25Year || 0)}</span></div>
                            )}
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
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-sm font-semibold">
                            HubSpot Status: {currentLead.hubspot_synced ? (
                              <span className="text-green-600">✓ Synced</span>
                            ) : (
                              <span className="text-gray-400">Not Synced</span>
                            )}
                          </div>
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                            Coming Soon
                          </span>
                        </div>
                        {currentLead.hubspot_contact_id && (
                          <div className="text-xs text-gray-500 mt-1">
                            Contact ID: {currentLead.hubspot_contact_id}
                          </div>
                        )}
                        {currentLead.hubspot_deal_id && (
                          <div className="text-xs text-gray-500">
                            Deal ID: {currentLead.hubspot_deal_id}
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
            )}

            {activeTab === 'estimate' && (
              <div className="space-y-6">
                {/* Annual Production Chart */}
                {productionChartData.length > 0 && (
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-navy-500 mb-4">Monthly Production</h3>
                    <div className="h-[22rem] sm:h-80 md:h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={productionChartData} margin={isMobile ? { top: 8, right: 20, left: 36, bottom: 36 } : { top: 10, right: 20, left: 48, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: isMobile ? 10 : 11 }}
                            label={{ value: 'Month', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
                          />
                          <YAxis 
                            tick={{ fontSize: isMobile ? 10 : 11 }}
                            tickFormatter={(v: number) => `${Math.round(v)} kWh`}
                            label={{ value: 'Production (kWh)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                            width={isMobile ? 50 : 60}
                          />
                          <Tooltip 
                            formatter={(value: number) => `${Math.round(value)} kWh`}
                            labelStyle={{ fontWeight: 'bold' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="production" 
                            stroke="#1B4E7C" 
                            strokeWidth={isMobile ? 2 : 2.5}
                            dot={{ r: isMobile ? 3 : 4, fill: '#1B4E7C' }}
                            activeDot={{ r: isMobile ? 6 : 7 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 text-sm text-gray-600 text-center">
                      Annual Production: {typeof displayAnnualProduction === 'number' ? displayAnnualProduction.toLocaleString() : 'N/A'} kWh
                    </div>
                  </div>
                )}

              </div>
            )}

            {SHOW_PEAK_SHAVING && activeTab === 'peakshaving' && (
              <div className="space-y-6">
                {/* Annual Usage Summary */}
                <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="text-blue-600" size={24} />
                    <h3 className="text-lg font-bold text-navy-500">Customer's Annual Energy Usage</h3>
                  </div>
                  <div className="text-3xl font-bold text-blue-700">
                    {(asNumber(lead.annual_usage_kwh) ?? 0).toLocaleString()} kWh/year
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    This is how much electricity they use in a year
                  </div>
                </div>

                {/* Explanation */}
                <div className="card p-4 bg-yellow-50 border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>What is Peak Shaving?</strong> This shows how much money the customer can save by using solar panels and a battery to reduce their electricity costs during expensive peak hours. We compare two rate plans: Time-of-Use (TOU) and Ultra-Low Overnight (ULO).
                  </p>
                </div>

                {/* Top summary cards */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* TOU Card */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-navy-500">Time-of-Use Plan (TOU)</h3>
                        <p className="text-xs text-gray-500 mt-1">Rates change based on time of day</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">Solar + Battery</span>
                      <button onClick={() => openPeakShavingInfo('TOU')} className="ml-2 text-xs underline text-blue-700 hover:text-blue-900">How this is calculated</button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-[11px] text-gray-600">Yearly Savings</div>
                        <div className="font-semibold text-navy-600">{touAnnual ? formatCurrency(touAnnual) : '—'}</div>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-[11px] text-gray-600">Monthly Savings</div>
                        <div className="font-semibold text-navy-600">{getCombinedBlock(peakShaving?.tou)?.monthly ? formatCurrency(getCombinedBlock(peakShaving?.tou)?.monthly) : '—'}</div>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-[11px] text-gray-600">Payback Time</div>
                        <div className="font-semibold text-navy-600">{typeof touPayback === 'number' ? `${touPayback} yrs` : '—'}</div>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-[11px] text-gray-600">25-Year Profit</div>
                        <div className="font-semibold text-green-700">{getCombinedBlock(peakShaving?.tou)?.projection?.netProfit25Year != null ? formatCurrency(getCombinedBlock(peakShaving?.tou)?.projection?.netProfit25Year) : '—'}</div>
                      </div>
                    </div>
                    {/* Costs */}
                    <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
                      <div className="bg-white rounded border p-3">
                        <div className="text-[11px] text-gray-600">Current Electricity Cost</div>
                        <div className="font-semibold">{peakShaving?.tou?.result?.originalCost?.total != null ? formatCurrency(peakShaving.tou.result.originalCost.total) : '—'}</div>
                        <div className="text-[10px] text-gray-500 mt-1">Without solar</div>
                      </div>
                    </div>
                    {/* Usage + Offsets */}
                    <div className="mt-3 grid sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-gray-50 rounded p-3">
                        <div className="font-semibold text-gray-700 mb-1">Energy Used During Different Times</div>
                        <div className="text-gray-700 mt-1">
                          {peakShaving?.tou?.result?.usageByPeriod ? (
                            <>
                              <div>Peak hours: {peakShaving.tou.result.usageByPeriod.onPeak?.toLocaleString()} kWh</div>
                              <div>Mid-peak: {peakShaving.tou.result.usageByPeriod.midPeak?.toLocaleString()} kWh</div>
                              <div>Off-peak: {peakShaving.tou.result.usageByPeriod.offPeak?.toLocaleString()} kWh</div>
                            </>
                          ) : '—'}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <div className="font-semibold text-gray-700 mb-1">Energy Covered by Battery</div>
                        <div className="text-gray-700 mt-1">
                          {peakShaving?.tou?.result?.batteryOffsets ? (
                            <>
                              <div>Peak hours: {peakShaving.tou.result.batteryOffsets.onPeak?.toLocaleString()} kWh</div>
                              <div>Mid-peak: {peakShaving.tou.result.batteryOffsets.midPeak?.toLocaleString()} kWh</div>
                              <div>Off-peak: {peakShaving.tou.result.batteryOffsets.offPeak?.toLocaleString()} kWh</div>
                            </>
                          ) : '—'}
                        </div>
                      </div>
                    </div>
                    {peakShaving?.tou?.result?.leftoverEnergy && (
                      <div className="mt-3 text-[12px] bg-blue-50 border border-blue-200 rounded p-3 text-blue-800">
                        <div className="font-semibold mb-1">Energy Still Needed from Grid</div>
                        <div>
                          <span className="font-semibold">{peakShaving.tou.result.leftoverEnergy.totalKwh?.toLocaleString()} kWh</span> per year at {peakShaving.tou.result.leftoverEnergy.ratePerKwh ?? '—'} per kWh
                        </div>
                        <div className="mt-1">This represents only {Math.round((peakShaving.tou.result.leftoverEnergy.costPercent || 0) * 10) / 10}% of their total electricity bill</div>
                      </div>
                    )}
                  </div>

                  {/* ULO Card */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-navy-500">Ultra-Low Overnight Plan (ULO)</h3>
                        <p className="text-xs text-gray-500 mt-1">Cheaper rates overnight</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">Solar + Battery</span>
                      <button onClick={() => openPeakShavingInfo('ULO')} className="ml-2 text-xs underline text-emerald-700 hover:text-emerald-900">How this is calculated</button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-[11px] text-gray-600">Yearly Savings</div>
                        <div className="font-semibold text-navy-600">{uloAnnual ? formatCurrency(uloAnnual) : '—'}</div>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-[11px] text-gray-600">Monthly Savings</div>
                        <div className="font-semibold text-navy-600">{getCombinedBlock(peakShaving?.ulo)?.monthly ? formatCurrency(getCombinedBlock(peakShaving?.ulo)?.monthly) : '—'}</div>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-[11px] text-gray-600">Payback Time</div>
                        <div className="font-semibold text-navy-600">{typeof uloPayback === 'number' ? `${uloPayback} yrs` : '—'}</div>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-[11px] text-gray-600">25-Year Profit</div>
                        <div className="font-semibold text-green-700">{getCombinedBlock(peakShaving?.ulo)?.projection?.netProfit25Year != null ? formatCurrency(getCombinedBlock(peakShaving?.ulo)?.projection?.netProfit25Year) : '—'}</div>
                      </div>
                    </div>
                    {/* Costs */}
                    <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
                      <div className="bg-white rounded border p-3">
                        <div className="text-[11px] text-gray-600">Current Electricity Cost</div>
                        <div className="font-semibold">{peakShaving?.ulo?.result?.originalCost?.total != null ? formatCurrency(peakShaving.ulo.result.originalCost.total) : '—'}</div>
                        <div className="text-[10px] text-gray-500 mt-1">Without solar</div>
                      </div>
                    </div>
                    {/* Usage + Offsets */}
                    <div className="mt-3 grid sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-gray-50 rounded p-3">
                        <div className="font-semibold text-gray-700 mb-1">Energy Used During Different Times</div>
                        <div className="text-gray-700 mt-1">
                          {peakShaving?.ulo?.result?.usageByPeriod ? (
                            <>
                              <div>Peak hours: {peakShaving.ulo.result.usageByPeriod.onPeak?.toLocaleString()} kWh</div>
                              <div>Mid-peak: {peakShaving.ulo.result.usageByPeriod.midPeak?.toLocaleString()} kWh</div>
                              <div>Off-peak: {peakShaving.ulo.result.usageByPeriod.offPeak?.toLocaleString()} kWh</div>
                              <div>Ultra-low: {peakShaving.ulo.result.usageByPeriod.ultraLow?.toLocaleString()} kWh</div>
                            </>
                          ) : '—'}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <div className="font-semibold text-gray-700 mb-1">Energy Covered by Battery</div>
                        <div className="text-gray-700 mt-1">
                          {peakShaving?.ulo?.result?.batteryOffsets ? (
                            <>
                              <div>Peak hours: {peakShaving.ulo.result.batteryOffsets.onPeak?.toLocaleString()} kWh</div>
                              <div>Mid-peak: {peakShaving.ulo.result.batteryOffsets.midPeak?.toLocaleString()} kWh</div>
                              <div>Off-peak: {peakShaving.ulo.result.batteryOffsets.offPeak?.toLocaleString()} kWh</div>
                            </>
                          ) : '—'}
                        </div>
                      </div>
                    </div>
                    {peakShaving?.ulo?.result?.leftoverEnergy && (
                      <div className="mt-3 text-[12px] bg-emerald-50 border border-emerald-200 rounded p-3 text-emerald-800">
                        <div className="font-semibold mb-1">Energy Still Needed from Grid</div>
                        <div>
                          <span className="font-semibold">{peakShaving.ulo.result.leftoverEnergy.totalKwh?.toLocaleString()} kWh</span> per year at {peakShaving.ulo.result.leftoverEnergy.ratePerKwh ?? '—'} per kWh
                        </div>
                        <div className="mt-1">This represents only {Math.round((peakShaving.ulo.result.leftoverEnergy.costPercent || 0) * 10) / 10}% of their total electricity bill</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-3">
                {/* Notes Section */}
                {notes.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-navy-500 mb-3">Notes</h3>
                    <div className="space-y-2">
                      {notes.map((note) => (
                        <div key={note.id} className="card p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="text-xs text-gray-500">
                              {note.created_by || 'Admin'} • {new Date(note.created_at).toLocaleString()}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Activities Section */}
                <div>
                  <h3 className="text-lg font-bold text-navy-500 mb-3">Activity Log</h3>
                  {activities.length > 0 ? (
                    <div className="space-y-2">
                      {activities.map((a) => (
                        <div key={a.id} className="card p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="text-sm font-semibold capitalize text-navy-600">
                                {a.activity_type.replace('_',' ')}
                              </div>
                              {a.activity_data && (
                                <div className="text-xs text-gray-600 mt-1">
                                  {a.activity_type === 'status_change' && (
                                    <span>
                                      Changed from <span className="font-semibold">{a.activity_data.old_status}</span> to <span className="font-semibold">{a.activity_data.new_status}</span>
                                    </span>
                                  )}
                                  {a.activity_type === 'note_added' && (
                                    <span>Note added: {a.activity_data.note_preview || 'Note added'}</span>
                                  )}
                                  {a.activity_type === 'hubspot_sync' && (
                                    <span>Synced to HubSpot {a.activity_data.contactId ? `(Contact: ${a.activity_data.contactId.substring(0, 8)}...)` : ''}</span>
                                  )}
                                  {a.activity_type === 'email_sent' && (
                                    <span>Email sent {a.activity_data.subject ? `: ${a.activity_data.subject}` : ''}</span>
                                  )}
                                  {a.activity_type === 'estimate_updated' && (
                                    <span>Estimate updated {a.activity_data.field ? `: ${a.activity_data.field}` : ''}</span>
                                  )}
                                </div>
                              )}
                              {!a.activity_data && (
                                <div className="text-xs text-gray-500 mt-1 italic">
                                  No additional details
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                              {new Date(a.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Clock size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="text-sm">No activity yet</p>
                      <p className="text-xs text-gray-400 mt-2">Activities will appear here as you interact with this lead</p>
                    </div>
                  )}
                </div>
              </div>
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
      {calcInfoOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-navy-600">{calcInfoTitle}</h3>
              <button onClick={() => setCalcInfoOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="mt-3 max-h-[65vh] overflow-y-auto">
              {calcInfoBody}
            </div>
            <div className="mt-4 text-right">
              <button onClick={() => setCalcInfoOpen(false)} className="btn-primary px-4 py-2">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {noteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-navy-600">Add Note</h3>
              <button 
                onClick={() => {
                  setNoteModalOpen(false)
                  setNoteText('')
                }} 
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={savingNote}
              >
                <X size={18} />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Note
              </label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter your note here..."
                rows={6}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 outline-none resize-none"
                disabled={savingNote}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => {
                  setNoteModalOpen(false)
                  setNoteText('')
                }}
                disabled={savingNote}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddNote}
                disabled={savingNote || !noteText.trim()}
                className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingNote ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


