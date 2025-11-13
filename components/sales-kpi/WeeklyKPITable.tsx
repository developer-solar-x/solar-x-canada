// Weekly KPI table component - Displays agent performance metrics per week
// Expandable accordion interface with totals row

'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';

// KPI data structure
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
  // Accordion state management
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate totals across all agents for this week
  const totals = data.reduce((acc, row) => ({
    total_leads: acc.total_leads + row.total_leads,
    qualified: acc.qualified + row.qualified,
    proposal: acc.proposal + row.proposal,
    closed: acc.closed + row.closed
  }), { total_leads: 0, qualified: 0, proposal: 0, closed: 0 });

  // Create totals row with calculated percentages
  const totalsRow = {
    owner: 'TOTAL',
    ...totals,
    qualified_pct: totals.total_leads > 0 ? parseFloat(((totals.qualified / totals.total_leads) * 100).toFixed(1)) : 0,
    proposal_pct: totals.total_leads > 0 ? parseFloat(((totals.proposal / totals.total_leads) * 100).toFixed(1)) : 0,
    closed_pct: totals.total_leads > 0 ? parseFloat(((totals.closed / totals.total_leads) * 100).toFixed(1)) : 0
  };

  // Format week date for display
  const weekLabel = format(parseISO(week), 'MMM d, yyyy');

  return (
    <div className="card">
      {/* Accordion header */}
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
        {/* Expand/collapse icon */}
        <svg
          className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Table content (shown when expanded) */}
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
              {/* Agent rows */}
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
              
              {/* Totals row */}
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

// Percentage badge component with color coding
function PercentageBadge({ value, color, bold = false }: { value: number; color: 'blue' | 'red'; bold?: boolean }) {
  const bgColor = color === 'blue' ? 'bg-blue-100' : 'bg-red-100';
  const textColor = color === 'blue' ? 'text-blue-700' : 'text-red-700';
  
  return (
    <span className={`inline-block px-2 py-1 rounded text-sm ${bgColor} ${textColor} ${bold ? 'font-bold' : 'font-medium'}`}>
      {value.toFixed(1)}%
    </span>
  );
}

