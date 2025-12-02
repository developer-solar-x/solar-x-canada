// Shared helpers for computing partial lead steps and progress
// This mirrors the estimator step logic in `app/estimator/page.tsx`
// but only cares about step names (no components).

export interface PartialLeadStepMeta {
  estimatorMode?: string | null
  programType?: string | null
  systemType?: string | null
}

// Names match the estimator display stepper after the Program step
const EASY_STEP_NAMES: string[] = [
  'Location',
  'Roof Size',
  'Energy',
  'Battery Savings',
  'Net Metering Savings',
  'Add-ons',
  'Photos',
  'Details',
  'Review',
  'Submit',
]

const DETAILED_STEP_NAMES: string[] = [
  'Location',
  'Draw Roof',
  'Details',
  'Battery Savings',
  'Net Metering Savings',
  'Add-ons',
  'Photos',
  'Review',
  'Submit',
]

export function getPartialLeadDisplaySteps(meta: PartialLeadStepMeta): string[] {
  const mode = meta.estimatorMode === 'detailed' ? 'detailed' : 'easy'
  const programType = meta.programType?.toLowerCase() ?? null
  const systemType = meta.systemType?.toLowerCase() ?? null

  const baseNames = mode === 'detailed' ? DETAILED_STEP_NAMES : EASY_STEP_NAMES

  return baseNames.filter((name) => {
    if (name === 'Battery Savings') {
      // Show Battery Savings for HRS / Solar + Battery style flows
      // or when the system was explicitly marked as a battery system.
      return (
        programType === 'hrs_residential' ||
        programType === 'quick' ||
        systemType === 'battery_system'
      )
    }

    if (name === 'Net Metering Savings') {
      // Only show Net Metering Savings for net metering program flows.
      return programType === 'net_metering'
    }

    return true
  })
}

export function getPartialLeadTotalSteps(meta: PartialLeadStepMeta): number {
  const steps = getPartialLeadDisplaySteps(meta)
  // Always have at least one step to avoid divide-by-zero in consumers.
  return steps.length > 0 ? steps.length : 1
}






