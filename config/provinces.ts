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
  }
};

// Calculate total system cost with taxes and zero-export incentives
export function calculateCosts(systemSizeKw: number, province: string = 'ON', batteryKwh: number = 0) {
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
  // Solar rebate applies to all systems
  let incentivesApplied = 0;
  
  // Solar incentive: $500 per kW, max $5,000 - applies to all systems
  const solarIncentivePerKw = 500;
  const solarMaxIncentive = 5000;
  const solarIncentiveCalculated = systemSizeKw * solarIncentivePerKw;
  const solarIncentive = Math.min(solarIncentiveCalculated, solarMaxIncentive);
  incentivesApplied += solarIncentive;
  
  // Battery incentive: $300 per kWh, max $5,000 - only applies if battery is included
  if (batteryKwh > 0) {
    const batteryIncentivePerKwh = 300;
    const batteryMaxIncentive = 5000;
    const batteryIncentiveCalculated = batteryKwh * batteryIncentivePerKwh;
    const batteryIncentive = Math.min(batteryIncentiveCalculated, batteryMaxIncentive);
    incentivesApplied += batteryIncentive;
  }
  
  // Calculate net cost after incentives
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
    id: 'loan_25',
    name: '25-Year Loan',
    interestRate: 5.5,
    termYears: 25,
    description: 'Extended term with competitive rate'
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

