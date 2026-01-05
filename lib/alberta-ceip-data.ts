// Alberta CEIP (Clean Energy Improvement Program) data by municipality
// Based on Alberta CEIP MASTER - Sheet2.csv

export interface AlbertaCEIPProgram {
  city: string
  loanMaxAmount: string
  interestRate: string
  amortization: string
  rebateAmount: string
  energyAuditRequired: boolean
  propertyType: 'Residential' | 'Commercial' | 'Both'
  maxRebate: string
  notableTerms?: string
  limitations?: string
  payOut?: string
}

// Normalize city names for matching (handle variations)
function normalizeCityName(city: string): string {
  return city
    .toLowerCase()
    .trim()
    .replace(/\./g, '') // Remove periods
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/^st\s+/i, 'st. ') // Handle St. vs St
    .replace(/grande\s+prairie/i, 'grand prairie') // Handle Grande Prairie vs Grand Prairie
}

// Alberta CEIP programs by municipality
export const ALBERTA_CEIP_PROGRAMS: Record<string, AlbertaCEIPProgram[]> = {
  'airdrie': [{
    city: 'Airdrie',
    loanMaxAmount: '$50,000',
    interestRate: '2.75%',
    amortization: '25 Years',
    rebateAmount: '$600',
    energyAuditRequired: true,
    propertyType: 'Residential',
    maxRebate: '$3,100',
    limitations: 'No New Construction (only retrofit)',
  }],
  'banff': [
    {
      city: 'Banff',
      loanMaxAmount: '$50,000',
      interestRate: '3%',
      amortization: '20 Years',
      rebateAmount: '$750 per KW',
      energyAuditRequired: true,
      propertyType: 'Commercial',
      maxRebate: '$15,000',
      limitations: 'Project below $7,500 total cost don\'t qualify.',
    },
    {
      city: 'Banff',
      loanMaxAmount: '$50,000',
      interestRate: '3%',
      amortization: '20 Years',
      rebateAmount: '$450 per KW',
      energyAuditRequired: true,
      propertyType: 'Residential',
      maxRebate: '$9,000',
      limitations: 'Project below $7,500 total cost don\'t qualify.',
    }
  ],
  'calgary': [{
    city: 'Calgary',
    loanMaxAmount: '$50,000',
    interestRate: '3.75%',
    amortization: '20 Years',
    rebateAmount: '10%',
    energyAuditRequired: true,
    propertyType: 'Residential',
    maxRebate: '$5,000',
  }],
  'canmore': [{
    city: 'Canmore',
    loanMaxAmount: '$50,000',
    interestRate: '2.70%',
    amortization: '20 Years',
    rebateAmount: '$500',
    energyAuditRequired: true,
    propertyType: 'Residential',
    maxRebate: '$500',
  }],
  'cold lake': [{
    city: 'Cold Lake',
    loanMaxAmount: '$50,000',
    interestRate: '3.10%',
    amortization: '20 Years',
    rebateAmount: '$580',
    energyAuditRequired: true,
    propertyType: 'Residential',
    maxRebate: '$580',
  }],
  'devon': [{
    city: 'Devon',
    loanMaxAmount: '$50,000',
    interestRate: '4%',
    amortization: '25 Years',
    rebateAmount: '$1,100',
    energyAuditRequired: true,
    propertyType: 'Residential',
    limitations: 'Last day to submit qualification is 01-31-26',
  }],
  'drayton valley': [{
    city: 'Drayton Valley',
    loanMaxAmount: '$50,000',
    interestRate: '4.16%',
    amortization: '20 Years',
    rebateAmount: '$350',
    energyAuditRequired: true,
    propertyType: 'Residential',
    maxRebate: '$350',
    payOut: 'Alberta Municipalities pays the Qualified Contractor directly after upgrades are completed and approved.',
  }],
  'edmonton': [
    {
      city: 'Edmonton',
      loanMaxAmount: '$50,000',
      interestRate: '6%',
      amortization: '20 Years',
      rebateAmount: 'N/A',
      energyAuditRequired: true,
      propertyType: 'Residential',
      maxRebate: 'N/A',
      payOut: 'CEIP funds are disbursed toward approved project costs, with repayment collected through the property tax system rather than monthly payments, and no cash rebate paid directly to the participant.',
    },
    {
      city: 'Edmonton',
      loanMaxAmount: '$1,000,000',
      interestRate: '6%',
      amortization: '20 Years',
      rebateAmount: 'N/A',
      energyAuditRequired: true,
      propertyType: 'Commercial',
      maxRebate: 'N/A',
      payOut: 'CEIP funds are disbursed toward approved project costs, with repayment collected through the property tax system rather than monthly payments, and no cash rebate paid directly to the participant.',
    }
  ],
  'grand prairie': [{
    city: 'Grande Prairie',
    loanMaxAmount: '$50,000',
    interestRate: '3%',
    amortization: '20 Years',
    rebateAmount: '$525',
    energyAuditRequired: true,
    propertyType: 'Residential',
    payOut: '25% paid upfront',
  }],
  'jasper': [{
    city: 'Jasper',
    loanMaxAmount: '$60,000',
    interestRate: '3%',
    amortization: '25 Years',
    rebateAmount: 'N/A',
    energyAuditRequired: true,
    propertyType: 'Residential',
    maxRebate: 'N/A',
    notableTerms: 'Admin Fee: 5%',
  }],
  'leduc': [{
    city: 'Leduc',
    loanMaxAmount: 'Up to 100% of project cost',
    interestRate: 'Blended: 0% interest on the first 73% of project cost',
    amortization: '20 Years',
    rebateAmount: '$1,350 incentive Tax Incentive',
    energyAuditRequired: true,
    propertyType: 'Residential',
    notableTerms: 'Interest Rate: Remaining financed portion charged at BMO prime rate (adjusted annually)',
    payOut: 'No direct cash payout from CEIP financing',
  }],
  'lethbridge': [{
    city: 'Lethbridge',
    loanMaxAmount: '$50,000',
    interestRate: '2.83%',
    amortization: '20 Years',
    rebateAmount: '$1,350 incentive Tax Incentive',
    energyAuditRequired: true,
    propertyType: 'Residential',
    maxRebate: '$5,400 (Multi Unit)',
    notableTerms: 'For multi-unit residential Properties, the project incentive may be offered on a per unit basis up to a maximum of $5,400, provided that each unit completes upgrades financed through CEIP.',
  }],
  'medicine hat': [{
    city: 'Medicine Hat',
    loanMaxAmount: '$50,000',
    interestRate: '3.25%',
    amortization: '20 Years',
    rebateAmount: '6.60%',
    energyAuditRequired: true,
    propertyType: 'Residential',
    maxRebate: '10.2%',
    notableTerms: 'An additional incentive of up to 3.6% of financed Project Costs is offered by the Municipality for completed CEIP Projects on residential properties built before the year 1990.',
  }],
  'pincher creek region': [{
    city: 'Pincher Creek Region',
    loanMaxAmount: '$50,000',
    interestRate: '2%',
    amortization: '20 Years',
    rebateAmount: '$450',
    energyAuditRequired: true,
    propertyType: 'Residential',
    maxRebate: '$450 incentive per CEIP project',
    notableTerms: 'Financing is attached to the property tax roll and repaid via Clean Energy Improvement Tax',
  }],
  'okotoks': [{
    city: 'Okotoks',
    loanMaxAmount: '$50,000',
    interestRate: '3%',
    amortization: '20 Years',
    rebateAmount: '$500',
    energyAuditRequired: true,
    propertyType: 'Residential',
    maxRebate: '$500',
  }],
  'st. albert': [{
    city: 'St. Albert',
    loanMaxAmount: 'Up to 100% of project cost',
    interestRate: '1.62% but capped off at 3%',
    amortization: '20 Years',
    rebateAmount: '$1,400',
    energyAuditRequired: true,
    propertyType: 'Residential',
    maxRebate: '$1,400',
    payOut: 'CEIP financing is paid toward approved project costs and issued to the qualified contractor after project completion and documentation approval',
  }],
  'rocky mountain house': [{
    city: 'Rocky Mountain House',
    loanMaxAmount: 'Up to 100% of project cost',
    interestRate: '3.50%',
    amortization: '20 Years',
    rebateAmount: 'N/A',
    energyAuditRequired: true,
    propertyType: 'Residential',
    maxRebate: '$2,100',
    payOut: 'CEIP financing funds are applied to approved project costs and issued to the qualified contractor upon verification of completed work and eligibility documentation',
  }],
  'stettler': [{
    city: 'Stettler',
    loanMaxAmount: 'Up to 100% of project cost',
    interestRate: '5.6% fixed for the project term',
    amortization: '25 Years',
    rebateAmount: '$580',
    energyAuditRequired: true,
    propertyType: 'Residential',
    maxRebate: '$580',
  }],
  'sturgeon county': [
    {
      city: 'Sturgeon County',
      loanMaxAmount: '$50,000',
      interestRate: '3.50%',
      amortization: '20 Years',
      rebateAmount: 'Up to 5% of approved project cost',
      energyAuditRequired: true,
      propertyType: 'Residential',
      maxRebate: 'Equal to 5% of total eligible project cost',
      notableTerms: 'Rebate Incentive automatically reduces the Clean Energy Improvement Tax/financing balance — not issued as cash',
    },
    {
      city: 'Sturgeon County',
      loanMaxAmount: '$300,000',
      interestRate: 'Commercial defaults may use a different below-market rate; check commercial Terms & Conditions',
      amortization: '20 Years',
      rebateAmount: 'Up to 5% of approved project cost',
      energyAuditRequired: true,
      propertyType: 'Commercial',
      maxRebate: 'Equal to 5% of total eligible project cost',
    }
  ],
  'spruce grove': [{
    city: 'Spruce Grove',
    loanMaxAmount: '$50,000',
    interestRate: '3.50%',
    amortization: '20 Years',
    rebateAmount: '7.5% of financed costs',
    energyAuditRequired: true,
    propertyType: 'Residential',
    maxRebate: '7.5% of total eligible financed cost per project',
    payOut: 'Funds are remitted to the qualified contractor for verified eligible work',
  }],
  'wetaskiwin': [{
    city: 'Wetaskiwin',
    loanMaxAmount: 'Up to 100% of project cost',
    interestRate: '3.20%',
    amortization: '20 Years',
    rebateAmount: '$650',
    energyAuditRequired: true,
    propertyType: 'Residential',
    maxRebate: '$650 per completed CEIP Project',
    payOut: 'Funds are paid directly to the qualified contractor for verified work.',
  }],
  'stirling': [{
    city: 'Stirling',
    loanMaxAmount: 'Up to 100% of project cost',
    interestRate: 'Competitive, matching the municipality\'s own low borrowing rate + 1%',
    amortization: '25 Years',
    rebateAmount: 'N/A',
    energyAuditRequired: true,
    propertyType: 'Residential',
    maxRebate: 'N/A',
  }],
  'strathcona county': [{
    city: 'Strathcona County',
    loanMaxAmount: 'Up to 100% of project cost',
    interestRate: '2%',
    amortization: '20 Years',
    rebateAmount: '5% incentive on completed CEIP projects',
    energyAuditRequired: true,
    propertyType: 'Residential',
    maxRebate: '5% of eligible project cost per project',
    payOut: 'The municipality will pay the CEIP Qualified Contractor directly for verified eligible costs',
  }],
  'taber': [{
    city: 'Taber',
    loanMaxAmount: 'Up to 100% of project cost',
    interestRate: '2%',
    amortization: '20 Years',
    rebateAmount: '$400',
    energyAuditRequired: true,
    propertyType: 'Residential',
    maxRebate: '$900 total (when Solar PV is included)',
  }],
  'westlock': [{
    city: 'Westlock',
    loanMaxAmount: 'Up to 100% of project cost',
    interestRate: '3%',
    amortization: '25 Years',
    rebateAmount: '$500',
    energyAuditRequired: true,
    propertyType: 'Residential',
    maxRebate: '$500 per property',
  }],
}

/**
 * Find CEIP program for a given city/municipality
 * @param city - City name from address (case-insensitive)
 * @param propertyType - 'Residential' or 'Commercial' (defaults to 'Residential')
 * @returns Array of matching CEIP programs, or empty array if not found
 */
export function findCEIPProgram(city: string | null | undefined, propertyType: 'Residential' | 'Commercial' = 'Residential'): AlbertaCEIPProgram[] {
  if (!city) return []
  
  const normalizedCity = normalizeCityName(city)
  const programs = ALBERTA_CEIP_PROGRAMS[normalizedCity]
  
  if (!programs) return []
  
  // Filter by property type if multiple programs exist
  if (programs.length > 1) {
    return programs.filter(p => 
      p.propertyType === propertyType || 
      p.propertyType === 'Both'
    )
  }
  
  return programs
}

/**
 * Extract city name from address string
 * @param address - Full address string
 * @returns City name or null
 */
export function extractCityFromAddress(address: string | null | undefined): string | null {
  if (!address) return null
  
  const addressLower = address.toLowerCase()
  
  // First, try to match against known Alberta cities in the address
  // This handles cases where city might appear anywhere in the address
  for (const cityKey of Object.keys(ALBERTA_CEIP_PROGRAMS)) {
    // Match whole word to avoid partial matches (e.g., "Edmonton" not matching "Edmonton County")
    const cityPattern = new RegExp(`\\b${cityKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (cityPattern.test(addressLower)) {
      return ALBERTA_CEIP_PROGRAMS[cityKey][0].city
    }
  }
  
  // Fallback: Try to extract city from common address formats
  // Format: "Street Address, City, Province Postal Code"
  const parts = address.split(',').map(p => p.trim())
  
  if (parts.length >= 2) {
    // City is usually the second part
    const city = parts[1]
    // Remove province/postal code if present
    const cityOnly = city.split(/\s+(AB|Alberta|\d{5})/i)[0].trim()
    if (cityOnly) {
      return cityOnly
    }
  }
  
  return null
}

