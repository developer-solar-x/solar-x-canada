'use client'

// Admin dashboard - leads table and analytics

import { useState, useEffect } from 'react'
import { Logo } from '@/components/Logo'
import { Users, DollarSign, Zap, TrendingUp, LogOut, Search, Download, Calculator } from 'lucide-react'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  analyzeZeroExportSystem, 
  calculatePeakShaving,
  recommendBatterySize,
  TOU_RATES 
} from '@/lib/peak-shaving'

interface Lead {
  id: string
  created_at: string
  full_name: string
  email: string
  phone: string
  address: string
  city?: string
  province: string
  system_size_kw?: number
  annual_savings?: number
  status: string
  hubspot_synced: boolean
}

export default function AdminPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSection, setActiveSection] = useState('leads') // State to track active section (leads or calculator)
  const router = useRouter()
  
  // Peak Shaving Calculator inputs state
  const [calculatorInputs, setCalculatorInputs] = useState({
    annualConsumption: 10000, // Default value in kWh
    systemSizeKw: 11.5, // Default value in kW
    annualSolarProduction: 14375, // Default value in kWh (11.5 kW * 1250 hours)
    batteryKwh: 13.5, // Default value in kWh
    systemCost: 30820, // Default value in dollars
  })
  
  // Peak Shaving Calculator results state
  const [calculatorResults, setCalculatorResults] = useState<ReturnType<typeof analyzeZeroExportSystem> | null>(null)

  // Fetch leads from API
  useEffect(() => {
    async function fetchLeads() {
      try {
        const response = await fetch(`/api/leads?status=${statusFilter}`)
        const data = await response.json()
        
        if (data.success) {
          setLeads(data.data.leads)
        }
      } catch (error) {
        console.error('Failed to fetch leads:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [statusFilter])

  // Calculate stats
  const stats = {
    totalLeads: leads.length,
    avgSystemSize: leads.reduce((sum, l) => sum + (l.system_size_kw || 0), 0) / (leads.length || 1),
    totalSavings: leads.reduce((sum, l) => sum + (l.annual_savings || 0), 0),
    newLeads: leads.filter(l => l.status === 'new').length,
  }

  // Filter leads by search term
  const filteredLeads = leads.filter(lead =>
    lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.push('/admin/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }
  
  // Calculate peak shaving results
  const handleCalculate = () => {
    try {
      const results = analyzeZeroExportSystem(
        calculatorInputs.annualConsumption,
        calculatorInputs.systemSizeKw,
        calculatorInputs.annualSolarProduction,
        calculatorInputs.batteryKwh,
        calculatorInputs.systemCost
      )
      setCalculatorResults(results)
    } catch (error) {
      console.error('Calculation failed:', error)
    }
  }
  
  // Update calculator input handler
  const updateCalculatorInput = (field: string, value: number) => {
    setCalculatorInputs(prev => ({
      ...prev,
      [field]: value
    }))
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-navy-500 text-white p-6">
        <div className="mb-8 bg-white p-4 rounded-lg">
          <Logo size="md" />
        </div>

        <nav className="space-y-2">
          <button 
            onClick={() => setActiveSection('leads')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeSection === 'leads' ? 'bg-red-500' : 'hover:bg-navy-600'
            }`}
          >
            <Users size={20} />
            Leads
          </button>
          <button 
            onClick={() => setActiveSection('calculator')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeSection === 'calculator' ? 'bg-red-500' : 'hover:bg-navy-600'
            }`}
          >
            <Calculator size={20} />
            Peak Shaving
          </button>
          <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-navy-600 rounded-lg transition-colors">
            <TrendingUp size={20} />
            Analytics
          </a>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-navy-600 rounded-lg transition-colors text-left"
          >
            <LogOut size={20} />
            Logout
          </button>
          <a href="/" className="flex items-center gap-3 px-4 py-3 hover:bg-navy-600 rounded-lg transition-colors">
            <LogOut size={20} />
            Exit to Site
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        {/* Conditionally render content based on active section */}
        {activeSection === 'leads' ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-navy-500 mb-2">Leads Dashboard</h1>
              <p className="text-gray-600">Manage and track all solar estimate submissions</p>
            </div>

        {/* Stats cards */}
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
              <Zap className="text-red-500" size={32} />
              <span className="text-3xl font-bold text-navy-500">
                {stats.avgSystemSize.toFixed(1)} kW
              </span>
            </div>
            <div className="text-sm text-gray-600">Avg System Size</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="text-green-500" size={32} />
              <span className="text-3xl font-bold text-navy-500">
                {formatCurrency(stats.totalSavings)}
              </span>
            </div>
            <div className="text-sm text-gray-600">Total Annual Savings</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="text-purple-500" size={32} />
              <span className="text-3xl font-bold text-navy-500">
                {((stats.newLeads / stats.totalLeads) * 100 || 0).toFixed(0)}%
              </span>
            </div>
            <div className="text-sm text-gray-600">Conversion Rate</div>
          </div>
        </div>

        {/* Filters bar */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="closed">Closed</option>
            </select>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
              />
            </div>

            {/* Export button */}
            <button className="btn-outline border-navy-500 text-navy-500 inline-flex items-center gap-2">
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Leads table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading leads...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No leads found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-navy-500 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Location</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">System Size</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Savings/Year</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">HubSpot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-navy-500">{lead.full_name}</div>
                        <div className="text-sm text-gray-500">{lead.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {lead.city}, {lead.province}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {lead.system_size_kw ? `${lead.system_size_kw.toFixed(1)} kW` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">
                        {lead.annual_savings ? formatCurrency(lead.annual_savings) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatRelativeTime(new Date(lead.created_at))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {lead.hubspot_synced ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination placeholder */}
        {filteredLeads.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredLeads.length} of {leads.length} leads
            </p>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                Previous
              </button>
              <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm">
                1
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                Next
              </button>
            </div>
          </div>
        )}
          </>
        ) : (
          <>
            {/* Peak Shaving Calculator Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-navy-500 mb-2">Peak Shaving Calculator</h1>
              <p className="text-gray-600">Test zero-export system calculations with battery optimization</p>
            </div>

            {/* Input Form */}
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-bold text-navy-500 mb-4">System Parameters</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Annual Consumption */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Annual Consumption (kWh)
                  </label>
                  <input
                    type="number"
                    value={calculatorInputs.annualConsumption}
                    onChange={(e) => updateCalculatorInput('annualConsumption', Number(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Total yearly electricity usage</p>
                </div>

                {/* System Size */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    System Size (kW)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={calculatorInputs.systemSizeKw}
                    onChange={(e) => updateCalculatorInput('systemSizeKw', Number(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Solar panel system capacity</p>
                </div>

                {/* Annual Solar Production */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Annual Solar Production (kWh)
                  </label>
                  <input
                    type="number"
                    value={calculatorInputs.annualSolarProduction}
                    onChange={(e) => updateCalculatorInput('annualSolarProduction', Number(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Expected yearly solar generation</p>
                </div>

                {/* Battery Size */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Battery Capacity (kWh)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={calculatorInputs.batteryKwh}
                    onChange={(e) => updateCalculatorInput('batteryKwh', Number(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Battery storage capacity</p>
                </div>

                {/* System Cost */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    System Cost ($)
                  </label>
                  <input
                    type="number"
                    value={calculatorInputs.systemCost}
                    onChange={(e) => updateCalculatorInput('systemCost', Number(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Total system installation cost</p>
                </div>
              </div>

              {/* Calculate Button */}
              <div className="mt-6">
                <button
                  onClick={handleCalculate}
                  className="btn-primary px-8 py-3 text-lg font-semibold"
                >
                  Calculate Peak Shaving
                </button>
              </div>
            </div>

            {/* Results Display */}
            {calculatorResults && (
              <>
                {/* Economics Overview */}
                <div className="grid md:grid-cols-4 gap-6 mb-6">
                  <div className="card p-6">
                    <div className="text-sm text-gray-600 mb-2">Annual Savings</div>
                    <div className="text-3xl font-bold text-green-600">
                      {formatCurrency(calculatorResults.economics.annualSavings)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {calculatorResults.peakShaving.savings.percentSaved.toFixed(1)}% reduction
                    </div>
                  </div>

                  <div className="card p-6">
                    <div className="text-sm text-gray-600 mb-2">Payback Period</div>
                    <div className="text-3xl font-bold text-navy-500">
                      {calculatorResults.economics.paybackYears} years
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Net cost: {formatCurrency(calculatorResults.economics.netCost)}
                    </div>
                  </div>

                  <div className="card p-6">
                    <div className="text-sm text-gray-600 mb-2">Total Incentives</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {formatCurrency(calculatorResults.economics.incentives)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Solar + Battery rebates
                    </div>
                  </div>

                  <div className="card p-6">
                    <div className="text-sm text-gray-600 mb-2">25-Year ROI</div>
                    <div className="text-3xl font-bold text-purple-600">
                      {calculatorResults.economics.roi25Year}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Lifetime: {formatCurrency(calculatorResults.economics.lifetimeSavings)}
                    </div>
                  </div>
                </div>

                {/* Peak Shaving Details */}
                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                  {/* Pre-Solar Usage */}
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-navy-500 mb-4">Pre-Solar Usage & Costs</h3>
                    <div className="space-y-3">
                      {Object.entries(TOU_RATES).map(([key, rate]) => {
                        const usage = calculatorResults.peakShaving.preSolar[key as keyof typeof calculatorResults.peakShaving.preSolar]
                        const cost = calculatorResults.peakShaving.preSolarCosts[key as keyof typeof calculatorResults.peakShaving.preSolarCosts]
                        return (
                          <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-semibold text-sm" style={{ color: rate.color }}>
                                {rate.name}
                              </div>
                              <div className="text-xs text-gray-500">${rate.pricePerKwh}/kWh</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{Math.round(usage).toLocaleString()} kWh</div>
                              <div className="text-sm text-gray-600">{formatCurrency(cost)}</div>
                            </div>
                          </div>
                        )
                      })}
                      <div className="flex justify-between items-center p-3 bg-navy-500 text-white rounded-lg font-bold">
                        <div>Total</div>
                        <div className="text-right">
                          <div>{Math.round(calculatorResults.peakShaving.preSolar.total).toLocaleString()} kWh</div>
                          <div>{formatCurrency(calculatorResults.peakShaving.preSolarCosts.total)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post-Solar Usage */}
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-navy-500 mb-4">Post-Solar Usage & Costs</h3>
                    <div className="space-y-3">
                      {Object.entries(TOU_RATES).map(([key, rate]) => {
                        const usage = calculatorResults.peakShaving.postSolar[key as keyof typeof calculatorResults.peakShaving.postSolar]
                        const cost = calculatorResults.peakShaving.postSolarCosts[key as keyof typeof calculatorResults.peakShaving.postSolarCosts]
                        const reduction = calculatorResults.peakShaving.peakShavingEffect[
                          `${key}Reduction` as keyof typeof calculatorResults.peakShaving.peakShavingEffect
                        ] || 0
                        return (
                          <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-semibold text-sm" style={{ color: rate.color }}>
                                {rate.name}
                              </div>
                              <div className="text-xs text-green-600">
                                {reduction > 0 ? `↓ ${reduction.toFixed(0)}%` : '-'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{Math.round(usage).toLocaleString()} kWh</div>
                              <div className="text-sm text-gray-600">{formatCurrency(cost)}</div>
                            </div>
                          </div>
                        )
                      })}
                      <div className="flex justify-between items-center p-3 bg-green-600 text-white rounded-lg font-bold">
                        <div>Total</div>
                        <div className="text-right">
                          <div>{Math.round(calculatorResults.peakShaving.postSolar.total).toLocaleString()} kWh</div>
                          <div>{formatCurrency(calculatorResults.peakShaving.postSolarCosts.total)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Battery and Energy Flow */}
                <div className="grid lg:grid-cols-3 gap-6 mb-6">
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-navy-500 mb-4">Battery Capacity</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nominal</span>
                        <span className="font-semibold">{calculatorResults.batteryInfo.nominalCapacity} kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Usable (90% DoD)</span>
                        <span className="font-semibold">{calculatorResults.batteryInfo.usableCapacity.toFixed(1)} kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Annual Capacity</span>
                        <span className="font-semibold">{Math.round(calculatorResults.batteryInfo.annualCapacity).toLocaleString()} kWh</span>
                      </div>
                    </div>
                  </div>

                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-navy-500 mb-4">Energy Sources</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Direct Solar</span>
                        <span className="font-semibold">{Math.round(calculatorResults.peakShaving.solarUsed).toLocaleString()} kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">From Battery</span>
                        <span className="font-semibold">{Math.round(calculatorResults.peakShaving.batteryUsed).toLocaleString()} kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Grid Usage</span>
                        <span className="font-semibold">{Math.round(calculatorResults.peakShaving.postSolar.total).toLocaleString()} kWh</span>
                      </div>
                    </div>
                  </div>

                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-navy-500 mb-4">Incentive Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Solar Rebate</span>
                        <span className="font-semibold">{formatCurrency(calculatorResults.incentives.solarIncentive)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Battery Rebate</span>
                        <span className="font-semibold">{formatCurrency(calculatorResults.incentives.batteryIncentive)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold">{formatCurrency(calculatorResults.incentives.totalIncentive)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}

