// Starting the import area with a smile so future readers know this file is friendly
import path from 'path' // Pulling in path helpers so we can build file locations without headaches
import { promises as fs } from 'fs' // Inviting the file system promises so we can read uploads gently
// Bringing in the spreadsheet toolbox that will let us read the raw download
// Using require for xlsx to avoid ESM/CJS compatibility issues
const XLSX = require('xlsx') as typeof import('xlsx')
import greenButtonLibrary from '@cityssm/green-button-parser' // Borrowing the official lookups so our labels sound official

// Using XLSX directly since we're using require
const XLSXLib: any = XLSX

// Listing the overnight-friendly labels so time-of-use codes instantly make sense to humans
const TOU_LABELS: Record<string, string> = {
  '1': 'Off-Peak', // Tagging code 1 as the relaxed off-peak period most people sleep through
  '2': 'Mid-Peak', // Tagging code 2 as the busy mid-peak stretch that sits between the extremes
  '3': 'On-Peak', // Tagging code 3 as the energetic on-peak window when demand skyrockets
  '4': 'Ultra-Low (Overnight)' // Tagging code 4 as the ultra-low overnight deal that rewards night owls
}

// Declaring the shape of a single interval so the rest of the app can lean on typed reassurance
export interface ParsedInterval {
  startIso: string // Sharing the start moment in ISO so timelines sort themselves
  endIso: string // Sharing the finish moment to make duration obvious at a glance
  startSeconds: number // Keeping the raw UNIX seconds for math-heavy teammates
  durationSeconds: number // Logging how long the interval lasted so averages are possible
  valueKwh: number // Highlighting how much energy was used in friendly kWh units
  rawValue: number // Keeping the original reading so audits stay grounded
  costDollars: number // Showing the price tag in dollars because budgets love clarity
  costRaw: number // Holding the raw cents so totals line up with utility statements
  touCode?: string // Remembering the numeric time-of-use code for filtering fun
  touLabel?: string // Translating the time-of-use code into plain language instantly
}

// Sketching the bigger response so the admin view knows exactly what to expect from the parser
export interface GreenButtonParseResult {
  filePath: string // Letting consumers know which file this data came from for transparency
  intervalCount: number // Sharing how many hourly records we unpacked so scale is clear
  totals: {
    totalUsageKwh: number // Rolling up the energy story in comforting kWh units
    totalCostDollars: number // Summing the bill impact so finance can breathe easy
    averageCostPerKwh: number // Boiling things down to a single blended rate for context
    dateRange: {
      startIso: string // Marking when the dataset kicks off so comparisons are easy
      endIso: string // Marking when the dataset wraps up to close the loop
      daySpan: number // Counting how many days the data spans to spot gaps fast
    }
  }
  usagePoint?: {
    id?: string // Passing along the usage point identifier for cross-system matching
    href?: string // Listing the source link in case someone wants to dig deeper
    serviceKind?: string // Translating the service category so it reads nicely
  }
  readingType?: {
    title?: string // Sharing the friendly title like “Reading Type - KWH” for context
    unitCode?: string // Passing along the raw unit code for traceability
    unitLabel?: string // Translating the unit so humans instantly understand
    powerOfTenMultiplier?: number // Remembering the scaling factor so math stays honest
    accumulationBehaviour?: string // Hinting how the utility accumulates data for nerdy curiosity
  }
  touSummary: Array<{
    touCode: string // Repeating the numeric code so charts can stay precise
    touLabel: string // Pairing the code with a friendly label for tooltips
    intervalCount: number // Sharing how many records live in this bucket
    totalUsageKwh: number // Summing usage by bucket for planning conversations
    totalCostDollars: number // Summing cost by bucket so savings ideas can surface
  }>
  intervals: ParsedInterval[] // Sending the hour-by-hour story for anyone who loves detail
}

// Dropping in a snug helper that converts optional numbers into real ones or zero if life happens
const toNumber = (value: unknown): number => (value === undefined || value === null || value === '' ? 0 : Number(value))

// Offering a gentle multiplier calculator so scaling factors never feel mysterious
const getMultiplier = (power: number): number => Math.pow(10, power)

// Dropping in a helper that squeezes intervals into the final response so both XLSX and XML can reuse it calmly
const buildResult = (filePath: string, intervals: ParsedInterval[], usagePoint?: GreenButtonParseResult['usagePoint'], readingType?: GreenButtonParseResult['readingType'], touBuckets?: Map<string, { usage: number; cost: number; count: number }>): GreenButtonParseResult => {
  const intervalCount = intervals.length // Counting how many friendly datapoints made it through the parser
  const totalUsageKwh = intervals.reduce((sum, item) => sum + item.valueKwh, 0) // Summing up all the energy use to share the big picture
  const totalCostDollars = intervals.reduce((sum, item) => sum + item.costDollars, 0) // Summing the cost so the year-long bill is front and center
  const averageCostPerKwh = totalUsageKwh === 0 ? 0 : totalCostDollars / totalUsageKwh // Calculating a blended rate per kWh to help with benchmarking
  const startSeconds = intervalCount ? Math.min(...intervals.map(item => item.startSeconds)) : 0 // Finding the earliest timestamp to mark the beginning of the story
  const endSeconds = intervalCount ? Math.max(...intervals.map(item => item.startSeconds + item.durationSeconds)) : 0 // Finding the latest timestamp so we know when the story ends
  const daySpan = intervalCount ? ((endSeconds - startSeconds) / 86400) : 0 // Converting the covered range into days so data completeness is easy to judge
  const summaryBuckets = touBuckets
    ? Array.from(touBuckets.entries()).map(([code, bucket]) => ({ // Transforming each bucket into a neat summary row for the UI
        touCode: code, // Sharing the numeric code so filters stay precise
        touLabel: TOU_LABELS[code] ?? `TOU ${code}`, // Translating the code back into a friendly label for the UI
        intervalCount: bucket.count, // Letting folks know how many intervals landed in this bucket
        totalUsageKwh: bucket.usage, // Summing the energy for this bucket so peaks jump out
        totalCostDollars: bucket.cost // Summing the cost so high-spend periods get attention
      }))
    : [] // Falling back to an empty array when no TOU breakdown was supplied

  return {
    filePath, // Echoing the original file location so audits are painless
    intervalCount, // Sharing how many hourly points we successfully parsed
    totals: {
      totalUsageKwh, // Passing along the sum of usage ready for dashboards
      totalCostDollars, // Passing along the summed cost to pair with the usage story
      averageCostPerKwh, // Including the blended rate so stakeholders can benchmark
      dateRange: {
        startIso: startSeconds ? new Date(startSeconds * 1000).toISOString() : '', // Offering the starting timestamp in ISO form for readability
        endIso: endSeconds ? new Date(endSeconds * 1000).toISOString() : '', // Offering the ending timestamp to complete the window
        daySpan // Noting the number of days covered so people can spot gaps instantly
      }
    },
    usagePoint, // Returning the usage point metadata we collected earlier
    readingType, // Returning the reading type summary for context
    touSummary: summaryBuckets, // Providing the grouped time-of-use insights for the dashboard
    intervals // Sending back every parsed interval so charts and tables can thrive
  } // Wrapping everything up in a tidy package the admin area can lean on
} // Closing the helper with a grin because it keeps things tidy

// Laying out a helper that converts sheet rows into objects so future tweaks stay centralized
const parseSheetRows = (rows: (string | number | null)[][]) => {
  const headers = rows[0] as string[] // Grabbing the header row so we can name every column politely
  return rows.slice(1).map(row => {
    const entry: Record<string, string> = {} // Preparing a blank note card for the current row to keep things tidy
    for (let column = 0; column < headers.length; column++) {
      const key = headers[column] // Peeking at the column label so we know what we are reading
      if (!key) continue // Skipping empty headers so we do not log meaningless keys
      const value = row[column] // Pulling the current cell so we can inspect it calmly
      if (value === undefined || value === null || value === '') continue // Skipping blanks because noise is not helpful here
      entry[key] = String(value) // Stashing the value as a string so downstream parsing is consistent
    }
    return entry // Handing back the tidy record for the current row
  })
} // Ending the sheet helper with a friendly nod because it keeps parsing readable

// Crafting a dedicated XLSX parser so spreadsheet uploads feel right at home
const parseXlsxWorkbook = (resolvedPath: string): GreenButtonParseResult => {
  let workbook
  try {
    workbook = XLSXLib.readFile(resolvedPath) // Opening the spreadsheet treasure chest that holds the feed
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown file system error' // Capturing the underlying message for transparency
    throw new Error(`Unable to read Green Button workbook at ${resolvedPath}. ${message}. Upload a fresh file or double-check the path.`) // Raising a helpful hint so users know the next best step
  }
  const firstSheetName = workbook.SheetNames[0] // Picking the very first sheet because that is where the utility packed the goods
  const sheet = workbook.Sheets[firstSheetName] // Retrieving the worksheet object that the helper library understands
  const rows = XLSXLib.utils.sheet_to_json(sheet, { header: 1, raw: false }) as (string | number | null)[][] // Converting the grid into a simple row array so iteration feels natural
  const records = parseSheetRows(rows) // Translating the rows into labeled records so later logic feels friendly
  const lookups = greenButtonLibrary.lookups // Pulling out the official lookup tables so codes become stories

  let currentReadingType: {
    title?: string // Holding the descriptive title when we see it
    power?: number // Keeping the multiplier exponent ready for conversions
    unitCode?: string // Remembering the raw unit code for traceability
    unitLabel?: string // Translating the unit code with the help of the lookup table
    accumulationBehaviour?: string // Translating how the meter behaves over time
  } | null = null // Starting with no reading type selected until the sheet introduces one

  let currentBlockTitle: string | null = null // Keeping track of which interval block we are currently inside
  let currentBlockDuration = 0 // Remembering the default duration that the block suggests

  const intervals: ParsedInterval[] = [] // Creating a cozy list that will collect every hourly reading we care about
  const touBuckets = new Map<string, { usage: number; cost: number; count: number }>() // Preparing buckets so we can summarize time-of-use patterns later
  let usagePoint: GreenButtonParseResult['usagePoint'] = undefined // Placeholder for usage point details that might appear
  let readingTypeSnapshot: GreenButtonParseResult['readingType'] = undefined // Placeholder for the final reading type summary we want to share

  for (const record of records) {
    if (record.title && record.title.startsWith('Usage Point')) {
      usagePoint = {
        id: record.id, // Capturing the unique identifier so admins know which feed they are staring at
        href: record.href, // Remembering the link that leads back to the source for brave explorers
        serviceKind: record.kind ? lookups.serviceCategoryKinds?.[Number(record.kind) as keyof typeof lookups.serviceCategoryKinds] ?? record.kind : undefined // Translating the service category into friendly words whenever possible
      }
      continue // Jumping to the next record because we already handled the metadata
    }

    if (record.title && record.title.startsWith('Reading Type')) {
      const power = toNumber(record.powerOfTenMultiplier) // Turning the string multiplier into a real number for easy math later
      currentReadingType = {
        title: record.title, // Remembering the descriptive title for this reading type
        power, // Keeping the exponent handy for value conversions
        unitCode: record.uom, // Holding the raw unit code passed by the utility
        unitLabel: record.uom ? lookups.unitsOfMeasurement?.[Number(record.uom) as keyof typeof lookups.unitsOfMeasurement] ?? record.uom : undefined, // Translating the unit code into words whenever a lookup exists
        accumulationBehaviour: record.accumulationBehaviour ? lookups.accumulationBehaviours?.[Number(record.accumulationBehaviour) as keyof typeof lookups.accumulationBehaviours] ?? record.accumulationBehaviour : undefined // Translating how values accumulate so the reader gets a clue
      }
      readingTypeSnapshot = {
        title: currentReadingType.title, // Passing the title downstream for reporting
        unitCode: currentReadingType.unitCode, // Sending the raw unit code forward too
        unitLabel: currentReadingType.unitLabel, // Sharing the translated unit label for clarity
        powerOfTenMultiplier: currentReadingType.power, // Keeping the exponent visible for debugging tweaks
        accumulationBehaviour: currentReadingType.accumulationBehaviour // Passing along the accumulation explanation as a friendly note
      }
      continue // Moving along because we finished processing the reading type row
    }

    if (record.title && record.title.startsWith('IntervalBlock')) {
      currentBlockTitle = record.title // Remembering which interval block we are stepping into
      currentBlockDuration = toNumber(record.duration) // Collecting the default duration so subsequent rows inherit it
      continue // Hopping forward to the next row because we stored what we needed
    }

    if (!currentBlockTitle) {
      continue // Skipping rows that appear before any interval block is announced
    }

    if (currentBlockTitle.includes('KWHR')) {
      continue // Gracefully ignoring reactive energy blocks so the dashboard stays focused on consumption
    }

    if (!record.value || !record.start) {
      continue // Gliding past rows without value data because they do not help our charts
    }

    const startSeconds = toNumber(record.start) // Turning the start timestamp into a number we can trust
    const durationSeconds = record.duration ? toNumber(record.duration) : currentBlockDuration || 0 // Letting row-specific durations win, otherwise falling back to the block default
    const rawValue = toNumber(record.value) // Grabbing the raw usage figure straight from the sheet
    const multiplier = currentReadingType ? getMultiplier(currentReadingType.power ?? 0) : 1 // Computing the scaling factor so values become real-world friendly
    const valueKwh = rawValue * multiplier // Applying the multiplier so the reading lands in kWh territory
    const costRaw = record.cost ? toNumber(record.cost) : 0 // Turning the raw cost (stored in cents) into a number
    const costDollars = costRaw / 100 // Converting cents to dollars so the finance story feels familiar

    const touCode = record.tou ? String(record.tou) : undefined // Keeping the time-of-use code as a string for consistent keys
    const touLabel = touCode ? TOU_LABELS[touCode] ?? `TOU ${touCode}` : undefined // Translating the code into a descriptive label or a safe fallback

    const interval: ParsedInterval = {
      startIso: new Date(startSeconds * 1000).toISOString(), // Turning the start timestamp into a smooth ISO string for UI magic
      endIso: new Date((startSeconds + durationSeconds) * 1000).toISOString(), // Calculating the end timestamp so durations are obvious
      startSeconds, // Passing along the raw start for analytical types
      durationSeconds, // Sharing the duration in seconds to keep calculations accurate
      valueKwh, // Recording the cleaned-up energy usage ready for charts
      rawValue, // Keeping the original raw number handy for curious engineers
      costDollars, // Storing the dollar cost because budgets speak dollars
      costRaw, // Keeping the raw cents in case we need to reconcile to utility statements
      touCode, // Remembering the time-of-use code for grouping later on
      touLabel // Sharing the friendly label that pairs with the code
    }

    intervals.push(interval) // Filing the interval into our growing list so nothing gets lost

    if (touCode) {
      if (!touBuckets.has(touCode)) {
        touBuckets.set(touCode, { usage: 0, cost: 0, count: 0 }) // Opening a fresh bucket when we meet a new code for the first time
      }
      const bucket = touBuckets.get(touCode)! // Picking up the bucket so we can add this interval’s story
      bucket.usage += valueKwh // Adding the usage so the bucket reflects reality
      bucket.cost += costDollars // Adding the cost so the bucket tracks spending too
      bucket.count += 1 // Counting the interval so averages are easy later
    }
  }
  return buildResult(resolvedPath, intervals, usagePoint, readingTypeSnapshot, touBuckets) // Handing the intervals to the shared summarizer so the return shape stays consistent
} // Finishing the XLSX parser with a satisfied sigh because spreadsheets are under control

// Crafting a helper that understands raw Green Button XML files so uploads work without conversions
const parseAtomXml = async (resolvedPath: string): Promise<GreenButtonParseResult> => {
  const xmlContent = await fs.readFile(resolvedPath, 'utf8') // Reading the uploaded XML as a plain string so the parser can do its magic
  const feed = await greenButtonLibrary.atomToGreenButtonJson(xmlContent) // Converting the Atom feed into a friendly JavaScript object using the official helper
  const lookups = greenButtonLibrary.lookups // Keeping the lookup tables nearby so we can translate codes later

  const intervals: ParsedInterval[] = [] // Preparing a cozy list to store every interval we find in the feed
  const touBuckets = new Map<string, { usage: number; cost: number; count: number }>() // Setting up TOU buckets so summaries remain quick to compute

  let usagePoint: GreenButtonParseResult['usagePoint'] = undefined // Placeholder that will capture usage point metadata if it exists
  let readingType: GreenButtonParseResult['readingType'] = undefined // Placeholder for the reading type info we discover

  for (const entry of feed.entries ?? []) {
    if (entry.content?.UsagePoint && !usagePoint) {
      usagePoint = {
        id: entry.links?.selfUid ?? entry.id, // Reusing the self link UID as the identifier because it stays unique
        href: entry.links?.self, // Passing the canonical link forward for traceability
        serviceKind: entry.content.UsagePoint.ServiceCategory?.kind_value // Sharing the friendly service category name when supplied
      } // Closing the usage point snapshot with a smile because we captured the essentials
    }

    if (entry.content?.ReadingType && !readingType) {
      const rt = entry.content.ReadingType // Grabbing the reading type content so we can inspect it comfortably
      readingType = {
        title: entry.title, // Borrowing the entry title for a human-readable label
        unitCode: rt.uom ? String(rt.uom) : undefined, // Storing the raw unit code just in case
        unitLabel: rt.uom ? lookups.unitsOfMeasurement?.[Number(rt.uom) as keyof typeof lookups.unitsOfMeasurement] ?? String(rt.uom) : undefined, // Translating the unit so dashboards read nicely
        powerOfTenMultiplier: rt.powerOfTenMultiplier ? Number(rt.powerOfTenMultiplier) : undefined, // Remembering the scaling exponent for future math curiosity
        accumulationBehaviour: rt.accumulationBehaviour_value // Sharing how the meter accumulates data in friendly words
      } // Wrapping the reading type summary with gratitude because it keeps context clear
    }

    if (entry.content?.IntervalBlock) {
      const isReactive = entry.title?.toLowerCase().includes('kphr') || entry.title?.toLowerCase().includes('kvar') // Checking the title so we can skip reactive energy blocks gently
      if (isReactive) {
        continue // Gliding past reactive blocks because the dashboard focuses on consumption
      }

      for (const block of entry.content.IntervalBlock) {
        const readings = block.IntervalReading ?? [] // Pulling the interval readings out gently, defaulting to an empty list when missing
        for (const reading of readings) {
          const timePeriod = reading.timePeriod // Holding the time period close so we can extract start and duration
          if (!timePeriod?.start || !timePeriod.duration) {
            continue // Skipping incomplete readings because charts adore complete data
          }

          const startSeconds = Number(timePeriod.start) // Converting the start timestamp into a number the math library understands
          const durationSeconds = Number(timePeriod.duration) // Converting the duration for the same reason
          const rawValue = toNumber(reading.value ?? 0) // Pulling in the raw usage value while guarding against undefined entries
          const power = readingType?.powerOfTenMultiplier ?? 0 // Reusing the reading type multiplier when available so scaling stays correct
          const valueKwh = rawValue * getMultiplier(power) // Applying the multiplier so we present usage in kWh units
          const costRaw = toNumber(reading.cost ?? 0) // Reading the raw cost (usually in cents) while handling missing entries kindly
          const costDollars = costRaw / 100 // Converting cents to dollars so budget numbers feel natural
          const touCode = reading.tou ? String(reading.tou) : undefined // Capturing any time-of-use code that rides along
          const touLabel = touCode ? TOU_LABELS[touCode] ?? `TOU ${touCode}` : undefined // Translating the TOU code into a friendly label when possible

          const interval: ParsedInterval = {
            startIso: new Date(startSeconds * 1000).toISOString(), // Translating the start time into ISO so sorting stays effortless
            endIso: new Date((startSeconds + durationSeconds) * 1000).toISOString(), // Calculating the end time to finish the story cleanly
            startSeconds, // Keeping the raw start seconds around for any downstream math heroes
            durationSeconds, // Sharing the duration in seconds for completeness
            valueKwh, // Recording the scaled usage ready for charts
            rawValue, // Storing the original reading in case diagnostics need it
            costDollars, // Presenting the cost in dollars to match the rest of the UI
            costRaw, // Keeping the raw cents just in case we need to reconcile future statements
            touCode, // Remembering the numeric TOU code for grouping fun
            touLabel // Sharing the translated TOU label for instant recognition
          } // Closing the interval object with delight because it is ready for display

          intervals.push(interval) // Adding the fresh interval to our growing timeline

          if (touCode) {
            if (!touBuckets.has(touCode)) {
              touBuckets.set(touCode, { usage: 0, cost: 0, count: 0 }) // Opening a friendly bucket for any brand-new TOU code
            }
            const bucket = touBuckets.get(touCode)! // Picking up the bucket so we can enrich it with the current reading
            bucket.usage += valueKwh // Growing the usage tally for this TOU bucket
            bucket.cost += costDollars // Growing the cost tally so the summary reflects spending patterns
            bucket.count += 1 // Incrementing the interval counter for fun stats later
          }
        }
      }
    }
  }

  return buildResult(resolvedPath, intervals, usagePoint, readingType, touBuckets) // Passing everything to the shared summarizer so the response shape matches the XLSX path
} // Wrapping up the XML helper with relief because uploads now feel seamless

// Teaching the parser to check whether a path exists so fallbacks become effortless
const pathExists = async (targetPath: string) => {
  try {
    await fs.access(targetPath) // Politely asking the file system for access to confirm the file is ready
    return true // Smiling when the file shows up on cue
  } catch {
    return false // Returning false calmly when the path is missing so we can look for another option
  }
} // Wrapping the existence helper with appreciation because it keeps the main flow readable

// Wrapping the main parser in a friendly async function so server routes can await with confidence
export async function parseGreenButtonWorkbook(fileName = 'Hydro1_Electric_60_Minute_10-29-2024_10-28-2025.xml.xlsx'): Promise<GreenButtonParseResult> {
  const baseDir = path.join(process.cwd(), 'greenbutton') // Pointing to the shared Green Button folder so uploads land in one cozy place
  await fs.mkdir(baseDir, { recursive: true }) // Making sure the folder exists even on a fresh project checkout

  const candidates: Array<{ name: string; fullPath: string; mtimeMs: number }> = [] // Collecting every friendly candidate we can try parsing
  const seen = new Set<string>() // Keeping track of paths we have already queued so duplicates stay away

  const tryAddCandidate = async (fullPath: string, nameHint?: string) => {
    if (seen.has(fullPath)) return // Skipping paths we already know about
    const ext = path.extname(fullPath).toLowerCase() // Inspecting the extension so only supported formats sneak through
    if (!['.xlsx', '.xlsm', '.xls', '.xml'].includes(ext)) return // Politely ignoring unsupported formats
    try {
      const stats = await fs.stat(fullPath) // Peeking at file stats so we can sort by modification time
      candidates.push({ name: nameHint ?? path.basename(fullPath), fullPath, mtimeMs: stats.mtimeMs }) // Stashing the candidate with a friendly name and timestamp
      seen.add(fullPath) // Remembering that we already enqueued this path
    } catch {
      // If the file disappears between discovery and stat we just skip it quietly
    }
  }

  // Give priority to the explicitly requested file name when it exists
  const requestedPath = path.join(baseDir, fileName)
  if (await pathExists(requestedPath)) {
    await tryAddCandidate(requestedPath, fileName)
  }

  // Add every other suitable file in the directory so we can fall back gracefully
  const dirEntries = await fs.readdir(baseDir, { withFileTypes: true })
  for (const entry of dirEntries) {
    if (!entry.isFile()) continue // Only files carry data we can parse
    const fullPath = path.join(baseDir, entry.name)
    await tryAddCandidate(fullPath, entry.name)
  }

  if (candidates.length === 0) {
    throw new Error('No Green Button files found in the greenbutton directory. Upload a new XML or XLSX export to get started.')
  }

  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs) // Sorting newest-first so recent uploads receive top priority

  const parseHandlers: Array<{
    extensions: Set<string>
    handler: (filePath: string) => Promise<GreenButtonParseResult> | GreenButtonParseResult
  }> = [
    { extensions: new Set(['.xlsx', '.xlsm', '.xls']), handler: parseXlsxWorkbook },
    { extensions: new Set(['.xml']), handler: parseAtomXml }
  ]

  const errorMessages: string[] = [] // Keeping a log of attempts so we can report a helpful summary if all files fail

  for (const candidate of candidates) {
    const ext = path.extname(candidate.name).toLowerCase()
    const match = parseHandlers.find(entry => entry.extensions.has(ext))
    if (!match) {
      continue // Skipping odd formats that slipped through the cracks
    }

    try {
      return await match.handler(candidate.fullPath) // Returning as soon as one parser succeeds so the admin sees fresh data instantly
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown parsing error' // Capturing the hiccup so we can reference it later
      errorMessages.push(`${candidate.name}: ${message}`) // Remembering which file gave us trouble and why
      continue // Moving on to the next candidate in case another file is healthier
    }
  }

  throw new Error(`Unable to parse any Green Button files. ${errorMessages.join(' | ')}`) // Sharing a combined summary when every candidate refused to cooperate
} // Closing the main parser with gratitude because it now handles both spreadsheets and XML feeds and falls back gracefully


