// Performance chart component - Bar chart showing agent performance percentages
// Uses Recharts with brand color palette

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  owner: string;
  qualified_pct: number;
  proposal_pct: number;
  closed_pct: number;
}

interface Props {
  data: ChartData[];
}

export default function PerformanceChart({ data }: Props) {
  // Transform data for chart display
  const chartData = data.map((d) => ({
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

