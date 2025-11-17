import { useMemo } from 'react'

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
    return {
      totalLeads: leads.length,
      avgSystemSize: leads.length > 0 
        ? leads.reduce((sum, l) => sum + (l.system_size_kw || 0), 0) / leads.length
        : 0,
      totalSavings: leads.reduce((sum, l) => sum + (l.annual_savings || 0), 0),
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
        const totalSteps = p.current_step >= 8 ? 8 : (p.estimator_data?.estimatorMode === 'easy' ? 8 : 7)
        const completion = Math.round((p.current_step / totalSteps) * 100)
        return completion >= 70
      }).length,
      avgCompletion: partialLeads.length > 0
        ? partialLeads.reduce((sum: number, p) => {
            const totalSteps = p.current_step >= 8 ? 8 : (p.estimator_data?.estimatorMode === 'easy' ? 8 : 7)
            const completion = Math.round((p.current_step / totalSteps) * 100)
            return sum + completion
          }, 0) / partialLeads.length
        : 0,
    }
  }, [partialLeads])
}

