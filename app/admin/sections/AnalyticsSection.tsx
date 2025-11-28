'use client'

import { Users, DollarSign, Zap, TrendingUp, Clock, Calendar, PieChart, MapPin, Home } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { SkeletonStatsGrid, SkeletonCard, SkeletonChart } from '@/components/admin/SkeletonLoader'

interface Lead {
  id: string
  system_size_kw?: number
  annual_savings?: number
  status: string
  province?: string
  program_type?: string
  // Cost fields across schemas
  combined_total_cost?: number
  solar_total_cost?: number
  solar_incentives?: number
  combined_net_cost?: number
  solar_net_cost?: number
  // HRS / residential specific cost fields
  system_cost?: number
  battery_cost?: number
  total_cost?: number
  net_cost?: number
  combined_totals?: {
    total_cost?: number
    net_cost?: number
    annual_savings?: number
    monthly_savings?: number
  } | null
  // TOU / ULO annual savings fields
  tou_annual_savings?: number
  ulo_annual_savings?: number
  created_at: string
  [key: string]: any
}

interface AnalyticsSectionProps {
  leads: Lead[]
  stats: {
    totalLeads: number
    avgSystemSize: number
    totalSavings: number
    newLeads: number
  }
  partialStats: {
    total: number
    recentCount: number
    highCompletionCount: number
    avgCompletion: number
  }
  loading?: boolean
}

// Aggregate a "useful" commercial metric: total net investment across all leads
// This uses the best-available NET cost from any schema (combined_net_cost, net_cost, etc.)
function getTotalNetInvestment(leads: Lead[]): number {
  return leads.reduce((sum, lead) => {
    // Prefer explicit combined_net_cost if present
    const fromCombinedNet = lead.combined_net_cost
    // Fallback to combined_totals JSONB
    const fromCombinedTotalsJson = lead.combined_totals?.net_cost
    // Fallbacks for HRS tables that use net_cost / solar_net_cost
    const fromNet =
      lead.net_cost ??
      lead.solar_net_cost

    // Fallback from full_data_json / estimator_data (simplified estimator data)
    const full: any =
      (lead as any).full_data_json ||
      (lead as any).fullDataJson ||
      (lead as any).estimator_data ||
      (lead as any).estimatorData ||
      null
    const fromFullCosts = full?.costs?.netCost

    const value =
      fromCombinedNet ??
      fromCombinedTotalsJson ??
      fromNet ??
      fromFullCosts ??
      0

    return sum + (typeof value === 'number' && !Number.isNaN(value) ? value : 0)
  }, 0)
}

function getTouUloAnnualSavings(leads: Lead[]): { touTotal: number; uloTotal: number } {
  return leads.reduce(
    (acc, lead) => {
      const full: any =
        (lead as any).full_data_json ||
        (lead as any).fullDataJson ||
        (lead as any).estimator_data ||
        (lead as any).estimatorData ||
        null

      const tou =
        typeof lead.tou_annual_savings === 'number' && lead.tou_annual_savings > 0
          ? lead.tou_annual_savings
          : typeof full?.tou?.annualSavings === 'number'
          ? full.tou.annualSavings
          : typeof full?.tou?.annual_savings === 'number'
          ? full.tou.annual_savings
          : 0

      const ulo =
        typeof lead.ulo_annual_savings === 'number' && lead.ulo_annual_savings > 0
          ? lead.ulo_annual_savings
          : typeof full?.ulo?.annualSavings === 'number'
          ? full.ulo.annualSavings
          : typeof full?.ulo?.annual_savings === 'number'
          ? full.ulo.annual_savings
          : 0
      return {
        touTotal: acc.touTotal + tou,
        uloTotal: acc.uloTotal + ulo,
      }
    },
    { touTotal: 0, uloTotal: 0 }
  )
}

export function AnalyticsSection({ leads, stats, partialStats, loading = false }: AnalyticsSectionProps) {
  const totalNetInvestment = getTotalNetInvestment(leads)
  const { touTotal, uloTotal } = getTouUloAnnualSavings(leads)
  const hasTouOrUloSavings = touTotal > 0 || uloTotal > 0
  const leadsWithBattery = leads.filter(
    (lead) => (lead as any).has_battery || (Array.isArray((lead as any).selected_battery_ids) && (lead as any).selected_battery_ids.length > 0)
  ).length
  const solarOnlyLeads = Math.max(0, stats.totalLeads - leadsWithBattery)

  // Helper to get a single lead's net cost after rebates (matches "Net after incentives" in lead modal)
  const getLeadNetCost = (lead: Lead): number => {
    const fromCombinedNet = lead.combined_net_cost
    const fromCombinedTotalsJson = lead.combined_totals?.net_cost
    const fromNet =
      lead.net_cost ??
      lead.solar_net_cost

    const full: any =
      (lead as any).full_data_json ||
      (lead as any).fullDataJson ||
      (lead as any).estimator_data ||
      (lead as any).estimatorData ||
      null
    const fromFullCosts = full?.costs?.netCost

    const value =
      fromCombinedNet ??
      fromCombinedTotalsJson ??
      fromNet ??
      fromFullCosts ??
      0

    return typeof value === 'number' && !Number.isNaN(value) ? value : 0
  }

  const getLeadPaybackYears = (lead: Lead): number => {
    const combined = (lead as any).combined_payback_years
    const tou = (lead as any).tou_payback_period
    const ulo = (lead as any).ulo_payback_period

    const full: any =
      (lead as any).full_data_json ||
      (lead as any).fullDataJson ||
      (lead as any).estimator_data ||
      (lead as any).estimatorData ||
      null

    const fromFull =
      full?.tou?.paybackPeriod ??
      full?.ulo?.paybackPeriod ??
      full?.costs?.paybackYears ??
      null

    const value = combined ?? tou ?? ulo ?? fromFull ?? 0
    return typeof value === 'number' && value > 0 && !Number.isNaN(value) ? value : 0
  }

  if (loading) {
    return (
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy-500 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your solar leads and business metrics</p>
        </div>

        {/* Key Metrics Overview */}
        <SkeletonStatsGrid />

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <SkeletonChart />
          <SkeletonChart />
        </div>

        {/* More charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Financial Overview */}
        <SkeletonCard className="mb-8" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-500 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">
          High-level overview of HRS residential and net metering performance across all leads
        </p>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="text-blue-500" size={32} />
            <span className="text-3xl font-bold text-navy-500">{stats.totalLeads}</span>
          </div>
          <div className="text-sm text-gray-600">Total Leads</div>
          <div className="text-xs text-green-600 mt-1">↑ {stats.newLeads} new</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Zap className="text-green-500" size={32} />
            <span className="text-3xl font-bold text-navy-500">
              {leadsWithBattery}
            </span>
          </div>
          <div className="text-sm text-gray-600">Battery System Leads</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Zap className="text-yellow-500" size={32} />
            <span className="text-3xl font-bold text-navy-500">
              {stats.avgSystemSize.toFixed(1)} kW
            </span>
          </div>
          <div className="text-sm text-gray-600">Avg System Size</div>
          <div className="text-xs text-gray-500 mt-1">Across all leads</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <Home className="text-purple-500" size={32} />
            <span className="text-3xl font-bold text-navy-500">
              {solarOnlyLeads}
            </span>
          </div>
          <div className="text-sm text-gray-600">Solar‑Only / Net Metering Leads</div>
          <div className="mt-1 text-xs text-gray-500">
            Leads without a battery system (solar‑only or net metering programs)
          </div>
        </div>
      </div>

      {/* Lead Status Distribution */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h2 className="text-xl font-bold text-navy-500 mb-4 flex items-center gap-2">
            <PieChart size={24} />
            Lead Status Distribution
          </h2>
          <div className="space-y-4">
            {['new', 'contacted', 'qualified', 'closed'].map((status) => {
              const count = leads.filter(l => l.status === status).length
              const percentage = stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0
              const colors: Record<string, string> = {
                new: 'bg-blue-500',
                contacted: 'bg-yellow-500',
                qualified: 'bg-green-500',
                closed: 'bg-purple-500',
              }
              return (
                <div key={status}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                    <span className="text-sm text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${colors[status]} h-2 rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-navy-500 mb-4 flex items-center gap-2">
            <MapPin size={24} />
            Leads by Province
          </h2>
          <div className="space-y-3">
            {(() => {
              const provinceCounts: Record<string, number> = {}
              leads.forEach(lead => {
                const province = lead.province || 'Unknown'
                provinceCounts[province] = (provinceCounts[province] || 0) + 1
              })
              return Object.entries(provinceCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([province, count]) => {
                  const percentage = stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0
                  return (
                    <div key={province}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{province}</span>
                        <span className="text-sm text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })
            })()}
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-navy-500 mb-4 flex items-center gap-2">
            <Zap size={20} />
            Program Distribution
          </h2>
          <div className="space-y-3">
            {(() => {
              // Count leads by program type
              const hrsCount = leads.filter(l => {
                const program = l.program_type?.toLowerCase()
                return program === 'hrs_residential' || program === 'hrs' || program?.includes('hrs')
              }).length
              const netMeteringCount = leads.filter(l => {
                const program = l.program_type?.toLowerCase()
                return program === 'net_metering' || program === 'netmetering' || program?.includes('net')
              }).length
              const otherCount = stats.totalLeads - hrsCount - netMeteringCount
              const total = stats.totalLeads
              
              return (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Solar HRS Program</span>
                      <span className="text-sm font-medium text-gray-900">{hrsCount} ({total > 0 ? ((hrsCount / total) * 100).toFixed(1) : 0}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${total > 0 ? (hrsCount / total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Net Metering Program</span>
                      <span className="text-sm font-medium text-gray-900">{netMeteringCount} ({total > 0 ? ((netMeteringCount / total) * 100).toFixed(1) : 0}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${total > 0 ? (netMeteringCount / total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  {otherCount > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">Other</span>
                        <span className="text-sm font-medium text-gray-900">{otherCount} ({total > 0 ? ((otherCount / total) * 100).toFixed(1) : 0}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-gray-500 h-2 rounded-full transition-all"
                          style={{ width: `${total > 0 ? (otherCount / total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold text-navy-500 mb-4 flex items-center gap-2">
            <Clock size={20} />
            Avg Payback Period
          </h2>
          <div className="text-3xl font-bold text-navy-500 mb-2">
            {(() => {
              const paybacks = leads.map(getLeadPaybackYears).filter(v => v > 0)
              if (paybacks.length === 0) return '—'
              const avg = paybacks.reduce((sum, v) => sum + v, 0) / paybacks.length
              return `${avg.toFixed(1)} yrs`
            })()}
          </div>
          <div className="text-sm text-gray-600">Average payback period where payback data is available</div>
        </div>
      </div>

      {/* Time-based Metrics */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h2 className="text-xl font-bold text-navy-500 mb-4 flex items-center gap-2">
            <Calendar size={24} />
            Leads Over Time (Last 7 Days)
          </h2>
          <div className="space-y-2">
            {(() => {
              const now = Date.now()
              const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000)
              const recentLeads = leads.filter(l => new Date(l.created_at).getTime() >= sevenDaysAgo)
              
              // Group by day
              const dailyCounts: Record<string, number> = {}
              recentLeads.forEach(lead => {
                const date = new Date(lead.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
                dailyCounts[date] = (dailyCounts[date] || 0) + 1
              })
              
              const maxCount = Math.max(...Object.values(dailyCounts), 1)
              
              return Object.entries(dailyCounts)
                .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                .map(([date, count]) => (
                  <div key={date} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-20">{date}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                      <div
                        className="bg-red-500 h-4 rounded-full transition-all"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                      <span className="absolute left-2 top-0.5 text-xs text-white font-medium">{count}</span>
                    </div>
                  </div>
                ))
            })()}
          </div>
        </div>

        {/* Partial Leads Analytics */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-navy-500 mb-4 flex items-center gap-2">
            <Clock size={24} />
            Partial Leads Metrics
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">Total Partial Leads</span>
                <span className="text-sm text-gray-600">{partialStats.total}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">Recent (Last 24h)</span>
                <span className="text-sm text-gray-600">{partialStats.recentCount}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">High Completion (≥70%)</span>
                <span className="text-sm text-gray-600">{partialStats.highCompletionCount}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">Average Completion</span>
                <span className="text-sm text-gray-600">{partialStats.avgCompletion.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all"
                  style={{ width: `${partialStats.avgCompletion}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Size Distribution */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-navy-500 mb-4 flex items-center gap-2">
          <Zap size={24} />
          System Size Distribution
        </h2>
        <div className="grid md:grid-cols-5 gap-4">
          {['0-5', '5-10', '10-15', '15-20', '20+'].map((range) => {
            const [min, max] = range === '20+' 
              ? [20, Infinity]
              : range.split('-').map(Number)
            const count = leads.filter(l => {
              const size = l.system_size_kw || 0
              return range === '20+' ? size >= 20 : size >= min && size < max
            }).length
            const percentage = stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0
            return (
              <div key={range} className="text-center">
                <div className="text-2xl font-bold text-navy-500 mb-1">{count}</div>
                <div className="text-sm text-gray-600 mb-2">{range} kW</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

