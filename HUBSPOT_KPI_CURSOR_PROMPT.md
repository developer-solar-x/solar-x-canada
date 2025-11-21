# HubSpot Weekly Sales KPI Dashboard - Cursor Build Prompt

## Project Overview
Build a Next.js application that processes HubSpot export data (CSV/XLSX) to compute and visualize weekly sales KPIs per agent and team. All data managed through Supabase with timezone-aware processing (America/Toronto).

## Tech Stack Requirements
- **Framework**: Next.js 15 (latest App Router)
- **Styling**: Tailwind CSS v4 (use existing color palette defined below)
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts or Chart.js
- **File Processing**: xlsx library for parsing
- **Datetime**: date-fns-tz for timezone handling
- **UI Components**: Build custom components using the existing design system

## Color Palette (MUST USE)
Use these exact CSS custom properties from the existing design system:

```css
/* Primary brand colors */
--color-navy-500: #1B4E7C;      /* Primary brand color - headings, key elements */
--color-navy-600: #163E63;      /* Hover states */
--color-navy-700: #102F4A;      /* Dark accents */

/* Red accent */
--color-red-500: #DC143C;       /* CTAs, important actions */
--color-red-600: #B01030;       /* Red hover states */
--color-red-100: #FDD3DB;       /* Light red backgrounds */

/* Blue accent for data visualization */
--color-blue-500: #4A90E2;      /* Charts, tech elements */
--color-blue-400: #47A7F7;      /* Light blue accents */
--color-blue-600: #3B73B5;      /* Dark blue accents */

/* Neutral grays */
--color-gray-50: #F8FAFC;       /* Backgrounds */
--color-gray-100: #F1F5F9;      /* Light backgrounds */
--color-gray-200: #E2E8F0;      /* Borders */
--color-gray-500: #64748B;      /* Muted text */
--color-gray-700: #334155;      /* Secondary text */
--color-gray-800: #1E293B;      /* Primary text */

/* Success/Warning/Error states */
--color-green-500: #10B981;     /* Success indicators */
--color-yellow-500: #F59E0B;    /* Warning states */
--color-red-500: #DC143C;       /* Error states */
```

### Chart Color Scheme
- **Qualified**: `#4A90E2` (blue-500)
- **Proposal**: `#10B981` (green)
- **Closed**: `#DC143C` (red-500)
- **Total Leads**: `#1B4E7C` (navy-500)
- **Trend Lines**: `#163E63` (navy-600)

## Font System
```css
--font-sans: 'Inter', system-ui, sans-serif;      /* Body text */
--font-display: 'Montserrat', sans-serif;          /* Headings */
```
Import from Google Fonts:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800;900&display=swap');
```

## Component Design System
Use these existing styles and patterns:

### Buttons
```tsx
// Primary action button (red)
<button className="btn-primary">Export Data</button>

// Secondary button (navy)
<button className="btn-secondary">View Details</button>

// Outline button
<button className="btn-outline">Cancel</button>
```

### Cards
```tsx
// Standard card
<div className="card">...</div>

// Interactive card with hover effect
<div className="card-hover">...</div>
```

### Headings
```tsx
<h1 className="heading-xl">Weekly Sales Dashboard</h1>
<h2 className="heading-lg">Performance Metrics</h2>
<h3 className="heading-md">Agent KPIs</h3>
```

## Functional Requirements

### 1. Data Model (Supabase Schema)

#### Table: `uploads`
```sql
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id),
  row_count INTEGER,
  processing_status TEXT DEFAULT 'pending',
  error_message TEXT
);
```

#### Table: `leads`
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
  owner TEXT NOT NULL,
  owner_assigned TIMESTAMPTZ NOT NULL,
  pipeline_status TEXT NOT NULL,
  original_source TEXT,
  utm_ad TEXT,
  effective_source TEXT,
  create_date TIMESTAMPTZ,
  first_conversion_date TIMESTAMPTZ,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_owner_week ON leads(owner, week_start);
CREATE INDEX idx_leads_week ON leads(week_start);
CREATE INDEX idx_leads_upload ON leads(upload_id);
```

#### Table: `weekly_kpis`
```sql
CREATE TABLE weekly_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  owner TEXT NOT NULL,
  total_leads INTEGER NOT NULL,
  qualified INTEGER NOT NULL,
  proposal INTEGER NOT NULL,
  closed INTEGER NOT NULL,
  qualified_pct NUMERIC(5,1) NOT NULL,
  proposal_pct NUMERIC(5,1) NOT NULL,
  closed_pct NUMERIC(5,1) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(upload_id, week_start, owner)
);

CREATE INDEX idx_weekly_kpis_week_owner ON weekly_kpis(week_start, owner);
```

#### Table: `weekly_rollup`
```sql
CREATE TABLE weekly_rollup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  total_leads INTEGER NOT NULL,
  qualified INTEGER NOT NULL,
  proposal INTEGER NOT NULL,
  closed INTEGER NOT NULL,
  qualified_pct NUMERIC(5,1) NOT NULL,
  proposal_pct NUMERIC(5,1) NOT NULL,
  closed_pct NUMERIC(5,1) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(upload_id, week_start)
);
```

### 2. Data Processing Logic

#### File Upload & Parsing
```typescript
// Location: lib/hubspot-parser.ts

import * as XLSX from 'xlsx';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { startOfWeek, format } from 'date-fns';

const TIMEZONE = 'America/Toronto';

interface RawLead {
  Owner: string;
  OwnerAssigned: string;
  PipelineStatus: string;
  OriginalSource?: string;
  UTM_Ad?: string;
  CreateDate?: string;
  FirstConversionDate?: string;
}

interface ProcessedLead {
  owner: string;
  owner_assigned: Date;
  pipeline_status: string;
  original_source: string | null;
  utm_ad: string | null;
  effective_source: string;
  create_date: Date | null;
  first_conversion_date: Date | null;
  week_start: string; // YYYY-MM-DD format (Monday)
}

// Parse datetime in America/Toronto timezone
function parseDateTimeET(dateString: string): Date | null {
  if (!dateString || dateString.trim() === '') return null;
  try {
    // Parse as Toronto time and convert to UTC
    return zonedTimeToUtc(dateString, TIMEZONE);
  } catch (error) {
    console.error('Date parse error:', dateString, error);
    return null;
  }
}

// Get Monday of the week for a given date in Toronto timezone
function getWeekStart(date: Date): string {
  const torontoDate = utcToZonedTime(date, TIMEZONE);
  const monday = startOfWeek(torontoDate, { weekStartsOn: 1 });
  return format(monday, 'yyyy-MM-dd');
}

// Normalize string fields
function normalizeString(value: any): string {
  return String(value || '').trim();
}

// Process uploaded file
export function parseHubSpotFile(fileBuffer: Buffer): ProcessedLead[] {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const rawData: RawLead[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const processedLeads: ProcessedLead[] = [];

  for (const row of rawData) {
    // Validate required fields
    const owner = normalizeString(row.Owner);
    const ownerAssignedStr = normalizeString(row.OwnerAssigned);
    const pipelineStatus = normalizeString(row.PipelineStatus);

    if (!owner || !ownerAssignedStr || !pipelineStatus) {
      continue; // Skip invalid rows
    }

    const ownerAssigned = parseDateTimeET(ownerAssignedStr);
    if (!ownerAssigned) continue;

    const weekStart = getWeekStart(ownerAssigned);

    // Effective source logic
    const utmAd = normalizeString(row.UTM_Ad);
    const originalSource = normalizeString(row.OriginalSource);
    const effectiveSource = utmAd || originalSource || 'Unknown';

    processedLeads.push({
      owner,
      owner_assigned: ownerAssigned,
      pipeline_status: pipelineStatus,
      original_source: originalSource || null,
      utm_ad: utmAd || null,
      effective_source: effectiveSource,
      create_date: row.CreateDate ? parseDateTimeET(row.CreateDate) : null,
      first_conversion_date: row.FirstConversionDate ? parseDateTimeET(row.FirstConversionDate) : null,
      week_start: weekStart
    });
  }

  return processedLeads;
}
```

#### KPI Calculation
```typescript
// Location: lib/kpi-calculator.ts

interface Lead {
  week_start: string;
  owner: string;
  pipeline_status: string;
}

interface WeeklyKPI {
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

const STATUS_QUALIFIED = 'Qualified';
const STATUS_PROPOSAL = ['Proposal Pitched', 'Proposal Booked'];
const STATUS_CLOSED = 'Signed & Closed';

// Calculate KPIs per owner per week
export function calculateWeeklyKPIs(leads: Lead[]): WeeklyKPI[] {
  // Group by week and owner
  const grouped = new Map<string, Lead[]>();

  for (const lead of leads) {
    const key = `${lead.week_start}|${lead.owner}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(lead);
  }

  // Calculate KPIs for each group
  const kpis: WeeklyKPI[] = [];

  for (const [key, groupLeads] of grouped) {
    const [week_start, owner] = key.split('|');
    const total_leads = groupLeads.length;
    
    const qualified = groupLeads.filter(l => l.pipeline_status === STATUS_QUALIFIED).length;
    const proposal = groupLeads.filter(l => STATUS_PROPOSAL.includes(l.pipeline_status)).length;
    const closed = groupLeads.filter(l => l.pipeline_status === STATUS_CLOSED).length;

    kpis.push({
      week_start,
      owner,
      total_leads,
      qualified,
      proposal,
      closed,
      qualified_pct: total_leads > 0 ? parseFloat(((qualified / total_leads) * 100).toFixed(1)) : 0,
      proposal_pct: total_leads > 0 ? parseFloat(((proposal / total_leads) * 100).toFixed(1)) : 0,
      closed_pct: total_leads > 0 ? parseFloat(((closed / total_leads) * 100).toFixed(1)) : 0
    });
  }

  return kpis;
}

// Calculate rollup KPIs per week
export function calculateWeeklyRollup(leads: Lead[]): Omit<WeeklyKPI, 'owner'>[] {
  const grouped = new Map<string, Lead[]>();

  for (const lead of leads) {
    if (!grouped.has(lead.week_start)) {
      grouped.set(lead.week_start, []);
    }
    grouped.get(lead.week_start)!.push(lead);
  }

  const rollups: Omit<WeeklyKPI, 'owner'>[] = [];

  for (const [week_start, weekLeads] of grouped) {
    const total_leads = weekLeads.length;
    
    const qualified = weekLeads.filter(l => l.pipeline_status === STATUS_QUALIFIED).length;
    const proposal = weekLeads.filter(l => STATUS_PROPOSAL.includes(l.pipeline_status)).length;
    const closed = weekLeads.filter(l => l.pipeline_status === STATUS_CLOSED).length;

    rollups.push({
      week_start,
      total_leads,
      qualified,
      proposal,
      closed,
      qualified_pct: total_leads > 0 ? parseFloat(((qualified / total_leads) * 100).toFixed(1)) : 0,
      proposal_pct: total_leads > 0 ? parseFloat(((proposal / total_leads) * 100).toFixed(1)) : 0,
      closed_pct: total_leads > 0 ? parseFloat(((closed / total_leads) * 100).toFixed(1)) : 0
    });
  }

  return rollups.sort((a, b) => a.week_start.localeCompare(b.week_start));
}
```

### 3. API Routes

#### Upload Handler
```typescript
// Location: app/api/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { parseHubSpotFile } from '@/lib/hubspot-parser';
import { calculateWeeklyKPIs, calculateWeeklyRollup } from '@/lib/kpi-calculator';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      return NextResponse.json({ error: 'Invalid file type. Upload CSV or XLSX only.' }, { status: 400 });
    }

    // Upload file to Supabase Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('hubspot-uploads')
      .upload(fileName, fileBuffer);

    if (uploadError) {
      return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
    }

    // Create upload record
    const { data: uploadRecord, error: uploadRecordError } = await supabase
      .from('uploads')
      .insert({
        filename: file.name,
        file_url: uploadData.path,
        uploaded_by: user.id,
        processing_status: 'processing'
      })
      .select()
      .single();

    if (uploadRecordError) {
      return NextResponse.json({ error: 'Failed to create upload record' }, { status: 500 });
    }

    // Parse file
    const processedLeads = parseHubSpotFile(fileBuffer);

    if (processedLeads.length === 0) {
      await supabase.from('uploads').update({ 
        processing_status: 'failed',
        error_message: 'No valid leads found'
      }).eq('id', uploadRecord.id);
      
      return NextResponse.json({ error: 'No valid leads found in file' }, { status: 400 });
    }

    // Insert leads
    const leadsToInsert = processedLeads.map(lead => ({
      ...lead,
      upload_id: uploadRecord.id
    }));

    const { error: leadsError } = await supabase
      .from('leads')
      .insert(leadsToInsert);

    if (leadsError) {
      return NextResponse.json({ error: 'Failed to save leads' }, { status: 500 });
    }

    // Calculate KPIs
    const weeklyKPIs = calculateWeeklyKPIs(processedLeads);
    const weeklyRollup = calculateWeeklyRollup(processedLeads);

    // Insert KPIs
    const kpisToInsert = weeklyKPIs.map(kpi => ({
      ...kpi,
      upload_id: uploadRecord.id
    }));

    await supabase.from('weekly_kpis').insert(kpisToInsert);

    const rollupsToInsert = weeklyRollup.map(rollup => ({
      ...rollup,
      upload_id: uploadRecord.id
    }));

    await supabase.from('weekly_rollup').insert(rollupsToInsert);

    // Update upload status
    await supabase.from('uploads').update({ 
      processing_status: 'completed',
      row_count: processedLeads.length
    }).eq('id', uploadRecord.id);

    return NextResponse.json({
      success: true,
      upload_id: uploadRecord.id,
      leads_processed: processedLeads.length,
      weeks_processed: new Set(processedLeads.map(l => l.week_start)).size
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 4. UI Components

#### Dashboard Layout
```typescript
// Location: app/dashboard/page.tsx

import { Suspense } from 'react';
import FileUpload from '@/components/FileUpload';
import KPIDashboard from '@/components/KPIDashboard';
import FilterPanel from '@/components/FilterPanel';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="heading-xl">Weekly Sales KPI Dashboard</h1>
          <p className="text-gray-500 mt-2">Track performance metrics across your sales team</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <section className="mb-8">
          <FileUpload />
        </section>

        {/* Filters */}
        <section className="mb-6">
          <FilterPanel />
        </section>

        {/* Dashboard */}
        <Suspense fallback={<DashboardSkeleton />}>
          <KPIDashboard />
        </Suspense>
      </main>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
    </div>
  );
}
```

#### File Upload Component
```tsx
// Location: components/FileUpload.tsx

'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export default function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadResult(result);
      // Trigger refresh of dashboard data
      window.dispatchEvent(new CustomEvent('kpi-data-updated'));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <div className="card">
      <h2 className="heading-md mb-4">Upload HubSpot Data</h2>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragActive ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-navy-500 hover:bg-gray-50'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-navy-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-700 font-medium">Processing file...</p>
          </div>
        ) : (
          <>
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-700 font-medium mb-2">
              {isDragActive ? 'Drop file here' : 'Drag & drop your HubSpot export'}
            </p>
            <p className="text-sm text-gray-500">or click to browse</p>
            <p className="text-xs text-gray-400 mt-2">Supports CSV and XLSX files</p>
          </>
        )}
      </div>

      {/* Success Message */}
      {uploadResult && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium text-green-900">Upload successful!</p>
              <p className="text-sm text-green-700 mt-1">
                Processed {uploadResult.leads_processed} leads across {uploadResult.weeks_processed} weeks
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium text-red-900">Upload failed</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### KPI Dashboard Component
```tsx
// Location: components/KPIDashboard.tsx

'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import WeeklyKPITable from './WeeklyKPITable';
import PerformanceChart from './PerformanceChart';
import TrendChart from './TrendChart';
import ExportButton from './ExportButton';

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
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // Fetch KPI data
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('weekly_kpis')
        .select('*')
        .order('week_start', { ascending: false })
        .order('owner');

      if (error) throw error;
      setKpiData(data || []);
      
      // Set most recent week as selected
      if (data && data.length > 0) {
        setSelectedWeek(data[0].week_start);
      }
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for upload events
    const handleUpdate = () => fetchData();
    window.addEventListener('kpi-data-updated', handleUpdate);
    return () => window.removeEventListener('kpi-data-updated', handleUpdate);
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (kpiData.length === 0) {
    return (
      <div className="card text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No data yet</h3>
        <p className="text-gray-500">Upload a HubSpot export file to see KPI metrics</p>
      </div>
    );
  }

  // Get unique weeks
  const weeks = Array.from(new Set(kpiData.map(d => d.week_start))).sort().reverse();

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
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

      {/* Charts */}
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

      {/* Export Button */}
      <div className="flex justify-end">
        <ExportButton data={kpiData} />
      </div>

      {/* Weekly Breakdown Tables */}
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

function calculateAvgPercentage(data: KPIData[], field: 'qualified_pct' | 'proposal_pct' | 'closed_pct'): string {
  const totalLeads = data.reduce((sum, d) => sum + d.total_leads, 0);
  const fieldSum = field === 'qualified_pct' 
    ? data.reduce((sum, d) => sum + d.qualified, 0)
    : field === 'proposal_pct'
    ? data.reduce((sum, d) => sum + d.proposal, 0)
    : data.reduce((sum, d) => sum + d.closed, 0);
  
  return totalLeads > 0 ? ((fieldSum / totalLeads) * 100).toFixed(1) : '0.0';
}

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
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <IconForType type={icon} />
        </div>
      </div>
    </div>
  );
}

function IconForType({ type }: { type: string }) {
  if (type === 'leads') {
    return (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    );
  }
  // Add other icon types...
  return null;
}

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
```

#### Weekly KPI Table
```tsx
// Location: components/WeeklyKPITable.tsx

'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';

interface KPIData {
  owner: string;
  total_leads: number;
  qualified: number;
  proposal: number;
  closed: number;
  qualified_pct: number;
  proposal_pct: number;
  closed_pct: number;
}

interface Props {
  week: string;
  data: KPIData[];
}

export default function WeeklyKPITable({ week, data }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate totals
  const totals = data.reduce((acc, row) => ({
    total_leads: acc.total_leads + row.total_leads,
    qualified: acc.qualified + row.qualified,
    proposal: acc.proposal + row.proposal,
    closed: acc.closed + row.closed
  }), { total_leads: 0, qualified: 0, proposal: 0, closed: 0 });

  const totalsRow = {
    owner: 'TOTAL',
    ...totals,
    qualified_pct: totals.total_leads > 0 ? parseFloat(((totals.qualified / totals.total_leads) * 100).toFixed(1)) : 0,
    proposal_pct: totals.total_leads > 0 ? parseFloat(((totals.proposal / totals.total_leads) * 100).toFixed(1)) : 0,
    closed_pct: totals.total_leads > 0 ? parseFloat(((totals.closed / totals.total_leads) * 100).toFixed(1)) : 0
  };

  const weekLabel = format(parseISO(week), 'MMM d, yyyy');

  return (
    <div className="card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div>
          <h3 className="heading-md">Week of {weekLabel}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {totals.total_leads} total leads • {data.length} agents
          </p>
        </div>
        <svg
          className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-navy-500">
                <th className="text-left py-3 px-4 font-display font-bold text-navy-700">Agent</th>
                <th className="text-right py-3 px-4 font-display font-bold text-navy-700">Total Leads</th>
                <th className="text-right py-3 px-4 font-display font-bold text-navy-700">Qualified</th>
                <th className="text-right py-3 px-4 font-display font-bold text-blue-600">Qualified %</th>
                <th className="text-right py-3 px-4 font-display font-bold text-navy-700">Proposal</th>
                <th className="text-right py-3 px-4 font-display font-bold text-blue-600">Proposal %</th>
                <th className="text-right py-3 px-4 font-display font-bold text-navy-700">Closed</th>
                <th className="text-right py-3 px-4 font-display font-bold text-red-600">Closed %</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900">{row.owner}</td>
                  <td className="text-right py-3 px-4 text-gray-700">{row.total_leads}</td>
                  <td className="text-right py-3 px-4 text-gray-700">{row.qualified}</td>
                  <td className="text-right py-3 px-4">
                    <PercentageBadge value={row.qualified_pct} color="blue" />
                  </td>
                  <td className="text-right py-3 px-4 text-gray-700">{row.proposal}</td>
                  <td className="text-right py-3 px-4">
                    <PercentageBadge value={row.proposal_pct} color="blue" />
                  </td>
                  <td className="text-right py-3 px-4 text-gray-700">{row.closed}</td>
                  <td className="text-right py-3 px-4">
                    <PercentageBadge value={row.closed_pct} color="red" />
                  </td>
                </tr>
              ))}
              
              {/* Totals Row */}
              <tr className="bg-navy-50 font-bold border-t-2 border-navy-500">
                <td className="py-3 px-4 text-navy-900">{totalsRow.owner}</td>
                <td className="text-right py-3 px-4 text-navy-900">{totalsRow.total_leads}</td>
                <td className="text-right py-3 px-4 text-navy-900">{totalsRow.qualified}</td>
                <td className="text-right py-3 px-4">
                  <PercentageBadge value={totalsRow.qualified_pct} color="blue" bold />
                </td>
                <td className="text-right py-3 px-4 text-navy-900">{totalsRow.proposal}</td>
                <td className="text-right py-3 px-4">
                  <PercentageBadge value={totalsRow.proposal_pct} color="blue" bold />
                </td>
                <td className="text-right py-3 px-4 text-navy-900">{totalsRow.closed}</td>
                <td className="text-right py-3 px-4">
                  <PercentageBadge value={totalsRow.closed_pct} color="red" bold />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PercentageBadge({ value, color, bold = false }: { value: number; color: 'blue' | 'red'; bold?: boolean }) {
  const bgColor = color === 'blue' ? 'bg-blue-100' : 'bg-red-100';
  const textColor = color === 'blue' ? 'text-blue-700' : 'text-red-700';
  
  return (
    <span className={`inline-block px-2 py-1 rounded text-sm ${bgColor} ${textColor} ${bold ? 'font-bold' : 'font-medium'}`}>
      {value.toFixed(1)}%
    </span>
  );
}
```

### 5. Chart Components

Use Recharts with the specified color palette:

```tsx
// Location: components/PerformanceChart.tsx

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PerformanceChart({ data }: any) {
  const chartData = data.map((d: any) => ({
    name: d.owner,
    'Qualified %': d.qualified_pct,
    'Proposal %': d.proposal_pct,
    'Closed %': d.closed_pct
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="name" stroke="#64748B" />
        <YAxis stroke="#64748B" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #E2E8F0',
            borderRadius: '0.5rem'
          }}
        />
        <Legend />
        <Bar dataKey="Qualified %" fill="#4A90E2" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Proposal %" fill="#10B981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Closed %" fill="#DC143C" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

## Acceptance Criteria Checklist

- [ ] File upload works for CSV and XLSX
- [ ] All dates processed in America/Toronto timezone
- [ ] Weeks start on Monday (ISO standard)
- [ ] Status mapping is accurate (Qualified, Proposal, Closed)
- [ ] Percentages calculated correctly with 1 decimal place
- [ ] Zero-safe calculations (no division by zero errors)
- [ ] Dashboard displays all KPI metrics
- [ ] Tables show weekly breakdown with accordion UI
- [ ] Charts visualize performance using brand colors
- [ ] Export to CSV/XLSX works correctly
- [ ] Performance: 5s max for 100k rows processing
- [ ] Supabase queries under 1s response time
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Error handling for missing columns
- [ ] Success/error notifications display properly
- [ ] Authentication required for access
- [ ] Data persists across sessions

## Implementation Order

1. Set up Next.js project with Tailwind v4
2. Configure Supabase connection and create tables
3. Implement file parsing logic (lib/hubspot-parser.ts)
4. Implement KPI calculation logic (lib/kpi-calculator.ts)
5. Create upload API route
6. Build FileUpload component
7. Build dashboard layout
8. Build KPI table components
9. Build chart components
10. Add export functionality
11. Add filters
12. Implement authentication
13. Add error handling and validation
14. Test with sample data
15. Performance optimization

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Package Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/auth-helpers-nextjs": "^0.9.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "xlsx": "^0.18.5",
    "date-fns": "^3.0.0",
    "date-fns-tz": "^2.0.0",
    "recharts": "^2.10.0",
    "react-dropzone": "^14.2.3",
    "tailwindcss": "^4.0.0"
  }
}
```

## Notes
- All components follow the existing design system
- Use the exact color values specified in the palette
- Components are client-side when needed ('use client')
- Server components used for static layouts
- API routes handle all server-side processing
- Timezone handling is critical - always use America/Toronto
- Week calculations must use ISO weeks (Monday start)
- Performance is important - optimize for large datasets
- Mobile-first responsive design
















