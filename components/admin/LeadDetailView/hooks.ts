// Custom hooks for LeadDetailView component

import { useState, useEffect } from 'react'
import { parseJson, asNumber, getCombinedBlock, extractCityFromAddress, parseCoordinates } from './utils'

interface Lead {
  [key: string]: any
}

/**
 * Hook to parse and extract lead data
 */
export function useLeadData(lead: Lead) {
  // Parse coordinates if it's a string (JSONB from database)
  const coordinates = parseCoordinates(lead.coordinates)
    
  // Extract city from address if not provided
  const city = lead.city || extractCityFromAddress(lead.address)
  
  // Map database fields to expected format
  // Support multiple sources: solar_estimate, estimate_data, and full_data_json (for hrs_residential_leads)
  const estimateDataRaw = typeof lead.solar_estimate === 'string'
    ? parseJson(lead.solar_estimate)
    : (lead.solar_estimate || lead.estimate_data)
  
  // Also check full_data_json for hrs_residential_leads schema
  const fullDataJson = typeof lead.full_data_json === 'string' 
    ? parseJson(lead.full_data_json) 
    : lead.full_data_json
  
  const estimateData = estimateDataRaw || fullDataJson || null
  
  // Parse additional JSONB/string fields
  const peakShaving = parseJson(lead.peak_shaving) || lead.peak_shaving || null
  const productionMonthlyFromDb = Array.isArray(lead.production_monthly_kwh)
    ? lead.production_monthly_kwh
    : (typeof lead.production_monthly_kwh === 'string' ? parseJson(lead.production_monthly_kwh) : null)

  // Selected batteries (could be JSON string or array) - support new field name
  const selectedBatteries: string[] = Array.isArray(lead.selected_battery_ids)
    ? lead.selected_battery_ids
    : (Array.isArray(lead.selected_batteries)
      ? lead.selected_batteries
      : (typeof lead.selected_batteries === 'string' ? (parseJson(lead.selected_batteries) || []) : []))
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

  // Battery simple values (if present) - support new field names
  const batteryPrice = asNumber(lead.battery_cost) ?? asNumber(lead.battery_price)
  const batteryRebate = asNumber(lead.battery_rebate)
  const batteryNet = asNumber(lead.battery_net_cost) ?? (batteryPrice && batteryRebate ? batteryPrice - batteryRebate : null)

  // Map annual savings - prefer combined, then solar-only; coerce strings
  const annualSavings = asNumber(lead.combined_annual_savings) 
    ?? asNumber(lead.solar_annual_savings) 
    ?? asNumber(lead.annual_savings) 
    ?? null

  // Safe display values with DB fallbacks (coerce numeric strings)
  // Support both old schema (solar_total_cost, solar_incentives) and new hrs_residential_leads schema (system_cost, solar_rebate)
  // Note: estimateData.costs uses systemCost (not totalCost) for hrs_residential_leads
  const displayTotalCost = asNumber(estimateData?.costs?.systemCost) 
    ?? asNumber(estimateData?.costs?.totalCost) 
    ?? asNumber(lead.solar_total_cost) 
    ?? asNumber(lead.system_cost)
  const displayIncentives = asNumber(estimateData?.costs?.solarRebate) 
    ?? asNumber(estimateData?.costs?.incentives) 
    ?? asNumber(lead.solar_incentives) 
    ?? asNumber(lead.solar_rebate)
  const displayNetCost = asNumber(estimateData?.costs?.netCost) 
    ?? asNumber(lead.solar_net_cost) 
    ?? asNumber(lead.net_cost)
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
  // Net after incentives = Total System Cost - Total Incentives
  // Also support direct net_cost field from hrs_residential_leads if available
  const combinedNetAfterIncentives = asNumber(lead.net_cost) 
    || (combinedTotalSystemCost - combinedTotalIncentives)
    || ((displayNetCost ?? 0) + (batteryNet ?? 0))

  // Plan comparison values with robust extraction for nested shapes
  const touCombined = getCombinedBlock(peakShaving?.tou)
  const uloCombined = getCombinedBlock(peakShaving?.ulo)
  
  // Use new direct fields first, then fall back to old structure
  const touAnnual = asNumber(lead.tou_annual_savings)
    ?? asNumber(touCombined?.annual)
    ?? asNumber(peakShaving?.tou?.result?.annualSavings)
  const uloAnnual = asNumber(lead.ulo_annual_savings)
    ?? asNumber(uloCombined?.annual)
    ?? asNumber(peakShaving?.ulo?.result?.annualSavings)
  const touPayback = asNumber(lead.tou_payback_period)
    ?? asNumber(lead.tou_payback_years)
    ?? asNumber(peakShaving?.tou?.projection?.paybackYears)
    ?? asNumber(touCombined?.projection?.paybackYears)
  const uloPayback = asNumber(lead.ulo_payback_period)
    ?? asNumber(lead.ulo_payback_years)
    ?? asNumber(peakShaving?.ulo?.projection?.paybackYears)
    ?? asNumber(uloCombined?.projection?.paybackYears)
  
  // Choose useful Annual Savings and Payback based on best plan/available data
  const combinedAnnual = asNumber(combinedTotals?.annual_savings) ?? asNumber(lead.combined_annual_savings)
  const bestAnnualSavings = (() => {
    if (typeof combinedAnnual === 'number') return combinedAnnual
    return annualSavings ?? null
  })()
  const combinedPayback = asNumber(combinedTotals?.payback_years) ?? asNumber(lead.combined_payback_years)
  const bestPayback = (() => {
    if (typeof combinedPayback === 'number') return combinedPayback
    return typeof displayPaybackYears === 'number' ? displayPaybackYears : null
  })()

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

  return {
    coordinates,
    city,
    estimateData,
    peakShaving,
    selectedBatteries,
    selectedBatteryFromPeak,
    photoUrls,
    photoSummary,
    combinedTotals,
    combinedNet,
    combinedMonthly,
    combinedProfit25,
    batteryPrice,
    batteryRebate,
    batteryNet,
    annualSavings,
    displayTotalCost,
    displayIncentives,
    displayNetCost,
    displayPaybackYears,
    displayMonthlySavings,
    displayAnnualProduction,
    displayMonthlyProduction,
    combinedTotalSystemCost,
    combinedTotalIncentives,
    combinedNetAfterIncentives,
    touCombined,
    uloCombined,
    touAnnual,
    uloAnnual,
    touPayback,
    uloPayback,
    bestAnnualSavings,
    bestPayback,
    roofSectionsParsed,
    numPanels,
    productionChartData,
  }
}

/**
 * Hook for mobile detection
 */
export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const handleResize = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return isMobile
}

/**
 * Hook for managing notes
 */
export function useNotes(leadId: string) {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch(`/api/leads/${leadId}/notes`)
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
  }, [leadId])

  return { notes, setNotes, loading, setLoading }
}

/**
 * Hook for managing activities
 */
export function useActivities(leadId: string) {
  const [activities, setActivities] = useState<any[]>([])

  const refreshActivities = async () => {
    try {
      const response = await fetch(`/api/leads?status=all`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data.leads) {
          const updatedLead = result.data.leads.find((l: any) => l.id === leadId)
          if (updatedLead && updatedLead.activities) {
            setActivities(updatedLead.activities)
          } else if (updatedLead) {
            setActivities([])
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing activities:', error)
    }
  }

  useEffect(() => {
    refreshActivities()
  }, [leadId])

  return { activities, setActivities, refreshActivities }
}

