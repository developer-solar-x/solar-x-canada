'use client'

import { Users, Clock, BarChart3, Calculator, Zap, ArrowRightFromLine, ExternalLink, TrendingUp, Building2, MessageSquare, Sparkles, LayoutDashboard, Loader2, Battery } from 'lucide-react'

interface AdminSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  onLogout: () => void
  mobileMenuOpen: boolean
  onMobileMenuClose: () => void
  totalLeads: number
  totalPartialLeads: number
  totalInstallers?: number
  totalFeedback?: number
  logoutLoading?: boolean
  exitLoading?: boolean
  onExitToSite?: (e: React.MouseEvent<HTMLAnchorElement>) => void
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
  totalFeedback = 0,
  logoutLoading = false,
  exitLoading = false,
  onExitToSite,
}: AdminSidebarProps) {
  const handleSectionClick = (section: string) => {
    onSectionChange(section)
    onMobileMenuClose()
  }

  return (
    <>
      <aside className={`
        fixed left-0 top-0 bottom-0 bg-gradient-to-b from-navy-600 to-navy-700 text-white z-40
        transition-transform duration-300 ease-in-out
        w-64 shadow-2xl
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        border-r border-navy-400/20
      `}>
        {/* Header Section */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Admin Dashboard</h2>
              <p className="text-xs text-white/70">Management Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          <button 
            onClick={() => handleSectionClick('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all relative group ${
              activeSection === 'analytics' 
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30' 
                : 'hover:bg-white/10 text-white/90 hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeSection === 'analytics' ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
              <TrendingUp size={18} className="flex-shrink-0" />
            </div>
            <span>Analytics</span>
            {activeSection === 'analytics' && (
              <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
            )}
          </button>

          <button 
            onClick={() => handleSectionClick('leads')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all relative group ${
              activeSection === 'leads' 
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30' 
                : 'hover:bg-white/10 text-white/90 hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeSection === 'leads' ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
              <Users size={18} className="flex-shrink-0" />
            </div>
            <span className="flex-1 text-left">Leads</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              activeSection === 'leads' 
                ? 'bg-white text-red-600' 
                : 'bg-white/20 text-white'
            }`}>
              {totalLeads}
            </span>
            {activeSection === 'leads' && (
              <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
            )}
          </button>

          <button 
            onClick={() => handleSectionClick('partial-leads')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all relative group ${
              activeSection === 'partial-leads' 
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30' 
                : 'hover:bg-white/10 text-white/90 hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeSection === 'partial-leads' ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
              <Clock size={18} className="flex-shrink-0" />
            </div>
            <span className="flex-1 text-left">Partial Leads</span>
            <span className="px-2.5 py-1 bg-yellow-400 text-navy-700 rounded-full text-xs font-bold shadow-sm">
              {totalPartialLeads}
            </span>
            {activeSection === 'partial-leads' && (
              <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
            )}
          </button>

          <button 
            onClick={() => handleSectionClick('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all relative group ${
              activeSection === 'users' 
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30' 
                : 'hover:bg-white/10 text-white/90 hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeSection === 'users' ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
              <Users size={18} className="flex-shrink-0" />
            </div>
            <span>Users</span>
            {activeSection === 'users' && (
              <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
            )}
          </button>

          <button 
            onClick={() => handleSectionClick('installers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all relative group ${
              activeSection === 'installers' 
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30' 
                : 'hover:bg-white/10 text-white/90 hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeSection === 'installers' ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
              <Building2 size={18} className="flex-shrink-0" />
            </div>
            <span className="flex-1 text-left">Installers</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              activeSection === 'installers' 
                ? 'bg-white text-red-600' 
                : 'bg-white/20 text-white'
            }`}>
              {totalInstallers}
            </span>
            {activeSection === 'installers' && (
              <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
            )}
          </button>

          <button 
            onClick={() => handleSectionClick('feedback')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all relative group ${
              activeSection === 'feedback' 
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30' 
                : 'hover:bg-white/10 text-white/90 hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeSection === 'feedback' ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
              <MessageSquare size={18} className="flex-shrink-0" />
            </div>
            <span className="flex-1 text-left">Feedback</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              activeSection === 'feedback' 
                ? 'bg-white text-red-600' 
                : 'bg-white/20 text-white'
            }`}>
              {totalFeedback}
            </span>
            {activeSection === 'feedback' && (
              <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
            )}
          </button>

          <button 
            onClick={() => handleSectionClick('batteries')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all relative group ${
              activeSection === 'batteries' 
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30' 
                : 'hover:bg-white/10 text-white/90 hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeSection === 'batteries' ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
              <Battery size={18} className="flex-shrink-0" />
            </div>
            <span>Batteries</span>
            {activeSection === 'batteries' && (
              <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
            )}
          </button>

          {/* Divider */}
          <div className="my-4 border-t border-white/10"></div>

          <button 
            onClick={() => handleSectionClick('sales-kpi')}
            disabled
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all opacity-60 cursor-not-allowed relative group"
          >
            <div className="p-1.5 rounded-lg bg-white/5">
              <BarChart3 size={18} className="flex-shrink-0" />
            </div>
            <span className="flex-1 text-left">Sales KPI</span>
            <span className="px-2.5 py-1 bg-yellow-400 text-navy-700 rounded-full text-xs font-bold shadow-sm">
              Coming Soon
            </span>
          </button>

          <button 
            onClick={() => handleSectionClick('commercial-calculator')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all relative group ${
              activeSection === 'commercial-calculator' 
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30' 
                : 'hover:bg-white/10 text-white/90 hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeSection === 'commercial-calculator' ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
              <Calculator size={18} className="flex-shrink-0" />
            </div>
            <span>Demand Calc</span>
            {activeSection === 'commercial-calculator' && (
              <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
            )}
          </button>

          <button 
            onClick={() => handleSectionClick('greenbutton')}
            disabled
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all opacity-60 cursor-not-allowed relative group"
          >
            <div className="p-1.5 rounded-lg bg-white/5">
              <Zap size={18} className="flex-shrink-0" />
            </div>
            <span className="flex-1 text-left">Green Button</span>
            <span className="px-2.5 py-1 bg-yellow-400 text-navy-700 rounded-full text-xs font-bold shadow-sm">
              Coming Soon
            </span>
          </button>

          {/* Divider */}
          <div className="my-4 border-t border-white/10"></div>

          <button 
            onClick={() => {
              onLogout()
              onMobileMenuClose()
            }}
            disabled={logoutLoading || exitLoading}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all hover:bg-red-500/20 hover:text-red-200 text-white/80 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-red-500/20">
              {logoutLoading ? (
                <Loader2 size={18} className="flex-shrink-0 animate-spin" />
              ) : (
                <ArrowRightFromLine size={18} className="flex-shrink-0" />
              )}
            </div>
            <span>{logoutLoading ? 'Logging out...' : 'Logout'}</span>
          </button>

          <a 
            href="/" 
            onClick={(e) => {
              if (onExitToSite) {
                onExitToSite(e)
              }
              onMobileMenuClose()
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all hover:bg-white/10 text-white/80 hover:text-white group ${exitLoading || logoutLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10">
              {exitLoading ? (
                <Loader2 size={18} className="flex-shrink-0 animate-spin" />
              ) : (
                <ExternalLink size={18} className="flex-shrink-0" />
              )}
            </div>
            <span>{exitLoading ? 'Redirecting...' : 'Exit to Site'}</span>
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

