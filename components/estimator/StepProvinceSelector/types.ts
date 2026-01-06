import type { EstimatorData } from '@/app/estimator/page'

export interface StepProvinceSelectorProps {
  data: EstimatorData
  onComplete: (data: Partial<EstimatorData>) => void
}

