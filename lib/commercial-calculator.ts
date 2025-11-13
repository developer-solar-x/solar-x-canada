// Commercial Class-B Battery Savings Calculator
// Implements PF correction and peak shaving calculations

export type BillingMethod = "Per kVA" | "Per kW" | "Max(kW, 0.9×kVA)";

export interface CommercialInputs {
  // Tariff & meter
  billingMethod: BillingMethod;
  demandRatePerUnit30d: number;     // $/unit/30 days
  measuredPeakKVA?: number;         // if no Green Button
  currentPF: number;                 // 0..1
  targetPF: number;                  // 0..1

  // Peak shaving strategy
  targetCapKW?: number;              // optional; if set, shave = kW_afterPF - targetCap
  shaveKW?: number;                  // used only if no targetCapKW
  peakDurationMin: number;           // minutes for the peak event
  batteryCRate: number;              // e.g., 0.5C or 1.0C
  roundTripEff: number;              // 0..1
  usableDOD: number;                 // 0..1

  // Costs & economics
  installedCostTotal: number;        // total (solar + battery + BOS + install)
  analysisYears: number;
  annualEscalator: number;           // e.g., 0.02

  // Rebate
  solarACElligibleKW: number;        // AC capacity eligible
  rebateRatePerKW: number;           // default 860
  rebateCapDollar: number;           // default 860000
  applySolar50Cap: boolean;          // true/false
  solarOnlyCost?: number;            // required if applySolar50Cap

  // Green Button-derived (optional)
  intervalKW?: Array<{ ts: string; kW: number }>; // 15-min time series
}

export interface BillingState {
  kVA: number;
  kW: number;
  billedDemand: number;
  monthlyCost: number;
}

export interface CommercialResults {
  // Three states
  before: BillingState;
  afterPF: BillingState;
  afterPFShave: BillingState;

  // Savings
  monthlySavings: number;
  annualSavings: number;

  // Battery sizing
  batteryKWh: number;
  inverterKW: number;
  sizingType: "power-dominated" | "energy-dominated";

  // Rebate
  baseRebate: number;
  rebateAfterCap: number;
  rebateFinal: number;
  netInstalledCost: number;

  // Economics
  roiYear1: number;  // percentage
  paybackYears: number;
  multiYearSavings: Array<{
    year: number;
    annualSavings: number;
    cumulative: number;
  }>;
}

/**
 * Calculate billed demand based on billing method
 */
export function calculateBilledDemand(
  kVA: number,
  kW: number,
  billingMethod: BillingMethod
): number {
  switch (billingMethod) {
    case "Per kVA":
      return kVA;
    case "Per kW":
      return kW;
    case "Max(kW, 0.9×kVA)":
      return Math.max(kW, 0.9 * kVA);
    default:
      return kW;
  }
}

/**
 * Calculate the three billing states: Before, After PF, After PF+Shave
 */
export function calculateBillingStates(inputs: CommercialInputs): {
  before: BillingState;
  afterPF: BillingState;
  afterPFShave: BillingState;
} {
  // If billing is "Per kW", the input is kW; otherwise it's kVA
  let kW0: number;
  let kVA0: number;
  
  if (inputs.billingMethod === 'Per kW') {
    // Input is kW, calculate kVA from kW and PF
    kW0 = inputs.measuredPeakKVA || 0;
    kVA0 = kW0 / inputs.currentPF;
  } else {
    // Input is kVA, calculate kW from kVA and PF
    kVA0 = inputs.measuredPeakKVA || 0;
    kW0 = kVA0 * inputs.currentPF;
  }

  // After PF correction only
  const kW1 = kW0; // kW doesn't change with PF correction
  const kVA1 = kW0 / inputs.targetPF;

  // Calculate shave amount
  let shaveKW = 0;
  if (inputs.targetCapKW !== undefined && inputs.targetCapKW > 0) {
    shaveKW = Math.max(0, kW1 - inputs.targetCapKW);
  } else if (inputs.shaveKW !== undefined) {
    shaveKW = inputs.shaveKW;
  }

  // After PF + Shave
  const kW2 = Math.max(kW1 - shaveKW, 0);
  const kVA2 = kW2 / inputs.targetPF;

  // Calculate billed demand for each state
  const before: BillingState = {
    kVA: kVA0,
    kW: kW0,
    billedDemand: calculateBilledDemand(kVA0, kW0, inputs.billingMethod),
    monthlyCost: 0, // Will be calculated below
  };

  const afterPF: BillingState = {
    kVA: kVA1,
    kW: kW1,
    billedDemand: calculateBilledDemand(kVA1, kW1, inputs.billingMethod),
    monthlyCost: 0, // Will be calculated below
  };

  const afterPFShave: BillingState = {
    kVA: kVA2,
    kW: kW2,
    billedDemand: calculateBilledDemand(kVA2, kW2, inputs.billingMethod),
    monthlyCost: 0, // Will be calculated below
  };

  // Calculate monthly costs
  before.monthlyCost = before.billedDemand * inputs.demandRatePerUnit30d;
  afterPF.monthlyCost = afterPF.billedDemand * inputs.demandRatePerUnit30d;
  afterPFShave.monthlyCost = afterPFShave.billedDemand * inputs.demandRatePerUnit30d;

  return { before, afterPF, afterPFShave };
}

/**
 * Calculate battery sizing based on energy and power constraints
 */
export function calculateBatterySizing(
  shaveKW: number,
  peakDurationMin: number,
  batteryCRate: number,
  roundTripEff: number,
  usableDOD: number
): {
  batteryKWh: number;
  inverterKW: number;
  sizingType: "power-dominated" | "energy-dominated";
  energyNeededKWh: number;
  powerRequiredKWh: number;
} {
  // Energy needed: Shave_kW × (PeakDurationMin/60)
  const energyNeededKWh = shaveKW * (peakDurationMin / 60);

  // Power constraint: Required_kWh_by_power = Shave_kW / C_rate
  const powerRequiredKWh = shaveKW / batteryCRate;

  // Account for losses: Nameplate = Energy_needed / (RoundTripEff × DoD)
  const nameplateByEnergy = energyNeededKWh / (roundTripEff * usableDOD);
  const nameplateByPower = powerRequiredKWh / (roundTripEff * usableDOD);

  // Required battery = max of both
  const batteryKWh = Math.max(nameplateByEnergy, nameplateByPower);
  const inverterKW = shaveKW;

  const sizingType = powerRequiredKWh > energyNeededKWh 
    ? "power-dominated" 
    : "energy-dominated";

  return {
    batteryKWh,
    inverterKW,
    sizingType,
    energyNeededKWh,
    powerRequiredKWh,
  };
}

/**
 * Calculate rebate
 */
export function calculateRebate(inputs: CommercialInputs): {
  baseRebate: number;
  rebateAfterCap: number;
  rebateFinal: number;
} {
  const baseRebate = inputs.solarACElligibleKW * inputs.rebateRatePerKW;
  const rebateAfterCap = Math.min(baseRebate, inputs.rebateCapDollar);

  let rebateFinal = rebateAfterCap;
  if (inputs.applySolar50Cap && inputs.solarOnlyCost !== undefined) {
    rebateFinal = Math.min(rebateAfterCap, 0.5 * inputs.solarOnlyCost);
  }

  return {
    baseRebate,
    rebateAfterCap,
    rebateFinal,
  };
}

/**
 * Calculate multi-year savings with escalator
 */
export function calculateMultiYearSavings(
  annualSavingsYear1: number,
  analysisYears: number,
  annualEscalator: number
): Array<{
  year: number;
  annualSavings: number;
  cumulative: number;
}> {
  const results: Array<{
    year: number;
    annualSavings: number;
    cumulative: number;
  }> = [];

  let cumulative = 0;
  for (let year = 1; year <= analysisYears; year++) {
    const annualSavings = annualSavingsYear1 * Math.pow(1 + annualEscalator, year - 1);
    cumulative += annualSavings;
    results.push({
      year,
      annualSavings,
      cumulative,
    });
  }

  return results;
}

/**
 * Main calculation function - computes all results
 */
export function calculateCommercialResults(
  inputs: CommercialInputs
): CommercialResults {
  // Calculate billing states
  const { before, afterPF, afterPFShave } = calculateBillingStates(inputs);

  // Calculate savings
  const monthlySavings = before.monthlyCost - afterPFShave.monthlyCost;
  const annualSavings = monthlySavings * 12;

  // Calculate shave amount
  let shaveKW = 0;
  if (inputs.targetCapKW !== undefined && inputs.targetCapKW > 0) {
    const kW1 = (inputs.measuredPeakKVA || 0) * inputs.currentPF;
    shaveKW = Math.max(0, kW1 - inputs.targetCapKW);
  } else if (inputs.shaveKW !== undefined) {
    shaveKW = inputs.shaveKW;
  }

  // Calculate battery sizing
  const batterySizing = calculateBatterySizing(
    shaveKW,
    inputs.peakDurationMin,
    inputs.batteryCRate,
    inputs.roundTripEff,
    inputs.usableDOD
  );

  // Calculate rebate
  const rebate = calculateRebate(inputs);
  const netInstalledCost = inputs.installedCostTotal - rebate.rebateFinal;

  // Calculate economics
  const roiYear1 = netInstalledCost > 0 
    ? (annualSavings / netInstalledCost) * 100 
    : 0;
  const paybackYears = annualSavings > 0 
    ? netInstalledCost / annualSavings 
    : Infinity;

  // Calculate multi-year savings
  const multiYearSavings = calculateMultiYearSavings(
    annualSavings,
    inputs.analysisYears,
    inputs.annualEscalator
  );

  return {
    before,
    afterPF,
    afterPFShave,
    monthlySavings,
    annualSavings,
    batteryKWh: batterySizing.batteryKWh,
    inverterKW: batterySizing.inverterKW,
    sizingType: batterySizing.sizingType,
    baseRebate: rebate.baseRebate,
    rebateAfterCap: rebate.rebateAfterCap,
    rebateFinal: rebate.rebateFinal,
    netInstalledCost,
    roiYear1,
    paybackYears,
    multiYearSavings,
  };
}

