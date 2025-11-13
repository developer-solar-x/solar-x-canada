// HubSpot file parser - Processes CSV/XLSX exports and converts to structured lead data
// Handles timezone conversion to America/Toronto and calculates week start dates

import * as XLSX from 'xlsx';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { startOfWeek, format } from 'date-fns';

// Timezone constant for all date processing
const TIMEZONE = 'America/Toronto';

// Raw lead data structure from HubSpot export
interface RawLead {
  Owner: string;
  OwnerAssigned: string;
  PipelineStatus: string;
  OriginalSource?: string;
  UTM_Ad?: string;
  CreateDate?: string;
  FirstConversionDate?: string;
}

// Processed lead data structure for database storage
export interface ProcessedLead {
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

// Parse datetime string in America/Toronto timezone and convert to UTC
function parseDateTimeET(dateString: string): Date | null {
  if (!dateString || dateString.trim() === '') return null;
  try {
    // Parse the date string and treat it as being in Toronto timezone, then convert to UTC
    const date = new Date(dateString);
    return fromZonedTime(date, TIMEZONE);
  } catch (error) {
    console.error('Date parse error:', dateString, error);
    return null;
  }
}

// Get Monday of the week for a given date in Toronto timezone
function getWeekStart(date: Date): string {
  const torontoDate = toZonedTime(date, TIMEZONE);
  const monday = startOfWeek(torontoDate, { weekStartsOn: 1 });
  return format(monday, 'yyyy-MM-dd');
}

// Normalize string fields - trim whitespace and handle empty values
function normalizeString(value: any): string {
  return String(value || '').trim();
}

// Process uploaded file and convert to structured lead data
export function parseHubSpotFile(fileBuffer: Buffer): ProcessedLead[] {
  // Read Excel/CSV file into workbook
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const rawData: RawLead[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const processedLeads: ProcessedLead[] = [];

  // Process each row in the export
  for (const row of rawData) {
    // Validate required fields
    const owner = normalizeString(row.Owner);
    const ownerAssignedStr = normalizeString(row.OwnerAssigned);
    const pipelineStatus = normalizeString(row.PipelineStatus);

    // Skip rows with missing required data
    if (!owner || !ownerAssignedStr || !pipelineStatus) {
      continue;
    }

    // Parse owner assigned date in Toronto timezone
    const ownerAssigned = parseDateTimeET(ownerAssignedStr);
    if (!ownerAssigned) continue;

    // Calculate week start (Monday) for this date
    const weekStart = getWeekStart(ownerAssigned);

    // Determine effective source (UTM_Ad takes priority, then OriginalSource, then Unknown)
    const utmAd = normalizeString(row.UTM_Ad);
    const originalSource = normalizeString(row.OriginalSource);
    const effectiveSource = utmAd || originalSource || 'Unknown';

    // Build processed lead object
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

