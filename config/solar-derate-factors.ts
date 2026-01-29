/**
 * Solar PV System Derate Factors (Loss Parameters)
 * 
 * Professional-grade loss calculations for accurate solar production estimates.
 * Based on industry standards and real-world system performance data.
 * 
 * These factors are applied sequentially to calculate the actual AC output
 * from the theoretical maximum based on irradiance.
 */

// ============================================================================
// IRRADIANCE LOSSES
// ============================================================================

export interface IrradianceLosses {
  tilt: number           // Loss from non-optimal panel tilt angle
  horizon: number        // Loss from horizon obstructions
  shade: number          // Loss from shading (trees, buildings, etc.)
  soiling: number        // Loss from dust, pollen, bird droppings
  snow: number           // Loss from snow coverage
  incidentAngle: number  // Loss from light hitting at non-perpendicular angles
}

// Default irradiance losses (conservative estimates)
export const DEFAULT_IRRADIANCE_LOSSES: IrradianceLosses = {
  tilt: 0.147,           // 14.7% - varies by roof pitch vs optimal
  horizon: 0.001,        // 0.1% - minimal for most residential
  shade: 0.035,          // 3.5% - average residential shading
  soiling: 0.02,         // 2% - regular cleaning assumed
  snow: 0.03,            // 3% - Canadian average
  incidentAngle: 0.034,  // 3.4% - angle of incidence losses
}

// Canadian winter-adjusted losses
export const CANADIAN_IRRADIANCE_LOSSES: IrradianceLosses = {
  tilt: 0.147,
  horizon: 0.001,
  shade: 0.035,
  soiling: 0.01,         // Less soiling due to rain/snow washing
  snow: 0.05,            // 5% - higher snow coverage
  incidentAngle: 0.034,
}

// ============================================================================
// DC SYSTEM LOSSES
// ============================================================================

export interface DCLosses {
  environmental: number   // Temperature coefficient losses
  moduleRating: number    // Nameplate vs actual rating tolerance
  degradation: number     // Annual degradation (Year 1 typically 1-2%)
  connections: number     // Connector and wiring resistance
  mismatch: number        // Module mismatch losses
  dcWiring: number        // DC cable losses
}

export const DEFAULT_DC_LOSSES: DCLosses = {
  environmental: 0.033,   // 3.3% - temperature coefficient losses
  moduleRating: 0.0,      // 0% - premium panels typically meet spec
  degradation: 0.015,     // 1.5% - Year 1 light-induced degradation
  connections: 0.005,     // 0.5% - connection losses
  mismatch: 0.02,         // 2% - module-to-module variation
  dcWiring: 0.02,         // 2% - DC cable resistance losses
}

// Premium system DC losses (better components)
export const PREMIUM_DC_LOSSES: DCLosses = {
  environmental: 0.028,   // Lower temp coefficient for N-type panels
  moduleRating: 0.0,
  degradation: 0.01,      // 1% - better cell technology
  connections: 0.003,     // 0.3% - MC4 connectors
  mismatch: 0.015,        // 1.5% - better binning
  dcWiring: 0.015,        // 1.5% - optimized cable sizing
}

// ============================================================================
// AC SYSTEM LOSSES
// ============================================================================

export interface ACLosses {
  dcAcConversion: number  // Inverter conversion losses
  inverterClipping: number // Clipping when DC > inverter capacity
}

export const DEFAULT_AC_LOSSES: ACLosses = {
  dcAcConversion: 0.035,  // 3.5% - Modern inverter losses (96.5% efficiency)
  inverterClipping: 0.0,  // 0% - with proper DC/AC ratio
}

// High-efficiency inverter losses
export const PREMIUM_AC_LOSSES: ACLosses = {
  dcAcConversion: 0.025,  // 2.5% - Premium microinverters (97.5% efficiency)
  inverterClipping: 0.0,
}

// ============================================================================
// OTHER LOSSES
// ============================================================================

export interface OtherLosses {
  transformerLoss: number    // Step-up transformer losses (if applicable)
  acWiring: number           // AC cable losses
  gridConnection: number     // Grid interconnection losses
  availability: number       // System downtime for maintenance
}

export const DEFAULT_OTHER_LOSSES: OtherLosses = {
  transformerLoss: 0.0,      // 0% - residential typically no transformer
  acWiring: 0.005,           // 0.5% - AC wiring losses
  gridConnection: 0.0,       // 0% - grid absorption assumed 100%
  availability: 0.01,        // 1% - minor downtime for maintenance
}

// ============================================================================
// INVERTER EFFICIENCY
// ============================================================================

export const INVERTER_EFFICIENCY = {
  standard: 0.96,            // 96% - Standard string inverter
  premium: 0.975,            // 97.5% - Premium microinverters/optimizers
  micro: 0.975,              // 97.5% - Microinverters
  hybrid: 0.95,              // 95% - Hybrid inverter with battery
}

// ============================================================================
// COMBINED DERATE FACTORS
// ============================================================================

export interface SystemDerateFactors {
  irradiance: IrradianceLosses
  dc: DCLosses
  ac: ACLosses
  other: OtherLosses
  inverterEfficiency: number
  gridAbsorptionRate: number  // How much exported power is accepted (typically 100%)
}

// Calculate total system derate factor
export function calculateTotalDerate(factors: SystemDerateFactors): {
  irradianceDerate: number
  dcDerate: number
  acDerate: number
  otherDerate: number
  totalDerate: number
  effectiveEfficiency: number
} {
  // Irradiance losses (multiplicative)
  const irradianceDerate = 
    (1 - factors.irradiance.tilt) *
    (1 - factors.irradiance.horizon) *
    (1 - factors.irradiance.shade) *
    (1 - factors.irradiance.soiling) *
    (1 - factors.irradiance.snow) *
    (1 - factors.irradiance.incidentAngle)
  
  // DC losses (multiplicative)
  const dcDerate = 
    (1 - factors.dc.environmental) *
    (1 - factors.dc.moduleRating) *
    (1 - factors.dc.degradation) *
    (1 - factors.dc.connections) *
    (1 - factors.dc.mismatch) *
    (1 - factors.dc.dcWiring)
  
  // AC losses (multiplicative)
  const acDerate = 
    (1 - factors.ac.dcAcConversion) *
    (1 - factors.ac.inverterClipping) *
    factors.inverterEfficiency
  
  // Other losses (multiplicative)
  const otherDerate = 
    (1 - factors.other.transformerLoss) *
    (1 - factors.other.acWiring) *
    (1 - factors.other.gridConnection) *
    (1 - factors.other.availability) *
    factors.gridAbsorptionRate

  // Total system derate
  const totalDerate = irradianceDerate * dcDerate * acDerate * otherDerate
  
  return {
    irradianceDerate,
    dcDerate,
    acDerate,
    otherDerate,
    totalDerate,
    effectiveEfficiency: totalDerate * 100, // As percentage
  }
}

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

// Standard residential system
export const STANDARD_SYSTEM: SystemDerateFactors = {
  irradiance: DEFAULT_IRRADIANCE_LOSSES,
  dc: DEFAULT_DC_LOSSES,
  ac: DEFAULT_AC_LOSSES,
  other: DEFAULT_OTHER_LOSSES,
  inverterEfficiency: INVERTER_EFFICIENCY.standard,
  gridAbsorptionRate: 1.0,
}

// Premium residential system (better components)
export const PREMIUM_SYSTEM: SystemDerateFactors = {
  irradiance: {
    ...DEFAULT_IRRADIANCE_LOSSES,
    shade: 0.02,    // Better site selection
    soiling: 0.01,  // Regular cleaning
  },
  dc: PREMIUM_DC_LOSSES,
  ac: PREMIUM_AC_LOSSES,
  other: {
    ...DEFAULT_OTHER_LOSSES,
    availability: 0.005, // Better monitoring = faster response
  },
  inverterEfficiency: INVERTER_EFFICIENCY.premium,
  gridAbsorptionRate: 1.0,
}

// Canadian winter-optimized system
export const CANADIAN_SYSTEM: SystemDerateFactors = {
  irradiance: CANADIAN_IRRADIANCE_LOSSES,
  dc: {
    ...DEFAULT_DC_LOSSES,
    environmental: 0.025, // Lower temps = better performance
  },
  ac: DEFAULT_AC_LOSSES,
  other: DEFAULT_OTHER_LOSSES,
  inverterEfficiency: INVERTER_EFFICIENCY.standard,
  gridAbsorptionRate: 1.0,
}

// ============================================================================
// MONTHLY ADJUSTMENT FACTORS
// ============================================================================

// Snow loss by month (Canadian average) - higher in winter months
export const MONTHLY_SNOW_LOSS: number[] = [
  0.15,  // Jan - heavy snow coverage
  0.12,  // Feb
  0.08,  // Mar
  0.02,  // Apr
  0.0,   // May
  0.0,   // Jun
  0.0,   // Jul
  0.0,   // Aug
  0.0,   // Sep
  0.01,  // Oct
  0.05,  // Nov
  0.12,  // Dec
]

// Temperature coefficient adjustment by month (heat reduces output)
// Negative values = bonus in cold months, positive = loss in hot months
export const MONTHLY_TEMP_COEFFICIENT: number[] = [
  -0.02,  // Jan - cold bonus
  -0.015, // Feb
  -0.005, // Mar
  0.005,  // Apr
  0.015,  // May
  0.025,  // Jun
  0.035,  // Jul - peak heat loss
  0.03,   // Aug
  0.02,   // Sep
  0.01,   // Oct
  0.0,    // Nov
  -0.015, // Dec
]

// ============================================================================
// INVERTER CLIPPING (10 kW STEPS)
// ============================================================================

/** DC/AC ratio used when inverter size is derived from system size. */
const DEFAULT_DC_AC_RATIO = 1.2

/**
 * Inverter clipping loss when inverter AC capacity is sized in 10 kW steps.
 * Inverter AC = next 10 kW step that can handle DC at the given ratio
 * (e.g. 12 kW DC at 1.2 -> 10 kW AC; 22 kW DC at 1.2 -> 20 kW AC).
 * Clipping % is derived from the resulting DC/AC ratio (empirical ~15% of
 * (ratio - 1), capped at 10%).
 */
export function computeInverterClippingFromCapacity(
  systemSizeKwDc: number,
  dcAcRatio: number = DEFAULT_DC_AC_RATIO
): number {
  if (systemSizeKwDc <= 0) return 0
  const inverterAcKw = Math.max(10, Math.ceil((systemSizeKwDc / dcAcRatio) / 10) * 10)
  const ratio = systemSizeKwDc / inverterAcKw
  if (ratio <= 1) return 0
  const clippingFraction = Math.min(0.1, 0.15 * (ratio - 1))
  return Math.round(clippingFraction * 1000) / 1000
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Apply derate factors to gross production
 */
export function applyDerateFactors(
  grossProductionKwh: number,
  factors: SystemDerateFactors = STANDARD_SYSTEM
): {
  netProductionKwh: number
  derateBreakdown: ReturnType<typeof calculateTotalDerate>
} {
  const derateBreakdown = calculateTotalDerate(factors)
  const netProductionKwh = grossProductionKwh * derateBreakdown.totalDerate
  
  return {
    netProductionKwh: Math.round(netProductionKwh),
    derateBreakdown,
  }
}

/**
 * Apply monthly derate adjustments
 */
export function applyMonthlyDerate(
  monthlyProduction: number[],
  factors: SystemDerateFactors = STANDARD_SYSTEM,
  applySnowLoss: boolean = true,
  applyTempCoefficient: boolean = true
): number[] {
  const baseDerate = calculateTotalDerate(factors)
  
  return monthlyProduction.map((kwh, monthIndex) => {
    let adjustedKwh = kwh * baseDerate.totalDerate
    
    // Apply monthly snow loss (replaces base snow loss for that month)
    if (applySnowLoss) {
      const baseSnowFactor = 1 - factors.irradiance.snow
      const monthlySnowFactor = 1 - MONTHLY_SNOW_LOSS[monthIndex]
      // Adjust: remove average snow loss, apply monthly snow loss
      adjustedKwh = adjustedKwh / baseSnowFactor * monthlySnowFactor
    }
    
    // Apply temperature coefficient adjustment
    if (applyTempCoefficient) {
      adjustedKwh = adjustedKwh * (1 - MONTHLY_TEMP_COEFFICIENT[monthIndex])
    }
    
    return Math.round(adjustedKwh)
  })
}

/**
 * Get derate summary for display
 */
export function getDerateSummary(factors: SystemDerateFactors = STANDARD_SYSTEM): {
  category: string
  loss: string
  value: number
}[] {
  const result = calculateTotalDerate(factors)
  
  return [
    { category: 'Irradiance', loss: 'Tilt', value: factors.irradiance.tilt * 100 },
    { category: 'Irradiance', loss: 'Horizon', value: factors.irradiance.horizon * 100 },
    { category: 'Irradiance', loss: 'Shade', value: factors.irradiance.shade * 100 },
    { category: 'Irradiance', loss: 'Soiling', value: factors.irradiance.soiling * 100 },
    { category: 'Irradiance', loss: 'Snow', value: factors.irradiance.snow * 100 },
    { category: 'Irradiance', loss: 'Incident Angle', value: factors.irradiance.incidentAngle * 100 },
    { category: 'DC', loss: 'Environmental (Temp)', value: factors.dc.environmental * 100 },
    { category: 'DC', loss: 'Module Rating', value: factors.dc.moduleRating * 100 },
    { category: 'DC', loss: 'Degradation', value: factors.dc.degradation * 100 },
    { category: 'DC', loss: 'Connections', value: factors.dc.connections * 100 },
    { category: 'DC', loss: 'Mismatch', value: factors.dc.mismatch * 100 },
    { category: 'DC', loss: 'DC Wiring', value: factors.dc.dcWiring * 100 },
    { category: 'AC', loss: 'DC/AC Conversion', value: factors.ac.dcAcConversion * 100 },
    { category: 'AC', loss: 'Inverter Clipping', value: factors.ac.inverterClipping * 100 },
    { category: 'Other', loss: 'AC Wiring', value: factors.other.acWiring * 100 },
    { category: 'Other', loss: 'Availability', value: factors.other.availability * 100 },
    { category: 'Total', loss: 'Effective Efficiency', value: result.effectiveEfficiency },
    { category: 'Total', loss: 'Total Loss', value: (1 - result.totalDerate) * 100 },
  ]
}

// Pre-calculate standard system derate for quick reference
export const STANDARD_DERATE = calculateTotalDerate(STANDARD_SYSTEM)
export const PREMIUM_DERATE = calculateTotalDerate(PREMIUM_SYSTEM)
export const CANADIAN_DERATE = calculateTotalDerate(CANADIAN_SYSTEM)
