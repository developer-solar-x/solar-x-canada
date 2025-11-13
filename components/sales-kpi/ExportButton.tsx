// Export button component - Exports KPI data to CSV/XLSX
// Allows users to download processed data for external analysis

'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

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

interface Props {
  data: KPIData[];
}

export default function ExportButton({ data }: Props) {
  const [exporting, setExporting] = useState(false);

  // Handle export to Excel
  const handleExport = async () => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    setExporting(true);

    try {
      // Prepare data for export
      const exportData = data.map(row => ({
        'Week Start': row.week_start,
        'Owner': row.owner,
        'Total Leads': row.total_leads,
        'Qualified': row.qualified,
        'Qualified %': row.qualified_pct,
        'Proposal': row.proposal,
        'Proposal %': row.proposal_pct,
        'Closed': row.closed,
        'Closed %': row.closed_pct
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      ws['!cols'] = [
        { wch: 12 }, // Week Start
        { wch: 20 }, // Owner
        { wch: 12 }, // Total Leads
        { wch: 10 }, // Qualified
        { wch: 12 }, // Qualified %
        { wch: 10 }, // Proposal
        { wch: 12 }, // Proposal %
        { wch: 10 }, // Closed
        { wch: 10 }  // Closed %
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Weekly KPIs');

      // Generate filename with current date
      const filename = `sales-kpi-export-${new Date().toISOString().split('T')[0]}.xlsx`;

      // Write and download file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting || data.length === 0}
      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {exporting ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export to Excel
        </>
      )}
    </button>
  );
}

