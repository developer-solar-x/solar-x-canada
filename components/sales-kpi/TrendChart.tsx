// Trend chart component - Line chart showing KPI trends over time
// Displays 12-week rolling trend for key metrics

'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface KPIData {
  week_start: string;
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

export default function TrendChart({ data }: Props) {
  // Get unique weeks and sort them
  const weeks = Array.from(new Set(data.map(d => d.week_start)))
    .sort()
    .slice(-12); // Last 12 weeks

  // Aggregate data by week (sum across all owners)
  const weeklyData = weeks.map(week => {
    const weekData = data.filter(d => d.week_start === week);
    const totals = weekData.reduce((acc, d) => ({
      total_leads: acc.total_leads + d.total_leads,
      qualified: acc.qualified + d.qualified,
      proposal: acc.proposal + d.proposal,
      closed: acc.closed + d.closed
    }), { total_leads: 0, qualified: 0, proposal: 0, closed: 0 });

    return {
      week: format(parseISO(week), 'MMM d'),
      'Qualified %': totals.total_leads > 0 
        ? parseFloat(((totals.qualified / totals.total_leads) * 100).toFixed(1))
        : 0,
      'Proposal %': totals.total_leads > 0
        ? parseFloat(((totals.proposal / totals.total_leads) * 100).toFixed(1))
        : 0,
      'Closed %': totals.total_leads > 0
        ? parseFloat(((totals.closed / totals.total_leads) * 100).toFixed(1))
        : 0
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={weeklyData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="week" stroke="#64748B" />
        <YAxis stroke="#64748B" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #E2E8F0',
            borderRadius: '0.5rem'
          }}
        />
        <Legend />
        <Line type="monotone" dataKey="Qualified %" stroke="#4A90E2" strokeWidth={2} dot={{ fill: '#4A90E2' }} />
        <Line type="monotone" dataKey="Proposal %" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
        <Line type="monotone" dataKey="Closed %" stroke="#DC143C" strokeWidth={2} dot={{ fill: '#DC143C' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

