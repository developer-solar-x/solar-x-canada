import { Modal } from '@/components/ui/Modal'
import type { PlanResultMap } from './types'

export interface TouInfoModalProps {
  open: boolean
  onClose: () => void
  annualUsageKwh: number
  touResults: PlanResultMap
}

export function TouInfoModal({ open, onClose, annualUsageKwh, touResults }: TouInfoModalProps) {
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Time-of-Use (TOU) Rate Plan"
      message="Standard time-based pricing for most households"
      variant="info"
      cancelText="Close"
    >
      <div className="space-y-4">
        {/* Display the TOU image from the public folder */}
        <div className="flex justify-center">
          <img 
            src="/TOU.JPG" 
            alt="Time-of-Use (TOU) Rate Plan Information" 
            className="max-w-full h-auto rounded-lg shadow-md"
          />
        </div>
      </div>
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
      title="Understanding Your 25-Year Profit"
      message="See how much money you'll keep after your solar and battery system pays for itself over 25 years."
      variant="info"
      cancelText="Close"
    >
      <div className="space-y-4 text-sm text-gray-700">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Simple Explanation</h3>
          <p className="text-sm text-blue-800">
            Your 25-year profit is the money you'll have left after your system pays for itself. Think of it as your total savings over 25 years, minus what you paid upfront.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">How We Calculate It</h3>
          <div className="space-y-2 text-xs text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">1.</span>
              <div>
                <span className="font-semibold">Start with Year 1 savings:</span> We use your first-year savings (shown in the "Annual Savings" card) as the starting point.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">2.</span>
              <div>
                <span className="font-semibold">Project forward 25 years:</span> We calculate how your savings grow each year as electricity rates increase, while accounting for realistic system performance.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">3.</span>
              <div>
                <span className="font-semibold">Subtract your investment:</span> We take your total 25-year savings and subtract what you paid for the system (after rebates).
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">4.</span>
              <div>
                <span className="font-semibold">What's left is your profit:</span> This is the money you keep after your system has fully paid for itself.
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg">
            <div className="text-sm font-semibold text-blue-900 mb-3">Time-of-Use (TOU)</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Your Investment:</span>
                <span className="font-bold text-gray-900">{formatMoney(tou?.combined?.netCost ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Total Savings (25 years):</span>
                <span className="font-bold text-blue-700">{formatMoney(touTotalSavings)}</span>
              </div>
              <div className="pt-2 border-t border-blue-300">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">Your Profit:</span>
                  <span className="text-lg font-bold text-green-700">{formatMoney(touProfit)}</span>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-blue-700 mt-2 italic">
              Includes winter safeguard and your solar + battery combination
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg">
            <div className="text-sm font-semibold text-purple-900 mb-3">Ultra-Low Overnight (ULO)</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Your Investment:</span>
                <span className="font-bold text-gray-900">{formatMoney(ulo?.combined?.netCost ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Total Savings (25 years):</span>
                <span className="font-bold text-purple-700">{formatMoney(uloTotalSavings)}</span>
              </div>
              <div className="pt-2 border-t border-purple-300">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">Your Profit:</span>
                  <span className="text-lg font-bold text-green-700">{formatMoney(uloProfit)}</span>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-purple-700 mt-2 italic">
              Overnight charging advantage + winter safeguard included
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-800">
            <strong>Example:</strong> If you invest {formatMoney(tou?.combined?.netCost ?? 20000)} and save {formatMoney(Math.round((touTotalSavings || 50000) / 25))} per year on average, after 25 years you'll have saved {formatMoney(touTotalSavings || 50000)} total. Your profit of {formatMoney(touProfit || 30000)} is what you keep after your investment is paid back.
          </p>
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
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Ultra-Low Overnight (ULO) Rate Plan"
      message="Best for EV owners and those who can shift usage to overnight hours"
      variant="info"
      cancelText="Close"
    >
      <div className="space-y-4">
        {/* Display the ULO image from the public folder */}
        <div className="flex justify-center">
          <img 
            src="/ULO.JPG" 
            alt="Ultra-Low Overnight (ULO) Rate Plan Information" 
            className="max-w-full h-auto rounded-lg shadow-md"
          />
        </div>
      </div>
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
      title="Understanding Your Payback Period"
      message="See how long it takes for your solar and battery system to pay for itself."
      variant="info"
      cancelText="Close"
    >
      <div className="space-y-4 text-sm text-gray-700">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">What Is Payback Period?</h3>
          <p className="text-sm text-blue-800">
            Your payback period is how long it takes for your savings to equal what you paid for the system. Once you reach this point, your system has fully paid for itself, and everything after that is pure profit.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">How We Calculate It</h3>
          <div className="space-y-2 text-xs text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-0.5">1.</span>
              <div>
                <span className="font-semibold">Start with your investment:</span> We use your total system cost (solar + battery) after rebates.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-0.5">2.</span>
              <div>
                <span className="font-semibold">Use Year 1 savings:</span> Your first-year savings (shown in "Annual Savings" above) is the starting point.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-0.5">3.</span>
              <div>
                <span className="font-semibold">Project savings forward:</span> We calculate how your savings grow each year as electricity rates increase, accounting for realistic system performance.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">4.</span>
              <div>
                <span className="font-semibold">Find the payback point:</span> We add up your savings year by year until the total equals your investment. That's your payback period.
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg">
            <div className="text-sm font-semibold text-blue-900 mb-3">Time-of-Use (TOU)</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Your Investment:</span>
                <span className="font-bold text-gray-900">{formatMoney(tou?.combined?.netCost)}</span>
              </div>
              <div className="text-[11px] text-gray-600 pl-1">
                Solar: {formatMoney(tou?.combined?.solarNetCost)} + Battery: {formatMoney(tou?.combined?.batteryNetCost)}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-blue-300">
                <span className="text-gray-700">Year 1 Savings:</span>
                <span className="font-bold text-blue-700">{formatMoney(tou?.combined?.annual)}</span>
              </div>
              <div className="pt-2 border-t border-blue-300">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">Payback Period:</span>
                  <span className="text-lg font-bold text-navy-600">{formatPayback(tou?.combined?.projection?.paybackYears)}</span>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-blue-700 mt-2 italic">
              Savings increase over time as rates rise
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg">
            <div className="text-sm font-semibold text-purple-900 mb-3">Ultra-Low Overnight (ULO)</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Your Investment:</span>
                <span className="font-bold text-gray-900">{formatMoney(ulo?.combined?.netCost)}</span>
              </div>
              <div className="text-[11px] text-gray-600 pl-1">
                Solar: {formatMoney(ulo?.combined?.solarNetCost)} + Battery: {formatMoney(ulo?.combined?.batteryNetCost)}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-purple-300">
                <span className="text-gray-700">Year 1 Savings:</span>
                <span className="font-bold text-purple-700">{formatMoney(ulo?.combined?.annual)}</span>
              </div>
              <div className="pt-2 border-t border-purple-300">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">Payback Period:</span>
                  <span className="text-lg font-bold text-navy-600">{formatPayback(ulo?.combined?.projection?.paybackYears)}</span>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-purple-700 mt-2 italic">
              Overnight charging advantage typically shortens payback
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-800">
            <strong>Example:</strong> If you invest {formatMoney(tou?.combined?.netCost || 20000)} and save {formatMoney(Math.round((tou?.combined?.annual || 2000) / 12))} per month, your system pays for itself in {formatPayback(tou?.combined?.projection?.paybackYears || 10)}. After that, all savings are pure profit!
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-700">
            <strong>Note:</strong> If payback shows "N/A", it means your savings won't exceed your investment within 25 years under these assumptions. A shorter payback period means your investment recovers faster.
          </p>
        </div>
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
  const touBaselineMonthly = touBaselineEnergy > 0 ? touBaselineEnergy / 12 : 0
  const uloBaselineMonthly = uloBaselineEnergy > 0 ? uloBaselineEnergy / 12 : 0
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
            • Current bill (baseline energy only): Varies by rate plan — TOU: {formatMoney(touBaselineMonthly)}/month ({formatMoney(touBaselineEnergy)}/year), ULO: {formatMoney(uloBaselineMonthly)}/month ({formatMoney(uloBaselineEnergy)}/year). These match the values shown in the summary card.
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

