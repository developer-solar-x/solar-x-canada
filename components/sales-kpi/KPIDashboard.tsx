// KPI Dashboard component - Main dashboard displaying all sales metrics
// Shows summary stats, charts, and weekly breakdown tables

'use client';

import { useState, useEffect } from 'react';
import WeeklyKPITable from './WeeklyKPITable';
import PerformanceChart from './PerformanceChart';
import TrendChart from './TrendChart';
import ExportButton from './ExportButton';

// KPI data structure
interface KPIData {
  week_start: string;
  owner: string;
  total_leads: number;
  qualified: number;
  proposal: number;
  closed: number;
  qualified_pct: number;
  proposal_pct: number;
  closed_pct: number;
}

export default function KPIDashboard() {
  // Component state management
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  // Fetch KPI data from API
  const fetchData = async () => {
    setLoading(true);
    try {
      // Include credentials to send cookies with the request
      const response = await fetch('/api/admin/sales-kpi/data', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        // Handle error response
        console.error('API error:', result.error || 'Failed to fetch data');
        setKpiData([]);
        return;
      }
      
      if (result.success) {
        setKpiData(result.data || []);
        
        // Set most recent week as selected by default
        if (result.data && result.data.length > 0) {
          setSelectedWeek(result.data[0].week_start);
        }
      } else {
        setKpiData([]);
      }
    } catch (error) {
      console.error('Error fetching KPI data:', error);
      setKpiData([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and listen for updates
  useEffect(() => {
    fetchData();

    // Listen for upload events to refresh data
    const handleUpdate = () => fetchData();
    window.addEventListener('kpi-data-updated', handleUpdate);
    return () => window.removeEventListener('kpi-data-updated', handleUpdate);
  }, []);

  // Loading skeleton
  if (loading) {
    return <DashboardSkeleton />;
  }

  // Empty state
  if (!loading && kpiData.length === 0) {
    return (
      <div className="card text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No data yet</h3>
        <p className="text-gray-500 mb-4">Upload a HubSpot export file to see KPI metrics</p>
        <p className="text-sm text-gray-400">
          Make sure you've run the database schema migration first if this is your first time using the dashboard.
        </p>
      </div>
    );
  }

  // Get unique weeks sorted by date
  const weeks = Array.from(new Set(kpiData.map(d => d.week_start))).sort().reverse();

  return (
    <div className="space-y-6">
      {/* Summary statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Leads"
          value={kpiData.reduce((sum, d) => sum + d.total_leads, 0)}
          icon="leads"
          color="navy"
        />
        <StatCard
          title="Qualified Rate"
          value={`${calculateAvgPercentage(kpiData, 'qualified_pct')}%`}
          icon="qualified"
          color="blue"
        />
        <StatCard
          title="Close Rate"
          value={`${calculateAvgPercentage(kpiData, 'closed_pct')}%`}
          icon="closed"
          color="red"
        />
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="heading-md mb-4">Current Week Performance</h3>
          <PerformanceChart data={kpiData.filter(d => d.week_start === selectedWeek)} />
        </div>
        
        <div className="card">
          <h3 className="heading-md mb-4">12-Week Trend</h3>
          <TrendChart data={kpiData} />
        </div>
      </div>

      {/* Export button */}
      <div className="flex justify-end">
        <ExportButton data={kpiData} />
      </div>

      {/* Weekly breakdown tables */}
      <div className="space-y-4">
        <h2 className="heading-lg">Weekly Breakdown</h2>
        {weeks.map(week => (
          <WeeklyKPITable
            key={week}
            week={week}
            data={kpiData.filter(d => d.week_start === week)}
          />
        ))}
      </div>
    </div>
  );
}

// Calculate average percentage across all data
function calculateAvgPercentage(data: KPIData[], field: 'qualified_pct' | 'proposal_pct' | 'closed_pct'): string {
  const totalLeads = data.reduce((sum, d) => sum + d.total_leads, 0);
  const fieldSum = field === 'qualified_pct' 
    ? data.reduce((sum, d) => sum + d.qualified, 0)
    : field === 'proposal_pct'
    ? data.reduce((sum, d) => sum + d.proposal, 0)
    : data.reduce((sum, d) => sum + d.closed, 0);
  
  return totalLeads > 0 ? ((fieldSum / totalLeads) * 100).toFixed(1) : '0.0';
}

// Stat card component for summary metrics
function StatCard({ title, value, icon, color }: any) {
  const colorClasses = {
    navy: 'bg-navy-50 text-navy-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="card-hover">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-navy-700">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
          <IconForType type={icon} />
        </div>
      </div>
    </div>
  );
}

// Icon component for different stat types
function IconForType({ type }: { type: string }) {
  if (type === 'leads') {
    return (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    );
  }
  if (type === 'qualified') {
    return (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (type === 'closed') {
    return (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  return null;
}

// Loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
    </div>
  );
}

