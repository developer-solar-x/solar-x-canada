// KPI Calculator - Computes weekly sales KPIs from lead data
// Calculates qualified, proposal, and closed percentages per owner and per week

// Lead data structure for KPI calculation
interface Lead {
  week_start: string;
  owner: string;
  pipeline_status: string;
}

// Weekly KPI data structure
export interface WeeklyKPI {
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

// Pipeline status constants for categorization
const STATUS_QUALIFIED = 'Qualified';
const STATUS_PROPOSAL = ['Proposal Pitched', 'Proposal Booked'];
const STATUS_CLOSED = 'Signed & Closed';

// Calculate KPIs per owner per week
export function calculateWeeklyKPIs(leads: Lead[]): WeeklyKPI[] {
  // Group leads by week and owner
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
    
    // Count leads by status
    const qualified = groupLeads.filter(l => l.pipeline_status === STATUS_QUALIFIED).length;
    const proposal = groupLeads.filter(l => STATUS_PROPOSAL.includes(l.pipeline_status)).length;
    const closed = groupLeads.filter(l => l.pipeline_status === STATUS_CLOSED).length;

    // Calculate percentages with zero-safe division
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

// Calculate rollup KPIs per week (all owners combined)
export function calculateWeeklyRollup(leads: Lead[]): Omit<WeeklyKPI, 'owner'>[] {
  // Group leads by week only
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
    
    // Count leads by status across all owners
    const qualified = weekLeads.filter(l => l.pipeline_status === STATUS_QUALIFIED).length;
    const proposal = weekLeads.filter(l => STATUS_PROPOSAL.includes(l.pipeline_status)).length;
    const closed = weekLeads.filter(l => l.pipeline_status === STATUS_CLOSED).length;

    // Calculate percentages with zero-safe division
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

  // Sort by week start date (ascending)
  return rollups.sort((a, b) => a.week_start.localeCompare(b.week_start));
}

