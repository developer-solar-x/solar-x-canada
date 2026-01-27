// Province-specific configuration for solar calculations
// Includes electricity rates, incentives, and solar potential data

import { getPanelAreaSqFt, getPanelWattage } from './panel-specs'
import { calculateSystemCost } from './pricing'

export interface ProvinceConfig {
  code: string
  name: string
  enabled: boolean
  
  // Electricity rates
  avgElectricityRate: number
  
  // Zero-export system incentives
  zeroExportIncentives?: {
    solarPerKw: number
    solarMaxIncentive: number
    batteryPerKwh: number
    batteryMaxIncentive: number
  }
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
    // Includes commodity charges, delivery, regulatory fees, and other proportional charges
    // Updated to reflect 2025 rates with total effective cost to customer
    avgElectricityRate: 0.140,
    rateStructure: 'time-of-use',
    
    // Zero-export system incentives (Ontario-specific rebates)
    zeroExportIncentives: {
      solarPerKw: 100, // $100 per kW
      solarMaxIncentive: 5000, // Max $5,000
      batteryPerKwh: 300, // $300 per kWh
      batteryMaxIncentive: 5000, // Max $5,000
    },
    
    // Solar irradiance in kWh/m²/year
    avgSolarIrradiance: 1250,
    // Typical capacity factor for Ontario
    avgCapacityFactor: 0.14,
    
    // Average cost per kW installed
    avgSystemCostPerKw: 2500,
    // Base installation cost
    avgInstallationCost: 3000,
    
    // Available incentive programs (Zero-Export Systems Only)
    incentives: [
      {
        name: 'Ontario Zero-Export Solar Incentive',
        type: 'rebate',
        amount: 'Variable',
        description: '$100 per kW of solar capacity, up to maximum of $5,000',
        eligibility: 'Zero-export solar systems (not net metering)',
        link: ''
      },
      {
        name: 'Ontario Zero-Export Battery Incentive',
        type: 'rebate',
        amount: 'Variable',
        description: '$300 per kWh of battery storage, up to maximum of $5,000',
        eligibility: 'Zero-export systems with battery storage',
        link: ''
      }
    ],
    
    // Net metering NOT used - Zero-Export System Only
    netMeteringAvailable: false,
    // Building permit required
    permitRequired: true,
    // Interconnection process description
    interconnectionProcess: 'Utility approval required. Typically 4-8 weeks for residential systems.',
    
    // Ontario HST rate
    hst: 13
  },
  AB: {
    code: 'AB',
    name: 'Alberta',
    enabled: true,
    avgElectricityRate: 0.165,
    rateStructure: 'time-of-use',
    avgSolarIrradiance: 1350,
    avgCapacityFactor: 0.16,
    avgSystemCostPerKw: 2500,
    avgInstallationCost: 3000,
    incentives: [],
    netMeteringAvailable: true,
    permitRequired: true,
    interconnectionProcess: 'Utility approval required. Typically 4-8 weeks for residential systems.',
    hst: 5
  },
  BC: {
    code: 'BC',
    name: 'British Columbia',
    enabled: false,
    avgElectricityRate: 0.125,
    rateStructure: 'tiered',
    avgSolarIrradiance: 1200,
    avgCapacityFactor: 0.13,
    avgSystemCostPerKw: 2500,
    avgInstallationCost: 3000,
    incentives: [],
    netMeteringAvailable: true,
    permitRequired: true,
    interconnectionProcess: 'Coming soon',
    hst: 12
  },
  MB: {
    code: 'MB',
    name: 'Manitoba',
    enabled: false,
    avgElectricityRate: 0.095,
    rateStructure: 'flat',
    avgSolarIrradiance: 1300,
    avgCapacityFactor: 0.15,
    avgSystemCostPerKw: 2500,
    avgInstallationCost: 3000,
    incentives: [],
    netMeteringAvailable: true,
    permitRequired: true,
    interconnectionProcess: 'Coming soon',
    hst: 12
  },
  NB: {
    code: 'NB',
    name: 'New Brunswick',
    enabled: false,
    avgElectricityRate: 0.125,
    rateStructure: 'tiered',
    avgSolarIrradiance: 1250,
    avgCapacityFactor: 0.14,
    avgSystemCostPerKw: 2500,
    avgInstallationCost: 3000,
    incentives: [],
    netMeteringAvailable: true,
    permitRequired: true,
    interconnectionProcess: 'Coming soon',
    hst: 15
  },
  NL: {
    code: 'NL',
    name: 'Newfoundland and Labrador',
    enabled: false,
    avgElectricityRate: 0.135,
    rateStructure: 'tiered',
    avgSolarIrradiance: 1100,
    avgCapacityFactor: 0.12,
    avgSystemCostPerKw: 2500,
    avgInstallationCost: 3000,
    incentives: [],
    netMeteringAvailable: true,
    permitRequired: true,
    interconnectionProcess: 'Coming soon',
    hst: 15
  },
  NS: {
    code: 'NS',
    name: 'Nova Scotia',
    enabled: false,
    avgElectricityRate: 0.155,
    rateStructure: 'tiered',
    avgSolarIrradiance: 1250,
    avgCapacityFactor: 0.14,
    avgSystemCostPerKw: 2500,
    avgInstallationCost: 3000,
    incentives: [],
    netMeteringAvailable: true,
    permitRequired: true,
    interconnectionProcess: 'Coming soon',
    hst: 15
  },
  NT: {
    code: 'NT',
    name: 'Northwest Territories',
    enabled: false,
    avgElectricityRate: 0.380,
    rateStructure: 'flat',
    avgSolarIrradiance: 1000,
    avgCapacityFactor: 0.11,
    avgSystemCostPerKw: 3000,
    avgInstallationCost: 4000,
    incentives: [],
    netMeteringAvailable: false,
    permitRequired: true,
    interconnectionProcess: 'Coming soon',
    hst: 5
  },
  NU: {
    code: 'NU',
    name: 'Nunavut',
    enabled: false,
    avgElectricityRate: 0.420,
    rateStructure: 'flat',
    avgSolarIrradiance: 900,
    avgCapacityFactor: 0.10,
    avgSystemCostPerKw: 3500,
    avgInstallationCost: 5000,
    incentives: [],
    netMeteringAvailable: false,
    permitRequired: true,
    interconnectionProcess: 'Coming soon',
    hst: 5
  },
  PE: {
    code: 'PE',
    name: 'Prince Edward Island',
    enabled: false,
    avgElectricityRate: 0.165,
    rateStructure: 'tiered',
    avgSolarIrradiance: 1250,
    avgCapacityFactor: 0.14,
    avgSystemCostPerKw: 2500,
    avgInstallationCost: 3000,
    incentives: [],
    netMeteringAvailable: true,
    permitRequired: true,
    interconnectionProcess: 'Coming soon',
    hst: 15
  },
  QC: {
    code: 'QC',
    name: 'Quebec',
    enabled: false,
    avgElectricityRate: 0.073,
    rateStructure: 'tiered',
    avgSolarIrradiance: 1200,
    avgCapacityFactor: 0.13,
    avgSystemCostPerKw: 2500,
    avgInstallationCost: 3000,
    incentives: [],
    netMeteringAvailable: true,
    permitRequired: true,
    interconnectionProcess: 'Coming soon',
    hst: 14.975
  },
  SK: {
    code: 'SK',
    name: 'Saskatchewan',
    enabled: false,
    avgElectricityRate: 0.145,
    rateStructure: 'tiered',
    avgSolarIrradiance: 1350,
    avgCapacityFactor: 0.16,
    avgSystemCostPerKw: 2500,
    avgInstallationCost: 3000,
    incentives: [],
    netMeteringAvailable: true,
    permitRequired: true,
    interconnectionProcess: 'Coming soon',
    hst: 11
  },
  YT: {
    code: 'YT',
    name: 'Yukon',
    enabled: false,
    avgElectricityRate: 0.120,
    rateStructure: 'tiered',
    avgSolarIrradiance: 1000,
    avgCapacityFactor: 0.11,
    avgSystemCostPerKw: 3000,
    avgInstallationCost: 4000,
    incentives: [],
    netMeteringAvailable: true,
    permitRequired: true,
    interconnectionProcess: 'Coming soon',
    hst: 5
  }
};

// Get all provinces with their enabled status
export function getAllProvinces() {
  return Object.values(PROVINCE_CONFIG).map(province => ({
    code: province.code,
    name: province.name,
    enabled: province.enabled
  }))
}

// Get province by code
export function getProvinceByCode(code: string): ProvinceConfig | undefined {
  return PROVINCE_CONFIG[code.toUpperCase()]
}

// Calculate total system cost with taxes and zero-export incentives
// programType: 'hrs_residential' | 'net_metering' | 'quick' | undefined
// Net metering systems do NOT qualify for rebates
export function calculateCosts(
  systemSizeKw: number, 
  province: string = 'ON', 
  batteryKwh: number = 0,
  programType?: 'hrs_residential' | 'net_metering' | 'quick'
) {
  // Fallback to Ontario config if province not found (for international demo)
  const config = PROVINCE_CONFIG[province] || PROVINCE_CONFIG['ON'];
  
  // Base system cost calculation using tiered pricing
  // Pricing includes everything: equipment, installation, labor, etc.
  const systemCost = calculateSystemCost(systemSizeKw);
  const installationCost = 0; // Included in tiered pricing
  const subtotal = systemCost; // No additional costs
  
  // Add HST/GST - TEMPORARILY DISABLED
  // const hst = subtotal * (config.hst / 100);
  // const totalCost = subtotal + hst;
  const hst = 0; // Tax removed from calculations
  const totalCost = subtotal; // Total without tax
  
  // Calculate Solar System Incentives
  // Solar rebate applies only to HRS and quick estimates, NOT net metering
  let incentivesApplied = 0;
  
  // Net metering systems do NOT qualify for rebates
  const isNetMetering = programType === 'net_metering'
  
  if (!isNetMetering) {
    // Solar incentive: $1,000 per kW, max $5,000 - applies to HRS and quick estimates only
  const solarIncentivePerKw = 1000;
  const solarMaxIncentive = 5000;
  const solarIncentiveCalculated = systemSizeKw * solarIncentivePerKw;
  const solarIncentive = Math.min(solarIncentiveCalculated, solarMaxIncentive);
  incentivesApplied += solarIncentive;
  
    // Battery incentive: $300 per kWh, max $5,000 - only applies if battery is included (HRS only)
  if (batteryKwh > 0) {
    const batteryIncentivePerKwh = 300;
    const batteryMaxIncentive = 5000;
    const batteryIncentiveCalculated = batteryKwh * batteryIncentivePerKwh;
    const batteryIncentive = Math.min(batteryIncentiveCalculated, batteryMaxIncentive);
    incentivesApplied += batteryIncentive;
    }
  }
  
  // Calculate net cost after incentives (for net metering, netCost = totalCost since no rebates)
  const netCost = totalCost - incentivesApplied;
  
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

// Calculate annual savings from zero-export solar system
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
  
  // Zero-Export System: All energy is self-consumed, nothing exported to grid
  let selfConsumedKwh: number;
  let exportedKwh: number = 0; // Zero-export means no energy to grid
  
  if (actualAnnualUsageKwh) {
    // User consumes what they produce, up to their actual usage
    // Any excess is curtailed (not used) since it cannot be exported
    selfConsumedKwh = Math.min(annualProductionKwh, actualAnnualUsageKwh);
  } else {
    // Default assumption: 100% self-consumption for zero-export system
    // System is sized to not exceed usage
    selfConsumedKwh = annualProductionKwh;
  }
  
  // Calculate total savings (only from self-consumed energy)
  const annualSavings = selfConsumedKwh * avgRate;
  const monthlySavings = annualSavings / 12;
  
  // Calculate long-term savings with 3% electricity rate increase per year
  const twentyFiveYearSavings = annualSavings * 25 * 1.03;
  
  return {
    annualSavings: Math.round(annualSavings),
    monthlySavings: Math.round(monthlySavings),
    twentyFiveYearSavings: Math.round(twentyFiveYearSavings),
    selfConsumedKwh: Math.round(selfConsumedKwh),
    exportedKwh: Math.round(exportedKwh) // Always 0 for zero-export
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

/**
 * Calculate recommended system size based on roof area and shading
 * 
 * Two-stage reduction process:
 * 1. Obstruction Allowance (10%): Accounts for physical roof obstructions
 *    - Vents, chimneys, skylights
 *    - Roof access requirements and walkways
 *    - Edge setbacks for safety and maintenance
 *    - HVAC equipment and other permanent fixtures
 * 
 * 2. Shading Factor (varies by level): Accounts for environmental shading
 *    - Tree shadows, building shadows, seasonal variations
 * 
 * Example for 1000 sqft roof with minimal shading:
 *   - After obstructions: 1000 × 0.90 = 900 sqft
 *   - After shading: 900 × 0.80 = 720 sqft usable
 *   - Effective utilization: 72% of drawn roof area
 */
export function calculateSystemSize(roofAreaSqFt: number, shadingLevel: string = 'minimal') {
  // Use centralized panel specifications
  const panelAreaSqFt = getPanelAreaSqFt();
  
  // Calculate effective area per panel including spacing
  // Panel dimensions: 1.961m (height) x 1.134m (width)
  // Spacing: 0.025m (2.5cm) horizontal + 0.025m vertical
  const PANEL_DIMENSIONS = {
    width: 1134 / 1000,  // 1.134m
    height: 1961 / 1000, // 1.961m
  }
  const PANEL_SPACING = {
    horizontal: 0.025, // 2.5cm
    vertical: 0.025,   // 2.5cm
  }
  
  // Effective area = (height + spacing) × (width + spacing)
  const effectiveAreaSqM = (PANEL_DIMENSIONS.height + PANEL_SPACING.vertical) * 
                          (PANEL_DIMENSIONS.width + PANEL_SPACING.horizontal)
  const effectiveAreaSqFt = effectiveAreaSqM * 10.764 // Convert m² to sq ft
  
  // Obstruction allowance factor (accounts for vents, chimneys, skylights, roof access, edges, etc.)
  // This is applied BEFORE shading calculations to account for physical roof obstructions
  const OBSTRUCTION_ALLOWANCE = 0.90; // 10% reduction for typical roof obstructions
  
  // Apply obstruction allowance first
  const roofAreaAfterObstructions = roofAreaSqFt * OBSTRUCTION_ALLOWANCE;
  
  // Usable roof percentage based on shading (applied after obstruction allowance)
  const usableRoofPercent: Record<string, number> = {
    'none': 0.90, // No shade - near maximum usable area
    'minimal': 0.80, // Mostly sunny - slight reduction
    'partial': 0.65, // Some shade from trees/buildings - moderate reduction
    'significant': 0.50 // Heavy shade - significant reduction
  };
  
  // Calculate final usable roof area (obstruction allowance + shading factor)
  const usableArea = roofAreaAfterObstructions * (usableRoofPercent[shadingLevel.toLowerCase()] || 0.80);
  
  // Calculate number of panels that fit - use effective area that accounts for spacing
  const numPanels = Math.floor(usableArea / effectiveAreaSqFt);
  
  // Calculate system size using actual panel wattage
  const panelWatts = getPanelWattage()
  const systemSizeKw = (numPanels * panelWatts) / 1000;
  
  return {
    systemSizeKw: Math.round(systemSizeKw * 10) / 10,
    numPanels,
    usableAreaSqFt: Math.round(usableArea),
    obstructionAllowance: OBSTRUCTION_ALLOWANCE,
    effectiveUsablePercent: usableRoofPercent[shadingLevel.toLowerCase()] || 0.80
  };
}

// Financing options interface
export interface FinancingOption {
  id: string
  name: string
  interestRate: number // Annual interest rate as percentage
  termYears: number // Loan term in years
  description: string
}

// Available financing options
export const FINANCING_OPTIONS: FinancingOption[] = [
  {
    id: 'cash',
    name: 'Cash Purchase',
    interestRate: 0,
    termYears: 0,
    description: 'Pay in full upfront - best long-term value'
  },
  {
    id: 'loan_25',
    name: '25-Year Loan',
    interestRate: 4.5,
    termYears: 25,
    description: 'Extended term with 4.5% interest rate'
  }
]

// Calculate monthly payment for a loan
export function calculateFinancing(
  totalAmount: number,
  interestRate: number,
  termYears: number
) {
  // Cash purchase - no financing needed
  if (termYears === 0 || interestRate === 0) {
    return {
      monthlyPayment: 0,
      totalPaid: totalAmount,
      totalInterest: 0,
      effectiveMonthlyPayment: Math.round(totalAmount / 300) // Amortized over 25 years for comparison
    }
  }
  
  // Convert annual interest rate to monthly decimal rate
  const monthlyRate = (interestRate / 100) / 12
  
  // Total number of monthly payments
  const numPayments = termYears * 12
  
  // Calculate monthly payment using loan payment formula
  // M = P * [r(1+r)^n] / [(1+r)^n - 1]
  const monthlyPayment = totalAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  
  // Calculate total amount paid over loan term
  const totalPaid = monthlyPayment * numPayments
  
  // Calculate total interest paid
  const totalInterest = totalPaid - totalAmount
  
  return {
    monthlyPayment: Math.round(monthlyPayment),
    totalPaid: Math.round(totalPaid),
    totalInterest: Math.round(totalInterest),
    effectiveMonthlyPayment: Math.round(monthlyPayment) // Actual monthly payment
  }
}

