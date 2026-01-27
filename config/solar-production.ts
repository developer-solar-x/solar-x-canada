/**
 * Solar Production Configuration
 *
 * Centralized configuration for all loss variables, derate factors,
 * and production calculation parameters used throughout the application.
 *
 * IMPORTANT: Update values here to affect all calculations system-wide.
 */

// =============================================================================
// SYSTEM LOSSES (PVWatts API Parameters)
// =============================================================================

export const SYSTEM_LOSSES = {
  /**
   * Default system losses percentage (industry standard)
   * Includes: soiling, shading, snow, mismatch, wiring, connections,
   * light-induced degradation, nameplate rating, age, availability
   */
  default: 14,

  /**
   * DC to AC ratio (inverter sizing)
   * 1.2 = 20% DC oversizing (modern best practice)
   */
  dcAcRatio: 1.2,

  /**
   * Inverter efficiency percentage
   * Modern string inverters: 96-98%
   */
  inverterEfficiency: 96,

  /**
   * Ground reflectance (albedo)
   * Affects both ground-reflected light and bifacial rear-side production
   */
  albedo: {
    canada: 0.35,    // Higher due to seasonal snow
    default: 0.20,   // Standard ground/grass
    snow: 0.60,      // Fresh snow
    concrete: 0.30,  // Light concrete
    darkRoof: 0.10,  // Dark asphalt shingles
  },

  /**
   * Snow loss factor for winter months
   * Applied in addition to monthly soiling
   */
  snowLossFactor: 0.03, // 3%
} as const

// =============================================================================
// MONTHLY SOILING LOSSES (% loss per month, Jan-Dec)
// =============================================================================

export const MONTHLY_SOILING = {
  /**
   * Canada - Higher losses in winter due to snow accumulation
   */
  canada: [12, 10, 8, 4, 2, 1, 1, 2, 3, 5, 8, 10],

  /**
   * Default/temperate regions
   */
  default: [2, 2, 3, 3, 4, 4, 5, 5, 4, 3, 2, 2],

  /**
   * Dry/dusty regions (e.g., desert)
   */
  dusty: [5, 5, 6, 7, 8, 8, 8, 8, 7, 6, 5, 5],
} as const

// =============================================================================
// MONTHLY DERATE FACTORS (Seasonal Production Variation)
// =============================================================================

/**
 * Normalized to peak summer = 1.0
 * Represents seasonal solar resource availability
 * Note: PVWatts already accounts for this - use only for manual calculations
 */
export const MONTHLY_DERATE_FACTORS = {
  /**
   * Ontario/Eastern Canada pattern
   */
  ontario: [0.35, 0.50, 0.70, 1.0, 1.0, 1.0, 1.0, 1.0, 0.80, 0.60, 0.45, 0.25],

  /**
   * Alberta/Prairie pattern (more consistent due to clearer skies)
   */
  alberta: [0.40, 0.55, 0.75, 1.0, 1.0, 1.0, 1.0, 1.0, 0.85, 0.65, 0.50, 0.30],

  /**
   * BC/Coastal pattern (cloudier winters)
   */
  coastal: [0.30, 0.45, 0.65, 0.95, 1.0, 1.0, 1.0, 1.0, 0.75, 0.55, 0.40, 0.20],
} as const

// =============================================================================
// ROOF ORIENTATION EFFICIENCY
// =============================================================================

/**
 * Production efficiency relative to optimal south-facing (180°)
 * Based on Canadian latitude solar studies
 */
export const ORIENTATION_EFFICIENCY = {
  // Azimuth ranges mapped to efficiency percentages
  south: { min: 157.5, max: 202.5, efficiency: 100 },
  southEast: { min: 135, max: 157.5, efficiency: 96 },
  southWest: { min: 202.5, max: 225, efficiency: 96 },
  eastSouthEast: { min: 112.5, max: 135, efficiency: 92 },
  westSouthWest: { min: 225, max: 247.5, efficiency: 92 },
  east: { min: 67.5, max: 112.5, efficiency: 82 },
  west: { min: 247.5, max: 292.5, efficiency: 82 },
  northEast: { min: 22.5, max: 67.5, efficiency: 72 },
  northWest: { min: 292.5, max: 337.5, efficiency: 72 },
  north: { min: 337.5, max: 22.5, efficiency: 55 }, // Wraps around 0°
} as const

/**
 * Get orientation efficiency for a given azimuth
 */
export function getOrientationEfficiencyValue(azimuth: number): number {
  const normalized = ((azimuth % 360) + 360) % 360

  if (normalized >= 157.5 && normalized <= 202.5) return 100
  if (normalized >= 135 && normalized < 157.5) return 96
  if (normalized > 202.5 && normalized <= 225) return 96
  if (normalized >= 112.5 && normalized < 135) return 92
  if (normalized > 225 && normalized <= 247.5) return 92
  if (normalized >= 67.5 && normalized < 112.5) return 82
  if (normalized > 247.5 && normalized <= 292.5) return 82
  if (normalized >= 22.5 && normalized < 67.5) return 72
  if (normalized > 292.5 && normalized < 337.5) return 72
  return 55 // North
}

// =============================================================================
// ROOF PITCH/TILT EFFICIENCY
// =============================================================================

/**
 * Tilt angle efficiency relative to optimal 30° (for Canadian latitudes)
 */
export const PITCH_EFFICIENCY = {
  flat: { degrees: 5, efficiency: 88, label: 'Flat' },
  low: { degrees: 15, efficiency: 93, label: 'Low (3:12 - 5:12)' },
  medium: { degrees: 30, efficiency: 100, label: 'Medium (7:12 - 9:12)' },
  steep: { degrees: 45, efficiency: 97, label: 'Steep (12:12+)' },
} as const

/**
 * Convert pitch label to degrees
 */
export function pitchToDegrees(pitch: string): number {
  const key = pitch.toLowerCase() as keyof typeof PITCH_EFFICIENCY
  return PITCH_EFFICIENCY[key]?.degrees ?? 30
}

/**
 * Get pitch efficiency percentage
 */
export function getPitchEfficiencyValue(pitch: string): number {
  const key = pitch.toLowerCase() as keyof typeof PITCH_EFFICIENCY
  return PITCH_EFFICIENCY[key]?.efficiency ?? 100
}

// =============================================================================
// SHADING FACTORS
// =============================================================================

/**
 * Usable roof percentage based on shading level
 * Applied AFTER obstruction allowance
 */
export const SHADING_FACTORS = {
  none: { factor: 0.90, label: 'No Shade', description: 'Full sun all day' },
  minimal: { factor: 0.80, label: 'Minimal', description: 'Mostly sunny, slight morning/evening shade' },
  partial: { factor: 0.65, label: 'Partial', description: 'Some shade from trees or buildings' },
  significant: { factor: 0.50, label: 'Significant', description: 'Heavy shade for part of day' },
} as const

/**
 * Get shading factor for a given level
 */
export function getShadingFactor(level: string): number {
  const key = level.toLowerCase() as keyof typeof SHADING_FACTORS
  return SHADING_FACTORS[key]?.factor ?? 0.80
}

// =============================================================================
// OBSTRUCTION ALLOWANCE
// =============================================================================

/**
 * Accounts for physical roof obstructions that reduce usable area
 * Applied BEFORE shading calculations
 */
export const OBSTRUCTION_ALLOWANCE = {
  /**
   * Default 10% reduction for typical residential roofs
   * Accounts for: vents, chimneys, skylights, roof access,
   * edge setbacks, HVAC equipment, plumbing stacks
   */
  default: 0.90,

  /**
   * Commercial roofs with more equipment
   */
  commercial: 0.85,

  /**
   * Simple roof with minimal obstructions
   */
  minimal: 0.95,
} as const

// =============================================================================
// BIFACIAL PANEL GAINS
// =============================================================================

/**
 * Additional production from bifacial panel rear side
 */
export const BIFACIAL_GAIN = {
  /**
   * Roof-mounted systems (limited rear clearance)
   */
  roofMount: 1.04, // +4%

  /**
   * Ground-mounted with reflective surface
   */
  groundMount: 1.08, // +8%

  /**
   * Elevated/tracker systems
   */
  elevated: 1.12, // +12%

  /**
   * No bifacial gain (monofacial panels)
   */
  none: 1.0,
} as const

// =============================================================================
// DEGRADATION RATES
// =============================================================================

/**
 * Annual panel degradation rates
 */
export const DEGRADATION = {
  /**
   * First year degradation (light-induced)
   */
  firstYear: 0.02, // 2%

  /**
   * Annual degradation after first year
   */
  annual: 0.005, // 0.5% per year

  /**
   * Guaranteed minimum performance at 25 years
   */
  warrantyAt25Years: 0.84, // 84% of original
} as const

// =============================================================================
// ELECTRICITY RATE ESCALATION
// =============================================================================

export const ESCALATION = {
  /**
   * Default annual electricity rate increase
   */
  default: 0.045, // 4.5%

  /**
   * Conservative estimate
   */
  conservative: 0.03, // 3%

  /**
   * Aggressive estimate
   */
  aggressive: 0.06, // 6%
} as const

// =============================================================================
// QUICK ESTIMATE DEFAULTS
// =============================================================================

export const QUICK_ESTIMATE_DEFAULTS = {
  /**
   * Average electricity rate (Ontario)
   */
  electricityRate: 0.134, // $/kWh

  /**
   * Average solar production per kW
   */
  productionPerKw: 1200, // kWh/year

  /**
   * Default escalation rate
   */
  escalation: 0.045, // 4.5%
} as const

// =============================================================================
// PROVINCE-SPECIFIC SOLAR PARAMETERS
// =============================================================================

export const PROVINCE_SOLAR_PARAMS = {
  ON: {
    capacityFactor: 0.14,
    irradiance: 1250, // kWh/m²/year
    soilingProfile: 'canada' as const,
    derateProfile: 'ontario' as const,
  },
  AB: {
    capacityFactor: 0.16,
    irradiance: 1350,
    soilingProfile: 'canada' as const,
    derateProfile: 'alberta' as const,
  },
  BC: {
    capacityFactor: 0.13,
    irradiance: 1200,
    soilingProfile: 'canada' as const,
    derateProfile: 'coastal' as const,
  },
  SK: {
    capacityFactor: 0.16,
    irradiance: 1350,
    soilingProfile: 'canada' as const,
    derateProfile: 'alberta' as const,
  },
  MB: {
    capacityFactor: 0.15,
    irradiance: 1300,
    soilingProfile: 'canada' as const,
    derateProfile: 'ontario' as const,
  },
  QC: {
    capacityFactor: 0.13,
    irradiance: 1200,
    soilingProfile: 'canada' as const,
    derateProfile: 'ontario' as const,
  },
  NS: {
    capacityFactor: 0.14,
    irradiance: 1250,
    soilingProfile: 'canada' as const,
    derateProfile: 'coastal' as const,
  },
  NB: {
    capacityFactor: 0.14,
    irradiance: 1250,
    soilingProfile: 'canada' as const,
    derateProfile: 'coastal' as const,
  },
  PE: {
    capacityFactor: 0.14,
    irradiance: 1250,
    soilingProfile: 'canada' as const,
    derateProfile: 'coastal' as const,
  },
  NL: {
    capacityFactor: 0.12,
    irradiance: 1100,
    soilingProfile: 'canada' as const,
    derateProfile: 'coastal' as const,
  },
  YT: {
    capacityFactor: 0.11,
    irradiance: 1000,
    soilingProfile: 'canada' as const,
    derateProfile: 'coastal' as const,
  },
  NT: {
    capacityFactor: 0.11,
    irradiance: 1000,
    soilingProfile: 'canada' as const,
    derateProfile: 'coastal' as const,
  },
  NU: {
    capacityFactor: 0.10,
    irradiance: 900,
    soilingProfile: 'canada' as const,
    derateProfile: 'coastal' as const,
  },
} as const

/**
 * Get province solar parameters with fallback to Ontario
 */
export function getProvinceSolarParams(provinceCode: string) {
  const code = provinceCode.toUpperCase() as keyof typeof PROVINCE_SOLAR_PARAMS
  return PROVINCE_SOLAR_PARAMS[code] ?? PROVINCE_SOLAR_PARAMS.ON
}

// =============================================================================
// PVWATTS API CONFIGURATION
// =============================================================================

export const PVWATTS_CONFIG = {
  /**
   * Module types
   * 0 = Standard (15% efficiency)
   * 1 = Premium (19% efficiency) - Used for N-type panels
   * 2 = Thin film (10% efficiency)
   */
  moduleType: 1, // Premium for N-type monocrystalline

  /**
   * Array types
   * 0 = Fixed - Open Rack
   * 1 = Fixed - Roof Mounted
   * 2 = 1-Axis Tracking
   * 3 = 1-Axis Backtracking
   * 4 = 2-Axis Tracking
   */
  arrayType: 1, // Fixed roof mount

  /**
   * Dataset options
   */
  dataset: 'nsrdb', // NREL Solar Radiation Database

  /**
   * Cache duration for API responses
   */
  cacheDurationMs: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const

// =============================================================================
// HELPER: Build PVWatts Parameters
// =============================================================================

export interface PVWattsInputs {
  lat: number
  lon: number
  systemCapacityKw: number
  tilt?: number
  azimuth?: number
  province?: string
}

/**
 * Build complete PVWatts API parameters from inputs
 */
export function buildPVWattsParams(inputs: PVWattsInputs) {
  const { lat, lon, systemCapacityKw, tilt = 30, azimuth = 180, province = 'ON' } = inputs

  const provinceParams = getProvinceSolarParams(province)
  const soilingProfile = MONTHLY_SOILING[provinceParams.soilingProfile]
  const isCanada = Object.keys(PROVINCE_SOLAR_PARAMS).includes(province.toUpperCase())

  return {
    lat,
    lon,
    system_capacity: systemCapacityKw,
    tilt,
    azimuth,
    module_type: PVWATTS_CONFIG.moduleType,
    losses: SYSTEM_LOSSES.default,
    array_type: PVWATTS_CONFIG.arrayType,
    dc_ac_ratio: SYSTEM_LOSSES.dcAcRatio,
    inv_eff: SYSTEM_LOSSES.inverterEfficiency,
    albedo: isCanada ? SYSTEM_LOSSES.albedo.canada : SYSTEM_LOSSES.albedo.default,
    soiling: soilingProfile,
    dataset: PVWATTS_CONFIG.dataset,
  }
}

// =============================================================================
// HELPER: Calculate Effective Production
// =============================================================================

export interface ProductionInputs {
  baseProductionKwh: number
  azimuth?: number
  pitch?: string
  shadingLevel?: string
  useBifacial?: boolean
}

/**
 * Apply all derate factors to base production
 */
export function calculateEffectiveProduction(inputs: ProductionInputs): number {
  const {
    baseProductionKwh,
    azimuth = 180,
    pitch = 'medium',
    shadingLevel = 'minimal',
    useBifacial = true,
  } = inputs

  let production = baseProductionKwh

  // Apply orientation efficiency
  const orientationEff = getOrientationEfficiencyValue(azimuth) / 100
  production *= orientationEff

  // Apply pitch efficiency
  const pitchEff = getPitchEfficiencyValue(pitch) / 100
  production *= pitchEff

  // Apply shading factor
  const shadingFactor = getShadingFactor(shadingLevel)
  production *= shadingFactor

  // Apply bifacial gain if applicable
  if (useBifacial) {
    production *= BIFACIAL_GAIN.roofMount
  }

  return Math.round(production)
}

// =============================================================================
// HELPER: Calculate Usable Roof Area
// =============================================================================

export interface RoofAreaInputs {
  totalAreaSqFt: number
  shadingLevel?: string
  obstructionLevel?: 'default' | 'commercial' | 'minimal'
}

/**
 * Calculate usable roof area after obstructions and shading
 */
export function calculateUsableRoofArea(inputs: RoofAreaInputs): {
  usableAreaSqFt: number
  obstructionLoss: number
  shadingLoss: number
  totalEfficiency: number
} {
  const {
    totalAreaSqFt,
    shadingLevel = 'minimal',
    obstructionLevel = 'default',
  } = inputs

  const obstructionFactor = OBSTRUCTION_ALLOWANCE[obstructionLevel]
  const shadingFactor = getShadingFactor(shadingLevel)

  const afterObstructions = totalAreaSqFt * obstructionFactor
  const usableAreaSqFt = afterObstructions * shadingFactor

  return {
    usableAreaSqFt: Math.round(usableAreaSqFt),
    obstructionLoss: (1 - obstructionFactor) * 100,
    shadingLoss: (1 - shadingFactor) * 100,
    totalEfficiency: obstructionFactor * shadingFactor * 100,
  }
}
