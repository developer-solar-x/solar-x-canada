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
  // Use centralized panel specifications
  const panelAreaSqFt = getPanelAreaSqFt();
  
  // Usable roof percentage based on shading
  const usableRoofPercent: Record<string, number> = {
    'none': 0.85, // No shade - maximum usable area (allowing for roof access, vents, etc)
    'minimal': 0.75, // Mostly sunny
    'partial': 0.60, // Some shade from trees/buildings
    'significant': 0.45 // Heavy shade
  };
  
  // Calculate usable roof area
  const usableArea = roofAreaSqFt * (usableRoofPercent[shadingLevel.toLowerCase()] || 0.75);
  
  // Calculate number of panels that fit
  const numPanels = Math.floor(usableArea / panelAreaSqFt);
  
  // Calculate system size using actual panel wattage
  const panelWatts = getPanelWattage()
  const systemSizeKw = (numPanels * panelWatts) / 1000;
  
  return {
    systemSizeKw: Math.round(systemSizeKw * 10) / 10,
    numPanels,
    usableAreaSqFt: Math.round(usableArea)
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
    id: 'loan_10',
    name: '10-Year Loan',
    interestRate: 6.99,
    termYears: 10,
    description: 'Lower monthly payments with moderate interest'
  },
  {
    id: 'loan_15',
    name: '15-Year Loan',
    interestRate: 7.49,
    termYears: 15,
    description: 'Lowest monthly payments with higher total interest'
  },
  {
    id: 'loan_5',
    name: '5-Year Loan',
    interestRate: 5.99,
    termYears: 5,
    description: 'Pay off quickly with lower total interest'
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

