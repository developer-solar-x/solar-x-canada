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
import { FeedbackSection } from './sections/FeedbackSection'
import { InstallerDetailView } from '@/components/admin/InstallerDetailView'
import { FeedbackDetailView } from '@/components/admin/FeedbackDetailView'
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
  
  // Navigation loading states
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [exitLoading, setExitLoading] = useState(false)

  // Feedback state
  const [feedbackEntries, setFeedbackEntries] = useState<any[]>([])
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null)
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState('all')
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('all')
  const [feedbackProvinceFilter, setFeedbackProvinceFilter] = useState('all')
  const [feedbackDateRangeFilter, setFeedbackDateRangeFilter] = useState({ start: '', end: '' })

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
        const result = await response.json()
        
        if (!response.ok) {
          console.error('Failed to fetch leads:', response.status, result)
          // Show error message to user
          alert(`Error loading leads: ${result.error || result.details || response.statusText}\n\n${result.hint || ''}`)
          setLeads([])
          return
        }
        
        console.log('Leads API response:', { success: result.success, leadsCount: result.data?.leads?.length, result })
        
        if (result.success && result.data) {
          const leadsData = result.data.leads || result.data || []
          if (Array.isArray(leadsData) && leadsData.length > 0) {
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
            // New TOU fields
            lead.tou_solar = toNumber(lead.tou_solar)
            lead.tou_battery_solar_capture = toNumber(lead.tou_battery_solar_capture)
            lead.tou_total_offset = toNumber(lead.tou_total_offset)
            lead.tou_buy_from_grid = toNumber(lead.tou_buy_from_grid)
            lead.tou_actual_cost_after_battery_optimization = toNumber(lead.tou_actual_cost_after_battery_optimization)
            lead.tou_savings = toNumber(lead.tou_savings)
            lead.tou_monthly_savings = toNumber(lead.tou_monthly_savings)
            lead.tou_profit_25_year = toNumber(lead.tou_profit_25_year)
            lead.tou_payback_period = toNumber(lead.tou_payback_period)
            lead.tou_total_bill_savings_percent = toNumber(lead.tou_total_bill_savings_percent)
            lead.tou_before_solar = toNumber(lead.tou_before_solar)
            lead.tou_after_solar = toNumber(lead.tou_after_solar)
            // New ULO fields
            lead.ulo_solar = toNumber(lead.ulo_solar)
            lead.ulo_battery_solar_capture = toNumber(lead.ulo_battery_solar_capture)
            lead.ulo_total_offset = toNumber(lead.ulo_total_offset)
            lead.ulo_buy_from_grid = toNumber(lead.ulo_buy_from_grid)
            lead.ulo_actual_cost_after_battery_optimization = toNumber(lead.ulo_actual_cost_after_battery_optimization)
            lead.ulo_savings = toNumber(lead.ulo_savings)
            lead.ulo_monthly_savings = toNumber(lead.ulo_monthly_savings)
            lead.ulo_profit_25_year = toNumber(lead.ulo_profit_25_year)
            lead.ulo_payback_period = toNumber(lead.ulo_payback_period)
            lead.ulo_total_bill_savings_percent = toNumber(lead.ulo_total_bill_savings_percent)
            lead.ulo_before_solar = toNumber(lead.ulo_before_solar)
            lead.ulo_after_solar = toNumber(lead.ulo_after_solar)
            // Battery fields
            lead.battery_cost = toNumber(lead.battery_cost)
            lead.battery_rebate = toNumber(lead.battery_rebate)
            return {
              ...lead,
              city,
              annual_savings: annualSavings,
              system_size_kw: systemSizeKw,
            }
          })
          setLeads(mappedLeads)
            console.log('Mapped leads:', mappedLeads.length, 'leads')
          } else {
            console.log('No leads found in database')
            setLeads([])
          }
        } else {
          console.warn('Unexpected response format:', result)
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
    setLogoutLoading(true)
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.push('/admin/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
      setLogoutLoading(false)
    }
  }
  
  // Handle exit to site
  const handleExitToSite = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setExitLoading(true)
    // Small delay to show loading state
    setTimeout(() => {
      window.location.href = '/'
    }, 300)
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
    if (activeSection === 'feedback') {
      fetchFeedbackEntries()
    }
  }, [activeSection, installerStatusFilter, searchTerm, feedbackStatusFilter, feedbackTypeFilter, feedbackProvinceFilter, feedbackDateRangeFilter])

  // Fetch installer applications
  const fetchInstallerApplications = async () => {
    setInstallersLoading(true)
    try {
      const params = new URLSearchParams()
      if (installerStatusFilter && installerStatusFilter !== 'all') {
        params.append('status', installerStatusFilter)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      
      const response = await fetch(`/api/installers?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch installer applications')
      }
      
      const result = await response.json()
      if (result.success && result.applications) {
        // Map database fields to component interface
        const mappedApplications = result.applications.map((app: any) => ({
          id: app.id,
          companyName: app.company_name,
          contactPersonName: app.contact_person_name,
          contactEmail: app.contact_email,
          contactPhone: app.contact_phone,
          websiteUrl: app.website_url,
          yearsInBusiness: app.years_in_business,
          primaryServiceProvinces: app.primary_service_provinces || [],
          serviceAreaDescription: app.service_area_description,
          province: app.primary_service_provinces?.[0] || 'N/A',
          status: app.status || 'pending_review',
          submittedAt: app.created_at, // Map created_at to submittedAt
          reviewedAt: app.reviewed_at,
          reviewedBy: app.reviewed_by,
          reviewNotes: app.review_notes,
          numberOfInstalls: app.number_of_installs,
          typicalSystemSizeRange: app.typical_system_size_range,
          workmanshipWarrantyYears: app.workmanship_warranty_years,
          productWarrantySupport: app.product_warranty_support,
          generalLiabilityCoverage: app.general_liability_coverage,
          certifications: {
            esa: app.certification_esa_url,
            provincial: app.certification_provincial_url,
            manufacturer: app.certification_manufacturer || [],
            other: app.certification_other_url,
            otherDescription: app.certification_other_description,
          },
          insuranceProof: app.insurance_proof_url,
          projectPhotos: app.project_photos_urls || [],
          agreeToVetting: app.agree_to_vetting,
          agreeToDoubleWarranty: app.agree_to_double_warranty,
          fullApplicationData: app.full_application_data,
        }))
        setInstallerApplications(mappedApplications)
      } else {
        setInstallerApplications([])
      }
    } catch (error) {
      console.error('Error fetching installer applications:', error)
      setInstallerApplications([])
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

  // Fetch feedback entries
  const fetchFeedbackEntries = async () => {
    setFeedbackLoading(true)
    try {
      const params = new URLSearchParams()
      if (feedbackStatusFilter !== 'all') {
        params.append('status', feedbackStatusFilter)
      }
      if (feedbackTypeFilter !== 'all') {
        params.append('type', feedbackTypeFilter)
      }
      if (feedbackProvinceFilter !== 'all') {
        params.append('province', feedbackProvinceFilter)
      }
      if (feedbackDateRangeFilter.start) {
        params.append('startDate', feedbackDateRangeFilter.start)
      }
      if (feedbackDateRangeFilter.end) {
        params.append('endDate', feedbackDateRangeFilter.end)
      }

      const response = await fetch(`/api/feedback?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch feedback')
      }

      const result = await response.json()
      setFeedbackEntries(result.feedback || [])
    } catch (error) {
      console.error('Error fetching feedback entries:', error)
      setFeedbackEntries([])
    } finally {
      setFeedbackLoading(false)
    }
  }

  // Calculate feedback stats
  const feedbackStats = {
    total: feedbackEntries.length,
    new: feedbackEntries.filter(f => f.status === 'new').length,
    reviewed: feedbackEntries.filter(f => f.status === 'reviewed').length,
    inProgress: feedbackEntries.filter(f => f.status === 'in_progress').length,
    resolved: feedbackEntries.filter(f => f.status === 'resolved').length,
    byType: {
      product: feedbackEntries.filter(f => f.type === 'product').length,
      improvement: feedbackEntries.filter(f => f.type === 'improvement').length,
      bug: feedbackEntries.filter(f => f.type === 'bug').length,
    },
  }

  // Handle feedback click
  const handleFeedbackClick = (feedback: any) => {
    setSelectedFeedback(feedback)
  }

  // Handle closing feedback detail view
  const handleCloseFeedbackView = () => {
    setSelectedFeedback(null)
  }

  // Handle feedback status update
  const handleFeedbackStatusUpdate = async (id: string, status: string, notes?: string) => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          reviewNotes: notes,
          reviewedBy: 'Admin User', // TODO: Get from auth context
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update feedback')
      }

      const result = await response.json()
      
      // Update local state
    setFeedbackEntries(prevFeedback =>
      prevFeedback.map(f =>
          f.id === id ? result.feedback : f
      )
    )
    
    if (selectedFeedback && selectedFeedback.id === id) {
        setSelectedFeedback(result.feedback)
      }
    } catch (error) {
      console.error('Error updating feedback:', error)
      throw error
    }
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
        logoutLoading={logoutLoading}
        exitLoading={exitLoading}
        onExitToSite={handleExitToSite}
        totalLeads={stats.totalLeads}
        totalPartialLeads={partialStats.total}
        totalInstallers={installerStats.total}
        totalFeedback={feedbackStats.total}
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

        {activeSection === 'feedback' && (
          <FeedbackSection
            feedback={feedbackEntries}
            loading={feedbackLoading}
            stats={feedbackStats}
            typeFilter={feedbackTypeFilter}
            onTypeFilterChange={setFeedbackTypeFilter}
            statusFilter={feedbackStatusFilter}
            onStatusFilterChange={setFeedbackStatusFilter}
            provinceFilter={feedbackProvinceFilter}
            onProvinceFilterChange={setFeedbackProvinceFilter}
            dateRangeFilter={feedbackDateRangeFilter}
            onDateRangeFilterChange={setFeedbackDateRangeFilter}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onFeedbackClick={handleFeedbackClick}
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

      {/* Feedback Detail View Modal */}
      {selectedFeedback && (
        <FeedbackDetailView
          feedback={selectedFeedback}
          onClose={handleCloseFeedbackView}
          onStatusUpdate={handleFeedbackStatusUpdate}
        />
      )}
    </div>
  )
}

