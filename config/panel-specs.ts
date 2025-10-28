// Solar Panel Specifications
// Model: TS-BGT54(500)-G11
// N-type Monocrystalline Bifacial Panel

/**
 * Physical specifications of the solar panel
 */
export const PANEL_SPECS = {
  // Model information
  model: 'TS-BGT54(500)-G11',
  cellType: 'N-type monocrystalline',
  bifacial: true,
  
  // Physical dimensions
  dimensions: {
    length: 1961, // mm
    width: 1134, // mm
    depth: 35, // mm
    lengthInch: 77.20,
    widthInch: 44.65,
    depthInch: 1.38,
    areaSqFt: 23.9, // Calculated from mm dimensions
    weight: 28, // kg
    weightLbs: 61.73,
  },
  
  // Cell configuration
  cells: {
    total: 108,
    configuration: '2x54',
  },
  
  // Electrical characteristics (STC - Standard Testing Conditions)
  // STC: Irradiance 1000W/m², Cell Temperature 25°C, AM1.5
  electrical: {
    peakPower: 500, // W
    openCircuitVoltage: 40.10, // V
    shortCircuitCurrent: 15.86, // A
    mppVoltage: 33.30, // V (Maximum Power Point)
    mppCurrent: 15.03, // A (Maximum Power Point)
    moduleEfficiency: 22.5, // %
  },
  
  // Electrical characteristics (NOCT - Nominal Operating Cell Temperature)
  // NOCT: Irradiance 800W/m², Ambient 20°C, Wind 1m/s, AM1.5
  noctPerformance: {
    peakPower: 382, // W
    openCircuitVoltage: 38.00, // V
    shortCircuitCurrent: 12.78, // A
    mppVoltage: 31.52, // V
    mppCurrent: 12.11, // A
  },
  
  // Bifacial characteristics
  bifacialSpecs: {
    bifaciality: 0.80, // 80% (±5%)
    rearGlassThickness: 2.0, // mm, heat strengthened
    frontGlassThickness: 2.0, // mm, anti-reflection coating
  },
  
  // Temperature coefficients
  temperatureCoefficients: {
    power: -0.30, // %/°C - Power loss per degree above 25°C
    openCircuitVoltage: -0.28, // %/°C
    shortCircuitCurrent: 0.04, // %/°C - Slight increase with temperature
    nominalOperatingCellTemp: 45, // °C (±2)
  },
  
  // Operating parameters
  operating: {
    powerTolerance: { min: 0, max: 5 }, // W
    maxSystemVoltage: 1500, // V
    maxRatedFuseCurrent: 30, // A
    operatingTempRange: { min: -40, max: 85 }, // °C
  },
  
  // Mechanical specifications
  mechanical: {
    frontMaxStaticLoad: 8100, // Pa
    rearMaxStaticLoad: 5000, // Pa
    hailstoneTest: 35, // mm
    frame: 'Anodized aluminum alloy',
    junctionBox: 'IP68, 3 bypass diodes',
    outputWire: '4.0 mm²',
    wireLength: [300, 1200], // mm (or customized)
    connector: 'MC4 - EVO2',
  },
  
  // Packaging
  packaging: {
    piecesPerPallet: 31,
    piecesPerContainer40HQ: 620,
  },
} as const

/**
 * Calculate expected power output with temperature adjustment
 */
export function calculateTemperatureAdjustedPower(
  ambientTemp: number,
  peakPower: number = PANEL_SPECS.electrical.peakPower
): number {
  // Cell temperature is typically 25-30°C higher than ambient under full sun
  const cellTempIncrease = 28 // Conservative estimate
  const cellTemp = ambientTemp + cellTempIncrease
  
  // Calculate power loss from 25°C STC
  const tempDifference = cellTemp - 25
  const powerLossPercent = tempDifference * PANEL_SPECS.temperatureCoefficients.power
  
  // Apply temperature derating
  const adjustedPower = peakPower * (1 + powerLossPercent / 100)
  
  return Math.max(0, adjustedPower)
}

/**
 * Get bifacial gain factor for production calculations
 * Conservative estimate for roof-mounted installations
 */
export function getBifacialGainFactor(
  installationType: 'roof' | 'ground' | 'elevated' = 'roof',
  groundReflectance: number = 0.2
): number {
  // Bifacial gain depends on:
  // 1. Panel bifaciality (80% for this panel)
  // 2. Ground reflectance (albedo)
  // 3. Mounting height and clearance
  
  const bifaciality = PANEL_SPECS.bifacialSpecs.bifaciality
  
  // Irradiance ratio on rear vs front (simplified model)
  let rearIrradianceRatio = 0
  
  switch (installationType) {
    case 'roof':
      // Roof mounting: Limited rear access, 5-10% gain
      rearIrradianceRatio = 0.10 * groundReflectance / 0.2 // Normalized to standard albedo
      break
    case 'ground':
      // Ground mounting with reflective surface: 10-15% gain
      rearIrradianceRatio = 0.15 * groundReflectance / 0.2
      break
    case 'elevated':
      // Elevated mounting (tracker or high clearance): 15-20% gain
      rearIrradianceRatio = 0.18 * groundReflectance / 0.2
      break
  }
  
  // Calculate additional power from rear side
  const bifacialGain = 1 + (rearIrradianceRatio * bifaciality)
  
  // Conservative cap at 1.15 (15% gain) for roof installations
  return Math.min(bifacialGain, installationType === 'roof' ? 1.10 : 1.20)
}

/**
 * Get panel area in square feet
 */
export function getPanelAreaSqFt(): number {
  return PANEL_SPECS.dimensions.areaSqFt
}

/**
 * Get panel wattage
 */
export function getPanelWattage(): number {
  return PANEL_SPECS.electrical.peakPower
}

/**
 * Get panel efficiency
 */
export function getPanelEfficiency(): number {
  return PANEL_SPECS.electrical.moduleEfficiency
}

