// Green Button file parser for commercial estimator
// Supports CSV and XML (ESPI) formats

export interface IntervalData {
  ts: string;  // ISO timestamp
  kW: number;
}

export interface ParsedGreenButton {
  intervals: IntervalData[];
  peak15minKW: number;
  peakDateTime: string;
  baseLoadKW: number;
  typicalPeakDurationMin: number;
  warnings: string[];
}

/**
 * Parse CSV Green Button file
 */
export async function parseCSV(file: File): Promise<ParsedGreenButton> {
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header and one data row');
  }

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  const timestampIndex = headers.findIndex(h => 
    h.includes('timestamp') || h.includes('date') || h.includes('time')
  );
  const powerIndex = headers.findIndex(h => 
    h.includes('kw') || h.includes('power') || h.includes('demand') || h.includes('value')
  );

  if (timestampIndex === -1 || powerIndex === -1) {
    throw new Error('CSV must contain timestamp and power (kW) columns');
  }

  const intervals: IntervalData[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < Math.max(timestampIndex, powerIndex) + 1) continue;

    const timestamp = values[timestampIndex];
    const powerStr = values[powerIndex];

    // Parse timestamp
    let ts: Date;
    try {
      ts = new Date(timestamp);
      if (isNaN(ts.getTime())) {
        warnings.push(`Invalid timestamp at row ${i + 1}: ${timestamp}`);
        continue;
      }
    } catch (e) {
      warnings.push(`Invalid timestamp at row ${i + 1}: ${timestamp}`);
      continue;
    }

    // Parse power value
    const kW = parseFloat(powerStr);
    if (isNaN(kW)) {
      warnings.push(`Invalid power value at row ${i + 1}: ${powerStr}`);
      continue;
    }

    intervals.push({
      ts: ts.toISOString(),
      kW: Math.max(0, kW), // Ensure non-negative
    });
  }

  if (intervals.length === 0) {
    throw new Error('No valid data rows found in CSV');
  }

  // Sort by timestamp
  intervals.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  return analyzeIntervals(intervals, warnings);
}

/**
 * Parse Green Button XML (ESPI format)
 */
export async function parseXML(file: File): Promise<ParsedGreenButton> {
  const text = await file.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'text/xml');

  // Check for parsing errors
  const parseError = xml.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML format');
  }

  const intervals: IntervalData[] = [];
  const warnings: string[] = [];

  // Find all IntervalReading elements
  const intervalBlocks = xml.querySelectorAll('IntervalBlock');
  
  for (const block of intervalBlocks) {
    const duration = block.querySelector('duration');
    const start = block.querySelector('start');
    const readings = block.querySelectorAll('IntervalReading');

    if (!duration || !start) continue;

    const durationValue = parseInt(duration.textContent || '0');
    const startTime = new Date(start.textContent || '');

    if (isNaN(startTime.getTime()) || durationValue <= 0) continue;

    for (const reading of readings) {
      const value = reading.querySelector('value');
      const timePeriod = reading.querySelector('timePeriod');

      if (!value) continue;

      // Get timestamp (from timePeriod or use block start + offset)
      let timestamp = startTime;
      if (timePeriod) {
        const tpStart = timePeriod.querySelector('start');
        if (tpStart) {
          timestamp = new Date(tpStart.textContent || '');
        }
      }

      // Parse value (may be in Wh, convert to kW)
      const valueNum = parseInt(value.textContent || '0');
      const durationMinutes = durationValue / 60; // Convert seconds to minutes
      const kW = durationMinutes > 0 ? (valueNum / 1000) / (durationMinutes / 60) : 0; // Convert Wh to kW

      intervals.push({
        ts: timestamp.toISOString(),
        kW: Math.max(0, kW),
      });
    }
  }

  if (intervals.length === 0) {
    throw new Error('No interval data found in XML');
  }

  // Sort by timestamp
  intervals.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  // Resample to 15-minute intervals if needed
  const resampled = resampleTo15Min(intervals);
  return analyzeIntervals(resampled, warnings);
}

/**
 * Resample intervals to 15-minute intervals
 */
function resampleTo15Min(intervals: IntervalData[]): IntervalData[] {
  if (intervals.length === 0) return [];

  const resampled: IntervalData[] = [];
  const startTime = new Date(intervals[0].ts);
  const endTime = new Date(intervals[intervals.length - 1].ts);

  // Round start time to nearest 15 minutes
  const roundedStart = new Date(startTime);
  roundedStart.setMinutes(Math.floor(roundedStart.getMinutes() / 15) * 15, 0, 0);

  let currentTime = new Date(roundedStart);

  while (currentTime <= endTime) {
    const nextTime = new Date(currentTime);
    nextTime.setMinutes(nextTime.getMinutes() + 15);

    // Find all intervals that fall within this 15-minute window
    const windowIntervals = intervals.filter(interval => {
      const ts = new Date(interval.ts);
      return ts >= currentTime && ts < nextTime;
    });

    if (windowIntervals.length > 0) {
      // Average the kW values in this window
      const avgKW = windowIntervals.reduce((sum, i) => sum + i.kW, 0) / windowIntervals.length;
      resampled.push({
        ts: currentTime.toISOString(),
        kW: avgKW,
      });
    }

    currentTime = nextTime;
  }

  return resampled;
}

/**
 * Analyze intervals to find peak, base load, and duration
 */
function analyzeIntervals(
  intervals: IntervalData[],
  warnings: string[]
): ParsedGreenButton {
  if (intervals.length === 0) {
    throw new Error('No intervals to analyze');
  }

  // Find peak 15-minute interval
  let peak15minKW = 0;
  let peakDateTime = intervals[0].ts;

  for (const interval of intervals) {
    if (interval.kW > peak15minKW) {
      peak15minKW = interval.kW;
      peakDateTime = interval.ts;
    }
  }

  // Calculate base load (P5 percentile or min of off-hours)
  const kWValues = intervals.map(i => i.kW).sort((a, b) => a - b);
  const p5Index = Math.floor(kWValues.length * 0.05);
  const baseLoadKW = kWValues[p5Index] || kWValues[0] || 0;

  // Calculate typical peak duration
  // Find contiguous intervals >= 80% of peak
  const threshold = peak15minKW * 0.8;
  let maxContiguousDuration = 15; // Minimum 15 minutes
  let currentDuration = 0;

  for (const interval of intervals) {
    if (interval.kW >= threshold) {
      currentDuration += 15;
      maxContiguousDuration = Math.max(maxContiguousDuration, currentDuration);
    } else {
      currentDuration = 0;
    }
  }

  const typicalPeakDurationMin = maxContiguousDuration;

  // Check for gaps or issues
  if (intervals.length < 24) {
    warnings.push('Less than 24 hours of data - results may be inaccurate');
  }

  // Check for monotonic timestamps
  for (let i = 1; i < intervals.length; i++) {
    const prev = new Date(intervals[i - 1].ts);
    const curr = new Date(intervals[i].ts);
    if (curr < prev) {
      warnings.push('Non-monotonic timestamps detected - data may be out of order');
      break;
    }
  }

  return {
    intervals,
    peak15minKW,
    peakDateTime,
    baseLoadKW,
    typicalPeakDurationMin,
    warnings,
  };
}

/**
 * Main parser function - detects file type and routes to appropriate parser
 */
export async function parseGreenButton(file: File): Promise<ParsedGreenButton> {
  if (file.name.endsWith('.csv') || file.type === 'text/csv') {
    return parseCSV(file);
  } else if (file.name.endsWith('.xml') || file.type === 'text/xml' || file.type === 'application/xml') {
    return parseXML(file);
  } else {
    throw new Error('Unsupported file format. Please upload a CSV or XML file.');
  }
}

