// Province-specific configuration for solar calculations
// Includes electricity rates, incentives, and solar potential data

export interface ProvinceConfig {
  code: string
  name: string
  enabled: boolean
  
  // Electricity rates
  avgElectricityRate: number
  rateStructure: 'flat' | 'tiered' | 'time-of-use'
  
  // Solar potential
  avgSolarIrradiance: number
  avgCapacityFactor: number
  
  // Cost information
  avgSystemCostPerKw: number
  avgInstallationCost: number
  
  // Available incentives
  incentives: {
    name: string
    type: 'grant' | 'rebate' | 'tax_credit' | 'net_metering'
    amount: number | string
    description: string
    eligibility: string
    link: string
  }[]
  
  // Provincial policies
  netMeteringAvailable: boolean
  permitRequired: boolean
  interconnectionProcess: string
  
  // Tax rate
  hst: number
}

// Configuration for each Canadian province
// For demo/international use, default to Ontario values if province not found
export const PROVINCE_CONFIG: Record<string, ProvinceConfig> = {
  ON: {
    code: 'ON',
    name: 'Ontario',
    enabled: true,
    
    // Average electricity rate in Ontario ($/kWh)
    avgElectricityRate: 0.134,
    rateStructure: 'time-of-use',
    
    // Solar irradiance in kWh/m²/year
    avgSolarIrradiance: 1250,
    // Typical capacity factor for Ontario
    avgCapacityFactor: 0.14,
    
    // Average cost per kW installed
    avgSystemCostPerKw: 2500,
    // Base installation cost
    avgInstallationCost: 3000,
    
    // Available incentive programs
    incentives: [
      {
        name: 'Canada Greener Homes Grant',
        type: 'grant',
        amount: 5000,
        description: 'Federal grant for energy-efficient home upgrades including solar PV systems',
        eligibility: 'Homeowners with pre- and post-upgrade EnerGuide evaluations',
        link: 'https://natural-resources.canada.ca/energy-efficiency/homes/canada-greener-homes-grant/23441'
      },
      {
        name: 'Net Metering Program',
        type: 'net_metering',
        amount: 'Variable',
        description: 'Credit for excess solar energy sent to the grid',
        eligibility: 'All residential solar systems up to 500 kW',
        link: 'https://www.oeb.ca/consumer-information-and-protection/electricity-rates/net-metering'
      }
    ],
    
    // Net metering is available in Ontario
    netMeteringAvailable: true,
    // Building permit required
    permitRequired: true,
    // Interconnection process description
    interconnectionProcess: 'Utility approval required. Typically 4-8 weeks for residential systems.',
    
    // Ontario HST rate
    hst: 13
  }
};

// Calculate total system cost with taxes and incentives
export function calculateCosts(systemSizeKw: number, province: string = 'ON') {
  // Fallback to Ontario config if province not found (for international demo)
  const config = PROVINCE_CONFIG[province] || PROVINCE_CONFIG['ON'];
  
  // Base system cost calculation
  const systemCost = systemSizeKw * config.avgSystemCostPerKw;
  const installationCost = config.avgInstallationCost;
  const subtotal = systemCost + installationCost;
  
  // Add HST/GST
  const hst = subtotal * (config.hst / 100);
  const totalCost = subtotal + hst;
  
  // Apply incentives
  let netCost = totalCost;
  let incentivesApplied = 0;
  
  config.incentives.forEach(incentive => {
    if (incentive.type === 'grant' && typeof incentive.amount === 'number') {
      incentivesApplied += incentive.amount;
      netCost -= incentive.amount;
    }
  });
  
  return {
    systemCost: Math.round(systemCost),
    installationCost: Math.round(installationCost),
    subtotal: Math.round(subtotal),
    hst: Math.round(hst),
    totalCost: Math.round(totalCost),
    incentivesApplied: Math.round(incentivesApplied),
    netCost: Math.round(netCost)
  };
}

// Calculate annual savings from solar system
export function calculateSavings(
  annualProductionKwh: number,
  monthlyBill: number,
  province: string = 'ON',
  actualAnnualUsageKwh?: number
) {
  // Fallback to Ontario config if province not found (for international demo)
  const config = PROVINCE_CONFIG[province] || PROVINCE_CONFIG['ON'];
  
  // Average electricity rate
  const avgRate = config.avgElectricityRate;
  
  // Calculate self-consumption based on actual usage if provided
  let selfConsumedKwh: number;
  let exportedKwh: number;
  
  if (actualAnnualUsageKwh) {
    // If we have actual usage data, calculate self-consumption more accurately
    // User consumes what they produce, up to their actual usage
    selfConsumedKwh = Math.min(annualProductionKwh, actualAnnualUsageKwh);
    exportedKwh = Math.max(0, annualProductionKwh - actualAnnualUsageKwh);
  } else {
    // Assume 80% self-consumption, 20% exported to grid (default estimate)
    selfConsumedKwh = annualProductionKwh * 0.8;
    exportedKwh = annualProductionKwh * 0.2;
  }
  
  // Net metering rate (typically same as retail rate in Ontario)
  const netMeteringRate = config.netMeteringAvailable ? avgRate : avgRate * 0.5;
  
  // Calculate total savings
  const annualSavings = (selfConsumedKwh * avgRate) + (exportedKwh * netMeteringRate);
  const monthlySavings = annualSavings / 12;
  
  // Calculate long-term savings with 3% electricity rate increase per year
  const twentyFiveYearSavings = annualSavings * 25 * 1.03;
  
  return {
    annualSavings: Math.round(annualSavings),
    monthlySavings: Math.round(monthlySavings),
    twentyFiveYearSavings: Math.round(twentyFiveYearSavings),
    selfConsumedKwh: Math.round(selfConsumedKwh),
    exportedKwh: Math.round(exportedKwh)
  };
}

// Convert roof pitch description to degrees for PVWatts
export function roofPitchToDegrees(pitch: string): number {
  const pitchMap: Record<string, number> = {
    'flat': 5,
    'low': 15,
    'medium': 30,
    'steep': 45
  };
  return pitchMap[pitch.toLowerCase()] || 30;
}

// Calculate recommended system size based on roof area and shading
export function calculateSystemSize(roofAreaSqFt: number, shadingLevel: string = 'minimal') {
  // Average panel size in square feet
  const panelAreaSqFt = 17.5;
  
  // Usable roof percentage based on shading
  const usableRoofPercent: Record<string, number> = {
    'minimal': 0.75,
    'partial': 0.60,
    'significant': 0.45
  };
  
  // Calculate usable roof area
  const usableArea = roofAreaSqFt * (usableRoofPercent[shadingLevel.toLowerCase()] || 0.75);
  
  // Calculate number of panels that fit
  const numPanels = Math.floor(usableArea / panelAreaSqFt);
  
  // Calculate system size (assuming 300W panels = 0.3 kW per panel)
  const systemSizeKw = numPanels * 0.3;
  
  return {
    systemSizeKw: Math.round(systemSizeKw * 10) / 10,
    numPanels,
    usableAreaSqFt: Math.round(usableArea)
  };
}

