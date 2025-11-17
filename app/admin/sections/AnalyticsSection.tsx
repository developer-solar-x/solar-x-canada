'use client'

import { Users, DollarSign, Zap, TrendingUp, Clock, Calendar, PieChart, MapPin, Home } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

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
}

export function AnalyticsSection({ leads, stats, partialStats }: AnalyticsSectionProps) {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-500 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Comprehensive insights into your solar leads and business metrics</p>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
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
            <DollarSign className="text-green-500" size={32} />
            <span className="text-3xl font-bold text-navy-500">
              {formatCurrency(leads.reduce((sum, l) => sum + (l.combined_total_cost || l.solar_total_cost || 0), 0))}
            </span>
          </div>
          <div className="text-sm text-gray-600">Total Pipeline Value</div>
          <div className="text-xs text-gray-500 mt-1">Estimated project value</div>
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
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="text-purple-500" size={32} />
            <span className="text-3xl font-bold text-navy-500">
              {formatCurrency(stats.totalSavings)}
            </span>
          </div>
          <div className="text-sm text-gray-600">Total Annual Savings</div>
          <div className="text-xs text-gray-500 mt-1">Potential customer savings</div>
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
            <Home size={20} />
            Avg System Cost
          </h2>
          <div className="text-3xl font-bold text-navy-500 mb-2">
            {(() => {
              const costs = leads.map(l => l.combined_total_cost || l.solar_total_cost || 0).filter(c => c > 0)
              return costs.length > 0 
                ? formatCurrency(costs.reduce((sum, c) => sum + c, 0) / costs.length)
                : formatCurrency(0)
            })()}
          </div>
          <div className="text-sm text-gray-600">Average project cost</div>
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

      {/* Financial Breakdown */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-bold text-navy-500 mb-4 flex items-center gap-2">
          <DollarSign size={24} />
          Financial Overview
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-1">Total Pipeline Value</div>
            <div className="text-2xl font-bold text-navy-500">
              {formatCurrency(leads.reduce((sum, l) => sum + (l.combined_total_cost || l.solar_total_cost || 0), 0))}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Total Incentives</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(leads.reduce((sum, l) => sum + (l.solar_incentives || 0), 0))}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Avg Net Cost</div>
            <div className="text-2xl font-bold text-navy-500">
              {(() => {
                const netCosts = leads.map(l => l.combined_net_cost || l.solar_net_cost || 0).filter(c => c > 0)
                return netCosts.length > 0 
                  ? formatCurrency(netCosts.reduce((sum, c) => sum + c, 0) / netCosts.length)
                  : formatCurrency(0)
              })()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Total Annual Savings</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalSavings)}
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

