'use client'

// Admin dashboard - leads table and analytics

import { useState, useEffect } from 'react'
import { Logo } from '@/components/Logo'
import { Users, DollarSign, Zap, TrendingUp, LogOut, Search, Download, Clock, AlertCircle, Mail, MapPin, Battery, Home, Calendar, BarChart3, PieChart } from 'lucide-react'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { MockPartialLead } from '@/lib/mock-partial-leads'
import { LeadDetailView } from '@/components/admin/LeadDetailView'
import { PartialLeadDetailView } from '@/components/admin/PartialLeadDetailView'
import { UserModal, UserFormData } from '@/components/admin/UserModal'
import { DeleteUserModal } from '@/components/admin/DeleteUserModal'

// Lead type matching database schema
interface Lead {
  id: string
  full_name: string
  email: string
  phone: string
  address: string
  city?: string
  province: string
  status: string
  system_size_kw?: number
  annual_savings?: number
  created_at: string
  hubspot_synced?: boolean
  rate_plan?: string
  [key: string]: any // Allow other database fields
}

export default function AdminPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [partialLeads, setPartialLeads] = useState<MockPartialLead[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSection, setActiveSection] = useState('leads') // State to track active section (leads, partial-leads, or users)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null) // State for detailed lead view
  const [selectedPartialLead, setSelectedPartialLead] = useState<MockPartialLead | null>(null) // State for partial lead detail view
  const router = useRouter()
  
  // Users state
  const [users, setUsers] = useState<any[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [deleteUserModalOpen, setDeleteUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userModalMode, setUserModalMode] = useState<'add' | 'edit'>('add')

  // Load real leads from database
  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (statusFilter !== 'all') {
          params.append('status', statusFilter)
        }
        if (searchTerm) {
          params.append('search', searchTerm)
        }
        
        const response = await fetch(`/api/leads?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch leads')
        }
        
        const result = await response.json()
        if (result.success && result.data.leads) {
          // Map database fields to expected format (coerce strings -> numbers)
          const toNumber = (v: any) => typeof v === 'number' ? v : (v != null ? Number(v) : 0) || 0
          const parsedLeads = result.data.leads.map((l: any) => ({ ...l }))
          const mappedLeads = parsedLeads.map((lead: any) => {
            const city = (() => {
              const addr = lead.address || ''
              const parts = addr.split(',').map((p: string) => p.trim())
              return parts[1] || parts[0] || ''
            })()
            // Prefer combined totals if available
            const annualSavings = toNumber(lead.combined_annual_savings) || toNumber(lead.solar_annual_savings)
            const systemSizeKw = toNumber(lead.system_size_kw)
            // Normalize common numeric/string fields
            lead.solar_total_cost = toNumber(lead.solar_total_cost)
            lead.solar_incentives = toNumber(lead.solar_incentives)
            lead.solar_net_cost = toNumber(lead.solar_net_cost)
            lead.production_annual_kwh = toNumber(lead.production_annual_kwh)
            lead.battery_price = toNumber(lead.battery_price)
            lead.battery_rebate = toNumber(lead.battery_rebate)
            lead.battery_net_cost = toNumber(lead.battery_net_cost)
            lead.tou_annual_savings = toNumber(lead.tou_annual_savings)
            lead.ulo_annual_savings = toNumber(lead.ulo_annual_savings)
            lead.combined_total_cost = toNumber(lead.combined_total_cost)
            lead.combined_net_cost = toNumber(lead.combined_net_cost)
            lead.combined_monthly_savings = toNumber(lead.combined_monthly_savings)
            lead.combined_annual_savings = toNumber(lead.combined_annual_savings)
            lead.combined_payback_years = toNumber(lead.combined_payback_years)
            return {
              ...lead,
              city,
              annual_savings: annualSavings,
              system_size_kw: systemSizeKw,
            }
          })
          setLeads(mappedLeads)
        } else {
          setLeads([])
        }
      } catch (error) {
        console.error('Error fetching leads:', error)
        setLeads([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchLeads()
  }, [statusFilter, searchTerm])

  // Load real partial leads from database
  useEffect(() => {
    const fetchPartialLeads = async () => {
      try {
        const params = new URLSearchParams()
        if (searchTerm) {
          params.append('search', searchTerm)
        }
        
        const response = await fetch(`/api/partial-lead?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch partial leads')
        }
        
        const result = await response.json()
        if (result.success && result.data.partialLeads) {
          setPartialLeads(result.data.partialLeads)
        } else {
          setPartialLeads([])
        }
      } catch (error) {
        console.error('Error fetching partial leads:', error)
        setPartialLeads([])
      }
    }
    
    fetchPartialLeads()
  }, [searchTerm])

  // Calculate stats from real data
  const stats = {
    totalLeads: leads.length,
    avgSystemSize: leads.length > 0 
      ? leads.reduce((sum, l) => sum + (l.system_size_kw || 0), 0) / leads.length
      : 0,
    totalSavings: leads.reduce((sum, l) => sum + (l.annual_savings || 0), 0),
    newLeads: leads.filter(l => l.status === 'new').length,
  }
  
  // Calculate partial lead stats
  const partialStats = {
    total: partialLeads.length,
    recentCount: partialLeads.filter((p: any) => {
      const hoursSinceCreated = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60)
      return hoursSinceCreated <= 24
    }).length,
    highCompletionCount: partialLeads.filter((p: any) => {
      const totalSteps = p.current_step >= 8 ? 8 : (p.estimator_data?.estimatorMode === 'easy' ? 8 : 7)
      const completion = Math.round((p.current_step / totalSteps) * 100)
      return completion >= 70
    }).length,
    avgCompletion: partialLeads.length > 0
      ? partialLeads.reduce((sum: number, p: any) => {
          const totalSteps = p.current_step >= 8 ? 8 : (p.estimator_data?.estimatorMode === 'easy' ? 8 : 7)
          const completion = Math.round((p.current_step / totalSteps) * 100)
          return sum + completion
        }, 0) / partialLeads.length
      : 0,
  }

  // Leads are already filtered by API query
  const filteredLeads = leads

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
  
  // Fetch users
  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setUsers(result.data.users || [])
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    if (activeSection === 'users') {
      fetchUsers()
    }
  }, [activeSection])

  // Handle add user
  const handleAddUser = () => {
    setSelectedUser(null)
    setUserModalMode('add')
    setUserModalOpen(true)
  }

  // Handle edit user
  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setUserModalMode('edit')
    setUserModalOpen(true)
  }

  // Handle save user (add or edit)
  const handleSaveUser = async (userData: UserFormData) => {
    try {
      if (userModalMode === 'add') {
        // Create new user
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create user')
        }
      } else {
        // Update existing user
        if (!selectedUser?.id) {
          throw new Error('User ID is required for update')
        }

        const response = await fetch(`/api/users/${selectedUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update user')
        }
      }

      // Refresh users list
      await fetchUsers()
    } catch (error) {
      throw error // Re-throw to let modal handle the error
    }
  }

  // Handle delete user
  const handleDeleteUser = (user: any) => {
    setSelectedUser(user)
    setDeleteUserModalOpen(true)
  }

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedUser?.id) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete user')
      }

      // Refresh users list
      await fetchUsers()
    } catch (error) {
      throw error // Re-throw to let modal handle the error
    }
  }
  
  // Handle lead row click to open detail view
  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead)
  }
  
  // Handle closing detail view
  const handleCloseDetailView = () => {
    setSelectedLead(null)
  }
  
  // Handle status change from detail view
  const handleStatusChange = (leadId: string, newStatus: string) => {
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId ? { ...lead, status: newStatus as any } : lead
      )
    )
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, status: newStatus as any })
    }
  }

  // Handle partial lead row click
  const handlePartialLeadClick = (partialLead: MockPartialLead) => {
    setSelectedPartialLead(partialLead)
  }

  // Handle closing partial lead detail view
  const handleClosePartialLeadView = () => {
    setSelectedPartialLead(null)
  }

  // Handle sending follow-up email
  const handleSendReminder = (email: string) => {
    alert(`Follow-up email would be sent to: ${email}\n\nIn production, this would trigger an automated email campaign.`)
  }

  // Handle deleting partial lead
  const handleDeletePartialLead = (id: string) => {
    if (confirm('Are you sure you want to delete this partial lead?')) {
      setPartialLeads(prevLeads => prevLeads.filter(lead => lead.id !== id))
      setSelectedPartialLead(null)
    }
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
            <span className="flex-1 text-left">Leads</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{stats.totalLeads}</span>
          </button>
          <button 
            onClick={() => setActiveSection('partial-leads')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeSection === 'partial-leads' ? 'bg-red-500' : 'hover:bg-navy-600'
            }`}
          >
            <Clock size={20} />
            <span className="flex-1 text-left">Partial Leads</span>
            <span className="bg-yellow-400 text-navy-500 px-2 py-0.5 rounded-full text-xs font-bold">{partialStats.total}</span>
          </button>
          <button 
            onClick={() => setActiveSection('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeSection === 'users' ? 'bg-red-500' : 'hover:bg-navy-600'
            }`}
          >
            <Users size={20} />
            Users
          </button>
          <button 
            onClick={() => setActiveSection('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeSection === 'analytics' ? 'bg-red-500' : 'hover:bg-navy-600'
            }`}
          >
            <TrendingUp size={20} />
            Analytics
          </button>
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
        {activeSection === 'leads' && (
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
            <>
              <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
                <p className="text-xs text-blue-700">
                  💡 <strong>Tip:</strong> Click on any row to view complete lead details including roof visualization, photos, and full estimate breakdown
                </p>
              </div>
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
                    <tr 
                      key={lead.id} 
                      onClick={() => handleLeadClick(lead)}
                      className="hover:bg-blue-50 transition-colors cursor-pointer"
                    >
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
            </>
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
        )}
        {activeSection === 'partial-leads' && (
          <>
            {/* Partial Leads Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-navy-500 mb-2">Partial Leads Dashboard</h1>
              <p className="text-gray-600">Users who started but haven't completed their solar estimate</p>
            </div>

            {/* Partial Leads Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="text-yellow-500" size={32} />
                  <span className="text-3xl font-bold text-navy-500">{partialStats.total}</span>
                </div>
                <div className="text-sm text-gray-600">Total Partial Leads</div>
                <div className="text-xs text-yellow-600 mt-1">In-progress estimates</div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <AlertCircle className="text-red-500" size={32} />
                  <span className="text-3xl font-bold text-navy-500">{partialStats.recentCount}</span>
                </div>
                <div className="text-sm text-gray-600">Recent (24h)</div>
                <div className="text-xs text-red-600 mt-1">Hot leads to follow up</div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="text-green-500" size={32} />
                  <span className="text-3xl font-bold text-navy-500">{partialStats.highCompletionCount}</span>
                </div>
                <div className="text-sm text-gray-600">High Completion</div>
                <div className="text-xs text-green-600 mt-1">70%+ complete</div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <Zap className="text-blue-500" size={32} />
                  <span className="text-3xl font-bold text-navy-500">{partialStats.avgCompletion.toFixed(0)}%</span>
                </div>
                <div className="text-sm text-gray-600">Avg Completion</div>
                <div className="text-xs text-blue-600 mt-1">Average progress</div>
              </div>
            </div>

            {/* Search bar */}
            <div className="card p-6 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by email or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
                />
              </div>
            </div>

            {/* Partial Leads Table */}
            <div className="card overflow-hidden">
              {partialLeads.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No partial leads found</div>
              ) : (
                <>
                  <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
                    <p className="text-xs text-yellow-700">
                      💡 <strong>Tip:</strong> Click any row to view complete details and send follow-up emails. 
                      Focus on HOT and High Priority leads first - they have the highest conversion potential.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-navy-500 text-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Address</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Best Plan</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Progress</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Data Captured</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Last Updated</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {partialLeads.map((partialLead) => {
                          // If current_step is 8, totalSteps must be at least 8
                          const totalSteps = partialLead.current_step >= 8 ? 8 : (partialLead.estimator_data?.estimatorMode === 'easy' ? 8 : 7)
                          const completion = Math.round((partialLead.current_step / totalSteps) * 100)
                          const isRecent = (Date.now() - new Date(partialLead.created_at).getTime()) / (1000 * 60 * 60) <= 24
                          const isHot = completion >= 70
                          
                          return (
                            <tr 
                              key={partialLead.id} 
                              onClick={() => handlePartialLeadClick(partialLead)}
                              className="hover:bg-yellow-50 transition-colors cursor-pointer"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Mail size={14} className="text-gray-400" />
                                  <span className="text-sm font-medium text-navy-500">{partialLead.email}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {partialLead.estimator_data.address || '-'}
                              </td>
                              <td className="px-4 py-3">
                                {partialLead.estimator_data.peakShaving?.ratePlan ? (
                                  <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">
                                    {partialLead.estimator_data.peakShaving.ratePlan.toUpperCase()}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-500">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        completion >= 70 ? 'bg-green-500' : 
                                        completion >= 40 ? 'bg-yellow-500' : 
                                        'bg-red-500'
                                      }`}
                                      style={{ width: `${completion}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-semibold text-gray-600">{completion}%</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Step {partialLead.current_step} of {totalSteps}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {partialLead.estimator_data.roofAreaSqft && (
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">Roof</span>
                                  )}
                                  {partialLead.estimator_data.monthlyBill && (
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Bill</span>
                                  )}
                                  {partialLead.estimator_data.selectedAddOns && partialLead.estimator_data.selectedAddOns.length > 0 && (
                                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">Add-ons</span>
                                  )}
                                  {partialLead.estimator_data.photoCount && partialLead.estimator_data.photoCount > 0 && (
                                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs">Photos</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {formatRelativeTime(new Date(partialLead.updated_at))}
                                {partialLead.resumed_at && (
                                  <div className="text-xs text-green-600 mt-1">Resumed</div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {isRecent && isHot ? (
                                  <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                    HOT
                                  </span>
                                ) : isHot ? (
                                  <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                    High Priority
                                  </span>
                                ) : isRecent ? (
                                  <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                                    Recent
                                  </span>
                                ) : (
                                  <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                                    Cold
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-navy-500 mb-3">What are Partial Leads?</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  <strong>Partial leads are users who started the solar estimator but didn't complete the submission.</strong> 
                  They saved their progress by entering their email during the estimate process.
                </p>
                <p className="mt-3">
                  <strong>How to identify them:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong className="text-red-600">HOT leads:</strong> Recent (last 24h) + High completion (70%+) - Highest conversion potential</li>
                  <li><strong className="text-green-600">High Priority:</strong> 70%+ complete - Very close to finishing</li>
                  <li><strong className="text-yellow-600">Recent:</strong> Last 24 hours - Good engagement timing</li>
                  <li><strong className="text-gray-600">Cold:</strong> Older leads with lower completion</li>
                </ul>
                <p className="mt-3">
                  <strong>Follow-up strategy:</strong> Focus on HOT and High Priority leads first. 
                  They have invested significant time and are most likely to convert with a gentle nudge.
                </p>
              </div>
            </div>
          </>
        )}
        {activeSection === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-navy-500 mb-2">User Management</h1>
                <p className="text-gray-600">Manage admin users and permissions</p>
              </div>
              <button 
                onClick={handleAddUser}
                className="btn-primary"
              >
                <Users size={20} className="mr-2" />
                Add User
              </button>
            </div>

            {usersLoading ? (
              <div className="text-center py-12">
                <div className="text-gray-500">Loading users...</div>
              </div>
            ) : users.length === 0 ? (
              <div className="card p-12 text-center">
                <Users size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No users found</h3>
                <p className="text-gray-500 mb-4">Get started by adding your first admin user</p>
                <button 
                  onClick={handleAddUser}
                  className="btn-primary"
                >
                  Add User
                </button>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.full_name || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                            {user.role === 'superadmin' ? 'Super Admin' : user.role || 'Admin'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Analytics Section */}
        {activeSection === 'analytics' && (
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
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="card p-6">
                <h2 className="text-lg font-bold text-navy-500 mb-4 flex items-center gap-2">
                  <Battery size={20} />
                  Battery Adoption
                </h2>
                <div className="text-3xl font-bold text-navy-500 mb-2">
                  {(() => {
                    const withBattery = leads.filter(l => l.has_battery || (l.selected_add_ons && Array.isArray(l.selected_add_ons) && l.selected_add_ons.includes('battery'))).length
                    return stats.totalLeads > 0 ? ((withBattery / stats.totalLeads) * 100).toFixed(1) : '0'
                  })()}%
                </div>
                <div className="text-sm text-gray-600">
                  {leads.filter(l => l.has_battery || (l.selected_add_ons && Array.isArray(l.selected_add_ons) && l.selected_add_ons.includes('battery'))).length} of {stats.totalLeads} leads
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-bold text-navy-500 mb-4 flex items-center gap-2">
                  <BarChart3 size={20} />
                  Rate Plan Preference
                </h2>
                <div className="space-y-2">
                  {(() => {
                    const touCount = leads.filter(l => l.rate_plan === 'tou' || (l.tou_annual_savings && l.tou_annual_savings > 0)).length
                    const uloCount = leads.filter(l => l.rate_plan === 'ulo' || (l.ulo_annual_savings && l.ulo_annual_savings > 0)).length
                    const total = touCount + uloCount
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">TOU</span>
                          <span className="text-sm font-medium text-gray-900">{touCount} ({total > 0 ? ((touCount / total) * 100).toFixed(1) : 0}%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">ULO</span>
                          <span className="text-sm font-medium text-gray-900">{uloCount} ({total > 0 ? ((uloCount / total) * 100).toFixed(1) : 0}%)</span>
                        </div>
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
        )}
      </main>

      {/* Lead Detail View Modal */}
      {selectedLead && (
        <LeadDetailView 
          lead={selectedLead} 
          onClose={handleCloseDetailView}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Partial Lead Detail View Modal */}
      {selectedPartialLead && (
        <PartialLeadDetailView 
          partialLead={selectedPartialLead} 
          onClose={handleClosePartialLeadView}
          onDelete={handleDeletePartialLead}
          onSendReminder={handleSendReminder}
        />
      )}

      {/* User Modal */}
      <UserModal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        onSave={handleSaveUser}
        user={selectedUser}
        mode={userModalMode}
      />

      {/* Delete User Modal */}
      <DeleteUserModal
        isOpen={deleteUserModalOpen}
        onClose={() => setDeleteUserModalOpen(false)}
        onConfirm={handleConfirmDelete}
        userName={selectedUser?.full_name || 'Unknown'}
        userEmail={selectedUser?.email || 'Unknown'}
      />
    </div>
  )
}

