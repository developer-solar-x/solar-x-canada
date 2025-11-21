'use client'

// Admin dashboard - leads table and analytics

import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { MockPartialLead } from '@/lib/mock-partial-leads'
import { LeadDetailView } from '@/components/admin/LeadDetailView'
import { PartialLeadDetailView } from '@/components/admin/PartialLeadDetailView'
import { UserModal, UserFormData } from '@/components/admin/UserModal'
import { DeleteUserModal } from '@/components/admin/DeleteUserModal'
import { GreenButtonParserSection } from '@/components/admin/GreenButtonParser'
import FileUpload from '@/components/sales-kpi/FileUpload'
import KPIDashboard from '@/components/sales-kpi/KPIDashboard'
import { CommercialCalculator } from '@/components/admin/CommercialCalculator'
import { AdminSidebar } from './components/AdminSidebar'
import { AnalyticsSection } from './sections/AnalyticsSection'
import { LeadsSection } from './sections/LeadsSection'
import { PartialLeadsSection } from './sections/PartialLeadsSection'
import { UsersSection } from './sections/UsersSection'
import { InstallersSection } from './sections/InstallersSection'
import { InstallerDetailView } from '@/components/admin/InstallerDetailView'
import { useLeadStats, usePartialLeadStats } from './hooks'

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
  const [partialLeadsLoading, setPartialLeadsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSection, setActiveSection] = useState('analytics') // State to track active section (leads, partial-leads, users, analytics, greenbutton, sales-kpi, or commercial-calculator)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null) // State for detailed lead view
  const [selectedPartialLead, setSelectedPartialLead] = useState<MockPartialLead | null>(null) // State for partial lead detail view
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false) // Mobile menu state
  const router = useRouter()
  
  // Users state
  const [users, setUsers] = useState<any[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [deleteUserModalOpen, setDeleteUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userModalMode, setUserModalMode] = useState<'add' | 'edit'>('add')

  // Installers state
  const [installerApplications, setInstallerApplications] = useState<any[]>([])
  const [installersLoading, setInstallersLoading] = useState(false)
  const [selectedInstaller, setSelectedInstaller] = useState<any>(null)
  const [installerStatusFilter, setInstallerStatusFilter] = useState('all')

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
      setPartialLeadsLoading(true)
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
      } finally {
        setPartialLeadsLoading(false)
      }
    }
    
    fetchPartialLeads()
  }, [searchTerm])

  // Calculate stats from real data
  const stats = useLeadStats(leads)
  const partialStats = usePartialLeadStats(partialLeads)

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
    if (activeSection === 'installers') {
      fetchInstallerApplications()
    }
  }, [activeSection])

  // Fetch installer applications (mock data for now)
  const fetchInstallerApplications = async () => {
    setInstallersLoading(true)
    try {
      // TODO: Replace with actual API call when backend is ready
      // For now, use mock data from sessionStorage or create mock data
      const mockApplications = [
        {
          id: 'app-1',
          companyName: 'Solar Solutions Inc.',
          contactPersonName: 'John Smith',
          contactEmail: 'john@solarsolutions.ca',
          contactPhone: '(416) 555-0123',
          websiteUrl: 'https://www.solarsolutions.ca',
          yearsInBusiness: '5+ years',
          primaryServiceProvinces: ['Ontario', 'Alberta'],
          serviceAreaDescription: 'Greater Toronto Area and surrounding regions',
          certifications: {
            esa: true,
            provincial: false,
            manufacturer: ['Tesla', 'Enphase'],
            other: '',
          },
          generalLiabilityCoverage: '$2,000,000',
          numberOfInstalls: '150+',
          typicalSystemSizeRange: '5-15 kW',
          workmanshipWarrantyYears: '10 years',
          productWarrantySupport: 'Full manufacturer warranty support',
          status: 'pending_review',
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'app-2',
          companyName: 'Green Energy Installers',
          contactPersonName: 'Sarah Johnson',
          contactEmail: 'sarah@greenenergy.ca',
          contactPhone: '(905) 555-0456',
          yearsInBusiness: '3-5 years',
          primaryServiceProvinces: ['Ontario'],
          certifications: {
            esa: true,
            provincial: true,
            manufacturer: ['SolarEdge'],
            other: 'CEC Certified',
          },
          generalLiabilityCoverage: '$1,500,000',
          numberOfInstalls: '75+',
          typicalSystemSizeRange: '7-12 kW',
          workmanshipWarrantyYears: '5 years',
          status: 'approved',
          submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          reviewedBy: 'Admin User',
        },
      ]
      
      // Try to get from sessionStorage if available (from installer form submission)
      const stored = sessionStorage.getItem('installerApplication')
      if (stored) {
        try {
          const storedApp = JSON.parse(stored)
          mockApplications.unshift(storedApp)
        } catch (err) {
          console.error('Error parsing stored application:', err)
        }
      }
      
      setInstallerApplications(mockApplications)
    } catch (error) {
      console.error('Error fetching installer applications:', error)
    } finally {
      setInstallersLoading(false)
    }
  }

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

  // Handle installer application click
  const handleInstallerClick = (application: any) => {
    setSelectedInstaller(application)
  }

  // Handle closing installer detail view
  const handleCloseInstallerView = () => {
    setSelectedInstaller(null)
  }

  // Handle installer status update
  const handleInstallerStatusUpdate = async (id: string, status: string, notes?: string) => {
    // TODO: Replace with actual API call when backend is ready
    setInstallerApplications(prevApps =>
      prevApps.map(app =>
        app.id === id
          ? {
              ...app,
              status,
              reviewNotes: notes || '',
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Admin User', // TODO: Get from auth context
            }
          : app
      )
    )
    
    if (selectedInstaller && selectedInstaller.id === id) {
      setSelectedInstaller({
        ...selectedInstaller,
        status,
        reviewNotes: notes || '',
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'Admin User',
      })
    }
    
    // Refresh the list
    await fetchInstallerApplications()
  }

  // Calculate installer stats
  const installerStats = {
    total: installerApplications.length,
    pending: installerApplications.filter(app => app.status === 'pending_review').length,
    approved: installerApplications.filter(app => app.status === 'approved').length,
    rejected: installerApplications.filter(app => app.status === 'rejected').length,
    needMoreInfo: installerApplications.filter(app => app.status === 'need_more_info').length,
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-navy-500 text-white p-2 rounded-lg shadow-lg"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={handleLogout}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
        totalLeads={stats.totalLeads}
        totalPartialLeads={partialStats.total}
        totalInstallers={installerStats.total}
      />

      {/* Main content */}
      <main className="lg:ml-64 ml-0 p-4 lg:p-8 transition-all duration-300">
        {/* Conditionally render content based on active section */}
        {activeSection === 'analytics' && (
          <AnalyticsSection
            leads={leads}
            stats={stats}
            partialStats={partialStats}
            loading={loading}
          />
        )}

        {activeSection === 'leads' && (
          <LeadsSection
            leads={filteredLeads as any}
            loading={loading}
            stats={stats}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onLeadClick={handleLeadClick as any}
          />
        )}

        {activeSection === 'partial-leads' && (
          <PartialLeadsSection
            partialLeads={partialLeads}
            partialStats={partialStats}
            loading={partialLeadsLoading}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onPartialLeadClick={handlePartialLeadClick}
          />
        )}

        {activeSection === 'users' && (
          <UsersSection
            users={users}
            usersLoading={usersLoading}
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {activeSection === 'installers' && (
          <InstallersSection
            applications={installerApplications}
            loading={installersLoading}
            stats={installerStats}
            statusFilter={installerStatusFilter}
            onStatusFilterChange={setInstallerStatusFilter}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onApplicationClick={handleInstallerClick}
          />
        )}
        {activeSection === 'greenbutton' && (
          <GreenButtonParserSection />
        )}
        {activeSection === 'sales-kpi' && (
          <div>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-navy-500 mb-2">Weekly Sales KPI Dashboard</h1>
              <p className="text-gray-600">Track performance metrics across your sales team</p>
            </div>

            {/* File upload section */}
            <div className="mb-8">
              <FileUpload />
            </div>

            {/* Dashboard section */}
            <KPIDashboard />
          </div>
        )}

        {/* Commercial Calculator Section */}
        {activeSection === 'commercial-calculator' && (
          <CommercialCalculator />
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

      {/* Installer Detail View Modal */}
      {selectedInstaller && (
        <InstallerDetailView
          application={selectedInstaller}
          onClose={handleCloseInstallerView}
          onStatusUpdate={handleInstallerStatusUpdate}
        />
      )}
    </div>
  )
}

