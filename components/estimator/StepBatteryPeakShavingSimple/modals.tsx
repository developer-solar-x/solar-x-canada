import { Modal } from '@/components/ui/Modal'
import { TOU_RATE_PLAN, ULO_RATE_PLAN } from '@/config/rate-plans'
import type { PlanResultMap } from './types'

export interface TouInfoModalProps {
  open: boolean
  onClose: () => void
  annualUsageKwh: number
  touResults: PlanResultMap
}

export function TouInfoModal({ open, onClose, annualUsageKwh, touResults }: TouInfoModalProps) {
  const touEntry = touResults.get('combined')

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="How We Calculate TOU Peak Shaving"
      message="This section mirrors the Time-of-Use savings card inside the battery comparison area so you can trace every assumption behind the annual results."
      variant="info"
      cancelText="Close"
    >
      {!touEntry ? (
        <div className="text-sm text-gray-700">
          We will show the full TOU breakdown as soon as the calculation finishes.
        </div>
      ) : (
        (() => {
          const formatMoney = (value: number) => `$${value.toFixed(2)}`
          const before = touEntry.result.originalCost
          const after = touEntry.result.newCost
          const leftover = touEntry.result.leftoverEnergy

          const breakdown = touEntry.combined?.breakdown
          const sumValues = (record?: Record<string, number>) =>
            Object.values(record || {}).reduce((acc, val) => acc + (val || 0), 0)
          const solarAppliedKwh = sumValues(breakdown?.solarAllocation)
          const batteryShiftedKwh = sumValues(touEntry.result.batteryOffsets)
          const gridAfterKwh = sumValues(breakdown?.usageAfterBattery) || leftover.totalKwh
          const lowRateKwh =
            (breakdown?.usageAfterBattery?.offPeak || 0) +
            (breakdown?.usageAfterBattery?.ultraLow || 0)
          const offPeakRate =
            (TOU_RATE_PLAN.periods.find((p) => p.period === 'off-peak')?.rate ??
              TOU_RATE_PLAN.weekendRate ??
              9.8) / 100
          const annualSavings = Math.max(0, before.total - after.total)
          const monthlySavings = annualSavings / 12

          return (
            <div className="space-y-4 text-sm text-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                <div>
                  <div className="font-semibold text-navy-600 mb-1">Bill without peak shaving</div>
                  <div>
                    Off-Peak: <span className="font-semibold">{formatMoney(before.offPeak)}</span>
                  </div>
                  <div>
                    Mid-Peak: <span className="font-semibold">{formatMoney(before.midPeak)}</span>
                  </div>
                  <div>
                    On-Peak: <span className="font-semibold">{formatMoney(before.onPeak)}</span>
                  </div>
                  <div className="mt-2 text-red-600 font-semibold">
                    Annual total: {formatMoney(before.total)}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-navy-600 mb-1">Bill with solar + battery</div>
                  <div>
                    Off-Peak (grid + battery charge):{' '}
                    <span className="font-semibold">{formatMoney(after.offPeak)}</span>
                  </div>
                  <div>
                    Mid-Peak: <span className="font-semibold">{formatMoney(after.midPeak)}</span>
                  </div>
                  <div>
                    On-Peak: <span className="font-semibold">{formatMoney(after.onPeak)}</span>
                  </div>
                  <div className="mt-2 text-green-600 font-semibold">
                    Annual total: {formatMoney(after.total)}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-800 uppercase">Savings snapshot</span>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{formatMoney(annualSavings)}/yr</div>
                    <div className="text-[11px] text-gray-500">
                      {formatMoney(monthlySavings)}/month
                    </div>
                  </div>
                </div>
                <div>
                  Solar applied to daytime load:{' '}
                  <span className="font-semibold text-gray-800">{solarAppliedKwh.toFixed(0)} kWh</span>.
                </div>
                <div>
                  Battery shifted out of peak windows:{' '}
                  <span className="font-semibold text-gray-800">{batteryShiftedKwh.toFixed(0)} kWh</span>.
                </div>
                <div>
                  Remaining grid energy priced at the off-peak rate ({(offPeakRate * 100).toFixed(1)}¢/kWh):{' '}
                  <span className="font-semibold text-gray-800">{gridAfterKwh.toFixed(0)} kWh</span>
                  {lowRateKwh > 0 && (
                    <span className="text-gray-500"> · {lowRateKwh.toFixed(0)} kWh drawn during low-rate hours</span>
                  )}
                  .
                </div>
              </div>
            </div>
          )
        })()
      )}
    </Modal>
  )
}

export interface ProfitInfoModalProps {
  open: boolean
  onClose: () => void
  touResults: PlanResultMap
  uloResults: PlanResultMap
}

export function ProfitInfoModal({ open, onClose, touResults, uloResults }: ProfitInfoModalProps) {
  const formatMoney = (value: number) => `$${Math.round(value).toLocaleString()}`
  const tou = touResults.get('combined')
  const ulo = uloResults.get('combined')
  const touProjection = tou?.combined?.projection
  const uloProjection = ulo?.combined?.projection
  const touTotalSavings = touProjection?.totalSavings25Year ?? 0
  const uloTotalSavings = uloProjection?.totalSavings25Year ?? 0
  const touProfit = touProjection?.netProfit25Year ?? 0
  const uloProfit = uloProjection?.netProfit25Year ?? 0

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="How 25‑Year Profit Is Calculated"
      message="We extend the same Year‑1 savings curve out to 25 years, then subtract the combined net cost to show the long-term outcome."
      variant="info"
      cancelText="Close"
    >
      <div className="space-y-4 text-sm text-gray-700">
        <div>
          <span className="font-semibold">What the model assumes</span>
          <div className="mt-1 text-xs text-gray-600 ml-1">
            • Year‑1 savings start with the same capped amount shown on the annual card.
          </div>
          <div className="mt-1 text-xs text-gray-600 ml-1">
            • Long-term projection gently increases utility prices while trimming solar+battery performance to stay realistic.
          </div>
          <div className="mt-1 text-xs text-gray-600 ml-1">
            • Total 25‑year savings add up that adjusted curve; profit simply subtracts the combined net cost.
          </div>
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-xs font-semibold text-navy-600 mb-1">Time-of-Use (TOU)</div>
          <div className="text-xs text-gray-700">
            Net cost: <span className="font-semibold">{formatMoney(tou?.combined?.netCost ?? 0)}</span>
          </div>
          <div className="text-xs text-gray-700">
            25‑Year total savings: <span className="font-semibold text-navy-600">{formatMoney(touTotalSavings)}</span>
          </div>
          <div className="text-xs text-gray-700">
            25‑Year profit: <span className="font-semibold text-green-600">{formatMoney(touProfit)}</span>
          </div>
          <div className="text-[11px] text-gray-600 mt-1">
            Savings reflect the winter safeguard and the same solar+battery mix from the main view.
          </div>
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-xs font-semibold text-navy-600 mb-1">Ultra-Low Overnight (ULO)</div>
          <div className="text-xs text-gray-700">
            Net cost: <span className="font-semibold">{formatMoney(ulo?.combined?.netCost ?? 0)}</span>
          </div>
          <div className="text-xs text-gray-700">
            25‑Year total savings: <span className="font-semibold text-navy-600">{formatMoney(uloTotalSavings)}</span>
          </div>
          <div className="text-xs text-gray-700">
            25‑Year profit: <span className="font-semibold text-green-600">{formatMoney(uloProfit)}</span>
          </div>
          <div className="text-[11px] text-gray-600 mt-1">
            Night charging plus the winter safeguard drive the difference versus TOU.
          </div>
        </div>

        <div className="text-xs text-gray-600 italic">
          Long-term profit is one more way to see the combined effect of capped savings, rate trends, and incentives.
        </div>
      </div>
    </Modal>
  )
}

export interface UloInfoModalProps {
  open: boolean
  onClose: () => void
  uloResults: PlanResultMap
}

export function UloInfoModal({ open, onClose, uloResults }: UloInfoModalProps) {
  const uloEntry = uloResults.get('combined')

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="How We Calculate ULO Peak Shaving"
      message="These numbers match the Ultra-Low Overnight savings card so you can double-check the midnight charging model and the winter safeguard split."
      variant="info"
      cancelText="Close"
    >
      {!uloEntry ? (
        <div className="text-sm text-gray-700">
          We will show the ULO breakdown as soon as the calculation finishes.
        </div>
      ) : (
        (() => {
          const formatMoney = (value: number) => `$${value.toFixed(2)}`
          const before = uloEntry.result.originalCost
          const after = uloEntry.result.newCost
          const leftover = uloEntry.result.leftoverEnergy

          const breakdown = uloEntry.combined?.breakdown
          const sumValues = (record?: Record<string, number>) =>
            Object.values(record || {}).reduce((acc, val) => acc + (val || 0), 0)
          const solarAppliedKwh = sumValues(breakdown?.solarAllocation)
          const batteryShiftedKwh = sumValues(uloEntry.result.batteryOffsets)
          const gridAfterKwh = sumValues(breakdown?.usageAfterBattery) || leftover.totalKwh
          const lowRateKwh =
            (breakdown?.usageAfterBattery?.ultraLow || 0) +
            (breakdown?.usageAfterBattery?.offPeak || 0)
          const ultraLowRate =
            (ULO_RATE_PLAN.periods.find((p) => p.period === 'ultra-low')?.rate ?? 3.9) / 100
          const annualSavings = Math.max(0, before.total - after.total)
          const monthlySavings = annualSavings / 12

          return (
            <div className="space-y-4 text-sm text-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                <div>
                  <div className="font-semibold text-navy-600 mb-1">Bill without ultra-low shifting</div>
                  <div>
                    Ultra-Low: <span className="font-semibold">{formatMoney(before.ultraLow || 0)}</span>
                  </div>
                  <div>
                    Mid-Peak: <span className="font-semibold">{formatMoney(before.midPeak)}</span>
                  </div>
                  <div>
                    On-Peak: <span className="font-semibold">{formatMoney(before.onPeak)}</span>
                  </div>
                  <div className="mt-2 text-red-600 font-semibold">
                    Annual total: {formatMoney(before.total)}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-navy-600 mb-1">Bill with solar + battery</div>
                  <div>
                    Ultra-Low (charging cost):{' '}
                    <span className="font-semibold">{formatMoney(after.ultraLow || 0)}</span>
                  </div>
                  <div>
                    Mid-Peak: <span className="font-semibold">{formatMoney(after.midPeak)}</span>
                  </div>
                  <div>
                    On-Peak: <span className="font-semibold">{formatMoney(after.onPeak)}</span>
                  </div>
                  <div className="mt-2 text-green-600 font-semibold">
                    Annual total: {formatMoney(after.total)}
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-800 uppercase">Savings snapshot</span>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{formatMoney(annualSavings)}/yr</div>
                    <div className="text-[11px] text-gray-500">
                      {formatMoney(monthlySavings)}/month
                    </div>
                  </div>
                </div>
                <div>
                  Solar applied to daytime load:{' '}
                  <span className="font-semibold text-gray-800">{solarAppliedKwh.toFixed(0)} kWh</span>.
                </div>
                <div>
                  Battery shifted out of peak windows:{' '}
                  <span className="font-semibold text-gray-800">{batteryShiftedKwh.toFixed(0)} kWh</span>.
                </div>
                <div>
                  Remaining grid energy priced at the ultra-low rate ({(ultraLowRate * 100).toFixed(1)}¢/kWh):{' '}
                  <span className="font-semibold text-gray-800">{gridAfterKwh.toFixed(0)} kWh</span>
                  {lowRateKwh > 0 && (
                    <span className="text-gray-500"> · {lowRateKwh.toFixed(0)} kWh drawn overnight</span>
                  )}
                  .
                </div>
              </div>
            </div>
          )
        })()
      )}
    </Modal>
  )
}

export interface PaybackInfoModalProps {
  open: boolean
  onClose: () => void
  touResults: PlanResultMap
  uloResults: PlanResultMap
}

export function PaybackInfoModal({ open, onClose, touResults, uloResults }: PaybackInfoModalProps) {
  const formatMoney = (value: number | undefined) => `$${Math.round(value || 0).toLocaleString()}`
  const formatPayback = (years?: number) => {
    if (years == null || years === Number.POSITIVE_INFINITY) return 'N/A'
    if (years <= 0) return '0.0 years'
    return `${years.toFixed(1)} years`
  }

  const tou = touResults.get('combined')
  const ulo = uloResults.get('combined')

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="How Full System Payback Is Calculated"
      message="We combine the capped Year‑1 savings with a gentle long-term curve to show when the system fully repays its upfront cost."
      variant="info"
      cancelText="Close"
    >
      <div className="space-y-4 text-sm text-gray-700">
        <div>
          <span className="font-semibold">What we include</span>
          <div className="mt-1 text-xs text-gray-600 ml-1">
            • Net cost: solar + battery after incentives — the investment the system must earn back.
          </div>
          <div className="mt-1 text-xs text-gray-600 ml-1">
            • Year‑1 savings: the capped annual savings, shown with the same solar/battery split as the summary card.
          </div>
          <div className="mt-1 text-xs text-gray-600 ml-1">
            • Long-term curve: savings rise gently with utility rates and taper slightly each year to reflect real-world performance.
          </div>
          <div className="mt-1 text-xs text-gray-600 ml-1">
            • Payback moment: the first year when cumulative savings exceed the combined net cost (or “N/A” if that point never arrives).
          </div>
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-xs font-semibold text-navy-600 mb-1">Time-of-Use (TOU)</div>
          <div className="text-xs text-gray-700">
            Net cost: <span className="font-semibold">{formatMoney(tou?.combined?.netCost)}</span>
          </div>
          <div className="text-xs text-gray-600 ml-1 mt-1">
            • Solar net (after rebate): {formatMoney(tou?.combined?.solarNetCost)}
          </div>
          {tou?.combined?.solarRebateApplied ? (
            <div className="text-[11px] text-gray-500 ml-3">
              Solar rebate applied: {formatMoney(tou.combined.solarRebateApplied)}
            </div>
          ) : null}
          <div className="text-xs text-gray-600 ml-1">
            • Battery net (after rebate): {formatMoney(tou?.combined?.batteryNetCost)}
          </div>
          {tou?.combined?.batteryRebateApplied ? (
            <div className="text-[11px] text-gray-500 ml-3">
              Battery rebate applied: {formatMoney(tou.combined.batteryRebateApplied)}
              {tou?.combined?.batteryGrossCost ? (
                <> (from {formatMoney(tou.combined.batteryGrossCost)})</>
              ) : null}
            </div>
          ) : tou?.combined?.batteryGrossCost ? (
            <div className="text-[11px] text-gray-500 ml-3">
              Battery price: {formatMoney(tou.combined.batteryGrossCost)}
            </div>
          ) : null}
          <div className="text-xs text-gray-700">
            Year 1 savings: <span className="font-semibold">{formatMoney(tou?.combined?.annual)}</span>
          </div>
          <div className="text-xs text-gray-700">
            Payback: <span className="font-bold text-navy-600">{formatPayback(tou?.combined?.projection?.paybackYears)}</span>
          </div>
          <div className="text-[11px] text-gray-600 mt-1">
            Savings glide gently over time while rates rise, producing a realistic payback slope.
          </div>
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-xs font-semibold text-navy-600 mb-1">Ultra-Low Overnight (ULO)</div>
          <div className="text-xs text-gray-700">
            Net cost: <span className="font-semibold">{formatMoney(ulo?.combined?.netCost)}</span>
          </div>
          <div className="text-xs text-gray-600 ml-1 mt-1">
            • Solar net (after rebate): {formatMoney(ulo?.combined?.solarNetCost)}
          </div>
          {ulo?.combined?.solarRebateApplied ? (
            <div className="text-[11px] text-gray-500 ml-3">
              Solar rebate applied: {formatMoney(ulo.combined.solarRebateApplied)}
            </div>
          ) : null}
          <div className="text-xs text-gray-600 ml-1">
            • Battery net (after rebate): {formatMoney(ulo?.combined?.batteryNetCost)}
          </div>
          {ulo?.combined?.batteryRebateApplied ? (
            <div className="text-[11px] text-gray-500 ml-3">
              Battery rebate applied: {formatMoney(ulo.combined.batteryRebateApplied)}
              {ulo?.combined?.batteryGrossCost ? (
                <> (from {formatMoney(ulo.combined.batteryGrossCost)})</>
              ) : null}
            </div>
          ) : ulo?.combined?.batteryGrossCost ? (
            <div className="text-[11px] text-gray-500 ml-3">
              Battery price: {formatMoney(ulo.combined.batteryGrossCost)}
            </div>
          ) : null}
          <div className="text-xs text-gray-700">
            Year 1 savings: <span className="font-semibold">{formatMoney(ulo?.combined?.annual)}</span>
          </div>
          <div className="text-xs text-gray-700">
            Payback: <span className="font-bold text-navy-600">{formatPayback(ulo?.combined?.projection?.paybackYears)}</span>
          </div>
          <div className="text-[11px] text-gray-600 mt-1">
            Night charging and the same winter safeguard are both included, which is why ULO often pays back sooner.
          </div>
        </div>

        <ul className="list-disc ml-6 text-xs text-gray-600 space-y-1">
          <li>If the net cost is ≤ 0, payback is 0 years.</li>
          <li>If capped savings never exceed the cost, payback shows as N/A so you know the system never breaks even under these assumptions.</li>
        </ul>
      </div>
    </Modal>
  )
}

export interface SavingsBreakdownModalProps {
  open: boolean
  onClose: () => void
  results: PlanResultMap
  formatKwh: (value: number) => string
}

export function TouSavingsBreakdownModal({
  open,
  onClose,
  results,
  formatKwh: formatKwhFn,
}: SavingsBreakdownModalProps) {
  const tou = results.get('combined')

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="TOU Savings & Remaining Costs"
      message="Here is how each number inside the Time-of-Use savings panel is built."
      variant="info"
      cancelText="Got it"
    >
      {!tou ? (
        <div className="text-sm text-gray-700">
          We will show the full breakdown once the simulation finishes running.
        </div>
      ) : (
        (() => {
          const formatMoney = (value: number) => `$${value.toFixed(2)}`
          const before = tou.result.originalCost
          const after = tou.result.newCost
          const offsets = tou.result.batteryOffsets
          const leftover = tou.result.leftoverEnergy
          const shiftedKwh = offsets.offPeak + offsets.midPeak + offsets.onPeak + (offsets.ultraLow || 0)

          return (
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <span className="font-semibold">What the rows compare</span>
                <ul className="mt-2 list-disc ml-5 text-xs text-gray-600 space-y-1">
                  <li>Before peak shaving totals the bill if the battery never helped.</li>
                  <li>After peak shaving shows the same usage once the battery discharges into peak windows.</li>
                  <li>The Total line is simply the sum of Off-, Mid-, and On-Peak rows on each side.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div>
                  <div className="text-xs font-semibold text-navy-600 mb-1">Bill without battery</div>
                  <div className="text-xs text-gray-600">
                    Off-Peak: <span className="font-semibold">{formatMoney(before.offPeak)}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Mid-Peak: <span className="font-semibold">{formatMoney(before.midPeak)}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    On-Peak: <span className="font-semibold">{formatMoney(before.onPeak)}</span>
                  </div>
                  <div className="text-xs font-semibold text-red-600 mt-2">
                    Total: {formatMoney(before.total)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-navy-600 mb-1">Bill with battery help</div>
                  <div className="text-xs text-gray-600">
                    Off-Peak: <span className="font-semibold">{formatMoney(after.offPeak)}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Mid-Peak: <span className="font-semibold">{formatMoney(after.midPeak)}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    On-Peak: <span className="font-semibold">{formatMoney(after.onPeak)}</span>
                  </div>
                  <div className="text-xs font-semibold text-green-600 mt-2">
                    Total: {formatMoney(after.total)}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                <div className="font-semibold text-navy-600">How the battery is working</div>
                <div>
                  • Energy shifted out of expensive hours:{' '}
                  <span className="font-semibold">{formatKwhFn(shiftedKwh)}</span>.
                </div>
                <div>
                  • Still bought from the grid:{' '}
                  <span className="font-semibold">{formatKwhFn(leftover.totalKwh)}</span> at{' '}
                  <span className="font-semibold">{(leftover.ratePerKwh * 100).toFixed(2)}¢/kWh</span>.
                </div>
                <div>
                  • Cost of that remainder:{' '}
                  <span className="font-semibold">{formatMoney(leftover.costAtOffPeak)}</span> ({leftover.costPercent.toFixed(2)}% of the original bill).
                </div>
              </div>

              <div className="text-xs text-gray-500 italic">
                Savings in this section equal {formatMoney(before.total - after.total)} per year — exactly the difference between the two totals above.
              </div>

              {(() => {
                const combinedBatteryPiece = Math.max(0, tou.combined?.batteryAnnual ?? 0)
                if (combinedBatteryPiece > 1) return null
                return (
                  <div className="text-[11px] text-gray-500 italic">
                    Battery slice showing $0? That simply means solar production already maxed out the winter cap (92%), so the combined view has no headroom left to display the battery’s share—even though the battery plan card still shows its standalone savings.
                  </div>
                )
              })()}
            </div>
          )
        })()
      )}
    </Modal>
  )
}

export function UloSavingsBreakdownModal({
  open,
  onClose,
  results,
  formatKwh: formatKwhFn,
}: SavingsBreakdownModalProps) {
  const ulo = results.get('combined')

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="ULO Savings & Remaining Costs"
      message="This is the detailed view of the Ultra-Low Overnight savings math."
      variant="info"
      cancelText="Understood"
    >
      {!ulo ? (
        <div className="text-sm text-gray-700">
          Hang tight—once the simulation finishes we will show the step-by-step costs.
        </div>
      ) : (
        (() => {
          const formatMoney = (value: number) => `$${value.toFixed(2)}`
          const before = ulo.result.originalCost
          const after = ulo.result.newCost
          const offsets = ulo.result.batteryOffsets
          const leftover = ulo.result.leftoverEnergy
          const shiftedKwh =
            offsets.offPeak + offsets.midPeak + offsets.onPeak + (offsets.ultraLow || 0)

          return (
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <span className="font-semibold">Reading the table</span>
                <ul className="mt-2 list-disc ml-5 text-xs text-gray-600 space-y-1">
                  <li>Ultra-Low rows reflect overnight charging — these barely change because the rate is already cheap.</li>
                  <li>Mid- and On-Peak rows shrink because the battery discharges during those pricey windows.</li>
                  <li>Totals are simply the column sums; the gap between them is the savings you see in the green banner.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div>
                  <div className="text-xs font-semibold text-navy-600 mb-1">
                    Before the battery helps
                  </div>
                  <div className="text-xs text-gray-600">
                    Ultra-Low: <span className="font-semibold">{formatMoney(before.ultraLow ?? 0)}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Weekend: <span className="font-semibold">{formatMoney(before.offPeak)}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Mid-Peak: <span className="font-semibold">{formatMoney(before.midPeak)}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    On-Peak: <span className="font-semibold">{formatMoney(before.onPeak)}</span>
                  </div>
                  <div className="text-xs font-semibold text-red-600 mt-2">
                    Total: {formatMoney(before.total)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-navy-600 mb-1">
                    After the battery shifts usage
                  </div>
                  <div className="text-xs text-gray-600">
                    Ultra-Low: <span className="font-semibold">{formatMoney(after.ultraLow ?? 0)}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Weekend: <span className="font-semibold">{formatMoney(after.offPeak)}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Mid-Peak: <span className="font-semibold">{formatMoney(after.midPeak)}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    On-Peak: <span className="font-semibold">{formatMoney(after.onPeak)}</span>
                  </div>
                  <div className="text-xs font-semibold text-green-600 mt-2">
                    Total: {formatMoney(after.total)}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                <div className="font-semibold text-navy-600">Battery action in plain numbers</div>
                <div>
                  • Energy shifted out of expensive periods:{' '}
                  <span className="font-semibold">{formatKwhFn(shiftedKwh)}</span>.
                </div>
                <div>
                  • Remaining grid energy:{' '}
                  <span className="font-semibold">{formatKwhFn(leftover.totalKwh)}</span>, now billed at{' '}
                  <span className="font-semibold">{(leftover.ratePerKwh * 100).toFixed(2)}¢/kWh</span>.
                </div>
                <div>
                  • Cost of that remainder:{' '}
                  <span className="font-semibold">{formatMoney(leftover.costAtOffPeak)}</span> ({leftover.costPercent.toFixed(2)}% of the original bill).
                </div>
              </div>

              <div className="text-xs text-gray-500 italic">
                That is why the savings banner shows {formatMoney(before.total - after.total)} per year — it is the exact gap between the two totals above.
              </div>

              {(() => {
                const combinedBatteryPiece = Math.max(0, ulo.combined?.batteryAnnual ?? 0)
                if (combinedBatteryPiece > 1) return null
                return (
                  <div className="text-[11px] text-gray-500 italic">
                    If the battery column reads $0, solar alone already pushed savings to the winter cap, so the combined split hides the incremental battery portion even though the standalone battery card still shows its impact.
                  </div>
                )
              })()}
            </div>
          )
        })()
      )}
    </Modal>
  )
}

export interface AnnualSavingsModalProps {
  open: boolean
  onClose: () => void
  touResults: PlanResultMap
  uloResults: PlanResultMap
  displayedMonthlyBill: number
}

export function AnnualSavingsModal({
  open,
  onClose,
  touResults,
  uloResults,
  displayedMonthlyBill,
}: AnnualSavingsModalProps) {
  const formatMoney = (value: number) => `$${Math.round(value).toLocaleString()}`
  const tou = touResults.get('combined')
  const ulo = uloResults.get('combined')
  const touBaselineEnergy = Math.max(0, tou?.combined?.baselineAnnualBillEnergyOnly ?? 0)
  const uloBaselineEnergy = Math.max(0, ulo?.combined?.baselineAnnualBillEnergyOnly ?? 0)
  const baselineAnnualEnergy = Math.max(touBaselineEnergy, uloBaselineEnergy)
  const fallbackBaselineAnnual = displayedMonthlyBill * 12
  const baselineAnnual = baselineAnnualEnergy > 0 ? baselineAnnualEnergy : fallbackBaselineAnnual
  const baselineMonthly = baselineAnnual / 12
  const touAnnualSavings = Math.max(0, tou?.combined?.annual ?? 0)
  const uloAnnualSavings = Math.max(0, ulo?.combined?.annual ?? 0)
  const touSolarPiece = tou?.combined?.solarOnlyAnnual ?? 0
  const touBatteryPiece = tou?.combined?.batteryAnnual ?? 0
  const uloSolarPiece = ulo?.combined?.solarOnlyAnnual ?? 0
  const uloBatteryPiece = ulo?.combined?.batteryAnnual ?? 0

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="How Annual Savings Are Calculated"
      message="We compare today’s bill with the projected bill after solar plus battery to share a realistic Year‑1 savings estimate."
      variant="info"
      cancelText="Close"
    >
      <div className="space-y-4 text-sm text-gray-700">
        <div>
          <span className="font-semibold">What the numbers mean</span>
          <div className="mt-1 text-xs text-gray-600 ml-1">
            • Current bill (baseline energy only): {formatMoney(baselineMonthly)}/month — the same {formatMoney(baselineAnnual)} per year shown in the summary card.
          </div>
          <div className="mt-1 text-xs text-gray-600 ml-1">
            • Projected bill (after upgrades): same usage, but with solar production and smart battery shifting applied, expressed as energy charges only.
          </div>
          <div className="mt-1 text-xs text-gray-600 ml-1">
            • Annual savings = Baseline energy charges − Projected energy charges, limited by a winter safeguard so estimates stay sensible.
          </div>
          <div className="mt-1 text-xs text-gray-600 ml-1">
            • Monthly savings = Annual savings ÷ 12 — an easy way to compare against your current bill.
          </div>
          <div className="mt-1 text-xs text-gray-600 ml-1">
            • Solar vs. Battery split mirrors the main card so you can explain which component delivers the benefit.
          </div>
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-xs font-semibold text-navy-600 mb-1">Time-of-Use (TOU)</div>
          <div className="text-xs text-gray-700">
            Annual savings: <span className="font-semibold text-navy-600">{formatMoney(touAnnualSavings)}</span> = {formatMoney(touSolarPiece)} (Solar) + {formatMoney(touBatteryPiece)} (Battery)
          </div>
          <div className="text-xs text-gray-700">
            Monthly savings: <span className="font-semibold text-navy-600">{formatMoney(touAnnualSavings / 12)}</span>
          </div>
          <div className="text-[11px] text-gray-600 mt-1">
            These match the TOU card after applying the winter safeguard. The split simply reflects the capped total.
          </div>
          {touBatteryPiece < 1 && (
            <div className="text-[11px] text-gray-500 italic mt-1">
              Battery showing $0 here? Solar savings already reached the winter cap, so the combined split has no extra room to display the battery slice—even though the battery-only plan still reports its standalone benefit.
            </div>
          )}
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-xs font-semibold text-navy-600 mb-1">Ultra-Low Overnight (ULO)</div>
          <div className="text-xs text-gray-700">
            Annual savings: <span className="font-semibold text-navy-600">{formatMoney(uloAnnualSavings)}</span> = {formatMoney(uloSolarPiece)} (Solar) + {formatMoney(uloBatteryPiece)} (Battery)
          </div>
          <div className="text-xs text-gray-700">
            Monthly savings: <span className="font-semibold text-navy-600">{formatMoney(uloAnnualSavings / 12)}</span>
          </div>
          <div className="text-[11px] text-gray-600 mt-1">
            ULO savings reflect cheaper overnight charging, lower daytime grid costs, and the same winter safeguard.
          </div>
          {uloBatteryPiece < 1 && (
            <div className="text-[11px] text-gray-500 italic mt-1">
              Battery column resting at $0? Solar alone maxed out the winter cap, so the combined split hides the incremental battery portion even though the battery plan card still shows its own savings.
            </div>
          )}
        </div>

        <div className="text-xs text-gray-600 italic">
          <span className="font-semibold">Why the plans differ:</span> Each rate plan has unique peak prices. The battery fills up when power is cheapest and discharges when it is most expensive, so the savings depend on the plan you pick.
        </div>
      </div>
    </Modal>
  )
}

