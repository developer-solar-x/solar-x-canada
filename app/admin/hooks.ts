import { useMemo } from 'react'
import { getPartialLeadTotalSteps } from './partial-lead-steps'

interface Lead {
  id: string
  system_size_kw?: number
  annual_savings?: number
  status: string
  province?: string
  program_type?: string
  combined_total_cost?: number
  solar_total_cost?: number
  solar_incentives?: number
  combined_net_cost?: number
  solar_net_cost?: number
  created_at: string
  [key: string]: any
}

interface PartialLead {
  id: string
  current_step: number
  created_at: string
  updated_at: string
  resumed_at?: string | null
  estimator_data?: {
    estimatorMode?: string
    programType?: string
    systemType?: string
    address?: string
    peakShaving?: {
      ratePlan?: string
    }
    roofAreaSqft?: number
    annualUsageKwh?: number
    selectedAddOns?: string[]
    photoCount?: number
  }
  [key: string]: any
}

export function useLeadStats(leads: Lead[]) {
  return useMemo(() => {
    const getSystemSizeKw = (lead: Lead): number => {
      if (lead.system_size_kw && lead.system_size_kw > 0) return lead.system_size_kw

      // Fallbacks from full_data_json / estimator_data or other nested structures
      const full: any =
        (lead as any).full_data_json ||
        (lead as any).fullDataJson ||
        (lead as any).estimator_data ||
        (lead as any).estimatorData ||
        null
      if (!full) return 0

      const fromSimplified = typeof full.systemSizeKw === 'number' ? full.systemSizeKw : 0
      const fromEstimate = typeof full.estimate?.system?.sizeKw === 'number' ? full.estimate.system.sizeKw : 0

      return fromSimplified || fromEstimate || 0
    }

    const getAnnualSavings = (lead: Lead): number => {
      // Prefer explicit column first
      if (lead.annual_savings && lead.annual_savings > 0) return lead.annual_savings

      const touCol = typeof (lead as any).tou_annual_savings === 'number' ? (lead as any).tou_annual_savings : 0
      const uloCol = typeof (lead as any).ulo_annual_savings === 'number' ? (lead as any).ulo_annual_savings : 0

      const full: any =
        (lead as any).full_data_json ||
        (lead as any).fullDataJson ||
        (lead as any).estimator_data ||
        (lead as any).estimatorData ||
        null
      const touFull =
        typeof full?.tou?.annualSavings === 'number'
          ? full.tou.annualSavings
          : typeof full?.tou?.annual_savings === 'number'
          ? full.tou.annual_savings
          : 0
      const uloFull =
        typeof full?.ulo?.annualSavings === 'number'
          ? full.ulo.annualSavings
          : typeof full?.ulo?.annual_savings === 'number'
          ? full.ulo.annual_savings
          : 0

      const combinedFromFull =
        typeof full?.costs?.annualSavings === 'number' ? full.costs.annualSavings : 0

      return Math.max(
        0,
        lead.annual_savings || 0,
        touCol,
        uloCol,
        touFull,
        uloFull,
        combinedFromFull
      )
    }

    return {
      totalLeads: leads.length,
      avgSystemSize: leads.length > 0 
        ? leads.reduce((sum, l) => sum + getSystemSizeKw(l), 0) / leads.length
        : 0,
      totalSavings: leads.reduce((sum, l) => sum + getAnnualSavings(l), 0),
      newLeads: leads.filter(l => l.status === 'new').length,
    }
  }, [leads])
}

export function usePartialLeadStats(partialLeads: PartialLead[]) {
  return useMemo(() => {
    return {
      total: partialLeads.length,
      recentCount: partialLeads.filter((p) => {
        const hoursSinceCreated = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60)
        return hoursSinceCreated <= 24
      }).length,
      highCompletionCount: partialLeads.filter((p) => {
        const totalSteps = getPartialLeadTotalSteps({
          estimatorMode: p.estimator_data?.estimatorMode,
          // Prefer top-level program_type if present, fall back to estimator_data.programType
          programType: (p as any).program_type ?? p.estimator_data?.programType ?? null,
          systemType: p.estimator_data?.systemType,
        })
        const clampedIndex = Math.max(0, Math.min(p.current_step, totalSteps - 1))
        const completion = Math.round(((clampedIndex + 1) / totalSteps) * 100)
        return completion >= 70
      }).length,
      avgCompletion: partialLeads.length > 0
        ? partialLeads.reduce((sum: number, p) => {
            const totalSteps = getPartialLeadTotalSteps({
              estimatorMode: p.estimator_data?.estimatorMode,
              programType: (p as any).program_type ?? p.estimator_data?.programType ?? null,
              systemType: p.estimator_data?.systemType,
            })
            const clampedIndex = Math.max(0, Math.min(p.current_step, totalSteps - 1))
            const completion = Math.round(((clampedIndex + 1) / totalSteps) * 100)
            return sum + completion
          }, 0) / partialLeads.length
        : 0,
    }
  }, [partialLeads])
}

