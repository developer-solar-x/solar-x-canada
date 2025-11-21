'use client'

import { Logo } from '@/components/Logo'
import { Users, Clock, BarChart3, Calculator, Zap, ArrowRightFromLine, ExternalLink, TrendingUp, Building2 } from 'lucide-react'

interface AdminSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  onLogout: () => void
  mobileMenuOpen: boolean
  onMobileMenuClose: () => void
  totalLeads: number
  totalPartialLeads: number
  totalInstallers?: number
}

export function AdminSidebar({
  activeSection,
  onSectionChange,
  onLogout,
  mobileMenuOpen,
  onMobileMenuClose,
  totalLeads,
  totalPartialLeads,
  totalInstallers = 0,
}: AdminSidebarProps) {
  const handleSectionClick = (section: string) => {
    onSectionChange(section)
    onMobileMenuClose()
  }

  return (
    <>
      <aside className={`
        fixed left-0 top-0 bottom-0 bg-navy-500 text-white p-6 z-40
        transition-transform duration-300 ease-in-out
        w-64
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="mb-8 bg-white p-4 rounded-lg">
          <Logo size="md" />
        </div>

        <nav className="space-y-2">
          <button 
            onClick={() => handleSectionClick('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeSection === 'analytics' ? 'bg-red-500' : 'hover:bg-navy-600'
            }`}
          >
            <TrendingUp size={20} className="flex-shrink-0" />
            <span>Analytics</span>
          </button>
          <button 
            onClick={() => handleSectionClick('leads')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeSection === 'leads' ? 'bg-red-500' : 'hover:bg-navy-600'
            }`}
          >
            <Users size={20} className="flex-shrink-0" />
            <span className="flex-1 text-left">Leads</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{totalLeads}</span>
          </button>
          <button 
            onClick={() => handleSectionClick('partial-leads')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeSection === 'partial-leads' ? 'bg-red-500' : 'hover:bg-navy-600'
            }`}
          >
            <Clock size={20} className="flex-shrink-0" />
            <span className="flex-1 text-left">Partial Leads</span>
            <span className="bg-yellow-400 text-navy-500 px-2 py-0.5 rounded-full text-xs font-bold">{totalPartialLeads}</span>
          </button>
          <button 
            onClick={() => handleSectionClick('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeSection === 'users' ? 'bg-red-500' : 'hover:bg-navy-600'
            }`}
          >
            <Users size={20} className="flex-shrink-0" />
            <span>Users</span>
          </button>
          <button 
            onClick={() => handleSectionClick('installers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeSection === 'installers' ? 'bg-red-500' : 'hover:bg-navy-600'
            }`}
          >
            <Building2 size={20} className="flex-shrink-0" />
            <span className="flex-1 text-left">Installers</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{totalInstallers}</span>
          </button>
          <button 
            onClick={() => handleSectionClick('sales-kpi')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeSection === 'sales-kpi' ? 'bg-red-500' : 'hover:bg-navy-600'
            }`}
          >
            <BarChart3 size={20} className="flex-shrink-0" />
            <span>Sales KPI</span>
          </button>
          <button 
            onClick={() => handleSectionClick('commercial-calculator')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeSection === 'commercial-calculator' ? 'bg-red-500' : 'hover:bg-navy-600'
            }`}
          >
            <Calculator size={20} className="flex-shrink-0" />
            <span>Demand Calc</span>
          </button>
          <button 
            onClick={() => handleSectionClick('greenbutton')}
            disabled
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors opacity-60 cursor-not-allowed hover:bg-navy-600"
          >
            <Zap size={20} className="flex-shrink-0" />
            <span className="flex-1 text-left">Green Button</span>
            <span className="text-xs bg-yellow-400 text-navy-500 px-2 py-0.5 rounded-full font-bold">Coming Soon</span>
          </button>
          <button 
            onClick={() => {
              onLogout()
              onMobileMenuClose()
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-navy-600 rounded-lg transition-colors text-left"
          >
            <ArrowRightFromLine size={20} className="flex-shrink-0" />
            <span>Logout</span>
          </button>
          <a 
            href="/" 
            className="flex items-center gap-3 px-4 py-3 hover:bg-navy-600 rounded-lg transition-colors"
            onClick={onMobileMenuClose}
          >
            <ExternalLink size={20} className="flex-shrink-0" />
            <span>Exit to Site</span>
          </a>
        </nav>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={onMobileMenuClose}
        />
      )}
    </>
  )
}

